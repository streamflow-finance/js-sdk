import { ProgramAccount } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
// eslint-disable-next-line no-restricted-imports
import BN from "bn.js";

import { RewardEntry, StakeEntry, RewardPool } from "../types.js";
import { SCALE_PRECISION_FACTOR_BN } from "../constants.js";

export const REWARD_AMOUNT_PRECISION_FACTOR = new BN("1000000000");

export class RewardEntryAccumulator implements RewardEntry {
  lastAccountedTs: BN;

  claimedAmount: BN;

  accountedAmount: BN;

  rewardPool: PublicKey;

  stakeEntry: PublicKey;

  createdTs: BN;

  lastRewardAmount: BN;

  lastRewardPeriod: BN;

  buffer: number[];

  constructor(public delegate: RewardEntry) {
    this.lastAccountedTs = delegate.lastAccountedTs;
    this.claimedAmount = delegate.claimedAmount;
    this.accountedAmount = delegate.accountedAmount;
    this.rewardPool = delegate.rewardPool;
    this.stakeEntry = delegate.stakeEntry;
    this.createdTs = delegate.createdTs;
    this.buffer = delegate.buffer;
    this.lastRewardAmount = delegate.lastRewardAmount;
    this.lastRewardPeriod = delegate.lastRewardPeriod;
  }

  // Calculate accountable amount by calculating how many seconds have passed since last claim/stake time
  getAccountableAmount(
    stakedTs: BN,
    accountableTs: BN,
    effectiveStakedAmount: BN,
    rewardAmount: BN,
    rewardPeriod: BN,
  ): BN {
    const lastAccountedTs = this.lastAccountedTs.gt(new BN(0)) ? this.lastAccountedTs : stakedTs;
    const secondsPassed = accountableTs.sub(lastAccountedTs);

    if (secondsPassed.lt(rewardPeriod)) {
      return new BN(0);
    }

    const periodsPassed = secondsPassed.div(rewardPeriod);

    const claimablePerEffectiveStake = periodsPassed.mul(rewardAmount);

    const accountableAmount = claimablePerEffectiveStake.mul(effectiveStakedAmount).div(SCALE_PRECISION_FACTOR_BN);

    return accountableAmount;
  }

  // Calculates claimable amount from accountable amount.
  getClaimableAmount(): BN {
    const claimedAmount = this.claimedAmount.mul(REWARD_AMOUNT_PRECISION_FACTOR);
    const nonClaimedAmount = this.accountedAmount.sub(claimedAmount);
    const claimableAmount = nonClaimedAmount.div(REWARD_AMOUNT_PRECISION_FACTOR);

    return claimableAmount;
  }

  // Get the time of the last unlock
  getLastAccountedTs(stakedTs: BN, claimableTs: BN, rewardPeriod: BN): BN {
    const lastAccountedTs = this.lastAccountedTs.gtn(0) ? this.lastAccountedTs : stakedTs;
    const totalSecondsPassed = claimableTs.sub(lastAccountedTs);
    const periodsPassed = totalSecondsPassed.div(rewardPeriod);
    const periodsToSeconds = periodsPassed.mul(rewardPeriod);
    const currClaimTs = lastAccountedTs.add(periodsToSeconds);

    return currClaimTs;
  }

  // Adds accounted amount
  addAccountedAmount(accountedAmount: BN): void {
    this.accountedAmount = this.accountedAmount.add(accountedAmount);
  }

  // Adds claimed amount
  addClaimedAmount(claimedAmount: BN): void {
    this.claimedAmount = this.claimedAmount.add(claimedAmount);
  }
}

const createDefaultRewardEntry = (
  stakeEntry: ProgramAccount<StakeEntry>,
  rewardPool: ProgramAccount<RewardPool>,
): RewardEntry => {
  return {
    stakeEntry: new PublicKey(stakeEntry.publicKey),
    rewardPool: new PublicKey(rewardPool.publicKey),
    createdTs: stakeEntry.account.createdTs,
    lastAccountedTs: new BN(0),
    lastRewardAmount: new BN(0),
    lastRewardPeriod: new BN(0),
    accountedAmount: new BN(0),
    claimedAmount: new BN(0),
    buffer: [],
  };
};

