/// <reference types="node" />
import { PublicKey } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
export declare function decode(buf: Buffer): {
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
};
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
