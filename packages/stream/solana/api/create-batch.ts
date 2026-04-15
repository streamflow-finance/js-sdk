import { PublicKey } from "@solana/web3.js";
import { pk } from "@streamflow/common";

import type { ICreateMultipleAlignedStreamData, ICreateMultipleLinearStreamData } from "../types.js";
import type { BatchInstructionResult, Env, Invoker, NativeOptions } from "./types.js";
import { createClientFromEnv } from "./types.js";

export async function createBatch(
  params: ICreateMultipleLinearStreamData | ICreateMultipleAlignedStreamData,
  invoker: Invoker,
  env: Env & NativeOptions,
): Promise<BatchInstructionResult> {
  const client = createClientFromEnv(env);
  const senderPublicKey = pk(invoker.publicKey);

  const result = await client.buildCreateMultipleTransactionInstructions(params, {
    sender: { publicKey: senderPublicKey },
    isNative: env.isNative ?? false,
  });

  return {
    setupInstructions: result.prepareInstructions,
    creationBatches: result.instructionsBatch.map((batch, i) => ({
      instructions: batch.ixs,
      signers: batch.metadata ? [batch.metadata] : undefined,
      recipient: batch.recipient,
      metadataPubKey: new PublicKey(result.metadatas[i]!),
    })),
  };
}
