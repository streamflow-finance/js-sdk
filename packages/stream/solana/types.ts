import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { AccountInfo, PublicKey, Keypair, VersionedTransaction, TransactionInstruction } from "@solana/web3.js";
import { ITransactionSolanaExt } from "@streamflow/common/solana";
import BN from "bn.js";
import { type IdlAccounts, type IdlTypes } from "@coral-xyz/anchor";

import { buildStreamType, calculateUnlockedAmount, decodeEndTime } from "../common/contractUtils.js";
import { AlignedStream, IRecipient, LinearStream, OracleTypeName, StreamType } from "../common/types.js";
import { getNumberFromBN } from "../common/utils.js";
import { StreamflowAlignedUnlocks as AlignedUnlocksIDL } from "./descriptor/streamflow_aligned_unlocks.js";
import { ALIGNED_PRECISION_FACTOR_POW } from "./constants.js";

export { IChain, ICluster, ContractError } from "@streamflow/common";

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

export interface ICreateSolanaExt {
  sender: SignerWalletAdapter | Keypair;
  isNative?: boolean;
}

export interface ITransactionSolanaExtWithInstructions extends ITransactionSolanaExt {
  customInstructions?: {
    after?: InstructionGenerator;
  };
}

export interface ICreateStreamSolanaExt extends ICreateSolanaExt, ITransactionSolanaExtWithInstructions {
  // allow custom Metadata Account to be passed, ephemeral signer is most cases, accepts array to be compatible in createMultiple
  metadataPubKeys?: PublicKey[];
  partner?: string | null;
}

export interface IInteractStreamSolanaExt extends ITransactionSolanaExtWithInstructions {
  invoker: SignerWalletAdapter | Keypair;
  checkTokenAccounts?: boolean;
}

export interface ITopUpStreamSolanaExt extends ITransactionSolanaExt {
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

  isAligned?: boolean;

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
