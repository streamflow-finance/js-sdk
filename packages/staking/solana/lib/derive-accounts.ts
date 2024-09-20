import { PublicKey } from "@solana/web3.js";
// eslint-disable-next-line no-restricted-imports
import BN from "bn.js";

import {
  STAKE_POOL_PREFIX,
  STAKE_VAULT_PREFIX,
  STAKE_MINT_PREFIX,
  STAKE_ENTRY_PREFIX,
  REWARD_POOL_PREFIX,
  REWARD_VAULT_PREFIX,
  REWARD_ENTRY_PREFIX,
  CONFIG_PREFIX,
  FEE_VALUE_PREFIX,
} from "../constants.js";

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
