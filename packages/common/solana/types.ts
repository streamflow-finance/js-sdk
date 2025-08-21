import type {
  AccountInfo,
  BlockhashWithExpiryBlockHeight,
  Commitment,
  Context,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import type PQueue from "p-queue";

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
export interface ITransactionSolanaExt {
  computePrice?: number | ComputePriceEstimate;
  computeLimit?: number | ComputeLimitEstimate | "autoSimulate";
  feePayer?: PublicKey;
}

/**
 * Acceptable type with resolved values.
 * Function types may be omitted if passed to destinations that do not support them.
 */
type ITransactionSolanaExtResolvedValues = {
  computePrice?: number | ComputePriceEstimate;
  computeLimit?: number | ComputeLimitEstimate;
  feePayer?: PublicKey;
};

type KeysNotOfA<T, ToExclude> = Pick<T, Exclude<keyof T, keyof ToExclude>>;

export type ITransactionSolanaExtResolved<T extends ITransactionSolanaExt = ITransactionSolanaExt> = {
  [AK in keyof KeysNotOfA<T, ITransactionSolanaExt>]: T[AK];
} & ITransactionSolanaExtResolvedValues;

export interface IInteractSolanaExt extends ITransactionSolanaExt {
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
