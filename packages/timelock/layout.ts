import BufferLayout from "buffer-layout";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";

const LE = "le"; //little endian
const instructionsFields = [
  BufferLayout.blob(8, "start_time"),
  BufferLayout.blob(8, "end_time"),
  BufferLayout.blob(8, "deposited_amount"),
  BufferLayout.blob(8, "total_amount"),
  BufferLayout.blob(8, "period"),
  BufferLayout.blob(8, "cliff"),
  BufferLayout.blob(8, "cliff_amount"),
];

const StreamInstructionLayout =
  BufferLayout.struct<StreamInstruction>(instructionsFields);

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
  };
}

const TokenStreamDataLayout = BufferLayout.struct<Stream>([
  BufferLayout.blob(8, "magic"),
  ...instructionsFields,
  BufferLayout.blob(8, "created_at"),
  BufferLayout.blob(8, "withdrawn"),
  BufferLayout.blob(8, "cancel_time"),
  BufferLayout.blob(32, "sender"),
  BufferLayout.blob(32, "sender_tokens"),
  BufferLayout.blob(32, "recipient"),
  BufferLayout.blob(32, "recipient_tokens"),
  BufferLayout.blob(32, "mint"),
  BufferLayout.blob(32, "escrow_tokens"),
]);

export function decode(buf: Buffer) {
  let raw = TokenStreamDataLayout.decode(buf);
  return {
    magic: new BN(raw.magic, LE),
    start_time: new BN(raw.start_time, LE),
    end_time: new BN(raw.end_time, LE),
    deposited_amount: new BN(raw.deposited_amount, LE),
    total_amount: new BN(raw.total_amount, LE),
    period: new BN(raw.period, LE),
    cliff: new BN(raw.cliff, LE),
    cliff_amount: new BN(raw.cliff_amount, LE),
    created_at: new BN(raw.created_at, LE),
    withdrawn: new BN(raw.withdrawn, LE),
    cancel_time: new BN(raw.cancel_time, LE),
    sender: new PublicKey(raw.sender),
    sender_tokens: new PublicKey(raw.sender_tokens),
    recipient: new PublicKey(raw.recipient),
    recipient_tokens: new PublicKey(raw.recipient_tokens),
    mint: new PublicKey(raw.mint),
    escrow_tokens: new PublicKey(raw.escrow_tokens),
  };
}

export interface StreamInstruction {
  start_time: BN;
  end_time: BN;
  deposited_amount: BN;
  total_amount: BN;
  period: BN;
  cliff: BN;
  cliff_amount: BN;
}

export interface Stream {
  magic: BN;
  start_time: BN;
  end_time: BN;
  deposited_amount: BN;
  total_amount: BN;
  period: BN;
  cliff: BN;
  cliff_amount: BN;
  created_at: BN;
  withdrawn: BN;
  cancel_time: BN;
  sender: PublicKey;
  sender_tokens: PublicKey;
  recipient: PublicKey;
  recipient_tokens: PublicKey;
  mint: PublicKey;
  escrow_tokens: PublicKey;
}
