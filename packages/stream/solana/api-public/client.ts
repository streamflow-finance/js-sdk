import type { ContractSchema } from "./types.js";

export interface ApiClientOptions {
  apiUrl?: string;
  cluster?: "mainnet" | "devnet";
  fetchFn?: typeof fetch;
}

export interface GetContractsOptions {
  sender?: string;
  recipient?: string;
}

export interface ApiClient {
  getContracts: (opts?: GetContractsOptions) => Promise<ContractSchema[]>;
  getContract: (address: string) => Promise<ContractSchema>;
}

const DEFAULT_API_URL = "https://api-public.streamflow.finance";
const DEFAULT_DEVNET_API_URL = "https://api-public-staging.streamflow.finance";

export const createClient = (options?: ApiClientOptions): ApiClient => {
  const apiUrl = options?.apiUrl ?? options?.cluster === "mainnet" ? DEFAULT_API_URL : DEFAULT_DEVNET_API_URL;
  const fetchFn = options?.fetchFn ?? fetch;

  const fetchResource = async <T>(url: string, options?: RequestInit): Promise<T> => {
    const res = await fetchFn(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      ...(options ?? {}),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Tabularium API error`, {
        cause: new Error(`: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`),
      });
    }
    return res.json() as unknown as T;
  };

  return {
    getContracts: async (opts?: GetContractsOptions): Promise<ContractSchema[]> => {
      const params = new URLSearchParams();
      if (opts?.sender) params.set("sender", opts.sender);
      if (opts?.recipient) params.set("recipient", opts.recipient);

      const url = `${apiUrl}/v2/api/contracts/tabularium/${params.toString() ? `?${params.toString()}` : ""}`;

      return fetchResource<ContractSchema[]>(url);
    },

    getContract: async (address: string): Promise<ContractSchema> => {
      const url = `${apiUrl}/v2/api/contracts/tabularium/${encodeURIComponent(address)}`;
      return fetchResource<ContractSchema>(url);
    },
  };
};
