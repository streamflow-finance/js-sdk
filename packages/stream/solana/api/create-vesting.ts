import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import type { ICreateLinearStreamData } from "../types.js";
import type { BatchInstructionResult, CreateInstructionResult, Env, Invoker, NativeOptions } from "./types.js";
import { createClientFromEnv } from "./types.js";
import { create } from "./create.js";

export interface ICreateVestingParams {
  recipient: string;
  tokenId: string;
  amount: BN;
  start: number;
  period: number;
  name: string;
  endDate?: number;
  duration?: number;
  cliffAmount?: BN;
  amountPerPeriod?: BN;
  cancelableBySender?: boolean;
  automaticWithdrawal?: boolean;
  withdrawalFrequency?: number;
  transferableBySender?: boolean;
  transferableByRecipient?: boolean;
  initialAllocation?: {
    amount: BN;
  };
  partner?: string;
  tokenProgramId?: string | PublicKey;
}

export function resolveDuration(params: Pick<ICreateVestingParams, "start" | "endDate" | "duration">): number {
  if (params.endDate !== undefined && params.duration !== undefined) {
    throw new Error("Provide either endDate or duration, not both");
  }
  if (params.endDate === undefined && params.duration === undefined) {
    throw new Error("Must provide either endDate or duration");
  }

  const duration = params.endDate !== undefined ? params.endDate - params.start : params.duration!;

  if (duration <= 0) {
    throw new Error("Duration must be positive");
  }

  return duration;
}

export function computeAmountPerPeriod(amount: BN, cliffAmount: BN, duration: number, period: number): BN {
  const remaining = amount.sub(cliffAmount);

  if (remaining.lten(0)) {
    throw new Error("cliffAmount must be less than total amount");
  }

  const numPeriods = Math.floor(duration / period);

  if (numPeriods <= 0) {
    throw new Error("Duration must be at least equal to period");
  }

  return remaining.addn(numPeriods - 1).divn(numPeriods);
}

export function buildVestingParams(params: ICreateVestingParams): ICreateLinearStreamData {
  const cliffAmount = params.cliffAmount ?? new BN(0);
  const duration = resolveDuration(params);

  return {
    recipient: params.recipient,
    tokenId: params.tokenId,
    amount: params.amount,
    start: params.start,
    cliff: params.start,
    period: params.period,
    name: params.name,
    cliffAmount,
    amountPerPeriod:
      params.amountPerPeriod ?? computeAmountPerPeriod(params.amount, cliffAmount, duration, params.period),
    canTopup: false,
    cancelableByRecipient: false,
    cancelableBySender: params.cancelableBySender ?? false,
    transferableBySender: params.transferableBySender ?? false,
    transferableByRecipient: params.transferableByRecipient ?? false,
    automaticWithdrawal: params.automaticWithdrawal ?? false,
    withdrawalFrequency: params.withdrawalFrequency ?? (params.automaticWithdrawal ? params.period : 0),
    ...(params.partner !== undefined && { partner: params.partner }),
    ...(params.tokenProgramId !== undefined && { tokenProgramId: params.tokenProgramId }),
  };
}

export function createVesting(
  params: ICreateVestingParams & { initialAllocation?: undefined },
  invoker: Invoker,
  env: Env & NativeOptions,
): Promise<CreateInstructionResult>;

export function createVesting(
  params: ICreateVestingParams & { initialAllocation: { amount: BN } },
  invoker: Invoker,
  env: Env & NativeOptions,
): Promise<BatchInstructionResult>;

export async function createVesting(
  params: ICreateVestingParams,
  invoker: Invoker,
  env: Env & NativeOptions,
): Promise<CreateInstructionResult | BatchInstructionResult> {
  if (!params.initialAllocation) {
    return create(buildVestingParams(params), invoker, env);
  }

  if (!params.initialAllocation.amount.gtn(0)) {
    throw new Error("Initial allocation amount must be greater than zero");
  }

  const client = createClientFromEnv(env);
  const mainData = buildVestingParams(params);

  const cancelableBySender = params.cancelableBySender ?? false;

  const allocData: ICreateLinearStreamData = {
    recipient: params.recipient,
    tokenId: params.tokenId,
    amount: params.initialAllocation.amount,
    start: params.start,
    cliff: params.start,
    period: 1,
    cliffAmount: params.initialAllocation.amount.subn(2),
    amountPerPeriod: new BN(2),
    name: params.name,
    canTopup: false,
    cancelableBySender,
    cancelableByRecipient: false,
    transferableBySender: false,
    transferableByRecipient: false,
    automaticWithdrawal: false,
    withdrawalFrequency: 0,
    ...(params.partner !== undefined && { partner: params.partner }),
    ...(params.tokenProgramId !== undefined && { tokenProgramId: params.tokenProgramId }),
  };

  const [mainResult, allocResult] = await Promise.all([
    client.buildCreateTransactionInstructions(mainData, {
      sender: invoker,
      isNative: env.isNative ?? false,
    }),
    client.buildCreateTransactionInstructions(allocData, {
      sender: invoker,
      isNative: env.isNative ?? false,
    }),
  ]);

  return {
    setupInstructions: [...mainResult.ixs.slice(0, -1), ...allocResult.ixs.slice(0, -1)],
    creationBatches: [
      {
        instructions: [mainResult.ixs[mainResult.ixs.length - 1]],
        signers: mainResult.metadata ? [mainResult.metadata] : undefined,
        recipient: params.recipient,
        metadataPubKey: new PublicKey(mainResult.metadataId),
      },
      {
        instructions: [allocResult.ixs[allocResult.ixs.length - 1]],
        signers: allocResult.metadata ? [allocResult.metadata] : undefined,
        recipient: params.recipient,
        metadataPubKey: new PublicKey(allocResult.metadataId),
      },
    ],
  };
}
