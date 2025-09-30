import { type ICluster, multiplyBigIntByNumber, fetchTokenPrice } from "@streamflow/common";
import type { Mint } from "@solana/spl-token";
import { NATIVE_MINT } from "@solana/spl-token";

import { fetchAirdropFee } from "./fetchAirdropFee.js";

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

export const MAXIMUM_FEE_FALLBACK = 9_900_000n; // 0.0099 SOL
export const MINIMUM_FEE_FALLBACK = 5_000_000n; // 0.005 SOL
export const FEE_ALLOCATION_FACTOR_FALLBACK_NUMERATOR = 90n; // 90%
export const FEE_ALLOCATION_FACTOR_FALLBACK_DENOMINATOR = 100n;

const LAMPORTS_PER_SOL = 1_000_000_000n;

const lamportsToSolString = (lamports: bigint): string => {
  const int = lamports / LAMPORTS_PER_SOL;
  const frac = lamports % LAMPORTS_PER_SOL;
  if (frac === 0n) return int.toString();
  const fracStr = frac.toString().padStart(9, "0").replace(/0+$/, "");
  return `${int.toString()}.${fracStr}`;
};

const allocationToString = (num: bigint, den: bigint): string => {
  const SCALE = 1_000_000_000n; // 9 digits
  const scaled = (num * SCALE) / den; // floor
  const int = scaled / SCALE;
  const frac = scaled % SCALE;
  if (frac === 0n) return int.toString();
  const fracStr = frac.toString().padStart(9, "0").replace(/0+$/, "");
  return `${int.toString()}.${fracStr}`;
};

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

export const toLamportsSOL = (value: string | number | bigint, solDecimals = 9): bigint => {
  const y = typeof value === "bigint" ? Number(value) : typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(y) || y <= 0) return 0n;
  const scale = 10n ** BigInt(solDecimals);
  return multiplyBigIntByNumber(scale, y);
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
        const fee = multiplyBigIntByNumber(claimableLamports, factor);
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
  const { claimableAmount, tokenPriceUsd, solPriceUsd, tokenDecimals, solDecimals = 9 } = params;
  if (tokenPriceUsd <= 0 || solPriceUsd <= 0) return 0n;

  // Fixed-point scale uses tokenDecimals (capped) so precision matches token
  const scaleDigits = Math.min(18, Math.max(0, tokenDecimals));
  const SCALE = 10n ** BigInt(scaleDigits);
  const pScaled = multiplyBigIntByNumber(SCALE, tokenPriceUsd, scaleDigits);
  const sScaled = multiplyBigIntByNumber(SCALE, solPriceUsd, scaleDigits);
  if (pScaled <= 0n || sScaled <= 0n) return 0n;

  const pow10 = (n: number) => 10n ** BigInt(n);

  // lamports = claimableAmount * 10^solDecimals * P / (10^tokenDecimals * S)
  const numerator = claimableAmount * pow10(solDecimals) * pScaled;
  const denominator = pow10(tokenDecimals) * sScaled;

  return numerator / denominator; // floor division
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
  const raw = multiplyBigIntByNumber(claimableLamports, factor);
  if (raw < minLamports) return minLamports;
  if (raw > maxLamports) return maxLamports;
  return raw;
}

export async function resolveAirdropFeeLamportsUsingApi(params: {
  distributorAddress: string;
  mintAccount: Mint;
  claimableAmount: bigint;
  cluster: ICluster;
}): Promise<bigint> {
  const { distributorAddress, mintAccount, claimableAmount, cluster } = params;
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
        fetchTokenPrice(NATIVE_MINT.toBase58(), cluster),
        fetchTokenPrice(mintAccount.address.toBase58(), cluster),
    ]);
  } catch (_) {
    // ignore and fallback
  }

  const response = apiFeesResponse ?? defaultAPIFeesResponse;

  if (response?.isCustom && response.claimFee !== undefined) {
    return toLamportsSOL(response.claimFee);
  }

  const claimFeeDynamic = response?.claimFeeDynamic ?? defaultAPIFeesResponse.claimFeeDynamic;

  if (!tokenPrice?.value || !solPrice?.value) {
    return MINIMUM_FEE_FALLBACK;
  }

  const baseLamports = calculateClaimableLamportsFromPrices({
    claimableAmount: claimableAmount,
    tokenPriceUsd: tokenPrice.value,
    solPriceUsd: solPrice.value,
    tokenDecimals: mintAccount.decimals,
  });

  return calculateDynamicFeeFromSolParams({
    minPrice: claimFeeDynamic!.minPrice,
    maxPrice: claimFeeDynamic!.maxPrice,
    allocationFactor: claimFeeDynamic!.allocationFactor,
    claimableLamports: baseLamports,
  });
}
