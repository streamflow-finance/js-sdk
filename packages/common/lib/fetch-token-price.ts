import { ICluster } from "../types.js";

export type TokensPricesResponse = {
  data: Record<string, TokenPriceResult>;
};

export type TokenPriceResult = { id: string; value: number | undefined };

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
    return { id: mintId, value: typeof entry?.value === "number" ? entry.value : undefined };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};