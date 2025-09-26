import { ICluster } from "@streamflow/common";
import { fetchAirdropFee } from "./fetchAirdropFee.js";
import type { Mint } from "@solana/spl-token";
export const MAXIMUM_FEE_FALLBACK = 9_900_000n; // 0.0099 SOL
export const MINIMUM_FEE_FALLBACK = 5_000_000n; // 0.005 SOL
export const FEE_ALLOCATION_FACTOR_FALLBACK_NUMERATOR = 90n; // 90%
export const FEE_ALLOCATION_FACTOR_FALLBACK_DENOMINATOR = 100n;

const lamportsToSolString = (lamports: bigint): string => {
  const s = (Number(lamports) / 1e9).toFixed(9);
  return s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
};
const allocationToString = (num: bigint, den: bigint): string => (Number(num) / Number(den)).toString();

const defaultAPIFeesResponse: AirdropFeeServiceResponse = {
  isCustom: false,
  claimFee: undefined,
  claimFeeDynamic: {
    minPrice: lamportsToSolString(MINIMUM_FEE_FALLBACK),
    maxPrice: lamportsToSolString(MAXIMUM_FEE_FALLBACK),
    allocationFactor: allocationToString(
      FEE_ALLOCATION_FACTOR_FALLBACK_NUMERATOR,
      FEE_ALLOCATION_FACTOR_FALLBACK_DENOMINATOR,
    ),
  },
} as const;

export type AirdropFeeDynamic = {
  minPrice: string;
  maxPrice: string;
  allocationFactor: string; // 0..1 in string
};

export type AirdropFeeServiceResponse = {
  isCustom?: boolean;
  claimFee?: string | number; // SOL units as string/number
  claimFeeDynamic?: AirdropFeeDynamic;
};

export type AirdropFeeClient = {
  getAirdropFee: (distributorAddress: string) => Promise<{ data?: AirdropFeeServiceResponse }>;
};

export const toBigInt = (v: string | number | bigint | undefined): bigint | undefined =>
  v === undefined ? undefined : BigInt(v);

export const toLamportsSOL = (value: string | number | bigint, solDecimals = 9): bigint => {
  const num = typeof value === "bigint" ? Number(value) : Number(value);
  const scale = 10 ** solDecimals;
  return BigInt(Math.floor(Math.max(0, num) * scale));
};

export const applyFeeLogic = (baseLamports: bigint): bigint => {
  if (baseLamports <= 0n) {
    return MINIMUM_FEE_FALLBACK;
  }
  const raw = (baseLamports * FEE_ALLOCATION_FACTOR_FALLBACK_NUMERATOR) / FEE_ALLOCATION_FACTOR_FALLBACK_DENOMINATOR;
  if (raw < MINIMUM_FEE_FALLBACK) return MINIMUM_FEE_FALLBACK;
  if (raw > MAXIMUM_FEE_FALLBACK) return MAXIMUM_FEE_FALLBACK;
  return raw;
};

export async function calculateAirdropFeeLamports(params: {
  distributorAddress: string;
  client?: AirdropFeeClient;
  claimableLamports?: bigint; // optional estimated claimable amount in lamports
}): Promise<bigint> {
  const { distributorAddress, client, claimableLamports } = params;

  try {
    if (client) {
      const res = await client.getAirdropFee(distributorAddress);
      const data = res?.data;
      if (data?.isCustom && data.claimFee !== undefined) {
        return toLamportsSOL(data.claimFee);
      }
      if (data?.claimFeeDynamic && claimableLamports !== undefined) {
        const min = toLamportsSOL(data.claimFeeDynamic.minPrice);
        const max = toLamportsSOL(data.claimFeeDynamic.maxPrice);
        const factor = Math.max(0, Math.min(1, parseFloat(data.claimFeeDynamic.allocationFactor)));
        const fee = BigInt(Math.floor(Number(claimableLamports) * factor));
        if (fee < min) return min;
        if (fee > max) return max;
        return fee;
      }
    }
  } catch (_err) {
    // Ignore and fallback
  }

  if (claimableLamports !== undefined) {
    return applyFeeLogic(claimableLamports);
  }
  return MINIMUM_FEE_FALLBACK;
}

/**
 * Calculates claimable SOL lamports from:
 * - claimable token amount in the token's base units (BN or bigint)
 * - token USD price and SOL USD price
 * - token decimals
 */
