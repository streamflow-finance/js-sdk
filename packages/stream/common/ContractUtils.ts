import BN from "bn.js";

export const calculateUnlocked = (
  depositedAmount: BN,
  cliff: number,
  cliffAmount: BN,
  end: number,
  currentTimestamp: number,
  lastRateChangeTime: number,
  period: number,
  amountPerPeriod: BN,
  fundsUnlockedAtLastRateChange: BN
): BN => {
  const deposited = depositedAmount;

  if (currentTimestamp < cliff) return new BN(0);
  if (currentTimestamp > end) return deposited;

  const streamed =
    lastRateChangeTime !== 0
      ? nonLinearReleaseRateUnlocked(
          currentTimestamp,
          lastRateChangeTime,
          period,
          amountPerPeriod,
          fundsUnlockedAtLastRateChange
        )
      : linearReleaseRateUnlocked(currentTimestamp, cliff, period, cliffAmount, amountPerPeriod);

  return streamed.lt(deposited) ? streamed : deposited;
};

const linearReleaseRateUnlocked = (
  currentTime: number,
  cliffTime: number,
  period: number,
  cliffAmount: BN,
  releaseRate: BN
) => {
  const perPeriod = new BN(Math.floor((currentTime - cliffTime) / period));
  return cliffAmount.add(perPeriod.mul(releaseRate));
};

const nonLinearReleaseRateUnlocked = (
  currentTime: number,
  lastRateChangeTime: number,
  period: number,
  releaseRate: BN,
  fundsUnlockedAtLastRateChange: BN
) => {
  return new BN(Math.floor((currentTime - lastRateChangeTime) / period))
    .mul(releaseRate)
    .add(fundsUnlockedAtLastRateChange);
};
