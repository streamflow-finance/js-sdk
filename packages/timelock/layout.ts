import BufferLayout from "buffer-layout";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";

const LE = "le"; //little endian

const TokenStreamDataLayout = BufferLayout.struct<Stream>([
  BufferLayout.blob(8, "magic"),
  BufferLayout.blob(1, "version"),
  BufferLayout.blob(8, "created_at"),
  BufferLayout.blob(8, "withdrawn_amount"),
  BufferLayout.blob(8, "canceled_at"),
  BufferLayout.blob(8, "end_time"),
  BufferLayout.blob(8, "last_withdrawn_at"),
  BufferLayout.blob(32, "sender"),
  BufferLayout.blob(32, "sender_tokens"),
  BufferLayout.blob(32, "recipient"),
  BufferLayout.blob(32, "recipient_tokens"),
  BufferLayout.blob(32, "mint"),
  BufferLayout.blob(32, "escrow_tokens"),
  BufferLayout.blob(32, "streamflow_treasury"),
  BufferLayout.blob(32, "streamflow_treasury_tokens"),
  BufferLayout.blob(8, "streamflow_fee_total"),
  BufferLayout.blob(8, "streamflow_fee_withdrawn"),
  BufferLayout.blob(4, "streamflow_fee_percent"),
  BufferLayout.blob(32, "partner"),
  BufferLayout.blob(32, "partner_tokens"),
  BufferLayout.blob(8, "partner_fee_total"),
  BufferLayout.blob(8, "partner_fee_withdrawn"),
  BufferLayout.blob(4, "partner_fee_percent"),
  BufferLayout.blob(8, "start_time"),
  BufferLayout.blob(8, "net_deposited_amount"),
  BufferLayout.blob(8, "period"),
  BufferLayout.blob(8, "amount_per_period"),
  BufferLayout.blob(8, "cliff"),
  BufferLayout.blob(8, "cliff_amount"),
  BufferLayout.blob(1, "cancelable_by_sender"),
  BufferLayout.blob(1, "cancelable_by_recipient"),
  BufferLayout.blob(1, "automatic_withdrawal"),
  BufferLayout.blob(1, "transferable_by_sender"),
  BufferLayout.blob(1, "transferable_by_recipient"),
  BufferLayout.blob(1, "can_topup"),
  BufferLayout.utf8(200, "stream_name"), //  it is not NUL-terminated C string
]);

export function decode(buf: Buffer) {
  let raw = TokenStreamDataLayout.decode(buf);
  return {
    magic: new BN(raw.magic, LE),
    version: new BN(raw.version, LE),
    created_at: new BN(raw.created_at, LE),
    withdrawn_amount: new BN(raw.withdrawn_amount, LE),
    canceled_at: new BN(raw.canceled_at, LE),
    end_time: new BN(raw.end_time, LE),
    last_withdrawn_at: new BN(raw.last_withdrawn_at, LE),
    sender: new PublicKey(raw.sender),
    sender_tokens: new PublicKey(raw.sender_tokens),
    recipient: new PublicKey(raw.recipient),
    recipient_tokens: new PublicKey(raw.recipient_tokens),
    mint: new PublicKey(raw.mint),
    escrow_tokens: new PublicKey(raw.escrow_tokens),
    streamflow_treasury: new PublicKey(raw.streamflow_treasury),
    streamflow_treasury_tokens: new PublicKey(raw.streamflow_treasury_tokens),
    streamflow_fee_total: new BN(raw.streamflow_fee_total, LE),
    streamflow_fee_withdrawn: new BN(raw.streamflow_fee_withdrawn, LE),
    streamflow_fee_percent: new BN(raw.streamflow_fee_percent, LE),
    partner_fee_total: new BN(raw.partner_fee_total, LE),
    partner_fee_withdrawn: new BN(raw.partner_fee_withdrawn, LE),
    partner_fee_percent: new BN(raw.partner_fee_percent, LE),
    partner: new PublicKey(raw.partner),
    partner_tokens: new PublicKey(raw.partner_tokens),
    start_time: new BN(raw.start_time, LE),
    net_deposited_amount: new BN(raw.net_deposited_amount, LE),
    period: new BN(raw.period, LE),
    amount_per_period: new BN(raw.amount_per_period, LE),
    cliff: new BN(raw.cliff, LE),
    cliff_amount: new BN(raw.cliff_amount, LE),
    cancelable_by_sender: Boolean(raw.cancelable_by_sender).valueOf(),
    cancelable_by_recipient: Boolean(raw.cancelable_by_recipient).valueOf(),
    automatic_withdrawal: Boolean(raw.automatic_withdrawal).valueOf(),
    transferable_by_sender: Boolean(raw.transferable_by_sender).valueOf(),
    transferable_by_recipient: Boolean(raw.transferable_by_recipient).valueOf(),
    can_topup: Boolean(raw.can_topup).valueOf(),
    stream_name: String(raw.stream_name),
  };
}

export interface Stream {
  magic: BN;
  version: BN;
  created_at: BN;
  withdrawn_amount: BN;
  canceled_at: BN;
  end_time: BN;
  last_withdrawn_at: BN;
  sender: PublicKey;
  sender_tokens: PublicKey;
  recipient: PublicKey;
  recipient_tokens: PublicKey;
  mint: PublicKey;
  escrow_tokens: PublicKey;
  streamflow_treasury: PublicKey;
  streamflow_treasury_tokens: PublicKey;
  streamflow_fee_total: BN;
  streamflow_fee_withdrawn: BN;
  streamflow_fee_percent: BN;
  partner_fee_total: BN;
  partner_fee_withdrawn: BN;
  partner_fee_percent: BN;
  partner: PublicKey;
  partner_tokens: PublicKey;
  start_time: BN;
  end_time: BN;
  net_deposited_amount: BN;
  total_amount: BN;
  period: BN;
  cliff: BN;
  cliff_amount: BN;
  cancelable_by_sender: boolean;
  cancelable_by_recipient: boolean;
  automatic_withdrawal: boolean;
  transferable_by_sender: boolean;
  transferable_by_recipient: boolean;
  amount_per_period: BN;
  stream_name: string;
  can_topup: boolean;
}

export type StreamDirectionType = "outgoing" | "incoming" | "all";
export type StreamType = "stream" | "vesting" | "all"; //wutevs