export function calculateClaimableLamportsFromPrices(params: {
  claimableAmount: bigint;
  tokenPriceUsd: number;
  solPriceUsd: number;
  tokenDecimals: number;
  solDecimals?: number; // default 9
}): bigint {
  const {
    claimableAmount: claimableAmountBaseUnits,
    tokenPriceUsd,
    solPriceUsd,
    tokenDecimals,
    solDecimals = 9,
  } = params;
  if (tokenPriceUsd <= 0 || solPriceUsd <= 0) return 0n;
  const decimalsDiff = BigInt(Math.max(0, solDecimals - tokenDecimals));
  const scaled = claimableAmountBaseUnits * BigInt(10) ** decimalsDiff;
  const usdValueScaled = BigInt(Math.floor(Number(scaled) * tokenPriceUsd));
  // divide by SOL price (avoid floating by scaling first)
  const lamports = BigInt(Math.floor(Number(usdValueScaled) / solPriceUsd));
  return lamports;
}

/**
 * Calculates lamport fee using dynamic SOL parameters coming from backend
 * minPrice/maxPrice/allocationFactor are strings from API; prices are in SOL units
 */
export function calculateDynamicFeeFromSolParams(params: {
  minPrice: string;
  maxPrice: string;
  allocationFactor: string; // e.g. "0.9"
  claimableLamports: bigint;
  solDecimals?: number; // default 9
}): bigint {
  const { minPrice, maxPrice, allocationFactor, claimableLamports, solDecimals = 9 } = params;
  const minLamports = toLamportsSOL(minPrice, solDecimals);
  const maxLamports = toLamportsSOL(maxPrice, solDecimals);
  const factor = Math.max(0, Math.min(1, parseFloat(allocationFactor)));
  const raw = BigInt(Math.floor(Number(claimableLamports) * factor));
  if (raw < minLamports) return minLamports;
  if (raw > maxLamports) return maxLamports;
  return raw;
}

async function fetchTokenPriceUsd(
  mintId: string,
  cluster: ICluster,
  fetchFn: typeof fetch = fetch,
): Promise<number | null> {
  const url = `https://token-api.streamflow.finance/price?ids=${encodeURIComponent(mintId)}&cluster=${encodeURIComponent(cluster)}`;
  const res = await fetchFn(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Record<string, { id: string; value?: number }> };
  const val = json?.data?.[mintId]?.value;
  return typeof val === "number" ? val : null;
}

export async function resolveAirdropFeeLamportsUsingApi(params: {
  distributorAddress: string;
  mintAccount: Mint;
  claimableAmount: bigint;
  cluster: ICluster;
  fetchFn?: typeof fetch;
}): Promise<bigint> {
  const { distributorAddress, mintAccount, claimableAmount, cluster, fetchFn } = params;
  let apiFeesResponse = undefined;

  try {
    apiFeesResponse = await fetchAirdropFee(distributorAddress, cluster);
  } catch (_) {
    // ignore and fallback
  }

  let solPrice = null;
  let tokenPrice = null;
  try {
    [solPrice, tokenPrice] = await Promise.all([
      fetchTokenPriceUsd("So11111111111111111111111111111111111111112", cluster, fetchFn),
      fetchTokenPriceUsd(mintAccount.address.toBase58(), cluster, fetchFn),
    ]);
  } catch (_) {
    // ignore and fallback
  }

  const response = apiFeesResponse ?? defaultAPIFeesResponse;

  if (response?.isCustom && response.claimFee !== undefined) {
    return toLamportsSOL(response.claimFee);
  }

  const claimFeeDynamic = response?.claimFeeDynamic ?? defaultAPIFeesResponse.claimFeeDynamic;

  if (!tokenPrice || !solPrice) {
    return MINIMUM_FEE_FALLBACK;
  }

  const baseLamports = calculateClaimableLamportsFromPrices({
    claimableAmount: claimableAmount,
    tokenPriceUsd: tokenPrice,
    solPriceUsd: solPrice,
    tokenDecimals: mintAccount.decimals,
  });

  return calculateDynamicFeeFromSolParams({
    minPrice: claimFeeDynamic!.minPrice,
    maxPrice: claimFeeDynamic!.maxPrice,
    allocationFactor: claimFeeDynamic!.allocationFactor,
    claimableLamports: baseLamports,
  });
}
