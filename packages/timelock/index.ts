import { BN, Idl, Program, Provider, web3 } from "@project-serum/anchor";
import { Wallet } from "@project-serum/anchor/src/provider";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionSignature,
} from "@solana/web3.js";
import type {
  Stream as StreamData,
  StreamDirectionType,
  StreamType,
  Account,
} from "./layout";
import { decode } from "./layout";
import idl from "./idl";

const TX_FINALITY_CONFIRMED = "confirmed";

const STREAM_STRUCT_OFFSET_SENDER = 49;
const STREAM_STRUCT_OFFSET_RECIPIENT = 113;

const PROGRAM_ID = idl.metadata.address;
const STREAMFLOW_TREASURY = new PublicKey(
  "Ht5G1RhkcKnpLVLMhqJc5aqZ4wYUEbxbtZwGCVbgU7DL"
);

function initProgram(connection: Connection, wallet: Wallet): Program {
  const provider = new Provider(connection, wallet, {});
  return new Program(idl as Idl, PROGRAM_ID, provider);
}

export default class Stream {
  /**
   * Creates a new stream/vesting contract. All fees are paid by sender. (escrow metadata account rent, escrow token account, recipient's associated token account creation)
   * @param {Connection} connection
   * @param {Wallet} sender - The sender's wallet.
   * @param {PublicKey} recipient - Solana address of a recipient. Associated token account will be derived from this address and SPL Token mint address.
   * @param {PublicKey | null} partner - Partner app or partner wallet.
   * @param {PublicKey} mint - SPL Token mint.
   * @param {BN} start - Timestamp (in seconds) when the tokens start vesting
   * @param {BN} depositedAmount - Initially deposited amount of tokens.
   * @param {BN} period - Time step (period) in seconds per which the vesting occurs
   * @param {BN} cliff - Vesting contract "cliff" timestamp
   * @param {BN} cliffAmount - Amount unlocked at the "cliff" timestamp
   * @param {BN} amountPerPeriod - Release rate
   * @param {string} name - Name/Subject
   * @param {boolean} canTopup - Specific for vesting contracts. TRUE for vesting contracts, FALSE for streams.
   * @param {boolean} cancelableBySender - Can sender cancel stream
   * @param {boolean} cancelableByRecipient - Can recipient cancel stream
   * @param {boolean} transferableBySender - Whether or not sender can transfer the stream
   * @param {boolean} transferableByRecipient - Whether or not recipient can transfer the stream
   * @param {boolean} automaticWithdrawal - Whether or not a 3rd party can initiate withdraw in the name of recipient (currently not used, set to FALSE)
   * @param {PublicKey | null} [partner = null] - Partner's wallet
   */
  static async create(
    connection: Connection,
    sender: Wallet,
    recipient: PublicKey,
    mint: PublicKey,
    start: BN,
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
    automaticWithdrawal: boolean,
    partner: PublicKey | null = null
  ): Promise<TransactionSignature> {
    const program = initProgram(connection, sender);

    const metadata = Keypair.generate();
    const [escrowTokens] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("strm"), metadata.publicKey.toBuffer()],
      program.programId
    );
    const senderTokens = await ata(mint, sender.publicKey);
    const recipientTokens = await ata(mint, recipient);
    const streamflowTreasuryTokens = await ata(mint, STREAMFLOW_TREASURY);
    const partnerTokens = await ata(mint, partner || STREAMFLOW_TREASURY);

    const signers = [metadata];

    return await program.rpc.create(
      // Order of the parameters must match the ones in program
      start,
      depositedAmount,
      period,
      amountPerPeriod,
      cliff,
      cliffAmount,
      cancelableBySender,
      cancelableByRecipient,
      automaticWithdrawal,
      transferableBySender,
      transferableByRecipient,
      canTopup,
      name,
      {
        accounts: {
          sender: sender.publicKey,
          senderTokens,
          recipient,
          metadata: metadata.publicKey,
          escrowTokens,
          recipientTokens,
          streamflowTreasury: STREAMFLOW_TREASURY,
          streamflowTreasuryTokens: streamflowTreasuryTokens,
          partner: partner || STREAMFLOW_TREASURY,
          partnerTokens: partnerTokens,
          mint,
          feeOracle: STREAMFLOW_TREASURY,
          rent: SYSVAR_RENT_PUBKEY,
          timelockProgram: program.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
        signers,
      }
    );
  }

  /**
   * Attempts withdrawal from a specified stream.
   * @param {Connection} connection
   * @param invoker
   * @param {PublicKey} stream - Identifier of a stream (escrow account with metadata) to be withdrawn from.
   * @param {BN} amount - Requested amount to withdraw. If BN(0), program attempts to withdraw maximum available amount.
   */
  static async withdraw(
    connection: Connection,
    invoker: Wallet,
    stream: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    const program = initProgram(connection, invoker);
    const escrow = await connection.getAccountInfo(stream);

    if (!escrow?.data) {
      throw new Error("Couldn't get account info");
    }

    const { mint, partner, recipient_tokens, escrow_tokens } = decode(
      escrow.data
    );

    const streamflowTreasuryTokens = await ata(mint, STREAMFLOW_TREASURY);
    const partnerTokens = await ata(mint, partner);

    return await program.rpc.withdraw(amount, {
      accounts: {
        authority: invoker.publicKey,
        recipient: invoker.publicKey,
        recipientTokens: recipient_tokens,
        metadata: stream,
        escrowTokens: escrow_tokens,
        streamflowTreasury: STREAMFLOW_TREASURY,
        streamflowTreasuryTokens,
        partner,
        partnerTokens,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });
  }

  /**
   * Attempts canceling the specified stream.
   * @param {Connection} connection
   * @param {Wallet} wallet - Wallet signing the transaction. It's address should match current stream sender or transaction will fail.
   * @param {PublicKey} stream - Identifier of a stream (escrow account with metadata) to be canceled.
   */
  static async cancel(
    connection: Connection,
    wallet: Wallet,
    stream: PublicKey
  ): Promise<TransactionSignature> {
    const program = initProgram(connection, wallet);
    let escrow_acc = await connection.getAccountInfo(stream);
    if (!escrow_acc?.data) {
      throw new Error("Couldn't get account info");
    }
    let data = decode(escrow_acc?.data);
    const { mint, partner } = data;

    const streamflowTreasuryTokens = await ata(data.mint, STREAMFLOW_TREASURY);
    const partnerTokens = await ata(mint, partner);

    return await program.rpc.cancel({
      accounts: {
        authority: wallet.publicKey,
        sender: data.sender,
        senderTokens: data.sender_tokens,
        recipient: data.recipient,
        recipientTokens: data.recipient_tokens,
        metadata: stream,
        escrowTokens: data.escrow_tokens,
        streamflowTreasury: STREAMFLOW_TREASURY,
        streamflowTreasuryTokens: streamflowTreasuryTokens,
        partner: partner,
        partnerTokens: partnerTokens,
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
   * @param {PublicKey} stream - Identifier of a stream (escrow account with metadata) to be transferred.
   * @param {PublicKey} newRecipient - Address of a new stream/vesting contract recipient.
   */
  static async transferRecipient(
    connection: Connection,
    wallet: Wallet,
    stream: PublicKey,
    newRecipient: PublicKey
  ): Promise<TransactionSignature> {
    const program = initProgram(connection, wallet);
    let escrow = await connection.getAccountInfo(stream);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info");
    }
    let data = decode(escrow?.data);

    const mint = data.mint;
    const newRecipientTokens = await ata(mint, newRecipient);

    return await program.rpc.transferRecipient({
      accounts: {
        authority: wallet.publicKey,
        newRecipient,
        newRecipientTokens,
        metadata: stream,
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
   * @param {Wallet} invoker - Wallet signing the transaction. It's address should match current stream recipient or transaction will fail.
   * @param {PublicKey} stream - Identifier of a stream (escrow account with metadata) to be transferred.
   * @param {BN} amount - Specified amount to topup (increases deposited amount).
   */
  static async topup(
    connection: Connection,
    invoker: Wallet,
    stream: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    const program = initProgram(connection, invoker);
    let escrow = await connection.getAccountInfo(stream);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info");
    }
    let data = decode(escrow?.data);

    const mint = data.mint;
    const streamflowTreasuryTokens = await ata(mint, STREAMFLOW_TREASURY);
    const partner = data.partner;
    const partnerTokens = await ata(data.mint, data.partner);

    return await program.rpc.topup(amount, {
      accounts: {
        sender: invoker.publicKey,
        senderTokens: data.sender_tokens,
        metadata: stream,
        escrowTokens: data.escrow_tokens,
        streamflowTreasury: STREAMFLOW_TREASURY,
        streamflowTreasuryTokens: streamflowTreasuryTokens,
        partner: partner,
        partnerTokens: partnerTokens,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });
  }

  /**
   * Get stream by ID
   * @param {Connection} connection
   * @param {PublicKey} streamID
   */
  static async getOne(
    connection: Connection,
    streamID: PublicKey
  ): Promise<StreamData> {
    const escrow = await connection.getAccountInfo(
      streamID,
      TX_FINALITY_CONFIRMED
    );
    if (!escrow?.data) {
      throw new Error("Couldn't get account info.");
    }

    return decode(escrow?.data);
  }

  /**
   * Get streams by providing direction (incoming, outgoing, all) and type (stream, vesting, all),
   * streams are sorted by start_time value in ascending order
   * @param {Connection} connection
   * @param {PublicKey} publicKey
   * @param {StreamType} type
   * @param {StreamDirectionType} direction
   */
  static async get(
    connection: Connection,
    publicKey: PublicKey,
    type: StreamType = "all",
    direction: StreamDirectionType = "all"
  ): Promise<[string, StreamData][]> {
    let accounts: Account[] = [];
    //todo: we need to be smart with our layout so we minimize rpc calls to the chain
    if (direction === "all") {
      const outgoingAccounts = await getProgramAccounts(
        connection,
        publicKey,
        STREAM_STRUCT_OFFSET_SENDER
      );
      const incomingAccounts = await getProgramAccounts(
        connection,
        publicKey,
        STREAM_STRUCT_OFFSET_RECIPIENT
      );
      accounts = [...outgoingAccounts, ...incomingAccounts];
    } else {
      const offset =
        direction === "outgoing"
          ? STREAM_STRUCT_OFFSET_SENDER
          : STREAM_STRUCT_OFFSET_RECIPIENT;
      accounts = await getProgramAccounts(connection, publicKey, offset);
    }

    let streams: { [s: string]: StreamData } = {};
    accounts.forEach((account) => {
      const decoded = decode(account.account.data);
      streams = { ...streams, [account.pubkey.toBase58()]: decoded };
    });

    const sortedStreams = Object.entries(streams).sort(
      ([, stream1], [, stream2]) =>
        stream2.start_time.toNumber() - stream1.start_time.toNumber()
    );

    if (type === "all") return sortedStreams;

    return type === "stream"
      ? sortedStreams.filter((stream) => stream[1].can_topup)
      : sortedStreams.filter((stream) => !stream[1].can_topup);
  }
}

/**
 * Get Program Accounts
 * @param {Connection} connection
 * @param {PublicKey} publicKey
 * @param {number} offset
 */
async function getProgramAccounts(
  connection: Connection,
  publicKey: PublicKey,
  offset: number
): Promise<Account[]> {
  return connection?.getProgramAccounts(new PublicKey(PROGRAM_ID), {
    filters: [
      {
        memcmp: {
          offset,
          bytes: publicKey.toBase58(),
        },
      },
    ],
  });
}

async function ata(mint: PublicKey, account: PublicKey) {
  return await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    account
  );
}
