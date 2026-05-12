import { type PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import type { ICreateMultipleLinearStreamData, IRecipient } from "../types.js";
import { computeAmountPerPeriod, resolveDuration } from "./create-vesting.js";
import type { BatchInstructionResult, Env, Invoker, NativeOptions } from "./types.js";
import { createBatch } from "./create-batch.js";

export interface IVestingBatchRecipient {
  recipient: string;
  amount: BN;
  name: string;
  cliffAmount?: BN;
  amountPerPeriod?: BN;
}

export interface ICreateVestingBatchParams {
  recipients: IVestingBatchRecipient[];
  tokenId: string;
  start: number;
  period: number;
  endDate?: number;
  duration?: number;
  cancelableBySender?: boolean;
  automaticWithdrawal?: boolean;
  withdrawalFrequency?: number;
  transferableBySender?: boolean;
  transferableByRecipient?: boolean;
  partner?: string;
  tokenProgramId?: string | PublicKey;
}

export function buildVestingBatchParams(params: ICreateVestingBatchParams): ICreateMultipleLinearStreamData {
  const duration = resolveDuration(params);

  return {
    tokenId: params.tokenId,
    start: params.start,
    cliff: params.start,
    period: params.period,
    canTopup: false,
    cancelableByRecipient: false,
    cancelableBySender: params.cancelableBySender ?? false,
    transferableBySender: params.transferableBySender ?? false,
    transferableByRecipient: params.transferableByRecipient ?? false,
    automaticWithdrawal: params.automaticWithdrawal ?? false,
    withdrawalFrequency: params.withdrawalFrequency ?? (params.automaticWithdrawal ? params.period : 0),
    ...(params.partner !== undefined && { partner: params.partner }),
    ...(params.tokenProgramId !== undefined && { tokenProgramId: params.tokenProgramId }),
    recipients: params.recipients.map(
      (r): IRecipient => ({
        recipient: r.recipient,
        amount: r.amount,
        name: r.name,
        cliffAmount: r.cliffAmount ?? new BN(0),
        amountPerPeriod:
          r.amountPerPeriod ?? computeAmountPerPeriod(r.amount, r.cliffAmount ?? new BN(0), duration, params.period),
      }),
    ),
  };
}

export async function createVestingBatch(
  params: ICreateVestingBatchParams,
  invoker: Invoker,
  env: Env & NativeOptions,
): Promise<BatchInstructionResult> {
  if (params.recipients.length === 0) {
    throw new Error("At least one recipient required");
  }

  for (const r of params.recipients) {
    if (r.amount.lte(new BN(0))) {
      throw new Error("Amount must be greater than zero");
    }
  }

  return createBatch(buildVestingBatchParams(params), invoker, env);
}
