import type { Address } from "@coral-xyz/anchor";
import type { PublicKey, TransactionInstruction, Commitment, ConnectionConfig } from "@solana/web3.js";
import type { IChain, ICluster } from "@streamflow/common";
import type BN from "bn.js";
import type { Signer } from "ethers";
import type { default as PQueue } from "p-queue";

import type { Types } from "aptos";

import type { ISuiIdParameters } from "../sui/index.js";

export { ContractError, IChain, ICluster } from "@streamflow/common";

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
  ixs: (TransactionInstruction | Types.TransactionPayload)[];
  txId: string;
}

export interface IFees {
  streamflowFee: number;
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
  Payment = "payment",
  Vesting = "vesting",
  Lock = "lock",
}

/**
 * Error codes raised by all protocols except for Solana
 */
export enum ContractErrorCode {
  /** Contract does not exist */
  ECONTRACT_NOT_INIT = "ECONTRACT_NOT_INIT",
  /** Invalid total amount */
  EBAD_AMOUNT = "EBAD_AMOUNT",
  /** No permissions to perform an operation */
  ENO_PERMISSIONS = "ENO_PERMISSIONS",
  /** Invalid input parameters on create/update */
  EBADINPUT = "EBADINPUT",
  /** Contract is already ended */
  ECLOSED = "ECLOSED",
  /** Invalid amount per period input */
  EBAD_INPUT_AMOUNT_PER_PERIOD = "EBAD_INPUT_AMOUNT_PER_PERIOD",
  /** Pause feature is not supported */
  EBAD_INPUT_PAUSABLE = "EBAD_INPUT_PAUSABLE",
  /** Not used currently  */
  EBAD_INPUT_UPDATE_RATE = "EBAD_INPUT_UPDATE_RATE",
  /** Invalid cliff amount input */
  EBAD_INPUT_CLIFF_AMOUNT = "EBAD_INPUT_CLIFF_AMOUNT",
  /** Invalid period input */
  EBAD_INPUT_PERIOD = "EBAD_INPUT_PERIOD",
  /** Invalid start time of the contract */
  EBAD_INPUT_START = "EBAD_INPUT_START",
  /** EVM: token allowance is not enough to create a Contract */
  EBAD_INSUFFICIENT_TOKEN_ALLOWANCE = "EBAD_INSUFFICIENT_TOKEN_ALLOWANCE",
  /** EVM: not enough coins were passed for withdrawal fees */
  EBAD_INSUFFICIENT_WITHDRAWAL_FEES = "EBAD_INSUFFICIENT_WITHDRAWAL_FEES",
  /** Sui: Insufficient amount of tokens passed */
  EBAD_INSUFFICIENT_AMOUNT = "EBAD_INSUFFICIENT_AMOUNT",
  /** Contract is already paused */
  EPAUSED = "EPAUSED",
  /** Contract is not paused */
  ENOTPAUSED = "ENOTPAUSED",
  /** Aptos: user opt out from direct coin transfers feature and has not coin wallet registered */
  ENO_RECIPIENT_COIN_ADDRESS = "ENO_RECIPIENT_COIN_ADDRESS",
}

// Base types, implemented by each chain package
export interface LinearStream {
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
};

export type AlignedStream = LinearStream & AlignedStreamData;

export type Stream = LinearStream | AlignedStream;

/**
 * Error codes raised by Solana protocol specifically
 */
export enum SolanaContractErrorCode {
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

export enum SolanaAlignedProxyErrorCode {
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
export interface SolanaTransactionSchedulingOptions {
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
export interface SolanaStreamClientOptions {
  chain: IChain.Solana;
  clusterUrl: string;
  cluster?: ICluster;
  programId?: string;
  commitment?: Commitment | ConnectionConfig;
  sendRate?: number;
  sendThrottler?: PQueue;
  sendScheduler?: PQueue | SolanaTransactionSchedulingOptions;
}

/**
 * @interface
 */
export interface AptosStreamClientOptions {
  chain: IChain.Aptos;
  clusterUrl: string;
  cluster?: ICluster;
  programId?: string;
  maxGas?: string;
}

/**
 * @interface
 */
export interface EvmStreamClientOptions {
  chain: IChain.Ethereum | IChain.BNB | IChain.Polygon;
  clusterUrl: string;
  signer: Signer;
  cluster?: ICluster;
  programId?: string;
}

/**
 * @interface
 */
export interface SuiStreamClientOptions {
  chain: IChain.Sui;
  clusterUrl: string;
  cluster?: ICluster;
  ids?: ISuiIdParameters;
}
