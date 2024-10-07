import { TransactionInstruction } from "@solana/web3.js";
import { Types } from "aptos";
import BN from "bn.js";

export { IChain, ICluster, ContractError } from "@streamflow/common";

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
}

export interface ICancelData extends IInteractData {
  isAlignedUnlock?: boolean;
}

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

  isAligned?: boolean;

  unlocked(currentTimestamp: number): BN;

  remaining(decimals: number): number;
}
