import BigNumber from "bignumber.js";

import { StreamType } from "./types.js";

interface ICalculateUnlockedAmount {
  depositedAmount: BigNumber;
  cliff: number;
  cliffAmount: BigNumber;
  end: number;
  currentTimestamp: number;
  lastRateChangeTime: number;
  period: number;
  amountPerPeriod: BigNumber;
  fundsUnlockedAtLastRateChange: BigNumber;
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
}: ICalculateUnlockedAmount): BigNumber => {
  const deposited = depositedAmount;

  if (currentTimestamp < cliff) return BigNumber(0);
  if (currentTimestamp > end) return deposited;

  const savedUnlockedFunds = lastRateChangeTime === 0 ? cliffAmount : fundsUnlockedAtLastRateChange;
  const savedUnlockedFundsTime = lastRateChangeTime === 0 ? cliff : lastRateChangeTime;

  const streamed = BigNumber(Math.floor((currentTimestamp - savedUnlockedFundsTime) / period))
    .times(amountPerPeriod)
    .plus(savedUnlockedFunds);

  return streamed.lt(deposited) ? streamed : deposited;
};

export const isCliffCloseToDepositedAmount = (streamData: {
  depositedAmount: BigNumber;
  cliffAmount: BigNumber;
}): boolean => {
  return streamData.cliffAmount.gte(streamData.depositedAmount.minus(BigNumber(1)));
};

export const isPayment = (streamData: { canTopup: boolean }): boolean => {
  return streamData.canTopup;
};

export const isVesting = (streamData: {
  canTopup: boolean;
  depositedAmount: BigNumber;
  cliffAmount: BigNumber;
}): boolean => {
  return !streamData.canTopup && !isCliffCloseToDepositedAmount(streamData);
};

export const isTokenLock = (streamData: {
  canTopup: boolean;
  automaticWithdrawal: boolean;
  cancelableBySender: boolean;
  cancelableByRecipient: boolean;
  transferableBySender: boolean;
  transferableByRecipient: boolean;
  depositedAmount: BigNumber;
  cliffAmount: BigNumber;
}): boolean => {
  return (
    !streamData.canTopup &&
    !streamData.automaticWithdrawal &&
    !streamData.cancelableBySender &&
    !streamData.cancelableByRecipient &&
    !streamData.transferableBySender &&
    !streamData.transferableByRecipient &&
    isCliffCloseToDepositedAmount(streamData)
  );
};

export const buildStreamType = (streamData: {
  canTopup: boolean;
  automaticWithdrawal: boolean;
  cancelableBySender: boolean;
  cancelableByRecipient: boolean;
  transferableBySender: boolean;
  transferableByRecipient: boolean;
  depositedAmount: BigNumber;
  cliffAmount: BigNumber;
}): StreamType => {
  if (isVesting(streamData)) {
    return StreamType.Vesting;
  }
  if (isTokenLock(streamData)) {
    return StreamType.Lock;
  }
  return StreamType.Payment;
};
