import { pk } from "@streamflow/common";

import type { ITopUpData } from "../types.js";
import type { Env, InstructionResult, Invoker, NativeOptions } from "./types.js";
import { createClientFromEnv } from "./types.js";

export async function topup(
  params: ITopUpData,
  invoker: Invoker,
  env: Env & NativeOptions,
): Promise<InstructionResult> {
  const client = createClientFromEnv(env);
  const invokerPublicKey = pk(invoker.publicKey);

  // ITopUpStreamExt.invoker type is SignerWalletAdapter | Keypair, but only publicKey is used internally
  const ixs = await client.prepareTopupInstructions(params, {
    invoker: { publicKey: invokerPublicKey } as any,
    isNative: env.isNative ?? false,
  });

  return { instructions: ixs };
}
