import {
  type BlockhashWithExpiryBlockHeight,
  type Commitment,
  Connection,
  type Context,
  type Keypair,
  type PublicKey,
  type TransactionInstruction,
  type TransactionSignature,
  type VersionedTransaction,
} from "@solana/web3.js";
import type { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { type ComputeLimitEstimate, type ComputePriceEstimate, ICluster } from "@streamflow/common";
import type PQueue from "p-queue";

import { SolanaStreamClient } from "../StreamClient.js";
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
  client?: SolanaStreamClient;
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

export interface BuiltTransaction {
  transaction: VersionedTransaction;
  blockhashWithExpiryBlockHeight: BlockhashWithExpiryBlockHeight;
  context: Context;
}

export interface BatchExecuteResult {
  signatures: TransactionSignature[];
  errors: Error[];
}

export type Invoker = { publicKey: string | PublicKey };

export type CreateFn = (
  params: ICreateStreamData,
  invoker: Invoker,
  env: Env & NativeOptions,
) => Promise<CreateInstructionResult>;

export type WithdrawFn = (params: IWithdrawData, invoker: Invoker, env: Env) => Promise<InstructionResult>;

export type TopupFn = (params: ITopUpData, invoker: Invoker, env: Env & NativeOptions) => Promise<InstructionResult>;

export type CancelFn = (params: { id: string }, invoker: Invoker, env: Env) => Promise<InstructionResult>;

export type TransferFn = (params: ITransferData, invoker: Invoker, env: Env) => Promise<InstructionResult>;

export type UpdateFn = (params: IUpdateData, invoker: Invoker, env: Env) => Promise<InstructionResult>;

export type CreateBatchFn = (
  params: ICreateMultipleLinearStreamData | ICreateMultipleAlignedStreamData,
  invoker: Invoker,
  env: Env & NativeOptions,
) => Promise<BatchInstructionResult>;

export type BuildTransactionFn = (
  instructions: TransactionInstruction[],
  options: BuildTransactionOptions,
  env: Env,
) => Promise<BuiltTransaction>;

export type SignFn = (
  transaction: VersionedTransaction,
  signers: (SignerWalletAdapter | Keypair | { publicKey: PublicKey })[],
) => Promise<VersionedTransaction>;

export type ExecuteFn = (builtTx: BuiltTransaction, env: ExecutionEnv) => Promise<TransactionSignature>;

export type ExecuteBatchFn = (builtTransactions: BuiltTransaction[], env: ExecutionEnv) => Promise<BatchExecuteResult>;

export type ExecuteBatchSequentialFn = (
  builtTransactions: BuiltTransaction[],
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

export function createClientFromEnv(env: Env): SolanaStreamClient {
  if (env.client) return env.client;

  const rpcUrl = "connection" in env ? env.connection.rpcEndpoint : env.rpcUrl;
  const cluster = "cluster" in env ? env.cluster : ICluster.Mainnet;

  return new SolanaStreamClient(rpcUrl, cluster, env.commitment, env.programId.toBase58());
}
