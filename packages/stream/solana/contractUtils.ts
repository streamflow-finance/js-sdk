import BN from "bn.js";

import {
  type AlignedStream,
  type ICreateAlignedStreamData,
  type ICreateLinearStreamData,
  type ICreateStreamData,
  type Stream,
  StreamType,
} from "./types.js";

const MAX_SAFE_UNIX_TIME_VALUE = 8640000000000;
const MAX_CLIFF_END_GAP_SECONDS = 1;

interface ICalculateUnlockedAmount {
  depositedAmount: BN;
  cliff: number;
  cliffAmount: BN;
  end: number;
  currentTimestamp: number;
  lastRateChangeTime: number;
  period: number;
  amountPerPeriod: BN;
  fundsUnlockedAtLastRateChange: BN;
}

export const calculateUnlockedAmount = ({
  depositedAmount,
  cliff,
  cliffAmount,
  end,
  currentTimestamp,
  lastRateChangeTime,
  period,
  amountPerPeriod,
  fundsUnlockedAtLastRateChange,
}: ICalculateUnlockedAmount): BN => {
  const deposited = depositedAmount;

  if (currentTimestamp < cliff) return new BN(0);
  if (currentTimestamp > end) return deposited;

  const savedUnlockedFunds = lastRateChangeTime === 0 ? cliffAmount : fundsUnlockedAtLastRateChange;
  const savedUnlockedFundsTime = lastRateChangeTime === 0 ? cliff : lastRateChangeTime;

  const streamed = new BN(Math.floor((currentTimestamp - savedUnlockedFundsTime) / period))
    .mul(amountPerPeriod)
    .add(savedUnlockedFunds);

  return streamed.lt(deposited) ? streamed : deposited;
};

export const isCliffCloseToDepositedAmount = (streamData: { depositedAmount: BN; cliffAmount: BN }): boolean => {
  return streamData.cliffAmount.gte(streamData.depositedAmount.sub(new BN(1)));
};

export const isVesting = (streamData: {
  depositedAmount: BN;
  cliffAmount: BN;
  minPrice?: number;
  maxPrice?: number;
  minPercentage?: number;
  maxPercentage?: number;
}): boolean => {
  return (
    !isCliffCloseToDepositedAmount(streamData) &&
    !isDynamicLock(streamData.minPrice, streamData.maxPrice, streamData.minPercentage, streamData.maxPercentage)
  );
};

export const isAligned = (stream: Stream): stream is AlignedStream => {
  return stream.isAligned;
};

export const isCreateAlignedStreamData = (obj: ICreateStreamData): obj is ICreateAlignedStreamData => {
  return "minPrice" in obj && "maxPrice" in obj && "minPercentage" in obj && "maxPercentage" in obj;
};

export const isDynamicLock = (
  minPrice?: number,
  maxPrice?: number,
  minPercentage?: number,
  maxPercentage?: number,
): boolean => {
  return (
    !!minPrice && !!maxPrice && minPrice > 0 && maxPrice - minPrice <= 1 && minPercentage === 0 && maxPercentage === 100
  );
};

export const isTokenLock = (streamData: {
  canTopup: boolean;
  automaticWithdrawal: boolean;
  cancelableBySender: boolean;
  cancelableByRecipient: boolean;
  transferableBySender: boolean;
  transferableByRecipient: boolean;
  depositedAmount: BN;
  cliffAmount: BN;
  cliff?: number;
  end?: number;
  minPrice?: number;
  maxPrice?: number;
  minPercentage?: number;
  maxPercentage?: number;
}): boolean => {
  if (
    streamData.canTopup ||
    streamData.automaticWithdrawal ||
    streamData.cancelableBySender ||
    streamData.cancelableByRecipient ||
    streamData.transferableBySender
  ) {
    return false;
  }

  if (isDynamicLock(streamData.minPrice, streamData.maxPrice, streamData.minPercentage, streamData.maxPercentage)) {
    return true;
  }

  if (isCliffCloseToDepositedAmount(streamData)) {
    if (streamData.cliff !== undefined && streamData.end !== undefined) {
      return streamData.end - streamData.cliff <= MAX_CLIFF_END_GAP_SECONDS;
    }
    return true;
  }

  return false;
};

/**
 * Whether the program charges a linear create the token-lock fee instead of the stream fee.
 * Keep in sync with the program's `is_strict_token_lock`, which runs on the create's own params
 * (a `start` of 0 sets both `start` and `cliff` to the current time); `isTokenLock` classifies a
 * decoded stream instead.
 */
export const isStrictTokenLockCreate = (
  data: Pick<
    ICreateLinearStreamData,
    | "canTopup"
    | "automaticWithdrawal"
    | "cancelableBySender"
    | "cancelableByRecipient"
    | "transferableBySender"
    | "amount"
    | "cliffAmount"
    | "amountPerPeriod"
    | "cliff"
    | "start"
    | "period"
  >,
  now: number = Math.floor(Date.now() / 1000),
): boolean => {
  if (
    data.canTopup ||
    data.automaticWithdrawal ||
    data.cancelableBySender ||
    data.cancelableByRecipient ||
    data.transferableBySender
  ) {
    return false;
  }
  if (!isCliffCloseToDepositedAmount({ depositedAmount: data.amount, cliffAmount: data.cliffAmount })) {
    return false;
  }
  if (data.cliffAmount.gt(data.amount) || data.amountPerPeriod.isZero()) {
    return false;
  }

  const remaining = data.amount.sub(data.cliffAmount);
  const periodsLeft = remaining.add(data.amountPerPeriod).subn(1).div(data.amountPerPeriod);
  const cliff = data.start === 0 ? now : data.cliff;
  const unlockStart = cliff > 0 ? cliff : data.start;
  const end = new BN(unlockStart).add(periodsLeft.mul(new BN(data.period)));
  const cliffEndGap = end.sub(new BN(cliff));
  return !cliffEndGap.isNeg() && cliffEndGap.lten(MAX_CLIFF_END_GAP_SECONDS);
};

export const buildStreamType = (streamData: {
  canTopup: boolean;
  automaticWithdrawal: boolean;
  cancelableBySender: boolean;
  cancelableByRecipient: boolean;
  transferableBySender: boolean;
  transferableByRecipient: boolean;
  depositedAmount: BN;
  cliffAmount: BN;
  cliff?: number;
  end?: number;
  minPrice?: number;
  maxPrice?: number;
  minPercentage?: number;
  maxPercentage?: number;
}): StreamType => {
  if (isTokenLock(streamData)) {
    return StreamType.Lock;
  }

  return StreamType.Vesting;
};

export const decodeEndTime = (endTime: BN): number => {
  if (endTime.gt(new BN(MAX_SAFE_UNIX_TIME_VALUE))) {
    return MAX_SAFE_UNIX_TIME_VALUE;
  }
  return endTime.toNumber();
};
