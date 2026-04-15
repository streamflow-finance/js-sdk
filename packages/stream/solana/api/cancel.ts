import { pk } from "@streamflow/common";

import type { ICancelData } from "../types.js";
import type { Env, InstructionResult, Invoker } from "./types.js";
import { createClientFromEnv } from "./types.js";

export async function cancel(params: ICancelData, invoker: Invoker, env: Env): Promise<InstructionResult> {
  const client = createClientFromEnv(env);
  const invokerPublicKey = pk(invoker.publicKey);

  const ixs = await client.prepareCancelInstructions(params, {
    invoker: { publicKey: invokerPublicKey },
  });

  return { instructions: ixs };
}
