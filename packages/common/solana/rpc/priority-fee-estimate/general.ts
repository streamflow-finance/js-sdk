import type { Connection, PublicKey } from "@solana/web3.js";

import { deserializeRawTransaction } from "../../lib/deserialize-raw-transaction.js";
import type { GetPriorityFeeEstimateOptions } from "../types.js";
import { resolveMedian } from "./calc-fee.js";
import { pk } from "../../lib/public-key.js";

/**
 * Fetch the recent prioritization fees from the RPC [getRecentPrioritizationFees] (https://solana.com/docs/rpc/http/getrecentprioritizationfees)
 * @deprecated Not recommended for use because it provides a single number per slot to indicate the minimum priority fee amount.
 * @param connection - The connection to the RPC
 * @param options - The options for the RPC
 * @returns The priority fee estimate
 */
export const getPriorityFeeEstimate = async (connection: Connection, options: GetPriorityFeeEstimateOptions) => {
  const recentPrioritizationFee = await getRecentPrioritizationFee(connection, options);
  const median = resolveMedian(recentPrioritizationFee.map((r) => r.prioritizationFee));
  return { median: Math.ceil(median * (1 + (options.increaseFactor ?? 0.05))), data: recentPrioritizationFee };
};

/**
 * Fetch the recent prioritization fees from the RPC [getRecentPrioritizationFees] (https://solana.com/docs/rpc/http/getrecentprioritizationfees)
 * @deprecated Not recommended for use because it provides a single number per slot to indicate the minimum priority fee amount.
 * @param connection - The connection to the RPC
 * @param options - The options for the RPC
 * @returns The priority fee estimate
 */
export const getRecentPrioritizationFee = async (
  connection: Connection,
  options: Pick<GetPriorityFeeEstimateOptions, "accountsOrTx">,
) => {
  return connection.getRecentPrioritizationFees({ lockedWritableAccounts: buildArgs(options.accountsOrTx)[0] });
};

const buildArgs = (accountsOrTx: (string | PublicKey)[] | string) => {
  const accountsArray =
    accountsOrTx instanceof Array ? accountsOrTx.map(pk) : deserializeRawTransaction(accountsOrTx).writableAccounts;
  return [accountsArray] as const;
};
