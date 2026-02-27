import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { ata, getBN, pk } from "@streamflow/common";

import { ALIGNED_PRECISION_FACTOR_POW, STREAMFLOW_TREASURY_PUBLIC_KEY } from "../constants.js";
import { Contract, AlignedContract } from "../types.js";
import type { Stream, DecodedStream, AlignedUnlocksContract } from "../types.js";
import type { ContractSchema, DynamicContractSchema } from "./types.js";

const isoToUnix = (iso: string | null): number => {
  if (!iso) return 0;
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? 0 : Math.floor(time / 1000);
};

const toBN = (value: string | number): BN => new BN(value);

const mapOracleType = (apiType: string | null): Record<string, object> => {
  if (!apiType) return { none: {} };
  const mapping: Record<string, Record<string, object>> = {
    TEST: { test: {} },
    PYTH: { pyth: {} },
    SWITCHBOARD: { switchboard: {} },
  };
  return mapping[apiType] ?? { none: {} };
};

async function toDecodedStream(schema: ContractSchema): Promise<DecodedStream> {
  const mint = pk(schema.mint);
  const sender = pk(schema.sender);
  const recipient = pk(schema.recipient);
  const partner = schema.partner ? pk(schema.partner) : sender;
  const payer = schema.payer ? pk(schema.payer) : PublicKey.default;

  const [senderTokens, recipientTokens, partnerTokens, streamflowTreasuryTokens] = await Promise.all([
    ata(mint, sender),
    ata(mint, recipient),
    ata(mint, partner),
    ata(mint, STREAMFLOW_TREASURY_PUBLIC_KEY),
  ]);

  return {
    magic: toBN(4),
    version: toBN(4),
    createdAt: toBN(isoToUnix(schema.createdDt)),
    withdrawnAmount: toBN(schema.claimedAmount),
    canceledAt: toBN(isoToUnix(schema.canceledDt)),
    end: toBN(isoToUnix(schema.endDt)),
    lastWithdrawnAt: toBN(isoToUnix(schema.lastClaimedDt)),
    sender,
    senderTokens,
    recipient,
    recipientTokens,
    mint,
    escrowTokens: schema.escrow ? pk(schema.escrow) : PublicKey.default,
    streamflowTreasury: STREAMFLOW_TREASURY_PUBLIC_KEY,
    streamflowTreasuryTokens,
    streamflowFeeTotal: toBN(schema.streamflowFee),
    streamflowFeeWithdrawn: toBN(schema.streamflowFeeWithdrawn),
    streamflowFeePercent: parseFloat(schema.streamflowFeePercentage) || 0,
    partnerFeeTotal: toBN(schema.partnerFee),
    partnerFeeWithdrawn: toBN(schema.partnerFeeWithdrawn),
    partnerFeePercent: parseFloat(schema.partnerFeePercentage) || 0,
    partner,
    partnerTokens,
    start: toBN(isoToUnix(schema.startDt)),
    depositedAmount: toBN(schema.amount),
    period: toBN(schema.period),
    amountPerPeriod: toBN(schema.amountPerPeriod),
    cliff: toBN(isoToUnix(schema.startDt)),
    cliffAmount: toBN(schema.cliffAmount),
    cancelableBySender: schema.isCancelableBySender,
    cancelableByRecipient: schema.isCancelableByRecipient,
    automaticWithdrawal: schema.hasAutoClaim,
    transferableBySender: schema.isTransferableBySender,
    transferableByRecipient: schema.isTransferableByRecipient,
    canTopup: schema.canTopup,
    name: schema.name,
    withdrawFrequency: toBN(schema.autoClaimPeriod),
    isPda: schema.isPda,
    nonce: schema.nonce ? schema.nonce : 0,
    closed: schema.isClosed,
    currentPauseStart: toBN(0),
    pauseCumulative: toBN(schema.pauseCumulative),
    lastRateChangeTime: toBN(isoToUnix(schema.lastRateUpdateDt)),
    fundsUnlockedAtLastRateChange: toBN(schema.amountUnlockedAtLastRateUpdate),
    oldMetadata: PublicKey.default,
    payer,
    bump: schema.bump ? schema.bump : 0,
  };
}

function toPrecisionBN(value: string | number, precision = ALIGNED_PRECISION_FACTOR_POW): BN {
  return getBN(typeof value === "number" ? value : parseFloat(value), precision);
}

function toAlignedProxy(dynamic: DynamicContractSchema): AlignedUnlocksContract {
  const proxy = {
    sender: pk(dynamic.sender),
    minPrice: toPrecisionBN(dynamic.minPrice),
    maxPrice: toPrecisionBN(dynamic.maxPrice),
    minPercentage: toPrecisionBN(dynamic.minPercentage),
    maxPercentage: toPrecisionBN(dynamic.maxPercentage),
    priceOracleType: mapOracleType(dynamic.priceOracleType),
    priceOracle: dynamic.priceOracleAddress ? pk(dynamic.priceOracleAddress) : PublicKey.default,
    tickSize: toPrecisionBN(dynamic.tickSize),
    initialAmountPerPeriod: toBN(dynamic.initialAmountPerPeriod),
    initialPrice: toPrecisionBN(dynamic.initialPrice),
    lastPrice: toPrecisionBN(dynamic.lastPrice),
    lastAmountUpdateTime: toBN(isoToUnix(dynamic.expiryDt)),
    initialNetAmount: toBN(dynamic.initialAmount),
    expiryTime: toBN(isoToUnix(dynamic.expiryDt)),
    expiryPercentage: toPrecisionBN(dynamic.expiryPercentage),
    floorPrice: toPrecisionBN(dynamic.floorPrice),
    streamCanceledTime: dynamic.streamCanceledTime ? toBN(dynamic.streamCanceledTime) : toBN(0),
  };
  return proxy as unknown as AlignedUnlocksContract;
}

export const transformContract = async (schema: ContractSchema): Promise<Stream> => {
  const decodedStream = await toDecodedStream(schema);

  if (schema.dynamicContract) {
    const alignedProxy = toAlignedProxy(schema.dynamicContract);
    return new AlignedContract(decodedStream, alignedProxy);
  }

  return new Contract(decodedStream);
};