export const calcRewards = (
  rewardEntryAccount: ProgramAccount<RewardEntry> | undefined,
  stakeEntryAccount: ProgramAccount<StakeEntry>,
  rewardPoolAccount: ProgramAccount<RewardPool>,
) => {
  const rewardEntry: RewardEntry =
    rewardEntryAccount?.account ?? createDefaultRewardEntry(stakeEntryAccount, rewardPoolAccount);
  const stakeEntry = stakeEntryAccount.account;
  const rewardPool = rewardPoolAccount.account;

  const rewardEntryAccumulator = new RewardEntryAccumulator(rewardEntry);
  if (rewardEntryAccumulator.createdTs.lt(stakeEntry.createdTs)) {
    throw new Error("InvalidRewardEntry");
  }

  const currTs = Math.floor(Date.now() / 1000);

  const stakedTs = rewardPool.createdTs ? BN.max(stakeEntry.createdTs, rewardPool.createdTs) : stakeEntry.createdTs;
  const claimableTs = stakeEntry.closedTs.gtn(0) ? stakeEntry.closedTs : new BN(currTs);

  const amountUpdated =
    !rewardPool.rewardAmount.eq(rewardPool.lastRewardAmount) &&
    rewardPool.lastAmountUpdateTs.gt(stakeEntry.createdTs) &&
    rewardPool.lastAmountUpdateTs.gt(stakeEntry.closedTs);
  const periodUpdated =
    !rewardPool.rewardPeriod.eq(rewardPool.lastRewardPeriod) &&
    rewardPool.lastPeriodUpdateTs.gt(stakeEntry.createdTs) &&
    rewardPool.lastPeriodUpdateTs.gt(stakeEntry.closedTs);

  if (amountUpdated || periodUpdated) {
    let firstUpdateTs: BN, secondUpdateTs: BN, rewardAmount: BN, rewardPeriod: BN;
    if (amountUpdated && periodUpdated) {
      if (rewardPool.lastAmountUpdateTs.lt(rewardPool.lastPeriodUpdateTs)) {
        firstUpdateTs = rewardPool.lastAmountUpdateTs;
        secondUpdateTs = rewardPool.lastPeriodUpdateTs;
        rewardAmount = rewardPool.rewardAmount;
        rewardPeriod = rewardEntryAccumulator.lastRewardPeriod;
      } else {
        firstUpdateTs = rewardPool.lastPeriodUpdateTs;
        secondUpdateTs = rewardPool.lastAmountUpdateTs;
        rewardAmount = rewardEntryAccumulator.lastRewardAmount;
        rewardPeriod = rewardPool.rewardPeriod;
      }
    } else if (amountUpdated) {
      firstUpdateTs = new BN(0);
      secondUpdateTs = rewardPool.lastAmountUpdateTs;
      rewardAmount = rewardEntryAccumulator.lastRewardAmount;
      rewardPeriod = rewardEntryAccumulator.lastRewardPeriod;
    } else {
      firstUpdateTs = new BN(0);
      secondUpdateTs = rewardPool.lastPeriodUpdateTs;
      rewardAmount = rewardEntryAccumulator.lastRewardAmount;
      rewardPeriod = rewardEntryAccumulator.lastRewardPeriod;
    }

    if (firstUpdateTs.gtn(0)) {
      const firstAccountableAmount = rewardEntryAccumulator.getAccountableAmount(
        stakedTs,
        firstUpdateTs,
        stakeEntry.effectiveAmount,
        rewardEntryAccumulator.lastRewardAmount,
        rewardEntryAccumulator.lastRewardPeriod,
      );
      rewardEntryAccumulator.addAccountedAmount(firstAccountableAmount);
      rewardEntryAccumulator.lastAccountedTs = rewardEntryAccumulator.getLastAccountedTs(
        stakedTs,
        firstUpdateTs,
        rewardPool.lastRewardPeriod,
      );
    }
    const secondAccountableAmount = rewardEntryAccumulator.getAccountableAmount(
      stakedTs,
      secondUpdateTs,
      stakeEntry.effectiveAmount,
      rewardAmount,
      rewardPeriod,
    );
    rewardEntryAccumulator.addAccountedAmount(secondAccountableAmount);
    rewardEntryAccumulator.lastAccountedTs = rewardEntryAccumulator.getLastAccountedTs(
      stakedTs,
      secondUpdateTs,
      rewardPeriod,
    );
  }

  const accountableAmount = rewardEntryAccumulator.getAccountableAmount(
    stakedTs,
    claimableTs,
    stakeEntry.effectiveAmount,
    rewardPool.rewardAmount,
    rewardPool.rewardPeriod,
  );
  rewardEntryAccumulator.addAccountedAmount(accountableAmount);

  return rewardEntryAccumulator.getClaimableAmount();
};
