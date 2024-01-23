import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import {
  AccountInfo,
  Connection,
  PublicKey,
  Keypair,
  TransactionSignature,
  TransactionInstruction,
  Transaction,
} from "@solana/web3.js";
import BN from "bn.js";

import { buildStreamType, calculateUnlockedAmount } from "../common/contractUtils";
import { IRecipient, Stream, StreamDirection, StreamType } from "../common/types";
import { getNumberFromBN } from "../common/utils";

export { WalletAdapterNetwork as Cluster } from "@solana/wallet-adapter-base";

export interface Account {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
}

export interface ICreateStreamSolanaExt {
  sender: SignerWalletAdapter | Keypair;
  // allow custom Metadata Account to be passed, ephemeral signer is most cases, accepts array to be compatible in createMultiple
  metadataPubKeys?: PublicKey[];
  partner?: string | null;
  isNative?: boolean;
}

export interface IInteractStreamSolanaExt {
  invoker: SignerWalletAdapter | Keypair;
  checkTokenAccounts?: boolean;
}

export interface ITopUpStreamSolanaExt {
  invoker: SignerWalletAdapter | Keypair;
  isNative?: boolean;
}

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

export interface MultiRecipient {
  recipient: string;
  depositedAmount: BN;
  name: string;
  cliffAmount: BN;
  amountPerPeriod: BN;
}

export interface CreateMultiData {
  recipientsData: MultiRecipient[];
  mint: string;
  start: number;
  period: number;
  cliff: number;
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
  sender: SignerWalletAdapter;
  partner?: string;
}

export interface CreateParams extends CreateStreamData {
  sender: SignerWalletAdapter | Keypair;
  partner?: string | null;
  isNative?: boolean;
}

export interface CreateMultiParams extends CreateMultiData {
  sender: SignerWalletAdapter | Keypair;
  partner?: string | null;
  isNative?: boolean;
}

export interface WithdrawStreamData {
  id: string;
  amount: BN;
}

export interface WithdrawStreamParams extends WithdrawStreamData {
  connection: Connection;
  invoker: SignerWalletAdapter;
}

export interface WithdrawParams extends WithdrawStreamData {
  invoker: SignerWalletAdapter | Keypair;
}

export interface TopupStreamData {
  id: string;
  amount: BN;
}

export interface TopupStreamParams extends TopupStreamData {
  connection: Connection;
  invoker: SignerWalletAdapter;
}

export interface TopupParams extends TopupStreamData {
  invoker: SignerWalletAdapter | Keypair;
  isNative?: boolean;
}

export interface CancelStreamData {
  id: string;
}

export interface CancelStreamParams extends CancelStreamData {
  connection: Connection;
  invoker: SignerWalletAdapter;
}

export interface CancelParams extends CancelStreamData {
  invoker: SignerWalletAdapter | Keypair;
}

export interface TransferStreamData {
  id: string;
  recipientId: string;
}

export interface TransferStreamParams extends TransferStreamData {
  connection: Connection;
  invoker: SignerWalletAdapter;
}

export interface TransferParams extends TransferStreamData {
  invoker: SignerWalletAdapter | Keypair;
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
}

export interface GetAllParams {
  wallet: PublicKey;
  type?: StreamType;
  direction?: StreamDirection;
}

export class Contract implements Stream {
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

  closed: boolean;

  currentPauseStart: number;

  pauseCumulative: BN;

  lastRateChangeTime: number;

  fundsUnlockedAtLastRateChange: BN;

  type: StreamType;

