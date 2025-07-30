import { type Address, type IdlAccounts } from "@coral-xyz/anchor";
import { type SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { type Keypair } from "@solana/web3.js";
import { type ITransactionSolanaExt } from "@streamflow/common/solana";
import type BN from "bn.js";

import { type RewardPool as RewardPoolIDL } from "./descriptor/reward_pool.js";
import { type StakePool as StakePoolIDL } from "./descriptor/stake_pool.js";
import { type FeeManager as FeeManagerIDL } from "./descriptor/fee_manager.js";

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

interface RewardPoolProgram {
  rewardPoolType?: "fixed" | "dynamic";
}

interface StakeBaseArgs extends BaseStakePoolArgs, TokenProgram {
  nonce: number;
}

export interface StakeArgs extends StakeBaseArgs {
  amount: BN;
  duration: BN;
  payer?: Keypair;
  authority?: Address;
}

interface RewardPoolArgs extends TokenProgram, RewardPoolProgram {
  nonce: number;
  mint: Address;
}

/**
 * Used only with dynamic reward pools
 */
interface GovernorWithVoteArgs {
  governor?: Address;
  vote?: Address;
}

export interface StakeAndCreateEntriesArgs extends StakeArgs {
  rewardPools: RewardPoolArgs[];
}

export interface UnstakeArgs extends StakeBaseArgs {
  shouldClose?: boolean;
}

export interface UnstakeAndCloseArgs extends UnstakeArgs {
  rewardPools: (RewardPoolArgs & GovernorWithVoteArgs)[];
}

export type UnstakeAndClaimArgs = UnstakeAndCloseArgs;

export type CloseStakeEntryArgs = Omit<StakeBaseArgs, "stakePoolMint" | "tokenProgramId">;

export interface FundPoolArgs extends BaseStakePoolArgs, TokenProgram, RewardPoolProgram {
  amount: BN;
  nonce: number;
  rewardMint: Address;
  feeValue: Address | null;
}

export interface CreateRewardEntryArgs extends BaseStakePoolArgs, TokenProgram, RewardPoolProgram {
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

export type ClaimRewardPoolArgs = CreateRewardEntryArgs & GovernorWithVoteArgs;

export type CloseRewardEntryArgs = CreateRewardEntryArgs;

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
