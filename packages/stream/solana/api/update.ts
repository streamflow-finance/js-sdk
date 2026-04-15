import { pk } from "@streamflow/common";

import type { IUpdateData } from "../types.js";
import type { Env, InstructionResult, Invoker } from "./types.js";
import { createClientFromEnv } from "./types.js";

export async function update(params: IUpdateData, invoker: Invoker, env: Env): Promise<InstructionResult> {
  const client = createClientFromEnv(env);
  const invokerPublicKey = pk(invoker.publicKey);

  const ixs = await client.prepareUpdateInstructions(params, {
    invoker: { publicKey: invokerPublicKey },
  });

  return { instructions: ixs };
}
