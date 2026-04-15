import {
  type Commitment,
  Connection,
  type Keypair,
  type PublicKey,
  type TransactionInstruction,
  type TransactionSignature,
  type VersionedTransaction,
} from "@solana/web3.js";
import type { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import type { ComputeLimitEstimate, ComputePriceEstimate, ICluster } from "@streamflow/common";
import type PQueue from "p-queue";

import type {
  ICreateMultipleAlignedStreamData,
  ICreateMultipleLinearStreamData,
  ICreateStreamData,
  ITopUpData,
  ITransferData,
  IUpdateData,
  IWithdrawData,
} from "../types.js";

type EnvBase = {
  programId: PublicKey;
  commitment?: Commitment;
};

type EnvWithConnection = EnvBase & { connection: Connection };

type EnvWithRpcUrl = EnvBase & { rpcUrl: string; cluster?: ICluster };

export type Env = EnvWithConnection | EnvWithRpcUrl;

export type ExecutionEnv = Env & {
  queue?: PQueue;
  sendRate?: number;
  throttler?: PQueue;
  skipPreflight?: boolean;
};

export interface InstructionResult {
  instructions: TransactionInstruction[];
  signers?: Keypair[];
  metadataPubKey?: PublicKey;
}

export interface CreateInstructionResult extends InstructionResult {
  metadata?: Keypair;
}

export interface BatchCreationItem {
  instructions: TransactionInstruction[];
  signers?: Keypair[];
  recipient: string;
  metadataPubKey: PublicKey;
}

export interface BatchInstructionResult {
  setupInstructions: TransactionInstruction[];
  creationBatches: BatchCreationItem[];
}

export interface BuildTransactionOptions {
  feePayer?: PublicKey;
  computeLimit?: number | ComputeLimitEstimate | "autoSimulate";
  computePrice?: number | ComputePriceEstimate;
}

export interface NativeOptions {
  isNative?: boolean;
}

export interface BatchExecuteResult {
  signatures: TransactionSignature[];
  errors: Error[];
}

export type CreateFn = (params: ICreateStreamData, env: Env & NativeOptions) => Promise<CreateInstructionResult>;

export type WithdrawFn = (params: IWithdrawData, env: Env) => Promise<InstructionResult>;

export type TopupFn = (params: ITopUpData, env: Env & NativeOptions) => Promise<InstructionResult>;

export type CancelFn = (params: { id: string }, env: Env) => Promise<InstructionResult>;

export type TransferFn = (params: ITransferData, env: Env) => Promise<InstructionResult>;

export type UpdateFn = (params: IUpdateData, env: Env) => Promise<InstructionResult>;

export type CreateBatchFn = (
  params: ICreateMultipleLinearStreamData | ICreateMultipleAlignedStreamData,
  env: Env & NativeOptions,
) => Promise<BatchInstructionResult>;

export type BuildTransactionFn = (
  instructions: TransactionInstruction[],
  options: BuildTransactionOptions,
  env: Env,
) => Promise<VersionedTransaction>;

export type SignFn = (
  transaction: VersionedTransaction,
  signers: (SignerWalletAdapter | Keypair | { publicKey: PublicKey })[],
) => Promise<VersionedTransaction>;

export type ExecuteFn = (signedTransaction: VersionedTransaction, env: ExecutionEnv) => Promise<TransactionSignature>;

export type ExecuteBatchFn = (
  signedTransactions: VersionedTransaction[],
  env: ExecutionEnv,
) => Promise<BatchExecuteResult>;

export type ExecuteBatchSequentialFn = (
  signedTransactions: VersionedTransaction[],
  env: ExecutionEnv,
) => Promise<BatchExecuteResult>;

export function resolveConnection(env: Env): Connection {
  if ("connection" in env) {
    return env.connection;
  }
  return new Connection(env.rpcUrl, {
    commitment: env.commitment,
  });
}
