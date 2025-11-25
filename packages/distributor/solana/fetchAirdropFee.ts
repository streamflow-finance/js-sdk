import { ICluster } from "@streamflow/common";

export type AirdropFeeResponse = {
  claimFee: string | number;
  claimFeeDynamic?: {
    minPrice: string;
    maxPrice: string;
    allocationFactor: string;
  };
  isCustom: boolean;
};

export interface AirdropFeeQueryOptionsOverrides {
  staleTimeMs?: number;
  gcTimeMs?: number;
  retry?: number | boolean;
  refetchOnWindowFocus?: boolean;
}   

export const fetchAirdropFee = async (
  distributorId: string,
  cluster: ICluster = ICluster.Mainnet,
  fetchFn: typeof fetch = fetch,
): Promise<AirdropFeeResponse> => {
  const baseUrl =
    cluster === ICluster.Mainnet ? "https://api.streamflow.finance" : "https://staging-api.streamflow.finance";
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
