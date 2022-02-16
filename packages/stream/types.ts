import { BN } from "@project-serum/anchor";
import { Wallet } from "@project-serum/anchor/src/provider";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  AccountInfo,
  Connection,
  PublicKey,
  TransactionSignature,
} from "@solana/web3.js";

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
  depositedAmount: BN;
  period: number;
  cliff: number;
  cliffAmount: BN;
  amountPerPeriod: BN;
  name: string;
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
  partner?: string;
  cluster?: ClusterExtended;
}

export interface WithdrawStreamData {
  id: string;
  amount: BN;
}

export interface WithdrawStreamParams extends WithdrawStreamData {
  connection: Connection;
  invoker: Wallet;
  cluster?: ClusterExtended;
}

export interface TopupStreamData {
  id: string;
  amount: BN;
}

export interface TopupStreamParams extends TopupStreamData {
  connection: Connection;
  invoker: Wallet;
  cluster?: ClusterExtended;
}

export interface CancelStreamData {
  id: string;
}

export interface CancelStreamParams extends CancelStreamData {
  connection: Connection;
  invoker: Wallet;
  cluster?: ClusterExtended;
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

export interface Stream {
  magic: number;
  version: number;
  createdAt: number;
  withdrawnAmount: BN;
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
  streamflowFeeTotal: BN;
  streamflowFeeWithdrawn: BN;
  streamflowFeePercent: number;
  partnerFeeTotal: BN;
  partnerFeeWithdrawn: BN;
  partnerFeePercent: number;
  partner: string;
  partnerTokens: string;
  start: number;
  depositedAmount: BN;
  period: number;
  amountPerPeriod: BN;
  cliff: number;
  cliffAmount: BN;
  cancelableBySender: boolean;
  cancelableByRecipient: boolean;
  automaticWithdrawal: boolean;
  transferableBySender: boolean;
  transferableByRecipient: boolean;
  canTopup: boolean;
  name: string;
  withdrawalFrequency: number;
}

export interface DecodedStream {
  magic: BN;
  version: BN;
  createdAt: BN;
  withdrawnAmount: BN;
  canceledAt: BN;
  end: BN;
  lastWithdrawnAt: BN;
  sender: PublicKey;
  senderTokens: PublicKey;
  recipient: PublicKey;
  recipientTokens: PublicKey;
  mint: PublicKey;
  escrowTokens: PublicKey;
  streamflowTreasury: PublicKey;
  streamflowTreasuryTokens: PublicKey;
  streamflowFeeTotal: BN;
  streamflowFeeWithdrawn: BN;
  streamflowFeePercent: BN;
  partnerFeeTotal: BN;
  partnerFeeWithdrawn: BN;
  partnerFeePercent: BN;
  partner: PublicKey;
  partnerTokens: PublicKey;
  start: BN;
  depositedAmount: BN;
  period: BN;
  amountPerPeriod: BN;
  cliff: BN;
  cliffAmount: BN;
  cancelableBySender: boolean;
  cancelableByRecipient: boolean;
  automaticWithdrawal: boolean;
  transferableBySender: boolean;
  transferableByRecipient: boolean;
  canTopup: boolean;
  name: string;
  withdrawalFrequency: BN;
}

export interface TransactionResponse {
  tx: TransactionSignature;
}

export interface CreateStreamResponse extends TransactionResponse {
  id: string;
}
