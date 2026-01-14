import {
  type TransactionInstruction,
  type AccountInfo,
  type BlockhashWithExpiryBlockHeight,
  type Commitment,
  type Context,
  type PublicKey,
  type VersionedTransaction,
} from "@solana/web3.js";
import type PQueue from "p-queue";
import type { Idl, IdlAccounts, IdlTypes, Program } from "@coral-xyz/anchor";

import type { PartnerOracle as PartnerOracle } from "./descriptor/partner_oracle.js";

export type ComputePriceEstimate = (tx: string | (string | PublicKey)[]) => Promise<number>;
export type ComputeLimitEstimate = (tx: VersionedTransaction) => Promise<number>;

/**
 * Additional parameter for Solana Transaction processing.
 *
 * computePrice - compute price per CU in micro-lamports to be set in a transaction - priority fee, accepts:
 *  - a constant number;
 *  - a callable that returns a price for a built transaction;
 * computeLimit - compute limit in CUs to set for a transaction, `computePrice` is paid per every allocated CU, accepts:
 *  - a constant number;
 *  - a callable that returns a CU limit for a built transaction;
 *  - `autoSimulate` - will be unwrapped by `unwrapExecutionParams` and converted to a callable that runs a simulation to estimate CUs and set a limit with some margin;
 * feePayer - account that will be set as sol fee payer in instructions that accept such account, i.e. ATA creation:
 *  - should be only when building instructions via `prepare` methods, as tx executing methods will fail without a signer;
 *  - currently supported only when claiming an Airdrop;
 */
export interface ITransactionExt {
  computePrice?: number | ComputePriceEstimate;
  computeLimit?: number | ComputeLimitEstimate | "autoSimulate";
  feePayer?: PublicKey;
}

/**
 * Acceptable type with resolved values.
 * Function types may be omitted if passed to destinations that do not support them.
 */
type ITransactionExtResolvedValues = {
  computePrice?: number | ComputePriceEstimate;
  computeLimit?: number | ComputeLimitEstimate;
  feePayer?: PublicKey;
};

type KeysNotOfA<T, ToExclude> = Pick<T, Exclude<keyof T, keyof ToExclude>>;

export type ITransactionExtResolved<T extends ITransactionExt = ITransactionExt> = {
  [AK in keyof KeysNotOfA<T, ITransactionExt>]: T[AK];
} & ITransactionExtResolvedValues;

export interface IInteractExt extends ITransactionExt {
  invoker: {
    publicKey: string | PublicKey | null;
  };
}

export interface Account {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
}

export interface CheckAssociatedTokenAccountsData {
  sender: PublicKey;
  recipient: PublicKey;
  partner: PublicKey;
  streamflowTreasury: PublicKey;
  mint: PublicKey;
}

export interface AtaParams {
  mint: PublicKey;
  owner: PublicKey;
  programId?: PublicKey;
}

export interface ConfirmationParams {
  hash: BlockhashWithExpiryBlockHeight;
  context: Context;
  commitment?: Commitment;
}

export interface ThrottleParams {
  sendRate?: number;
  sendThrottler?: PQueue;
  waitBeforeConfirming?: number | undefined;
}

export interface TransactionExecutionParams extends ThrottleParams {
  skipSimulation?: boolean;
}

export interface IProgramAccount<T> {
  publicKey: PublicKey;
  account: T;
}

export class TransactionFailedError extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, TransactionFailedError.prototype);
    this.name = "TransactionFailedError";
  }
}

export interface ITransactionResult {
  ixs: TransactionInstruction[];
  txId: string;
}

// Utility types
export enum ICluster {
  Mainnet = "mainnet",
  Devnet = "devnet",
  Testnet = "testnet",
  Local = "local",
}

/// Anchor type extractions
export type IdlInstruction<IDL extends Idl, Name extends IDL["instructions"][number]["name"]> = Extract<
  IDL["instructions"][number],
  { name: Name }
>;

export type IdlAccountsOfMethod<IDL extends Idl, M extends keyof Program<IDL>["methods"]> = Parameters<
  ReturnType<Program<IDL>["methods"][M]>["accounts"]
>[0];
export type IdlArgsOfMethod<IDL extends Idl, M extends keyof Program<IDL>["methods"]> = Parameters<
  Program<IDL>["methods"][M]
>;

// Common Partner oracle
export type PartnerOracleTypes = IdlTypes<PartnerOracle>;
export type PartnerOracleAccounts = IdlAccounts<PartnerOracle>;

/**
 * Error wrapper for calls made to the contract on chain
 */
export class ContractError extends Error {
  public contractErrorCode: string | null;

  public description: string | null;

  /**
   * Constructs the Error Wrapper
   * @param error Original error raised probably by the chain SDK
   * @param code extracted code from the error if managed to parse it
   */
  constructor(error: Error, code?: string | null, description?: string | null) {
    super(error.message, { cause: error }); // Call the base class constructor with the error message
    this.contractErrorCode = code ?? null;
    this.description = description ?? null;
    // Copy properties from the original error
    Object.setPrototypeOf(this, ContractError.prototype);
    this.name = "ContractError"; // Set the name property
    this.stack = error.stack;
  }
}
