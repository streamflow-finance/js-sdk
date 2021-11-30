/// <reference types="bn.js" />
import { Address, BN } from "@project-serum/anchor";
import { Wallet } from "@project-serum/anchor/src/provider";
import { Connection, Keypair, PublicKey, TransactionSignature } from "@solana/web3.js";
export default class Timelock {
    /**
     * Creates a new stream/vesting contract. All fees are paid by sender. (escrow metadata account rent, escrow token account, recipient's associated token account creation
     * @param {Connection} connection
     * @param {Wallet} wallet - Wallet signing the transaction.
     * @param {Address} timelockProgramId - Program ID of a timelock program on chain.
     * @param {Keypair} newAcc - New escrow account containing all of the stream/vesting contract metadata.
     * @param {PublicKey} recipient - Solana address of a recipient. Associated token account will be derived from this address and SPL Token mint address.
     * @param {PublicKey} mint - SPL Token mint.
     * @param {BN} depositedAmount - Initially deposited amount of tokens.
     * @param {BN} start - Timestamp (in seconds) when the tokens start vesting
     * @param {BN} end - Timestamp when all tokens are fully vested
     * @param {BN} period - Time step (period) in seconds per which the vesting occurs
     * @param {BN} cliff - Vesting contract "cliff" timestamp
     * @param {BN} cliffAmount - Amount unlocked at the "cliff" timestamp
     * @param {boolean} cancelable_by_sender - Can sender cancel stream
     * @param {boolean} cancelable_by_recipient - Can recepient cancel stream
     * @param {boolean} withdrawal_public - Whether or not a 3rd party can initiate withdraw in the name of recipient (currently not used, set to FALSE)
     * @param {boolean} transferable - Whether or not recipient can transfer the stream
     * @param {BN} releaseRate - Period rate in recurring payment
     * @param {String} streamName - Name or subject of the stream
     */
    static create(connection: Connection, wallet: Wallet, timelockProgramId: Address, newAcc: Keypair, recipient: PublicKey, mint: PublicKey, depositedAmount: BN, start: BN, end: BN, period: BN, cliff: BN, cliffAmount: BN, cancelable_by_sender: boolean, cancelable_by_recipient: boolean, withdrawal_public: boolean, transferable: boolean, release_rate: BN, stream_name: String): Promise<TransactionSignature>;
    /**
     * Attempts withdrawal from a specified stream.
     * @param {Connection} connection
     * @param {Wallet} wallet - Wallet signing the transaction. It's address should match current stream recipient or transaction will fail.
     * @param {Address} timelockProgramId - Program ID of a timelock program on chain.
     * @param {PublicKey} stream - Identifier of a stream (escrow account with metadata) to be withdrawn from.
     * @param {BN} amount - Requested amount to withdraw. If BN(0), program attempts to withdraw maximum available amount.
     */
    static withdraw(connection: Connection, wallet: Wallet, timelockProgramId: Address, stream: PublicKey, amount: BN): Promise<TransactionSignature>;
    /**
     * Attempts canceling the specified stream.
     * @param {Connection} connection
     * @param {Wallet} wallet - Wallet signing the transaction. It's address should match current stream sender or transaction will fail.
     * @param {Address} timelockProgramId - Program ID of a timelock program on chain.
     * @param {PublicKey} stream - Identifier of a stream (escrow account with metadata) to be canceled.
     */
    static cancel(connection: Connection, wallet: Wallet, timelockProgramId: Address, stream: PublicKey): Promise<TransactionSignature>;
    /**
     * Attempts changing the stream/vesting contract's recipient (effectively transferring the stream/vesting contract).
     * Potential associated token account rent fee (to make it rent-exempt) is paid by the transaction initiator (i.e. current recipient)
     * @param {Connection} connection
     * @param {Wallet} wallet - Wallet signing the transaction. It's address should match current stream recipient or transaction will fail.
     * @param {Address} timelockProgramId - Program ID of a timelock program on chain.
     * @param {PublicKey} stream - Identifier of a stream (escrow account with metadata) to be transferred.
     * @param {PublicKey} newRecipient - Address of a new stream/vesting contract recipient.
     */
    static transferRecipient(connection: Connection, wallet: Wallet, timelockProgramId: Address, stream: PublicKey, newRecipient: PublicKey): Promise<TransactionSignature>;
    /**
   * Tops up stream account deposited amount
   * @param {Connection} connection
   * @param {Wallet} wallet - Wallet signing the transaction. It's address should match current stream recipient or transaction will fail.
   * @param {Address} timelockProgramId - Program ID of a timelock program on chain.
   * @param {PublicKey} stream - Identifier of a stream (escrow account with metadata) to be transferred.
   * @param {BN} amount - Requested amount to withdraw. If BN(0), program attempts to withdraw maximum available amount.
   */
    static topup(connection: Connection, wallet: Wallet, timelockProgramId: Address, stream: PublicKey, amount: BN): Promise<TransactionSignature>;
}