  constructor(stream: DecodedStream) {
    this.magic = stream.magic.toNumber();
    this.version = stream.version.toNumber();
    this.createdAt = stream.createdAt.toNumber();
    this.withdrawnAmount = stream.withdrawnAmount;
    this.canceledAt = stream.canceledAt.toNumber();
    this.end = stream.end.toNumber();
    this.lastWithdrawnAt = stream.lastWithdrawnAt.toNumber();
    this.sender = stream.sender.toBase58();
    this.senderTokens = stream.senderTokens.toBase58();
    this.recipient = stream.recipient.toBase58();
    this.recipientTokens = stream.recipientTokens.toBase58();
    this.mint = stream.mint.toBase58();
    this.escrowTokens = stream.escrowTokens.toBase58();
    this.streamflowTreasury = stream.streamflowTreasury.toBase58();
    this.streamflowTreasuryTokens = stream.streamflowTreasuryTokens.toBase58();
    this.streamflowFeeTotal = stream.streamflowFeeTotal;
    this.streamflowFeeWithdrawn = stream.streamflowFeeWithdrawn;
    this.streamflowFeePercent = stream.streamflowFeePercent.toNumber();
    this.partnerFeeTotal = stream.partnerFeeTotal;
    this.partnerFeeWithdrawn = stream.partnerFeeWithdrawn;
    this.partnerFeePercent = stream.partnerFeePercent.toNumber();
    this.partner = stream.partner.toBase58();
    this.partnerTokens = stream.partnerTokens?.toBase58();
    this.start = stream.start.toNumber();
    this.depositedAmount = stream.depositedAmount;
    this.period = stream.period.toNumber();
    this.amountPerPeriod = stream.amountPerPeriod;
    this.cliff = stream.cliff.toNumber();
    this.cliffAmount = stream.cliffAmount;
    this.cancelableBySender = stream.cancelableBySender;
    this.cancelableByRecipient = stream.cancelableByRecipient;
    this.automaticWithdrawal = stream.automaticWithdrawal;
    this.transferableBySender = stream.transferableBySender;
    this.transferableByRecipient = stream.transferableByRecipient;
    this.canTopup = stream.canTopup;
    this.name = stream.name;
    this.withdrawalFrequency = stream.withdrawFrequency.toNumber();
    this.closed = stream.closed;
    this.currentPauseStart = stream.currentPauseStart.toNumber();
    this.pauseCumulative = stream.pauseCumulative;
    this.lastRateChangeTime = stream.lastRateChangeTime.toNumber();
    this.fundsUnlockedAtLastRateChange = stream.fundsUnlockedAtLastRateChange;
    this.type = buildStreamType(this);
  }

  unlocked(currentTimestamp: number): BN {
    return calculateUnlockedAmount({
      ...this,
      currentTimestamp,
    });
  }

  remaining(decimals: number): number {
    return getNumberFromBN(this.depositedAmount.sub(this.withdrawnAmount), decimals);
  }
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
  withdrawFrequency: BN;
  closed: boolean;
  currentPauseStart: BN;
  pauseCumulative: BN;
  lastRateChangeTime: BN;
  fundsUnlockedAtLastRateChange: BN;
}

export interface TransactionResponse {
  tx: TransactionSignature;
}

export interface CreateStreamResponse extends TransactionResponse {
  id: string;
}

export interface TxResponse {
  ixs: TransactionInstruction[];
  tx: TransactionSignature;
}

export interface CreateResponse extends TxResponse {
  metadata: Keypair;
}

export interface MetadataRecipientHashMap {
  [metadataPubKey: string]: IRecipient;
}

export interface CreateMultiError {
  recipient: string;
  error: string;
}

export interface CreateMultiResponse {
  txs: TransactionSignature[];
  metadatas: Keypair[];
  metadataToRecipient: MetadataRecipientHashMap;
  errors: CreateMultiError[];
}

export enum TransferCancelOptions {
  Recipient = "recipient",
  Sender = "sender",
  Both = "both",
  Neither = "neither",
}

export interface Recipient {
  recipient: string;
  recipientEmail: string;
  name: string;
  depositedAmount: number;
}

export interface CreateMultipleStreamsValues {
  releaseAmount: number;
  email: string;
  tokenSymbol: string;
  startDate: string;
  startTime: string;
  releaseFrequencyCounter: number;
  whoCanTransfer: TransferCancelOptions;
  whoCanCancel: TransferCancelOptions;
  releaseFrequencyPeriod: number;
  automaticWithdrawal: boolean;
  withdrawalFrequencyCounter: number;
  withdrawalFrequencyPeriod: number;
  referral: string;
  recipients: Recipient[];
}

export interface CheckAssociatedTokenAccountsData {
  sender: PublicKey;
  senderTokens: PublicKey;
  recipient: PublicKey;
  recipientTokens: PublicKey;
  partner: PublicKey;
  partnerTokens: PublicKey;
  streamflowTreasury: PublicKey;
  streamflowTreasuryTokens: PublicKey;
  mint: PublicKey;
}

export interface BatchItem {
  recipient: string;
  tx: Transaction;
}

export interface BatchItemSuccess extends BatchItem {
  signature: string;
}

export interface BatchItemError extends BatchItem {
  error: string;
}

export interface AtaParams {
  mint: PublicKey;
  owner: PublicKey;
}

export type BatchItemResult = BatchItemSuccess | BatchItemError;
