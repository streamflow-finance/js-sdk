import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { Keypair, PublicKey } from "@solana/web3.js";
import { ITransactionSolanaExt } from "@streamflow/common/solana";
import BN from "bn.js";
import { type IdlTypes, Address } from "@coral-xyz/anchor";

import { StakePool as StakePoolIDL } from "./descriptor/stake_pool.js";
import { RewardPool as RewardPoolIDL } from "./descriptor/reward_pool.js";

export type StakePool = IdlTypes<StakePoolIDL>["stakePool"];
export type StakeEntry = IdlTypes<StakePoolIDL>["stakeEntry"];
export type RewardEntry = IdlTypes<RewardPoolIDL>["rewardEntry"];
export type RewardPool = IdlTypes<RewardPoolIDL>["rewardPool"];

export interface IInteractSolanaExt extends ITransactionSolanaExt {
  invoker: SignerWalletAdapter | Keypair;
}

export interface ICreateSolanaExt extends IInteractSolanaExt {
  isNative?: boolean;
}

export interface UnstakeArgs {
  stakePoolKey: Address;
  stakeMint: Address;
  amount: BN;
  duration: BN;
  nonce: number;
  tokenProgramId?: PublicKey;
}

export interface StakeArgs {
  stakePoolKey: Address;
  from: Address;
  to: Address;
  amount: BN;
  duration: BN;
  payer?: Keypair;
  authority?: PublicKey;
  nonce: number;
  tokenProgramId?: PublicKey;
}

export interface FundPoolArgs {
  amount: BN;
  mint: PublicKey;
  stakePool: PublicKey;
  tokenProgramId: PublicKey;
  nonce: number;
}

export interface CreateRewardEntryArgs {
  mint: PublicKey;
  stakePool: PublicKey;
  tokenProgramId: PublicKey;
  nonce: number;
}

export interface CreateRewardPoolArgs {
  stakePoolNonce: number;
  stakePoolMint: Address;
  stakePool: Address;
  rewardMint: Address;
  tokenProgramId?: PublicKey;
  nonce: number;
  rewardAmount: BN;
  rewardPeriod: BN;
  permissionless: boolean;
  authority: Keypair;
}

export interface ClaimRewardPoolArgs {
  stakePoolNonce: number;
  stakePoolMint: Address;
  stakePool: Address;
  rewardMint: Address;
  tokenProgramId?: PublicKey;
  nonce: number;
  rewardAmount: BN;
  rewardPeriod: BN;
  permissionless: boolean;
  authority: Keypair;
}

export interface CreateStakePoolArgs {
  mint: Address;
  tokenProgramId?: PublicKey;
  nonce: number;
  maxWeight: BN;
  minDuration: BN;
  maxDuration: BN;
  permissionless?: boolean;
  authority?: Keypair;
}

export interface GetStakeEntriesData {
  stakePool?: string | PublicKey;
  owner?: string | PublicKey;
}
