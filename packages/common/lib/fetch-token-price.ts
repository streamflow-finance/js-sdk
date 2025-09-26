import { ICluster } from "../types.js";

export type TokensPricesResponse = {
  data: Record<string, { id: string; value: number | undefined }>;
};

export type TokenPriceResult = { id: string; value: number | null };

export interface FetchTokenPriceOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export const fetchTokenPrice = async (
  mintId: string,
  cluster: ICluster = ICluster.Mainnet,
  options?: FetchTokenPriceOptions,
): Promise<TokenPriceResult> => {
  const url = `https://token-api.streamflow.finance/price?ids=${encodeURIComponent(mintId)}&cluster=${encodeURIComponent(cluster)}`;

  const impl = options?.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = options?.timeoutMs
    ? setTimeout(() => controller.abort(), options.timeoutMs)
    : undefined;

  try {
    const res = await impl(url, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Price API error: ${res.status} ${res.statusText}`);
    }
    const json = (await res.json()) as TokensPricesResponse;
    const entry = json?.data?.[mintId];
    return { id: mintId, value: typeof entry?.value === "number" ? entry.value : null };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

export interface TokenPriceQueryOptionsOverrides {
  staleTimeMs?: number;
  gcTimeMs?: number;
  retry?: number | boolean;
  refetchOnWindowFocus?: boolean;
}

export function getTokenPriceQueryOptions(
  mintId: string,
  cluster: ICluster = ICluster.Mainnet,
  options?: FetchTokenPriceOptions & TokenPriceQueryOptionsOverrides,
) {
  const { staleTimeMs = 60_000, gcTimeMs = 300_000, retry = 2, refetchOnWindowFocus = false, ...rest } =
    options ?? {};
  const key = ["sf", "price", cluster, mintId];
  return {
    queryKey: key,
    queryFn: () => fetchTokenPrice(mintId, cluster, rest),
    staleTime: staleTimeMs,
    gcTime: gcTimeMs,
    retry,
    refetchOnWindowFocus,
  };
}


