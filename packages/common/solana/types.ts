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

export interface ITransactionSolanaExt {
  computePrice?: number | ComputePriceEstimate;
  computeLimit?: number | ComputeLimitEstimate | "autoSimulate";
}

/**
 * Acceptable type with resolved values.
 * Function types may be omitted if passed to destinations that do not support them.
 */
type ITransactionSolanaExtResolvedValues = {
  computePrice?: number | ComputePriceEstimate;
  computeLimit?: number | ComputeLimitEstimate;
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
