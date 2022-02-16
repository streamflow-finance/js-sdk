import { PublicKey } from "@solana/web3.js";
import { u64 } from "@solana/spl-token";

import { streamLayout } from "./layout";
import { Stream, DecodedStream } from "./types";

var decoder = new TextDecoder("utf-8");
const LE = "le"; //little endian

export const decodeStream = (buf: Buffer): DecodedStream => {
  let raw = streamLayout.decode(buf);

  return {
    magic: new u64(raw.magic, LE),
    version: new u64(raw.version, LE),
    createdAt: new u64(raw.created_at, LE),
    withdrawnAmount: new u64(raw.withdrawn_amount, LE),
    canceledAt: new u64(raw.canceled_at, LE),
    end: new u64(raw.end_time, LE),
    lastWithdrawnAt: new u64(raw.last_withdrawn_at, LE),
    sender: new PublicKey(raw.sender),
    senderTokens: new PublicKey(raw.sender_tokens),
    recipient: new PublicKey(raw.recipient),
    recipientTokens: new PublicKey(raw.recipient_tokens),
    mint: new PublicKey(raw.mint),
    escrowTokens: new PublicKey(raw.escrow_tokens),
    streamflowTreasury: new PublicKey(raw.streamflow_treasury),
    streamflowTreasuryTokens: new PublicKey(raw.streamflow_treasury_tokens),
    streamflowFeeTotal: new u64(raw.streamflow_fee_total, LE),
    streamflowFeeWithdrawn: new u64(raw.streamflow_fee_withdrawn, LE),
    streamflowFeePercent: new u64(raw.streamflow_fee_percent, LE),
    partnerFeeTotal: new u64(raw.partner_fee_total, LE),
    partnerFeeWithdrawn: new u64(raw.partner_fee_withdrawn, LE),
    partnerFeePercent: new u64(raw.partner_fee_percent, LE),
    partner: new PublicKey(raw.partner),
    partnerTokens: new PublicKey(raw.partner_tokens),
    start: new u64(raw.start_time, LE),
    depositedAmount: new u64(raw.net_amount_deposited, LE),
    period: new u64(raw.period, LE),
    amountPerPeriod: new u64(raw.amount_per_period, LE),
    cliff: new u64(raw.cliff, LE),
    cliffAmount: new u64(raw.cliff_amount, LE),
    cancelableBySender: Boolean(raw.cancelable_by_sender),
    cancelableByRecipient: Boolean(raw.cancelable_by_recipient),
    automaticWithdrawal: Boolean(raw.automatic_withdrawal),
    transferableBySender: Boolean(raw.transferable_by_sender),
    transferableByRecipient: Boolean(raw.transferable_by_recipient),
    canTopup: Boolean(raw.can_topup),
    name: decoder.decode(raw.stream_name),
    withdrawFrequency: new u64(raw.withdraw_frequency, LE),
  };
};

export const formatDecodedStream = (stream: DecodedStream): Stream => ({
  magic: stream.magic.toNumber(),
  version: stream.version.toNumber(),
  createdAt: stream.createdAt.toNumber(),
  withdrawnAmount: stream.withdrawnAmount,
  canceledAt: stream.canceledAt.toNumber(),
  end: stream.end.toNumber(),
  lastWithdrawnAt: stream.lastWithdrawnAt.toNumber(),
  sender: stream.sender.toBase58(),
  senderTokens: stream.senderTokens.toBase58(),
  recipient: stream.recipient.toBase58(),
  recipientTokens: stream.recipientTokens.toBase58(),
  mint: stream.mint.toBase58(),
  escrowTokens: stream.escrowTokens.toBase58(),
  streamflowTreasury: stream.streamflowTreasury.toBase58(),
  streamflowTreasuryTokens: stream.streamflowTreasuryTokens.toBase58(),
  streamflowFeeTotal: stream.streamflowFeeTotal,
  streamflowFeeWithdrawn: stream.streamflowFeeWithdrawn,
  streamflowFeePercent: stream.streamflowFeePercent.toNumber(),
  partnerFeeTotal: stream.partnerFeeTotal,
  partnerFeeWithdrawn: stream.partnerFeeWithdrawn,
  partnerFeePercent: stream.partnerFeePercent.toNumber(),
  partner: stream.partner.toBase58(),
  partnerTokens: stream.partnerTokens?.toBase58(),
  start: stream.start.toNumber(),
  depositedAmount: stream.depositedAmount,
  period: stream.period.toNumber(),
  amountPerPeriod: stream.amountPerPeriod,
  cliff: stream.cliff.toNumber(),
  cliffAmount: stream.cliffAmount,
  cancelableBySender: stream.cancelableBySender,
  cancelableByRecipient: stream.cancelableByRecipient,
  automaticWithdrawal: stream.automaticWithdrawal,
  transferableBySender: stream.transferableBySender,
  transferableByRecipient: stream.transferableByRecipient,
  canTopup: stream.canTopup,
  name: stream.name,
  withdrawFrequency: stream.withdrawFrequency.toNumber(),
});

/**
 * Used for conversion of token amounts to their Big Number representation.
 * Get Big Number representation in the smallest units from the same value in the highest units.
 * @param {number} value - Number of tokens you want to convert to its u64 representation.
 * @param {number} decimals - Number of decimals the token has.
 */
export const getBN = (value: number, decimals: number): u64 =>
  value > (2 ** 53 - 1) / 10 ** decimals
    ? new u64(value).mul(new u64(10 ** decimals))
    : new u64(value * 10 ** decimals);

/**
 * Used for token amounts conversion from their Big Number representation to number.
 * Get value in the highest units from u64 representation of the same value in the smallest units.
 * @param {u64} value - Big Number representation of value in the smallest units.
 * @param {number} decimals - Number of decimals the token has.
 */
export const getNumberFromBN = (value: u64, decimals: number): number =>
  value.gt(new u64(2 ** 53 - 1))
    ? value.div(new u64(10 ** decimals)).toNumber()
    : value.toNumber() / 10 ** decimals;
