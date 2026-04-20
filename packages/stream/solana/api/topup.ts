import type { Keypair } from "@solana/web3.js";
import type { SignerWalletAdapter } from "@solana/wallet-adapter-base";

import type { ITopUpData } from "../types.js";
import type { Env, InstructionResult, Invoker, NativeOptions } from "./types.js";
import { createClientFromEnv } from "./types.js";

export async function topup(
  params: ITopUpData,
  invoker: Invoker,
  env: Env & NativeOptions,
): Promise<InstructionResult> {
  const client = createClientFromEnv(env);

  const ixs = await client.prepareTopupInstructions(params, {
    invoker: invoker as SignerWalletAdapter | Keypair,
    isNative: env.isNative ?? false,
  });

  return { instructions: ixs };
}
