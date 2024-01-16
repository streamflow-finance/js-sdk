import { TransactionInstruction } from "@solana/web3.js";
import { Types } from "aptos";
import BN from "bn.js";

// Stream Client Types
export interface IRecipient {
  recipient: string;
  amount: BN;
  name: string;
  cliffAmount: BN;
  amountPerPeriod: BN;
}

export interface IStreamConfig {
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
}

export type ICreateStreamData = IStreamConfig & IRecipient;

export type ICreateMultipleStreamData = IStreamConfig & {
  recipients: IRecipient[];
};

export interface IWithdrawData {
  id: string;
  amount: BN;
}

export interface IUpdateData {
  id: string;
  enableAutomaticWithdrawal?: boolean;
  withdrawFrequency?: BN;
  amountPerPeriod?: BN;
}

export interface ICancelData {
  id: string;
}

export interface ITransferData {
  id: string;
  newRecipient: string;
}

export interface ITopUpData {
  id: string;
  amount: BN;
}

export interface IGetOneData {
  id: string;
}

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

// Utility types
export enum ICluster {
  Mainnet = "mainnet",
  Devnet = "devnet",
  Testnet = "testnet",
  Local = "local",
}
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

export enum IChain {
  Solana = "Solana",
  Aptos = "Aptos",
  Ethereum = "Ethereum",
  BNB = "BNB",
  Polygon = "Polygon",
  Sui = "Sui",
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

// Base types, implemented by each chain package
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
  closed: boolean;
  currentPauseStart: number;
  pauseCumulative: BN;
  lastRateChangeTime: number;
  fundsUnlockedAtLastRateChange: BN;

  type: StreamType;

  unlocked(currentTimestamp: number): BN;

  remaining(decimals: number): number;
}

/**
 * Error wrapper for calls made to the contract on chain
 */
export class ContractError extends Error {
  public contractErrorCode: string | null;

  /**
   * Constructs the Error Wrapper
   * @param error Original error raised probably by the chain SDK
   * @param code extracted code from the error if managed to parse it
   */
  constructor(error: Error, code?: string | null) {
    super(error.message); // Call the base class constructor with the error message
    this.contractErrorCode = code ?? null;
    // Copy properties from the original error
    Object.setPrototypeOf(this, ContractError.prototype);
    this.name = "ContractError"; // Set the name property
    this.stack = error.stack;
  }
}
