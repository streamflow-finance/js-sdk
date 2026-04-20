import { PublicKey } from "@solana/web3.js";

import type { ICreateStreamData } from "../types.js";
import type { CreateInstructionResult, Env, Invoker, NativeOptions } from "./types.js";
import { createClientFromEnv } from "./types.js";

export async function create(
  params: ICreateStreamData,
  invoker: Invoker,
  env: Env & NativeOptions,
): Promise<CreateInstructionResult> {
  const client = createClientFromEnv(env);

  const { ixs, metadataId, metadata } = await client.buildCreateTransactionInstructions(params, {
    sender: invoker,
    isNative: env.isNative ?? false,
  });

  return {
    instructions: ixs,
    signers: metadata ? [metadata] : undefined,
    metadata,
    metadataPubKey: new PublicKey(metadataId),
  };
}
