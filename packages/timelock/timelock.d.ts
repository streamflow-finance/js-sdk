import { BN } from "@project-serum/anchor";
import { Wallet } from "@project-serum/anchor/src/provider";
import { Connection, Keypair, PublicKey, TransactionSignature } from "@solana/web3.js";
export default class Timelock {
    static create(connection: Connection, wallet: Wallet, newAcc: Keypair, recipient: PublicKey, mint: PublicKey, depositedAmount: BN, start: BN, end: BN, period: BN, cliff: BN, cliffAmount: BN): Promise<TransactionSignature>;
    static withdraw(connection: Connection, wallet: Wallet, stream: PublicKey, amount: BN): Promise<TransactionSignature>;
    static cancel(connection: Connection, wallet: Wallet, stream: PublicKey): Promise<TransactionSignature>;
    static transferRecipient(connection: Connection, wallet: Wallet, stream: PublicKey, newRecipient: PublicKey): Promise<TransactionSignature>;
}
