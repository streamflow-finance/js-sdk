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
  apiUrl: string,
  apiKey?: string,
  fetchFn: typeof fetch = fetch,
): Promise<AirdropFeeResponse> => {
  const url = `${apiUrl}/v2/api/airdrops/${encodeURIComponent(distributorId)}/fees`;

  const res = await fetchFn(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "x-api-key": apiKey } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Airdrop fee API error: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }

  const json = (await res.json()) as AirdropFeeResponse;
  return json;
};
