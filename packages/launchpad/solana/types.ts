import { Address, type IdlAccounts } from "@coral-xyz/anchor";
import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { Keypair } from "@solana/web3.js";
import { ITransactionSolanaExt } from "@streamflow/common/solana";
import { OracleTypeName } from "@streamflow/stream";
import BN from "bn.js";

import { StreamflowLaunchpad } from "./descriptor/streamflow_launchpad.js";

export type Launchpad = IdlAccounts<StreamflowLaunchpad>["launchpad"];
export type DepositAccount = IdlAccounts<StreamflowLaunchpad>["depositAccount"];

export interface IInteractSolanaExt extends ITransactionSolanaExt {
  invoker: SignerWalletAdapter | Keypair;
}

interface ILaunchpad {
  launchpad: Address;
  baseMint?: Address;
  quoteMint?: Address;
}

interface IOwner {
  owner?: Address;
}

interface ITokenProgram {
  tokenProgramId?: Address;
}

export interface ICreateLaunchpad extends ITokenProgram {
  baseMint: Address;
  quoteMint: Address;
  receiver?: Address;
  priceOracle?: Address;

  nonce: number;
  price: BN;
  individualDepositingCap: BN;
  maxDepositingCap: BN;
  depositingStartTs: number | BN;
  depositingEndTs: number | BN;
  vestingStartTs: number | BN;
  vestingEndTs: number | BN;
  vestingPeriod: number | BN;
  oracleType?: OracleTypeName;
  minPrice: number;
  maxPrice: number;
  minPercentage: number;
  maxPercentage: number;
  tickSize: number;
  skipInitial: boolean;
  isMemoRequired: boolean;
}

export interface IFundLaunchpad extends ILaunchpad, ITokenProgram {
  amount: BN;
}

export interface IDeposit extends ILaunchpad, IOwner, ITokenProgram {
  amount: BN;
  autoCap?: boolean;
  memo?: string;
}

export interface IClaimDeposits extends ILaunchpad, ITokenProgram {}

export interface IClaimAllocatedVested extends ILaunchpad, IOwner, ITokenProgram {}

export interface IClaimAllocatedInstant extends ILaunchpad, IOwner, ITokenProgram {}
