import type { ICancelData } from "../types.js";
import type { Env, InstructionResult, Invoker } from "./types.js";
import { createClientFromEnv, normalizeInvoker } from "./types.js";

export async function cancel(params: ICancelData, invoker: Invoker, env: Env): Promise<InstructionResult> {
  const client = createClientFromEnv(env);

  const ixs = await client.prepareCancelInstructions(params, {
    invoker: normalizeInvoker(invoker),
  });

  return { instructions: ixs };
}
