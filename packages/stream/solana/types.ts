import type { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import type { PublicKey, Keypair, VersionedTransaction, TransactionInstruction, AccountInfo, Commitment, ConnectionConfig } from "@solana/web3.js";
import { getNumberFromBN } from "@streamflow/common";
import type { ITransactionExt, ICluster } from "@streamflow/common";
import type BN from "bn.js";
import { type IdlAccounts, type IdlTypes, type Address } from "@coral-xyz/anchor";
import type { default as PQueue } from "p-queue";

import { buildStreamType, calculateUnlockedAmount, decodeEndTime } from "./contractUtils.js";
import type { StreamflowAlignedUnlocks as AlignedUnlocksIDL } from "./descriptor/streamflow_aligned_unlocks.js";
// Duplicated constant locally to avoid circular import with constants.ts
const ALIGNED_PRECISION_FACTOR_POW = 9;

export { ContractError, ICluster } from "@streamflow/common";

export interface IRecipient {
  recipient: string;
  amount: BN;
  name: string;
  cliffAmount: BN;
  amountPerPeriod: BN;
}

export interface IBaseStreamConfig {
  period: number;
  start: number;
  cliff: number;
  cancelableBySender: boolean;
  cancelableByRecipient: boolean;
  transferableBySender: boolean;
  transferableByRecipient: boolean;
  canTopup: boolean;
  automaticWithdrawal?: boolean;
  withdrawalFrequency?: number;
  tokenId: string;
  canPause?: boolean;
  canUpdateRate?: boolean;
  partner?: string;
  tokenProgramId?: string | PublicKey;
}

export type IAlignedStreamConfig = {
  minPrice: number | BN;
  maxPrice: number | BN;
  minPercentage: number | BN;
  maxPercentage: number | BN;
  oracleType?: OracleTypeName;
  priceOracle?: Address;
  skipInitial?: boolean;
  tickSize?: number;
  expiryTime?: number;
  expiryPercentage?: number | BN;
  floorPrice?: number | BN;
};

export type ICreateLinearStreamData = IBaseStreamConfig & IRecipient;

export type ICreateAlignedStreamData = ICreateLinearStreamData & IAlignedStreamConfig;

export type ICreateStreamData = ICreateLinearStreamData | ICreateAlignedStreamData;

export type ICreateMultipleLinearStreamData = IBaseStreamConfig & {
  recipients: IRecipient[];
};

export type ICreateMultipleAlignedStreamData = ICreateMultipleLinearStreamData & IAlignedStreamConfig;

export type ICreateMultipleStreamData = ICreateMultipleLinearStreamData | ICreateMultipleAlignedStreamData;

export interface IInteractData {
  id: string;
}

export interface IWithdrawData extends IInteractData {
  amount?: BN;
}

export interface IUpdateData extends IInteractData {
  enableAutomaticWithdrawal?: boolean;
  withdrawFrequency?: BN;
  amountPerPeriod?: BN;

  // supported only on Solana
  transferableBySender?: boolean;
  transferableByRecipient?: boolean;
  cancelableBySender?: boolean;
}

export type ICancelData = IInteractData;

export interface ITransferData extends IInteractData {
  newRecipient: string;
}

export interface ITopUpData extends IInteractData {
  amount: BN;
}

export type IGetOneData = IInteractData;

export interface IGetFeesData {
  address: string;
}

export interface IGetAllData {
  address: string;
  type?: StreamType;
  direction?: StreamDirection;
}

export interface ICreateMultiError {
  recipient: string;
  error: string;
  contractErrorCode?: string;
}

type MetadataId = string;

export interface ITransactionResult {
  ixs: TransactionInstruction[];
  txId: string;
}

/**
 * Schema outlining vesting protocol fees.
 */
export interface IFees {
  // fee paid in SOL to create a contract
  creationFeeSol?: number;
  // fee paid in SOL to enable auto-claim
  autoClaimFeeSol?: number;
  // fee paid in token % paid on contract creation and claimed to the treasury with every claim
  streamflowFee: number;
  // referral fee, not used right now
  partnerFee: number;
}

export interface ICreateResult extends ITransactionResult {
  metadataId: MetadataId;
}

export interface IMultiTransactionResult {
  txs: string[];
  metadatas: MetadataId[];
  metadataToRecipient: Record<MetadataId, IRecipient>;
  errors: ICreateMultiError[];
}

export type OracleTypeName = "none" | "pyth" | "switchboard" | "test";

export enum StreamDirection {
  Outgoing = "outgoing",
  Incoming = "incoming",
  All = "all",
}

export enum StreamType {
  All = "all",
  Vesting = "vesting",
  Lock = "lock",
}

// Base types
export interface LinearStream {
  isAligned: boolean;
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

  unlocked(currentTimestamp: number): BN;

  remaining(decimals: number): number;
}

export type AlignedStreamData = {
  minPrice: number;
  maxPrice: number;
  minPercentage: number;
  maxPercentage: number;
  oracleType: OracleTypeName;
  priceOracle: string | undefined;
  tickSize: number;
  initialAmountPerPeriod: BN;
  initialPrice: number;
  lastPrice: number;
  lastAmountUpdateTime: number;
  initialNetAmount: BN;
  expiryTime: number;
  expiryPercentage: number;
  floorPrice: number;
};

export type AlignedStream = LinearStream & AlignedStreamData;

export type Stream = LinearStream | AlignedStream;

/**
 * Error codes raised by Solana protocol specifically
 */
export enum ContractErrorCode {
  /** Accounts not writable */
  AccountsNotWritable = "AccountsNotWritable",
  /** Invalid Metadata */
  InvalidMetadata = "InvalidMetadata",
  /** Invalid metadata account */
  InvalidMetadataAccount = "InvalidMetadataAccount",
  /** Provided accounts don't match the ones in contract */
  MetadataAccountMismatch = "MetadataAccountMismatch",
  /** Invalid escrow account */
  InvalidEscrowAccount = "InvalidEscrowAccount",
  /** Provided account(s) is/are not valid associated token accounts */
  NotAssociated = "NotAssociated",
  /** Sender mint does not match accounts mint */
  MintMismatch = "MintMismatch",
  /** Recipient not transferable for account */
  TransferNotAllowed = "TransferNotAllowed",
  /** Contract closed */
  ContractClosed = "ContractClosed",
  /** Invalid Streamflow Treasury accounts supplied */
  InvalidTreasury = "InvalidTreasury",
  /** Given timestamps are invalid */
  InvalidTimestamps = "InvalidTimestamps",
  /** Invalid deposit configuration */
  InvalidDepositConfiguration = "InvalidDepositConfiguration",
  /** Amount cannot be zero */
  AmountIsZero = "AmountIsZero",
  /** Amount requested is larger than available */
  AmountMoreThanAvailable = "AmountMoreThanAvailable",
  /** Amount currently available is zero */
  AmountAvailableIsZero = "AmountAvailableIsZero",
  /** Arithmetic error */
  ArithmeticError = "ArithmeticError",
  /** Metadata account data must be 1104 bytes long */
  InvalidMetadataSize = "InvalidMetadataSize",
  /** Metadata state account must be initialized */
  UninitializedMetadata = "UninitializedMetadata",
  /** Authority does not have permission for this action */
  Unauthorized = "Unauthorized",
  /** Contract is not transferable to the original recipient */
  SelfTransfer = "SelfTransfer",
  /** Contract is already paused */
  AlreadyPaused = "AlreadyPaused",
  /** Contract is not paused */
  NotPaused = "NotPaused",
  /** Meta account is not rent exempt */
  MetadataNotRentExempt = "MetadataNotRentExempt",
}

export enum AlignedProxyErrorCode {
  /** Authority does not have permission for this action */
  Unauthorized = "Unauthorized",

  /** Arithmetic error */
  ArithmeticError = "ArithmeticError",

  /** Mint has unsupported Token Extensions */
  UnsupportedTokenExtensions = "UnsupportedTokenExtensions",

  /** Provided period is too short, should be equal or more than 30 seconds */
  PeriodTooShort = "PeriodTooShort",

  /** Provided percentage tick size is invalid */
  InvalidTickSize = "InvalidTickSize",

  /** Provided percentage bounds are invalid */
  InvalidPercentageBoundaries = "InvalidPercentageBoundaries",

  /** Provided price bounds are invalid */
  InvalidPriceBoundaries = "InvalidPriceBoundaries",

  /** Unsupported price oracle */
  UnsupportedOracle = "UnsupportedOracle",

  /** Invalid oracle account */
  InvalidOracleAccount = "InvalidOracleAccount",

  /** Invalid oracle price */
  InvalidOraclePrice = "InvalidOraclePrice",

  /** Invalid Stream Metadata */
  InvalidStreamMetadata = "InvalidStreamMetadata",

  /** Release amount has already been updated in this period */
  AmountAlreadyUpdated = "AmountAlreadyUpdated",

  /** All funds are already unlocked */
  AllFundsUnlocked = "AllFundsUnlocked",
}

/**
 * @interface
 */
export interface TransactionSchedulingOptions {
  /**
   * concurrency rate for scheduling
   */
  sendRate: number;
  /**
   * time interval between consecutive sends
   */
  sendInterval?: number;
  /**
   * time interval before confirming the transaction
   */
  waitBeforeConfirming?: number;
}

/**
 * @interface
 */
export interface StreamClientOptions {
  clusterUrl: string;
  cluster?: ICluster;
  programId?: string;
  commitment?: Commitment | ConnectionConfig;
  sendRate?: number;
  sendThrottler?: PQueue;
  sendScheduler?: PQueue | TransactionSchedulingOptions;
}

type AlignedUnlocksTypes = IdlTypes<AlignedUnlocksIDL>;
type AlignedUnlocksAccounts = IdlAccounts<AlignedUnlocksIDL>;

export type AlignedUnlocksContract = AlignedUnlocksAccounts["contract"];
export type OracleType = IdlTypes<AlignedUnlocksIDL>["oracleType"];
export type TestOracle = AlignedUnlocksAccounts["testOracle"];

export type CreateParams = AlignedUnlocksTypes["createParams"];
export type ChangeOracleParams = AlignedUnlocksTypes["changeOracleParams"];
export type CreateTestOracleParams = AlignedUnlocksTypes["createTestOracleParams"];
export type UpdateTestOracleParams = AlignedUnlocksTypes["updateTestOracleParams"];

export interface ISearchStreams {
  mint?: string;
  sender?: string;
  recipient?: string;
  closed?: boolean;
}

export interface Account {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
}

export interface ICreateExt {
  sender: SignerWalletAdapter | Keypair;
  isNative?: boolean;
}

export interface ITransactionExtWithInstructions extends ITransactionExt {
  customInstructions?: {
    after?: InstructionGenerator;
  };
}

export interface ICreateStreamExt extends ICreateExt, ITransactionExtWithInstructions {
  // allow custom Metadata Account to be passed, ephemeral signer is most cases, accepts array to be compatible in createMultiple
  metadataPubKeys?: PublicKey[];
  partner?: string | null;
}

export interface IPrepareCreateStreamExt extends Omit<ICreateStreamExt, "sender"> {
  sender: {
    publicKey: PublicKey | null;
  }
}

export interface IInteractStreamExt extends ITransactionExtWithInstructions {
  invoker: SignerWalletAdapter | Keypair;
  checkTokenAccounts?: boolean;
}

export interface IPrepareStreamExt extends Omit<IInteractStreamExt, "invoker"> {
  invoker: {
    publicKey: PublicKey | null;
  }
}

export interface ITopUpStreamExt extends ITransactionExt {
  invoker: SignerWalletAdapter | Keypair;
  isNative?: boolean;
}

export interface ICreateStreamInstructions {
  ixs: TransactionInstruction[];
  metadata: Keypair | undefined;
  metadataPubKey: PublicKey;
}

export class Contract implements LinearStream {
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

  isAligned: boolean;

  constructor(stream: DecodedStream) {
    this.magic = stream.magic.toNumber();
    this.version = stream.version.toNumber();
    this.createdAt = stream.createdAt.toNumber();
    this.withdrawnAmount = stream.withdrawnAmount;
    this.canceledAt = stream.canceledAt.toNumber();
    // for aligned contracts end time can be an invalid timeValue
    this.end = decodeEndTime(stream.end);
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
    this.streamflowFeePercent = stream.streamflowFeePercent;
    this.partnerFeeTotal = stream.partnerFeeTotal;
    this.partnerFeeWithdrawn = stream.partnerFeeWithdrawn;
    this.partnerFeePercent = stream.partnerFeePercent;
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
    this.isAligned = false;
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

export class AlignedContract extends Contract implements AlignedStream {
  minPrice: number;

  maxPrice: number;

  minPercentage: number;

  maxPercentage: number;

  tickSize: number;

  proxyAddress: string;

  priceOracle: string | undefined;

  oracleType: OracleTypeName;

  initialAmountPerPeriod: BN;

  initialPrice: number;

  lastPrice: number;

  lastAmountUpdateTime: number;

  initialNetAmount: BN;

  expiryTime: number;

  expiryPercentage: number;

  floorPrice: number;

  constructor(stream: DecodedStream, alignedProxy: AlignedUnlocksContract) {
    super(stream);
    this.minPrice = getNumberFromBN(alignedProxy.minPrice, ALIGNED_PRECISION_FACTOR_POW);
    this.maxPrice = getNumberFromBN(alignedProxy.maxPrice, ALIGNED_PRECISION_FACTOR_POW);
    this.minPercentage = getNumberFromBN(alignedProxy.minPercentage, ALIGNED_PRECISION_FACTOR_POW);
    this.maxPercentage = getNumberFromBN(alignedProxy.maxPercentage, ALIGNED_PRECISION_FACTOR_POW);
    this.oracleType = (Object.keys(alignedProxy.priceOracleType).find((key) => !!key) || "none") as OracleTypeName;
    this.tickSize = alignedProxy.tickSize.toNumber();
    this.priceOracle = this.oracleType === "none" ? undefined : alignedProxy.priceOracle.toBase58();
    this.sender = alignedProxy.sender.toBase58();
    this.canceledAt = alignedProxy.streamCanceledTime.toNumber();
    this.proxyAddress = stream.sender.toBase58();
    this.initialAmountPerPeriod = alignedProxy.initialAmountPerPeriod;
    this.initialPrice = getNumberFromBN(alignedProxy.initialPrice, ALIGNED_PRECISION_FACTOR_POW);
    this.lastPrice = getNumberFromBN(alignedProxy.lastPrice, ALIGNED_PRECISION_FACTOR_POW);
    this.lastAmountUpdateTime = alignedProxy.lastAmountUpdateTime.toNumber();
    this.initialNetAmount = alignedProxy.initialNetAmount;
    this.expiryTime = alignedProxy.expiryTime.toNumber();
    this.expiryPercentage = getNumberFromBN(alignedProxy.expiryPercentage, ALIGNED_PRECISION_FACTOR_POW);
    this.floorPrice = getNumberFromBN(alignedProxy.floorPrice, ALIGNED_PRECISION_FACTOR_POW);
    // need to call this again since minPrice and maxPrice are used in determining the type
    this.type = buildStreamType(this);
    this.isAligned = true;
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
  streamflowFeePercent: number;
  partnerFeeTotal: BN;
  partnerFeeWithdrawn: BN;
  partnerFeePercent: number;
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
  oldMetadataKey: PublicKey;
}

export interface MetadataRecipientHashMap {
  [metadataPubKey: string]: IRecipient;
}

export interface BatchItem {
  recipient: string;
  tx: VersionedTransaction;
}

export interface BatchItemSuccess extends BatchItem {
  signature: string;
}

export interface BatchItemError extends BatchItem {
  error: string;
}

export type BatchItemResult = BatchItemSuccess | BatchItemError;

export type InstructionGenerator =
  | TransactionInstruction[]
  | ((params: {
      instructions: TransactionInstruction[];
      metadata?: PublicKey;
    }) => TransactionInstruction[] | Promise<TransactionInstruction[]>);
