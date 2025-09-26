export type AirdropFeeResponse = {
  claimFee: string | number;
  claimFeeDynamic?: {
    minPrice: string;
    maxPrice: string;
    allocationFactor: string;
  };
  isCustom: boolean;
};

import { ICluster } from "@streamflow/common";

export const fetchAirdropFee = async (
  distributorId: string,
  cluster: ICluster = ICluster.Mainnet,
  fetchFn: typeof fetch = fetch,
): Promise<AirdropFeeResponse> => {
  const baseUrl = cluster === ICluster.Mainnet ? "https://api.streamflow.finance" : "https://staging-api.streamflow.finance";
  const url = `${baseUrl}/v2/api/airdrops/${encodeURIComponent(distributorId)}/fees`;

  const res = await fetchFn(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Airdrop fee API error: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }

  const json = (await res.json()) as AirdropFeeResponse;
  return json;
};

export interface AirdropFeeQueryOptionsOverrides {
  staleTimeMs?: number;
  gcTimeMs?: number;
  retry?: number | boolean;
  refetchOnWindowFocus?: boolean;
}

export function getAirdropFeeQueryOptions(
  params: { distributorId: string; cluster?: ICluster; fetchFn?: typeof fetch },
  options?: AirdropFeeQueryOptionsOverrides,
) {
  const { staleTimeMs = 60_000, gcTimeMs = 300_000, retry = 2, refetchOnWindowFocus = false } = options ?? {};
  const cluster = params.cluster ?? ICluster.Mainnet;
  const key = ["sf", "airdrop", "fee", cluster, params.distributorId];
  return {
    queryKey: key,
    queryFn: () => fetchAirdropFee(params.distributorId, cluster, params.fetchFn ?? fetch),
    staleTime: staleTimeMs,
    gcTime: gcTimeMs,
    retry,
    refetchOnWindowFocus,
  };
}

