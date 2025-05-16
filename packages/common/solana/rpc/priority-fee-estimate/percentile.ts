import type { Connection, PublicKey } from "@solana/web3.js";

import { deserializeRawTransaction } from "../../lib/deserialize-raw-transaction.js";
import type { GetPriorityFeeEstimateOptions } from "../types.js";
import { resolveMedian } from "./calc-fee.js";

type RpcRequest = (methodName: string, args: Array<any> | ReadonlyArray<any>) => Promise<any>;

/**
 * @category GetPriorityFeeEstimateOptions
 * @interface RecentPrioritizationFee
 * @property result - The result of the recent prioritization fees.
 * @property result.prioritizationFee - The prioritization fee.
 * @property result.slot - The slot of the prioritization fee.
 */
interface RecentPrioritizationFee {
  result: Array<{ prioritizationFee: number; slot: number }>;
}

/**
 * Fetch the recent prioritization fees from the RPC [getRecentPrioritizationFees]
 * @param connection - The connection to the RPC
 * @param options - The options for the RPC
 * @returns The priority fee estimate
 */
export const getPriorityFeeEstimate = async (connection: Connection, options: GetPriorityFeeEstimateOptions) => {
  const recentPrioritizationFee = await getRecentPrioritizationFee(connection, options);
  const median = resolveMedian(recentPrioritizationFee.result.map((r) => r.prioritizationFee));
  return { median: Math.ceil(median * (1 + (options.increaseFactor ?? 0.05))), data: recentPrioritizationFee };
};

/**
 * If an RPC of use supports percentile value, aka {@link https://docs.triton.one/chains/solana/improved-priority-fees-api}
 * @param connection - The connection to the RPC
 * @param options - The options for the RPC
 * @returns The priority fee estimate
 */
export const getRecentPrioritizationFee = async (
  connection: Connection,
  options: Pick<GetPriorityFeeEstimateOptions, "accountsOrTx" | "percentile">,
): Promise<RecentPrioritizationFee> => {
  const { accountsOrTx, percentile = 5000 } = options;

  return (connection as unknown as { _rpcRequest: RpcRequest })._rpcRequest(
    "getRecentPrioritizationFees",
    buildArgs(accountsOrTx, percentile),
  ) as Promise<RecentPrioritizationFee>;
};

const buildArgs = (accountsOrTx: (string | PublicKey)[] | string, percentile: number) => {
  const accountsArray =
    accountsOrTx instanceof Array
      ? accountsOrTx.map((a) => a.toString())
      : deserializeRawTransaction(accountsOrTx).writableAccounts.map((a) => a.toString());
  return [
    accountsArray,
    {
      percentile,
    },
  ] as const;
};
