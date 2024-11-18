import { getBN } from "@streamflow/common";
import { PublicKey } from "@solana/web3.js";
// eslint-disable-next-line no-restricted-imports
import BN from "bn.js";
import { describe, expect, test } from "vitest";

import {
  RewardEntryAccumulator,
  calculateRewardAmountFromRate,
  calculateRewardRateFromAmount,
} from "../../solana/lib/rewards.js";
import { SCALE_PRECISION_FACTOR_BN } from "../../solana/constants.js";

const populateRewardEntry = (
  effectiveStakedAmount?: BN,
  rewardAmount?: BN,
  rewardPeriod?: BN,
  periods?: number,
): RewardEntryAccumulator => {
  const rewardEntry = new RewardEntryAccumulator(
    new BN(0),
    new BN(0),
    new BN(0),
    PublicKey.default,
    PublicKey.default,
    new BN(0),
    new BN(0),
    new BN(0),
    [],
  );
  if (effectiveStakedAmount && rewardAmount && rewardPeriod) {
    rewardEntry.accountedAmount = rewardEntry.getAccountableAmount(
      new BN(0),
      rewardPeriod.muln(periods || 1),
      effectiveStakedAmount,
      rewardAmount,
      rewardPeriod,
    );
  }
  return rewardEntry;
};

describe("RewardEntryAccumulator", () => {
  describe("getClaimableAmount", () => {
    const testCases: [number, number, number, number, BN][] = [
      [9, 9, 1, 0.0025, new BN(2_500_000)],
      [6, 9, 1, 0.0025, new BN(2_500_000_000)],
      [9, 6, 1, 0.0025, new BN(2_500)],
      [1, 8, 1, 0.0025, new BN(25_000_000_000_000)],
    ];
    testCases.forEach(([stakeTokenDecimals, rewardTokenDecimals, periods, rewardRate, expectedRewardAmount]) => {
      test(`test decimals - ${stakeTokenDecimals}/${rewardTokenDecimals}/${periods}/${rewardRate}`, () => {
        const stakedAmount = getBN(1, stakeTokenDecimals);
        const effectiveStakedAmount = stakedAmount.mul(SCALE_PRECISION_FACTOR_BN);
        const rewardPeriod = new BN(1);
        const rewardAmount = calculateRewardAmountFromRate(rewardRate, stakeTokenDecimals, rewardTokenDecimals);
        const rewardEntry = populateRewardEntry(effectiveStakedAmount, rewardAmount, rewardPeriod, periods);
        const claimableAmount = rewardEntry.getClaimableAmount();

        expect(rewardAmount.toString()).toEqual(expectedRewardAmount.toString());
        expect(claimableAmount.toString()).toEqual(getBN(rewardRate, rewardTokenDecimals).muln(periods).toString());
        expect(calculateRewardRateFromAmount(rewardAmount, stakeTokenDecimals, rewardTokenDecimals)).toEqual(
          rewardRate,
        );
      });
    });

    test(`test decimals - negative difference`, () => {
      let rewardAmount = calculateRewardAmountFromRate(0.0025, 18, 1);
      expect(rewardAmount.toString()).toEqual(new BN(0).toString());

      rewardAmount = calculateRewardAmountFromRate(0.0025, 12, 4);
      expect(rewardAmount.toString()).toEqual(new BN(0).toString());
    });

    test(`test decimals - precision loss`, () => {
      const stakeTokenDecimals = 12;
      const rewardTokenDecimals = 6;
      const stakedAmount = getBN(1, stakeTokenDecimals);
      const effectiveStakedAmount = stakedAmount.mul(SCALE_PRECISION_FACTOR_BN);
      const rewardPeriod = new BN(1);
      const rewardAmount = calculateRewardAmountFromRate(0.0025, stakeTokenDecimals, rewardTokenDecimals);
      const rewardEntry = populateRewardEntry(effectiveStakedAmount, rewardAmount, rewardPeriod);
      const claimableAmount = rewardEntry.getClaimableAmount();

      expect(rewardAmount.toString()).toEqual(new BN(2).toString());
      expect(claimableAmount.toString()).toEqual(getBN(0.002, rewardTokenDecimals).toString());
      expect(calculateRewardRateFromAmount(rewardAmount, stakeTokenDecimals, rewardTokenDecimals)).toEqual(0.002);
    });
  });
});
