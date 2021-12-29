import {
  Address,
  BN,
  Idl,
  Program,
  Provider,
  web3,
} from "@project-serum/anchor";
import { Wallet } from "@project-serum/anchor/src/provider";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionSignature,
  Keypair,
} from "@solana/web3.js";
import idl from "./idl";
import { decode } from "./layout";
import type { Stream as StreamData, AccountsType } from "./layout";

function initProgram(
  connection: Connection,
  wallet: Wallet,
  programId: Address
): Program {
  const provider = new Provider(connection, wallet, {});
  return new Program(idl as Idl, programId, provider);
}

export const TIMELOCK_STRUCT_OFFSET_SENDER = 48;
export const TIMELOCK_STRUCT_OFFSET_RECIPIENT = 112;

export default class Stream {
  /**
   * Creates a new stream/vesting contract. All fees are paid by sender. (escrow metadata account rent, escrow token account, recipient's associated token account creation)
   * @param {Connection} connection
   * @param {Wallet} sender - Wallet signing the transaction.
   * @param {Address} programId - Timelock program ID on chain.
   * @param {PublicKey} recipient - Solana address of a recipient. Associated token account will be derived from this address and SPL Token mint address.
   * @param {PublicKey | null} partner - Partner app or partner wallet.
   * @param {PublicKey} mint - SPL Token mint.
   * @param {BN} start - Timestamp (in seconds) when the tokens start vesting
   * @param {BN} end - Timestamp when all tokens are fully vested
   * @param {BN} depositedAmount - Initially deposited amount of tokens.
   * @param {BN} period - Time step (period) in seconds per which the vesting occurs
   * @param {BN} cliff - Vesting contract "cliff" timestamp
   * @param {BN} cliffAmount - Amount unlocked at the "cliff" timestamp
   * @param {BN} amountPerPeriod - Release rate
   * @param {string} name - Name/Subject
   * @param {boolean} canTopup - Specific for vesting contracts. TRUE for vesting contracts, FALSE for streams.
   * @param {boolean} cancelableBySender - Can sender cancel stream
   * @param {boolean} cancelableByRecipient - Can recepient cancel stream
   * @param {boolean} transferableBySender - Whether or not sender can transfer the stream
   * @param {boolean} transferableByRecipient - Whether or not recipient can transfer the stream
   * @param {boolean} automaticWithdrawal - Whether or not a 3rd party can initiate withdraw in the name of recipient (currently not used, set to FALSE)
   */
  static async create(
    connection: Connection,
    sender: Wallet,
    programId: Address,
    recipient: PublicKey,
    partner: PublicKey | null,
    mint: PublicKey,
    start: BN,
    end: BN,
    depositedAmount: BN,
    period: BN,
    cliff: BN,
    cliffAmount: BN,
    amountPerPeriod: BN,
    name: string,
    canTopup: boolean,
    cancelableBySender: boolean,
    cancelableByRecipient: boolean,
    transferableBySender: boolean,
    transferableByRecipient: boolean,
    automaticWithdrawal: boolean
  ): Promise<TransactionSignature> {
    const program = initProgram(connection, sender, programId);
    const metadata = Keypair.generate();
    const [escrowTokens] = await web3.PublicKey.findProgramAddress(
      [metadata.publicKey.toBuffer()],
      program.programId
    );
    let senderTokens = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      sender.publicKey
    );
    let signers = [metadata];
    let instructions = undefined;

