import { TransferFeeConfig } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
// eslint-disable-next-line no-restricted-imports
import BN from "bn.js";

import {
  CONFIG_PREFIX,
  DEFAULT_FEE_BN,
  FEE_PRECISION_FACTOR_BN,
  FEE_VALUE_PREFIX,
  REWARD_ENTRY_PREFIX,
  REWARD_POOL_PREFIX,
  REWARD_VAULT_PREFIX,
  SCALE_PRECISION_FACTOR,
  SCALE_PRECISION_FACTOR_BN,
  STAKE_ENTRY_PREFIX,
  STAKE_MINT_PREFIX,
  STAKE_POOL_PREFIX,
  STAKE_VAULT_PREFIX,
  U64_MAX,
} from "./constants.js";

export const deriveStakePoolPDA = (
  programId: PublicKey,
  mint: PublicKey,
  authority: PublicKey,
  nonce: number,
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [STAKE_POOL_PREFIX, mint.toBuffer(), authority.toBuffer(), new BN(nonce).toArrayLike(Buffer, "le", 1)],
    programId,
  )[0];
};

export const deriveStakeVaultPDA = (programId: PublicKey, stakePool: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([STAKE_VAULT_PREFIX, stakePool.toBuffer()], programId)[0];
};

export const deriveStakeMintPDA = (programId: PublicKey, stakePool: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([STAKE_MINT_PREFIX, stakePool.toBuffer()], programId)[0];
};

export const deriveStakeEntryPDA = (
  programId: PublicKey,
  stakePool: PublicKey,
  authority: PublicKey,
  nonce: number,
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [STAKE_ENTRY_PREFIX, stakePool.toBuffer(), authority.toBuffer(), new BN(nonce).toArrayLike(Buffer, "le", 4)],
    programId,
  )[0];
};

export const deriveRewardPoolPDA = (
  programId: PublicKey,
  stakePool: PublicKey,
  mint: PublicKey,
  nonce: number,
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [REWARD_POOL_PREFIX, stakePool.toBuffer(), mint.toBuffer(), new BN(nonce).toArrayLike(Buffer, "le", 1)],
    programId,
  )[0];
};

export const deriveRewardVaultPDA = (programId: PublicKey, rewardPool: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([REWARD_VAULT_PREFIX, rewardPool.toBuffer()], programId)[0];
};

export const deriveRewardEntryPDA = (programId: PublicKey, rewardPool: PublicKey, stakeEntry: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [REWARD_ENTRY_PREFIX, rewardPool.toBuffer(), stakeEntry.toBuffer()],
    programId,
  )[0];
};

export const deriveConfigPDA = (programId: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([CONFIG_PREFIX], programId)[0];
};

export const deriveFeeValuePDA = (programId: PublicKey, target: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([FEE_VALUE_PREFIX, target.toBuffer()], programId)[0];
};

export const calculateStakeWeight = (minDuration: BN, maxDuration: BN, maxWeight: BN, duration: BN) => {
  const durationSpan = maxDuration.sub(minDuration);
  if (durationSpan.eq(new BN(0))) {
    return SCALE_PRECISION_FACTOR_BN;
  }
  const durationExceedingMin = duration.sub(minDuration);
  const normalizedWeight = durationExceedingMin.mul(SCALE_PRECISION_FACTOR_BN).div(durationSpan);
  const weightDiff = maxWeight.sub(SCALE_PRECISION_FACTOR_BN);

  return BN.max(
    SCALE_PRECISION_FACTOR_BN.add(normalizedWeight.mul(weightDiff).div(SCALE_PRECISION_FACTOR_BN)),
    SCALE_PRECISION_FACTOR_BN,
  );
};

export const calculateFeeAmount = (amount: BN, fee: BN = DEFAULT_FEE_BN) => {
  if (fee.eq(FEE_PRECISION_FACTOR_BN)) {
    return amount;
  }
  return amount.mul(fee).div(FEE_PRECISION_FACTOR_BN);
};

export const calculateDecimalsShift = (maxWeight: bigint, maxShift = 999) => {
  if (maxShift == 0) {
    return 0;
  }

  let decimalsShift = 0;
  while ((maxWeight * U64_MAX) / BigInt(SCALE_PRECISION_FACTOR) / BigInt(10 ** decimalsShift) > U64_MAX) {
    decimalsShift += 1;
    if (decimalsShift == maxShift) {
      return maxShift;
    }
  }
  return decimalsShift;
};

export const divCeilN = (n: bigint, d: bigint): bigint => n / d + (n % d ? BigInt(1) : BigInt(0));

export async function calculateAmountWithTransferFees(
  connection: Connection,
  transferFeeConfig: TransferFeeConfig,
  transferAmount: bigint,
): Promise<{ transferAmount: bigint; feeCharged: bigint }> {
  const epoch = await connection.getEpochInfo();
  const transferFee =
    epoch.epoch >= transferFeeConfig.newerTransferFee.epoch
      ? transferFeeConfig.newerTransferFee
      : transferFeeConfig.olderTransferFee;
  const transferFeeBasisPoints = BigInt(transferFee.transferFeeBasisPoints);
  let feeCharged = BigInt(0);

  if (transferFeeBasisPoints !== BigInt(0)) {
    const numerator = transferAmount * 10_000n;
    const denominator = 10_000n - transferFeeBasisPoints;
    const rawPreFeeAmount = divCeilN(numerator, denominator);
    const fee = rawPreFeeAmount - transferAmount;
    transferAmount = rawPreFeeAmount;
    feeCharged = fee > transferFee.maximumFee ? transferFee.maximumFee : fee;
  }

  return { transferAmount, feeCharged };
}
