import { type PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import type { ICreateMultipleLinearStreamData, IRecipient } from "../types.js";
import type { BatchInstructionResult, Env, Invoker, NativeOptions } from "./types.js";
import { createBatch } from "./create-batch.js";

export interface ILockBatchRecipient {
  recipient: string;
  amount: BN;
  name: string;
}

export interface ICreateLockBatchParams {
  recipients: ILockBatchRecipient[];
  tokenId: string;
  unlockDate: number;
  transferableByRecipient?: boolean;
  partner?: string;
  tokenProgramId?: string | PublicKey;
}

export function buildLockBatchParams(params: ICreateLockBatchParams): ICreateMultipleLinearStreamData {
  return {
    tokenId: params.tokenId,
    start: params.unlockDate,
    cliff: params.unlockDate,
    period: 1,
    canTopup: false,
    cancelableBySender: false,
    cancelableByRecipient: false,
    transferableBySender: false,
    transferableByRecipient: params.transferableByRecipient ?? false,
    automaticWithdrawal: false,
    withdrawalFrequency: 0,
    ...(params.partner !== undefined && { partner: params.partner }),
    ...(params.tokenProgramId !== undefined && { tokenProgramId: params.tokenProgramId }),
    recipients: params.recipients.map(
      (r): IRecipient => ({
        recipient: r.recipient,
        amount: r.amount,
        name: r.name,
        cliffAmount: r.amount.subn(1),
        amountPerPeriod: new BN(1),
      }),
    ),
  };
}

export async function createLockBatch(
  params: ICreateLockBatchParams,
  invoker: Invoker,
  env: Env & NativeOptions,
): Promise<BatchInstructionResult> {
  if (params.recipients.length === 0) {
    throw new Error("At least one recipient required");
  }

  for (const r of params.recipients) {
    if (r.amount.lten(1)) {
      throw new Error("Lock amount must be greater than 1");
    }
  }

  return createBatch(buildLockBatchParams(params), invoker, env);
}
