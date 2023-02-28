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
  Stream = "stream",
  Vesting = "vesting",
  All = "all",
}

export enum IChain {
  Solana = "Solana",
  Aptos = "Aptos",
  Etherium = "Etherium",
  BSC = "BSC",
}
