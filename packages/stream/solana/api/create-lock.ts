import { type PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import type { ICreateLinearStreamData } from "../types.js";
import type { CreateInstructionResult, Env, Invoker, NativeOptions } from "./types.js";
import { create } from "./create.js";

export interface ICreateLockParams {
  recipient: string;
  tokenId: string;
  amount: BN;
  unlockDate: number;
  name: string;
  transferableByRecipient?: boolean;
  partner?: string;
  tokenProgramId?: string | PublicKey;
}

export function buildLockParams(params: ICreateLockParams): ICreateLinearStreamData {
  if (params.amount.lten(1)) {
    throw new Error("Lock amount must be greater than 1");
  }

  return {
    recipient: params.recipient,
    tokenId: params.tokenId,
    amount: params.amount,
    start: params.unlockDate,
    cliff: params.unlockDate,
    period: 1,
    cliffAmount: params.amount.subn(1),
    amountPerPeriod: new BN(1),
    name: params.name,
    canTopup: false,
    cancelableBySender: false,
    cancelableByRecipient: false,
    transferableBySender: false,
    transferableByRecipient: params.transferableByRecipient ?? false,
    automaticWithdrawal: false,
    withdrawalFrequency: 0,
    ...(params.partner !== undefined && { partner: params.partner }),
    ...(params.tokenProgramId !== undefined && { tokenProgramId: params.tokenProgramId }),
  };
}

export async function createLock(
  params: ICreateLockParams,
  invoker: Invoker,
  env: Env & NativeOptions,
): Promise<CreateInstructionResult> {
  return create(buildLockParams(params), invoker, env);
}
