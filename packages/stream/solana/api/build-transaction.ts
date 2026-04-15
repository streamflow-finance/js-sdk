import type { TransactionInstruction } from "@solana/web3.js";
import { prepareBaseInstructions, prepareTransaction } from "@streamflow/common";

import type { BuildTransactionOptions, BuiltTransaction, Env } from "./types.js";
import { resolveConnection } from "./types.js";

export async function buildTransaction(
  instructions: TransactionInstruction[],
  options: BuildTransactionOptions,
  env: Env,
): Promise<BuiltTransaction> {
  const connection = resolveConnection(env);

  const computeBudgetIxs = prepareBaseInstructions(connection, {
    computePrice: options.computePrice && typeof options.computePrice === "function" ? undefined : options.computePrice,
    computeLimit: options.computeLimit && typeof options.computeLimit !== "number" ? undefined : options.computeLimit,
  });

  const allIxs = [...computeBudgetIxs, ...instructions];

  const { tx, hash, context } = await prepareTransaction(connection, allIxs, options.feePayer, env.commitment);

  return {
    transaction: tx,
    blockhashWithExpiryBlockHeight: hash,
    context,
  };
}