    const recipientTokens = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      recipient
    );

    return await program.rpc.create(
      // Order of the parameters must match the ones in program
      start,
      end,
      depositedAmount,
      depositedAmount,
      period,
      cliff,
      cliffAmount,
      cancelableBySender,
      cancelableByRecipient,
      automaticWithdrawal,
      transferableBySender,
      transferableByRecipient,
      amountPerPeriod,
      name,
      {
        accounts: {
          sender: sender.publicKey,
          senderTokens,
          recipient,
          recipientTokens,
          metadata: metadata.publicKey,
          escrowTokens,
          mint,
          rent: SYSVAR_RENT_PUBKEY,
          timelockProgram: program.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        },
        signers,
        instructions,
      }
    );
  }

  /**
   * Attempts withdrawal from a specified stream.
   * @param {Connection} connection
   * @param {Wallet} wallet - Wallet signing the transaction. It's address should match current stream recipient or transaction will fail.
   * @param {Address} timelockProgramId - Program ID of a timelock program on chain.
   * @param {PublicKey} stream - Identifier of a stream (escrow account with metadata) to be withdrawn from.
   * @param {BN} amount - Requested amount to withdraw. If BN(0), program attempts to withdraw maximum available amount.
   */
  static async withdraw(
    connection: Connection,
    invoker: Wallet,
    programId: Address,
    stream: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    const program = initProgram(connection, invoker, programId);
    const escrow = await connection.getAccountInfo(stream);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info");
    }
    const data = decode(escrow.data);

    return await program.rpc.withdraw(amount, {
      accounts: {
        withdrawAuthority: invoker.publicKey,
        sender: data.sender,
        recipient: invoker.publicKey,
        recipientTokens: data.recipient_tokens,
        metadata: stream,
        escrowTokens: data.escrow_tokens,
        mint: data.mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });
  }

  /**
   * Attempts canceling the specified stream.
   * @param {Connection} connection
   * @param {Wallet} wallet - Wallet signing the transaction. It's address should match current stream sender or transaction will fail.
   * @param {Address} timelockProgramId - Program ID of a timelock program on chain.
   * @param {PublicKey} stream - Identifier of a stream (escrow account with metadata) to be canceled.
   */
  static async cancel(
    connection: Connection,
    wallet: Wallet,
    programId: Address,
    stream: PublicKey
  ): Promise<TransactionSignature> {
    const program = initProgram(connection, wallet, programId);
    let escrow_acc = await connection.getAccountInfo(stream);
    if (!escrow_acc?.data) {
      throw new Error("Couldn't get account info");
    }
    let data = decode(escrow_acc?.data);

    return await program.rpc.cancel({
      accounts: {
        cancelAuthority: wallet.publicKey,
        sender: wallet.publicKey,
        senderTokens: data.sender_tokens,
        recipient: data.recipient,
        recipientTokens: data.recipient_tokens,
        metadata: stream,
        escrowTokens: data.escrow_tokens,
        mint: data.mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });
  }

  /**
   * Attempts changing the stream/vesting contract's recipient (effectively transferring the stream/vesting contract).
   * Potential associated token account rent fee (to make it rent-exempt) is paid by the transaction initiator (i.e. current recipient)
   * @param {Connection} connection
   * @param {Wallet} wallet - Wallet signing the transaction. It's address should match authorized wallet (sender or recipient) or transaction will fail.
   * @param {Address} timelockProgramId - Program ID of a timelock program on chain.
   * @param {PublicKey} stream - Identifier of a stream (escrow account with metadata) to be transferred.
   * @param {PublicKey} newRecipient - Address of a new stream/vesting contract recipient.
   */
  static async transferRecipient(
    connection: Connection,
    wallet: Wallet,
    programId: Address,
    stream: PublicKey,
    newRecipient: PublicKey
  ): Promise<TransactionSignature> {
    const program = initProgram(connection, wallet, programId);
    let escrow = await connection.getAccountInfo(stream);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info");
    }
    let data = decode(escrow?.data);

    const mint = data.mint;
    const newRecipientTokens = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      newRecipient
    );

    return await program.rpc.transferRecipient({
      accounts: {
        existingRecipient: wallet.publicKey,
        newRecipient,
        newRecipientTokens,
        metadata: stream,
        escrowTokens: data.escrow_tokens,
        mint,
        rent: SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        system: web3.SystemProgram.programId,
      },
    });
  }

  /**
   * Tops up stream account deposited amount
   * @param {Connection} connection
   * @param {Wallet} wallet - Wallet signing the transaction. It's address should match current stream recipient or transaction will fail.
   * @param {Address} timelockProgramId - Program ID of a timelock program on chain.
   * @param {PublicKey} stream - Identifier of a stream (escrow account with metadata) to be transferred.
   * @param {BN} amount - Specified amount to topup (increases deposited amount).
   */
  static async topup(
    connection: Connection,
    invoker: Wallet,
    programId: Address,
    stream: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    const program = initProgram(connection, invoker, programId);
    let escrow = await connection.getAccountInfo(stream);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info");
    }
    let data = decode(escrow?.data);

    const mint = data.mint;

    return await program.rpc.topup(amount, {
      accounts: {
        sender: invoker.publicKey,
        senderTokens: data.sender_tokens,
        metadata: stream,
        escrowTokens: data.escrow_tokens,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });
  }

  /**
   * Get stream by ID
   * @param {Connection} connection
   * @param {Wallet} wallet
   * @param {PublicKey} streamID
   */
  static async getOne(
    connection: Connection,
    streamID: PublicKey
  ): Promise<StreamData> {
    const escrow = await connection.getAccountInfo(streamID);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info.");
    }

    return decode(escrow?.data);
  }

  /**
   * Get streams
   * @param {Connection} connection
   * @param {Address} programID
   * @param {Wallet} wallet
   * @param {AccountsType}type
   */
  static async get(
    connection: Connection,
    programId: Address,
    wallet: Wallet,
    type: AccountsType
  ): Promise<{ [s: string]: StreamData }> {
    const offset =
      type === "sender"
        ? TIMELOCK_STRUCT_OFFSET_SENDER
        : TIMELOCK_STRUCT_OFFSET_RECIPIENT;

    const accounts = await connection?.getProgramAccounts(
      new PublicKey(programId),
      {
        filters: [
          {
            memcmp: {
              offset,
              bytes: wallet.publicKey?.toBase58(),
            },
          },
        ],
      }
    );

    let transactions = {};
    accounts.forEach((account) => {
      const decoded = decode(account.account.data);
      transactions = { ...transactions, [account.pubkey.toBase58()]: decoded };
    });

    return transactions;
  }
}
