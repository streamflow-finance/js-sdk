import type { IWithdrawData } from "../types.js";
import type { Env, InstructionResult, Invoker } from "./types.js";
import { createClientFromEnv } from "./types.js";

export async function withdraw(params: IWithdrawData, invoker: Invoker, env: Env): Promise<InstructionResult> {
  const client = createClientFromEnv(env);

  const ixs = await client.prepareWithdrawInstructions(params, {
    invoker,
  });

  return { instructions: ixs };
}
