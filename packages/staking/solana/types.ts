import { Address, type IdlAccounts } from "@coral-xyz/anchor";
import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { Keypair } from "@solana/web3.js";
import { ITransactionSolanaExt } from "@streamflow/common/solana";
import BN from "bn.js";

import { RewardPool as RewardPoolIDL } from "./descriptor/reward_pool.js";
import { StakePool as StakePoolIDL } from "./descriptor/stake_pool.js";
import { FeeManager as FeeManagerIDL } from "./descriptor/fee_manager.js";

export type StakePool = IdlAccounts<StakePoolIDL>["stakePool"];
export type StakeEntry = IdlAccounts<StakePoolIDL>["stakeEntry"];
export type RewardEntry = IdlAccounts<RewardPoolIDL>["rewardEntry"];
export type RewardPool = IdlAccounts<RewardPoolIDL>["rewardPool"];
export type FeeValue = IdlAccounts<FeeManagerIDL>["feeValue"];
export type DefaultFeeValueConfig = IdlAccounts<FeeManagerIDL>["config"];

export interface IInteractSolanaExt extends ITransactionSolanaExt {
  invoker: SignerWalletAdapter | Keypair;
}

export interface BaseStakePoolArgs {
  stakePool: Address;
  stakePoolMint: Address;
}

interface TokenProgram {
  tokenProgramId?: Address;
}

interface StakeBaseArgs extends BaseStakePoolArgs, TokenProgram {
  nonce: number;
}

export type UnstakeArgs = StakeBaseArgs;

export interface StakeArgs extends StakeBaseArgs {
  amount: BN;
  duration: BN;
  payer?: Keypair;
  authority?: Address;
}

export interface FundPoolArgs extends BaseStakePoolArgs, TokenProgram {
  amount: BN;
  nonce: number;
  rewardMint: Address;
  feeValue: Address | null;
}

export interface CreateRewardEntryArgs extends BaseStakePoolArgs, TokenProgram {
  depositNonce: number;
  rewardPoolNonce: number;
  rewardMint: Address;
}

export interface CreateRewardPoolArgs extends BaseStakePoolArgs, TokenProgram {
  stakePoolNonce: number;
  rewardMint: Address;
  nonce: number;
  rewardAmount: BN;
  rewardPeriod: BN;
  permissionless: boolean;
  lastClaimPeriodOpt: BN | null;
}

export interface UpdateRewardPoolArgs {
  stakePool: Address;
  rewardAmount: BN | null;
  rewardPeriod: BN | null;
  rewardPool: Address;
}

export interface ClaimRewardPoolArgs extends BaseStakePoolArgs, TokenProgram {
  depositNonce: number;
  rewardMint: Address;
  rewardPoolNonce: number;
}

export interface CreateStakePoolArgs extends TokenProgram {
  mint: Address;
  nonce: number;
  maxWeight: BN;
  minDuration: BN;
  maxDuration: BN;
  permissionless?: boolean;
  freezeStakeMint?: boolean | null;
  unstakePeriod?: BN | null;
  authority?: Keypair;
}
