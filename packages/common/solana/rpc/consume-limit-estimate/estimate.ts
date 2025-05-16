import type { VersionedTransaction, Connection } from "@solana/web3.js";

import type { GetConsumeLimitEstimateOptions } from "../types.js";

/**
 * Estimate the consume limit of a transaction based on the simulation results of the transaction.
 * @param connection - The connection to the RPC
 * @param tx - The transaction to estimate the consume limit for
 * @param options - The options for the estimate
 * @returns The consume limit estimate multiplied by a multiplier percent or undefined and the native simulation results
 */
export const estimateConsumeLimit = async (
  connection: Connection,
  tx: VersionedTransaction,
  options: GetConsumeLimitEstimateOptions = {},
) => {
  const { increaseFactor = 0.05 } = options;
  const simulationResults = await connection.simulateTransaction(tx, {
    sigVerify: false,
    replaceRecentBlockhash: true,
  });
  return {
    unitsConsumed: simulationResults.value.unitsConsumed
      ? Math.ceil(simulationResults.value.unitsConsumed * (1 + increaseFactor))
      : simulationResults.value.unitsConsumed,
    data: simulationResults,
  };
};
