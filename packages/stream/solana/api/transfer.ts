import { pk } from "@streamflow/common";

import type { ITransferData } from "../types.js";
import type { Env, InstructionResult, Invoker } from "./types.js";
import { createClientFromEnv } from "./types.js";

/**
 * Prepare transfer instructions.
 * Note: prepareTransferInstructions embeds ComputeBudgetProgram.setComputeUnitLimit
 * (computeLimit defaults to 100001). Callers using buildTransaction() should leave
 * computeLimit undefined to avoid duplicating compute budget instructions.
 */
export async function transfer(params: ITransferData, invoker: Invoker, env: Env): Promise<InstructionResult> {
  const client = createClientFromEnv(env);
  const invokerPublicKey = pk(invoker.publicKey);

  const ixs = await client.prepareTransferInstructions(params, {
    invoker: { publicKey: invokerPublicKey },
  });

  return { instructions: ixs };
}
