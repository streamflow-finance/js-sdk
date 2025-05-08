import {
  type AccountInfo,
  type BlockhashWithExpiryBlockHeight,
  type Commitment,
  type Context,
  type PublicKey,
} from "@solana/web3.js";
import type PQueue from "p-queue";

export interface ITransactionSolanaExt {
  computePrice?: number;
  computeLimit?: number;
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
