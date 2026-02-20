import type BN from "bn.js";

import type { StreamType } from "../types.js";

/**
 * Chain identifiers supported by Streamflow protocol
 */
export type Chain = "SOLANA" | "APTOS" | "ETHEREUM" | "BNB" | "POLYGON" | "SUI";

/**
 * Contract types supported by Streamflow protocol
 */
export type ContractType = "VESTING" | "PAYMENT" | "TOKEN_LOCK" | "DYNAMIC_VESTING" | "DYNAMIC_LOCK";

/**
 * Price oracle types for dynamic contracts
 */
export type PriceOracleType = "TEST" | "SWITCHBOARD" | "PYTH";

/**
 * Contract schema matching OpenAPI specification
 * Used for API responses
 */
export interface ContractSchema {
  chain: Chain;
  programId: string;
  address: string;
  oldAddress: string | null;
  name: string;
  contractType: ContractType;
  sender: string;
  recipient: string;
  partner: string | null;
  mint: string;
  escrow: string | null;
  amount: string; // decimal string
  cliffAmount: string;
  amountPerPeriod: string;
  claimedAmount: string;
  amountUnlockedAtLastRateUpdate: string;
  period: number;
  autoClaimPeriod: number;
  createdDt: string; // ISO date
  startDt: string;
  endDt: string;
  canceledDt: string | null;
  pausedDt: string | null;
  lastClaimedDt: string | null;
  lastRateUpdateDt: string | null;
  isClosed: boolean;
  isFucked: boolean;
  isPausable: boolean;
  canTopup: boolean;
  hasAutoClaim: boolean;
  isCancelableBySender: boolean;
  isCancelableByRecipient: boolean;
  isTransferableBySender: boolean;
  isTransferableByRecipient: boolean;
  canUpdateRate: boolean | null;
  streamflowFee: string;
  streamflowFeeWithdrawn: string;
  streamflowFeePercentage: string;
  partnerFee: string;
  partnerFeeWithdrawn: string;
  partnerFeePercentage: string;
  txFee: string;
  pauseCumulative: number;
  creationFee: number | null;
  creationFeeClaimed: boolean | null;
  autoClaimFee: number | null;
  autoClaimFeeClaimed: boolean | null;
  lastUpdateSlot: number | null;
  dynamicContract: DynamicContractSchema | null;
}

/**
 * Dynamic contract schema for aligned stream data
 * Used for API responses with price-based streams
 */
export interface DynamicContractSchema {
  chain: Chain;
  programId: string;
  address: string;
  contractAddress: string;
  sender: string;
  priceOracleType: PriceOracleType | null;
  priceOracleAddress: string | null;
  minPrice: string;
  maxPrice: string;
  minPercentage: string;
  maxPercentage: string;
  tickSize: string;
  expiryDt: string | null;
  expiryPercentage: string;
  floorPrice: string;
  lastPrice: string;
  initialAmountPerPeriod: string;
  initialPrice: string;
  initialAmount: string;
  lastUpdateSlot: number | null;
  streamCanceledTime: string | number | null;
}

/**
 * TabulariumContract interface
 * Mirrors LinearStream with primitive types for API/public usage
 * All addresses are strings, timestamps are numbers, amounts are BN
 */
export interface TabulariumContract {
  // Identity
  address: string;
  // Parties
  sender: string;
  senderTokens: string;
  recipient: string;
  recipientTokens: string;
  partner: string;
  partnerTokens: string;
  // Token
  mint: string;
  escrowTokens: string;
  // Treasury
  streamflowTreasury: string;
  streamflowTreasuryTokens: string;
  // Amounts (BN)
  depositedAmount: BN;
  withdrawnAmount: BN;
  cliffAmount: BN;
  amountPerPeriod: BN;
  streamflowFeeTotal: BN;
  streamflowFeeWithdrawn: BN;
  partnerFeeTotal: BN;
  partnerFeeWithdrawn: BN;
  pauseCumulative: BN;
  fundsUnlockedAtLastRateChange: BN;
  // Timestamps (number - Unix seconds)
  start: number;
  end: number;
  cliff: number;
  createdAt: number;
  canceledAt: number;
  lastWithdrawnAt: number;
  lastRateChangeTime: number;
  currentPauseStart: number;
  // Periods
  period: number;
  withdrawalFrequency: number;
  // Percentages
  streamflowFeePercent: number;
  partnerFeePercent: number;
  // Booleans
  cancelableBySender: boolean;
  cancelableByRecipient: boolean;
  transferableBySender: boolean;
  transferableByRecipient: boolean;
  canTopup: boolean;
  automaticWithdrawal: boolean;
  closed: boolean;
  // Metadata
  name: string;
  type: StreamType;
  isAligned: boolean;
  // Legacy
  magic: number;
  version: number;
  oldMetadata: string;
}
