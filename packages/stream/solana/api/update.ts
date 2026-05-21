import type { IUpdateData } from "../types.js";
import type { Env, InstructionResult, Invoker } from "./types.js";
import { createClientFromEnv, normalizeInvoker } from "./types.js";

export async function update(params: IUpdateData, invoker: Invoker, env: Env): Promise<InstructionResult> {
  const client = createClientFromEnv(env);

  const ixs = await client.prepareUpdateInstructions(params, {
    invoker: normalizeInvoker(invoker),
  });

  return { instructions: ixs };
}
