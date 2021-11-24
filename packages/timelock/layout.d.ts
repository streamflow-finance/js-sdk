/// <reference types="node" />
/// <reference types="bn.js" />
import { PublicKey } from "@solana/web3.js";
import { BN } from "@project-serum/anchor";
export declare function decode(buf: Buffer): {
    magic: BN;
    created_at: BN;
    withdrawn_amount: BN;
    canceled_at: BN;
    cancellable_at: BN;
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
};
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
}
