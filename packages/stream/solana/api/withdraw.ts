import { pk } from "@streamflow/common";

import type { IWithdrawData } from "../types.js";
import type { Env, InstructionResult, Invoker } from "./types.js";
import { createClientFromEnv } from "./types.js";

export async function withdraw(params: IWithdrawData, invoker: Invoker, env: Env): Promise<InstructionResult> {
  const client = createClientFromEnv(env);
  const invokerPublicKey = pk(invoker.publicKey);

  const ixs = await client.prepareWithdrawInstructions(params, {
    invoker: { publicKey: invokerPublicKey },
  });

  return { instructions: ixs };
}
