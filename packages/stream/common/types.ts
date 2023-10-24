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

export interface IGetAllData {
  address: string;
  type?: StreamType;
  direction?: StreamDirection;
}

export interface ICreateMultiError {
  recipient: string;
  error: string;
  parsedError?: string;
}

type MetadataId = string;

export interface ITransactionResult {
  ixs: (TransactionInstruction | Types.TransactionPayload)[];
  txId: string;
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

export enum ContractErrorCode {
  ECONTRACT_NOT_INIT = "ECONTRACT_NOT_INIT",
  EBAD_AMOUNT = "EBAD_AMOUNT",
  ENO_PERMISSIONS = "ENO_PERMISSIONS",
  EBADINPUT = "EBADINPUT",
  ECLOSED = "ECLOSED",
  EBAD_INPUT_AMOUNT_PER_PERIOD = "EBAD_INPUT_AMOUNT_PER_PERIOD",
  EBAD_INPUT_PAUSABLE = "EBAD_INPUT_PAUSABLE",
  EBAD_INPUT_UPDATE_RATE = "EBAD_INPUT_UPDATE_RATE",
  EBAD_INPUT_CLIFF_AMOUNT = "EBAD_INPUT_CLIFF_AMOUNT",
  EBAD_INPUT_PERIOD = "EBAD_INPUT_PERIOD",
  EBAD_INPUT_START = "EBAD_INPUT_START",
  EBAD_INSUFFICIENT_TOKEN_ALLOWANCE = "EBAD_INSUFFICIENT_TOKEN_ALLOWANCE",
  EBAD_INSUFFICIENT_WITHDRAWAL_FEES = "EBAD_INSUFFICIENT_WITHDRAWAL_FEES",
  EADDRESS_NOT_VALID = "EADDRESS_NOT_VALID",
  EFEE_NOT_VALID = "EFEE_NOT_VALID",
  EBAD_INSUFFICIENT_AMOUNT = "EBAD_INSUFFICIENT_AMOUNT",
  EPAUSED = "EPAUSED",
  ENOTPAUSED = "ENOTPAUSED",
  EADMIN_NOT_AUTHORIZED = "EADMIN_NOT_AUTHORIZED",
  EWITHDRAWOR_NOT_AUTHORIZED = "EWITHDRAWOR_NOT_AUTHORIZED",
  ENO_RECIPIENT_COIN_ADDRESS = "ENO_RECIPIENT_COIN_ADDRESS",
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
    this.name = "ContractError"; // Set the name property
    this.contractErrorCode = code ?? null;

    // Copy properties from the original error
    Object.getOwnPropertyNames(error).forEach((key) => {
      (this as any)[key] = (error as any)[key];
    });

    // If you want to capture the stack trace:
    this.stack = error.stack;
  }
}
