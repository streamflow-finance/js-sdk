import BN from "bn.js";

import { AlignedStream, ICreateAlignedStreamData, ICreateStreamData, Stream, StreamType } from "./types.js";
import { MAX_SAFE_UNIX_TIME_VALUE } from "./constants.js";

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

export const isPayment = (streamData: { canTopup: boolean }): boolean => {
  return streamData.canTopup;
};

export const isVesting = (streamData: {
  canTopup: boolean;
  depositedAmount: BN;
  cliffAmount: BN;
  minPrice?: number;
  maxPrice?: number;
  minPercentage?: number;
  maxPercentage?: number;
}): boolean => {
  return (
    !streamData.canTopup &&
    !isCliffCloseToDepositedAmount(streamData) &&
    !isDynamicLock(streamData.minPrice, streamData.maxPrice, streamData.minPercentage, streamData.maxPercentage)
  );
};

export const isAligned = (stream: Stream): stream is AlignedStream => {
  return "minPrice" in stream && "maxPrice" in stream && "minPercentage" in stream && "maxPercentage" in stream;
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
  minPrice?: number;
  maxPrice?: number;
  minPercentage?: number;
  maxPercentage?: number;
}): boolean => {
  return (
    !streamData.canTopup &&
    !streamData.automaticWithdrawal &&
    !streamData.cancelableBySender &&
    !streamData.cancelableByRecipient &&
    !streamData.transferableBySender &&
    !streamData.transferableByRecipient &&
    (isCliffCloseToDepositedAmount(streamData) ||
      isDynamicLock(streamData.minPrice, streamData.maxPrice, streamData.minPercentage, streamData.maxPercentage))
  );
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
  minPrice?: number;
  maxPrice?: number;
  minPercentage?: number;
  maxPercentage?: number;
}): StreamType => {
  if (isVesting(streamData)) {
    return StreamType.Vesting;
  }
  if (isTokenLock(streamData)) {
    return StreamType.Lock;
  }
  return StreamType.Payment;
};

export const decodeEndTime = (endTime: BN): number => {
  if (endTime.gt(new BN(MAX_SAFE_UNIX_TIME_VALUE))) {
    return MAX_SAFE_UNIX_TIME_VALUE;
  }
  return endTime.toNumber();
};
