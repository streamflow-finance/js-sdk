import { executeTransaction, executeMultipleTransactions } from "@streamflow/common";

import type { BatchExecuteResult, BuiltTransaction, ExecutionEnv } from "./types.js";
import { resolveConnection } from "./types.js";

export async function execute(builtTx: BuiltTransaction, env: ExecutionEnv): Promise<string> {
  const connection = resolveConnection(env);

  return executeTransaction(
    connection,
    builtTx.transaction,
    {
      hash: builtTx.blockhashWithExpiryBlockHeight,
      context: builtTx.context,
      commitment: env.commitment,
    },
    {
      sendRate: env.sendRate,
      sendThrottler: env.throttler,
      skipSimulation: env.skipPreflight,
    },
  );
}

export async function executeBatch(
  builtTransactions: BuiltTransaction[],
  env: ExecutionEnv,
): Promise<BatchExecuteResult> {
  const connection = resolveConnection(env);

  const results = await executeMultipleTransactions(
    connection,
    builtTransactions.map((btx) => btx.transaction),
    {
      hash: builtTransactions[0]!.blockhashWithExpiryBlockHeight,
      context: builtTransactions[0]!.context,
      commitment: env.commitment,
    },
    {
      sendRate: env.sendRate,
      sendThrottler: env.throttler,
    },
  );

  const signatures: string[] = [];
  const errors: Error[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      signatures.push(result.value);
    } else {
      errors.push(result.reason instanceof Error ? result.reason : new Error(String(result.reason)));
    }
  }

  return { signatures, errors };
}

export async function executeBatchSequential(
  builtTransactions: BuiltTransaction[],
  env: ExecutionEnv,
): Promise<BatchExecuteResult> {
  const connection = resolveConnection(env);
  const signatures: string[] = [];
  const errors: Error[] = [];

  for (const btx of builtTransactions) {
    try {
      const sig = await executeTransaction(
        connection,
        btx.transaction,
        {
          hash: btx.blockhashWithExpiryBlockHeight,
          context: btx.context,
          commitment: env.commitment,
        },
        {
          sendRate: env.sendRate,
          sendThrottler: env.throttler,
          skipSimulation: env.skipPreflight,
        },
      );
      signatures.push(sig);
    } catch (err) {
      errors.push(err instanceof Error ? err : new Error(String(err)));
    }
  }

  return { signatures, errors };
}
