import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import { streamLayout } from "./layout";
import { Stream, DecodedStream } from "./types";

var decoder = new TextDecoder("utf-8");
const LE = "le"; //little endian

export const decodeStream = (buf: Buffer): DecodedStream => {
  let raw = streamLayout.decode(buf);

  return {
    magic: new BN(raw.magic, LE),
    version: new BN(raw.version, LE),
    createdAt: new BN(raw.created_at, LE),
    withdrawnAmount: new BN(raw.withdrawn_amount, LE),
    canceledAt: new BN(raw.canceled_at, LE),
    end: new BN(raw.end_time, LE),
    lastWithdrawnAt: new BN(raw.last_withdrawn_at, LE),
    sender: new PublicKey(raw.sender),
    senderTokens: new PublicKey(raw.sender_tokens),
    recipient: new PublicKey(raw.recipient),
    recipientTokens: new PublicKey(raw.recipient_tokens),
    mint: new PublicKey(raw.mint),
    escrowTokens: new PublicKey(raw.escrow_tokens),
    streamflowTreasury: new PublicKey(raw.streamflow_treasury),
    streamflowTreasuryTokens: new PublicKey(raw.streamflow_treasury_tokens),
    streamflowFeeTotal: new BN(raw.streamflow_fee_total, LE),
    streamflowFeeWithdrawn: new BN(raw.streamflow_fee_withdrawn, LE),
    streamflowFeePercent: new BN(raw.streamflow_fee_percent, LE),
    partnerFeeTotal: new BN(raw.partner_fee_total, LE),
    partnerFeeWithdrawn: new BN(raw.partner_fee_withdrawn, LE),
    partnerFeePercent: new BN(raw.partner_fee_percent, LE),
    partner: new PublicKey(raw.partner),
    partnerTokens: new PublicKey(raw.partner_tokens),
    start: new BN(raw.start_time, LE),
    depositedAmount: new BN(raw.net_amount_deposited, LE),
    period: new BN(raw.period, LE),
    amountPerPeriod: new BN(raw.amount_per_period, LE),
    cliff: new BN(raw.cliff, LE),
    cliffAmount: new BN(raw.cliff_amount, LE),
    cancelableBySender: Boolean(raw.cancelable_by_sender),
    cancelableByRecipient: Boolean(raw.cancelable_by_recipient),
    automaticWithdrawal: Boolean(raw.automatic_withdrawal),
    transferableBySender: Boolean(raw.transferable_by_sender),
    transferableByRecipient: Boolean(raw.transferable_by_recipient),
    canTopup: Boolean(raw.can_topup),
    name: decoder.decode(raw.stream_name),
    withdrawFrequency: new BN(raw.withdraw_frequency, LE),
  };
};
// DeprecationWarning: This object will be deprecated starting from the version 4.0.0. Use
// types/Contract instead
export const formatDecodedStream = (stream: DecodedStream): Stream  => {
  const resp = {
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
  withdrawalFrequency: stream.withdrawFrequency.toNumber(),
    unlocked: function () { return 0 }, //phantom method to preserve partial support of this object
    withdrawn: function() { return new BN(0) } //phantom method to preserve partial support of this object
  }
  return resp
}


/**
 * Used for conversion of token amounts to their Big Number representation.
 * Get Big Number representation in the smallest units from the same value in the highest units.
 * @param {number} value - Number of tokens you want to convert to its BN representation.
 * @param {number} decimals - Number of decimals the token has.
 */
export const getBN = (value: number, decimals: number): BN =>
  value > (2 ** 53 - 1) / 10 ** decimals
    ? new BN(value).mul(new BN(10 ** decimals))
    : new BN(value * 10 ** decimals);

/**
 * Used for token amounts conversion from their Big Number representation to number.
 * Get value in the highest units from BN representation of the same value in the smallest units.
 * @param {BN} value - Big Number representation of value in the smallest units.
 * @param {number} decimals - Number of decimals the token has.
 */
export const getNumberFromBN = (value: BN, decimals: number): number =>
  value.gt(new BN(2 ** 53 - 1))
    ? value.div(new BN(10 ** decimals)).toNumber()
    : value.toNumber() / 10 ** decimals;
