import BufferLayout from "buffer-layout";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";

const LE = "le"; //little endian

const StreamInstructionLayout = BufferLayout.struct<StreamInstruction>([
  BufferLayout.blob(8, "start_time"),
  BufferLayout.blob(8, "end_time"),
  BufferLayout.blob(8, "deposited_amount"),
  BufferLayout.blob(8, "total_amount"),
  BufferLayout.blob(8, "period"),
  BufferLayout.blob(8, "cliff"),
  BufferLayout.blob(8, "cliff_amount"),
  BufferLayout.blob(1, "cancelable_by_sender"),
  BufferLayout.blob(1, "cancelable_by_recipient"),
  BufferLayout.blob(1, "withdrawal_public"),
  BufferLayout.blob(1, "transferable"),
  BufferLayout.blob(4, "release_rate"),
  BufferLayout.utf8(60, "stream_name"),  //  NUL-terminated C string
]);

function decode_stream_instruction(buf: Buffer) {
  let raw = StreamInstructionLayout.decode(buf);
  return {
    start_time: new BN(raw.start_time, LE),
    end_time: new BN(raw.end_time, LE),
    deposited_amount: new BN(raw.deposited_amount, LE),
    total_amount: new BN(raw.total_amount, LE),
    period: new BN(raw.period, LE),
    cliff: new BN(raw.cliff, LE),
    cliff_amount: new BN(raw.cliff_amount, LE),
    cancelable_by_sender: new BN(raw.cancelable_by_sender, LE),
    cancelable_by_recipient: new BN(raw.cancelable_by_recipient, LE),
    withdrawal_public: new BN(raw.withdrawal_public, LE),
    transferable: new BN(raw.transferable, LE),
    release_rate: new BN(raw.release_rate, LE),
    stream_name: new String(raw.stream_name),
  };
}

interface StreamInstruction {
  start_time: BN;
  end_time: BN;
  deposited_amount: BN;
  total_amount: BN;
  period: BN;
  cliff: BN;
  cliff_amount: BN;
  cancelable_by_sender: BN;
  cancelable_by_recipient: BN;
  withdrawal_public: BN;
  transferable: BN;
  release_rate: BN;
  stream_name: string;
}

const TokenStreamDataLayout = BufferLayout.struct<TokenStreamData>([
  BufferLayout.blob(8, "magic"),
  BufferLayout.blob(8, "created_at"),
  BufferLayout.blob(8, "withdrawn_amount"),
  BufferLayout.blob(8, "canceled_at"),
  BufferLayout.blob(8, "closable_at"),
  BufferLayout.blob(8, "last_withdrawn_at"),
  BufferLayout.blob(32, "sender"),
  BufferLayout.blob(32, "sender_tokens"),
  BufferLayout.blob(32, "recipient"),
  BufferLayout.blob(32, "recipient_tokens"),
  BufferLayout.blob(32, "mint"),
  BufferLayout.blob(32, "escrow_tokens"),
  BufferLayout.blob(8, "start_time"),
  BufferLayout.blob(8, "end_time"),
  BufferLayout.blob(8, "deposited_amount"),
  BufferLayout.blob(8, "total_amount"),
  BufferLayout.blob(8, "period"),
  BufferLayout.blob(8, "cliff"),
  BufferLayout.blob(8, "cliff_amount"),
  BufferLayout.blob(1, "cancelable_by_sender"),
  BufferLayout.blob(1, "cancelable_by_recipient"),
  BufferLayout.blob(1, "withdrawal_public"),
  BufferLayout.blob(1, "transferable"),
  BufferLayout.blob(8, "release_rate"),
  BufferLayout.utf8(60, "stream_name"),  //  it is not NUL-terminated C string
]);

export function decode(buf: Buffer) {
  let raw = TokenStreamDataLayout.decode(buf);
  return {
    magic: new BN(raw.magic, LE),
    created_at: new BN(raw.created_at, LE),
    withdrawn_amount: new BN(raw.withdrawn_amount, LE),
    canceled_at: new BN(raw.canceled_at, LE),
    cancellable_at: new BN(raw.closable_at, LE),
    last_withdrawn_at: new BN(raw.last_withdrawn_at, LE),
    sender: new PublicKey(raw.sender),
    sender_tokens: new PublicKey(raw.sender_tokens),
    recipient: new PublicKey(raw.recipient),
    recipient_tokens: new PublicKey(raw.recipient_tokens),
    mint: new PublicKey(raw.mint),
    escrow_tokens: new PublicKey(raw.escrow_tokens),
    start_time: new BN(raw.start_time, LE),
    end_time: new BN(raw.end_time, LE),
    deposited_amount: new BN(raw.deposited_amount, LE),
    total_amount: new BN(raw.total_amount, LE),
    period: new BN(raw.period, LE),
    cliff: new BN(raw.cliff, LE),
    cliff_amount: new BN(raw.cliff_amount, LE),
    cancelable_by_sender: new BN(raw.cancelable_by_sender, LE),
    cancelable_by_recipient: new BN(raw.cancelable_by_recipient, LE),
    withdrawal_public: new BN(raw.withdrawal_public, LE),
    transferable: new BN(raw.transferable, LE),
    release_rate: new BN(raw.release_rate, LE),
    stream_name: new String(raw.stream_name),
  };
}

export interface TokenStreamData {
  magic: BN;
  created_at: BN;
  withdrawn_amount: BN;
  canceled_at: BN;
  closable_at: BN;
  last_withdrawn_at: BN;
  sender: PublicKey;
  sender_tokens: PublicKey;
  recipient: PublicKey;
  recipient_tokens: PublicKey;
  mint: PublicKey;
  escrow_tokens: PublicKey;
  start_time: BN;
  end_time: BN;
  deposited_amount: BN;
  total_amount: BN;
  period: BN;
  cliff: BN;
  cliff_amount: BN;
  cancelable_by_sender: BN;
  cancelable_by_recipient: BN;
  withdrawal_public: BN;
  transferable: BN;
  release_rate: BN;
  stream_name: string;
}
