import { Wallet } from "@project-serum/anchor/src/provider";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  AccountInfo,
  Connection,
  PublicKey,
  Keypair,
  TransactionSignature,
  TransactionInstruction,
} from "@solana/web3.js";
import { u64 } from "@solana/spl-token";

export { WalletAdapterNetwork as Cluster } from "@solana/wallet-adapter-base";

export enum StreamDirection {
  Outgoing = "outgoing",
  Incoming = "incoming",
  All = "all",
}

export enum StreamType {
  Stream = "stream",
  Vesting = "vesting",
  All = "all",
}

export interface Account {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
}

export enum LocalCluster {
  Local = "local",
}

export type ClusterExtended = WalletAdapterNetwork | LocalCluster;

export interface CreateStreamData {
  recipient: string;
  mint: string;
  start: number;
  depositedAmount: u64;
  period: number;
  cliff: number;
  cliffAmount: u64;
  amountPerPeriod: u64;
  name: string;
  canTopup: boolean;
  cancelableBySender: boolean;
  cancelableByRecipient: boolean;
  transferableBySender: boolean;
  transferableByRecipient: boolean;
  automaticWithdrawal?: boolean;
  withdrawalFrequency?: number;
}

export interface MultiRecipient {
  recipient: string;
  depositedAmount: u64;
  name: string;
}

export interface CreateMultiStreamData {
  recipientsData: MultiRecipient[];
  mint: string;
  start: number;
  period: number;
  cliff: number;
  cliffAmount: u64;
  amountPerPeriod: u64;
  canTopup: boolean;
  cancelableBySender: boolean;
  cancelableByRecipient: boolean;
  transferableBySender: boolean;
  transferableByRecipient: boolean;
  automaticWithdrawal?: boolean;
  withdrawalFrequency?: number;
}

export interface CreateStreamParams extends CreateStreamData {
  connection: Connection;
  sender: Wallet;
  partner?: string | null;
  cluster?: ClusterExtended;
}

export interface CreateStreamParamsRaw extends CreateStreamData {
  sender: Wallet;
  partner?: string | null;
}

export interface CreateMultiStreamParamsRaw extends CreateMultiStreamData {
  sender: Wallet;
  partner?: string | null;
}

export interface WithdrawStreamData {
  id: string;
  amount: u64;
}

export interface WithdrawStreamParams extends WithdrawStreamData {
  connection: Connection;
  invoker: Wallet;
  cluster?: ClusterExtended;
}

export interface WithdrawStreamParamsRaw extends WithdrawStreamData {
  invoker: Wallet;
}

export interface TopupStreamData {
  id: string;
  amount: u64;
}

export interface TopupStreamParams extends TopupStreamData {
  connection: Connection;
  invoker: Wallet;
  cluster?: ClusterExtended;
}

export interface TopupStreamParamsRaw extends TopupStreamData {
  invoker: Wallet;
}

export interface CancelStreamData {
  id: string;
}

export interface CancelStreamParams extends CancelStreamData {
  connection: Connection;
  invoker: Wallet;
  cluster?: ClusterExtended;
}

export interface CancelStreamParamsRaw extends CancelStreamData {
  invoker: Wallet;
}

export interface TransferStreamData {
  id: string;
  recipientId: string;
}

export interface TransferStreamParams extends TransferStreamData {
  connection: Connection;
  invoker: Wallet;
  cluster?: ClusterExtended;
}

export interface TransferStreamParamsRaw extends TransferStreamData {
  invoker: Wallet;
}

export interface GetStreamParams {
  connection: Connection;
  id: string;
}

export interface GetStreamsParams {
  connection: Connection;
  wallet: PublicKey;
  type?: StreamType;
  direction?: StreamDirection;
  cluster?: ClusterExtended;
}

export interface GetStreamsParamsRaw {
  wallet: PublicKey;
  type?: StreamType;
  direction?: StreamDirection;
}

export interface Stream {
  magic: number;
  version: number;
  createdAt: number;
  withdrawnAmount: u64;
  canceledAt: number;
  end: number;
  lastWithdrawnAt: number;
  sender: string;
  senderTokens: string;
  recipient: string;
  recipientTokens: string;
  mint: string;
  escrowTokens: string;
  streamflowTreasury: string;
  streamflowTreasuryTokens: string;
  streamflowFeeTotal: u64;
  streamflowFeeWithdrawn: u64;
  streamflowFeePercent: number;
  partnerFeeTotal: u64;
  partnerFeeWithdrawn: u64;
  partnerFeePercent: number;
  partner: string;
  partnerTokens: string;
  start: number;
  depositedAmount: u64;
  period: number;
  amountPerPeriod: u64;
  cliff: number;
  cliffAmount: u64;
  cancelableBySender: boolean;
  cancelableByRecipient: boolean;
  automaticWithdrawal: boolean;
  transferableBySender: boolean;
  transferableByRecipient: boolean;
  canTopup: boolean;
  name: string;
  withdrawFrequency: number;
}

export interface DecodedStream {
  magic: u64;
  version: u64;
  createdAt: u64;
  withdrawnAmount: u64;
  canceledAt: u64;
  end: u64;
  lastWithdrawnAt: u64;
  sender: PublicKey;
  senderTokens: PublicKey;
  recipient: PublicKey;
  recipientTokens: PublicKey;
  mint: PublicKey;
  escrowTokens: PublicKey;
  streamflowTreasury: PublicKey;
  streamflowTreasuryTokens: PublicKey;
  streamflowFeeTotal: u64;
  streamflowFeeWithdrawn: u64;
  streamflowFeePercent: u64;
  partnerFeeTotal: u64;
  partnerFeeWithdrawn: u64;
  partnerFeePercent: u64;
  partner: PublicKey;
  partnerTokens: PublicKey;
  start: u64;
  depositedAmount: u64;
  period: u64;
  amountPerPeriod: u64;
  cliff: u64;
  cliffAmount: u64;
  cancelableBySender: boolean;
  cancelableByRecipient: boolean;
  automaticWithdrawal: boolean;
  transferableBySender: boolean;
  transferableByRecipient: boolean;
  canTopup: boolean;
  name: string;
  withdrawFrequency: u64;
}

export interface TransactionResponse {
  tx: TransactionSignature;
}

export interface CreateStreamResponse extends TransactionResponse {
  id: string;
}

export interface TransactionResponseRaw {
  ixs: TransactionInstruction[];
  tx: TransactionSignature;
}

export interface CreateStreamResponseRaw extends TransactionResponseRaw {
  metadata: Keypair;
}

export interface CreateMultiStreamResponse {
  txs: TransactionSignature[]
}
