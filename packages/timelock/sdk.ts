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
} from "@solana/web3.js";

import {
  Stream as StreamData,
  StreamDirection,
  StreamType,
  Account,
  CreateStreamParams,
  WithdrawStreamParams,
  TopupStreamParams,
  CancelStreamParams,
  TransferStreamParams,
  ClusterExtended,
  Cluster,
  GetStreamParams,
  GetStreamsParams,
  CreateStreamResponse,
  TransactionResponse,
} from "./types";
import { decodeStream, formatDecodedStream } from "./utils";
import {
  PROGRAM_ID,
  STREAMFLOW_TREASURY_PUBLIC_KEY,
  STREAM_STRUCT_OFFSET_RECIPIENT,
  STREAM_STRUCT_OFFSET_SENDER,
  TX_FINALITY_CONFIRMED,
} from "./constants";
import idl from "./idl";

const encoder = new TextEncoder();

const initProgram = (
  connection: Connection,
  wallet: Wallet,
  cluster: ClusterExtended
): Program => {
  const provider = new Provider(connection, wallet, {});
  return new Program(idl as Idl, PROGRAM_ID[cluster], provider);
};

export default class Stream {
  /**
   * Creates a new stream/vesting contract.
   * All fees are paid by sender. (escrow metadata account rent, escrow token account, recipient's associated token account creation)
   * @param {CreateStreamParams} data
   */
  static async create({
    connection,
    sender,
    recipient,
    mint,
    start,
    depositedAmount,
    period,
    cliff,
    cliffAmount,
    amountPerPeriod,
    name,
    canTopup,
    cancelableBySender,
    cancelableByRecipient,
    transferableBySender,
    transferableByRecipient,
    automaticWithdrawal,
    partner,
    cluster = Cluster.Mainnet,
  }: CreateStreamParams): Promise<CreateStreamResponse> {
    const program = initProgram(connection, sender, cluster);
    const mintPublicKey = new PublicKey(mint);
    const recipientPublicKey = new PublicKey(recipient);

    const metadata = Keypair.generate();
    const [escrowTokens] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("strm"), metadata.publicKey.toBuffer()],
      program.programId
    );
    const senderTokens = await ata(mintPublicKey, sender.publicKey);
    const recipientTokens = await ata(mintPublicKey, recipientPublicKey);
    const streamflowTreasuryTokens = await ata(
      mintPublicKey,
      STREAMFLOW_TREASURY_PUBLIC_KEY
    );
    const partnerTokens = await ata(
      mintPublicKey,
      partner ? new PublicKey(partner) : STREAMFLOW_TREASURY_PUBLIC_KEY
    );

    const signers = [metadata];

    const nameUtf8EncodedBytes: BN[] = formatStringToBytesArray(encoder, name);

    const tx = await program.rpc.create(
      // Order of the parameters must match the ones in the program
      new BN(start),
      new BN(depositedAmount),
      new BN(period),
      new BN(amountPerPeriod),
      new BN(cliff),
      new BN(cliffAmount),
      cancelableBySender,
      cancelableByRecipient,
      automaticWithdrawal,
      transferableBySender,
      transferableByRecipient,
      canTopup,
      nameUtf8EncodedBytes,
      {
        accounts: {
          sender: sender.publicKey,
          senderTokens,
          recipient,
          metadata: metadata.publicKey,
          escrowTokens,
          recipientTokens,
          streamflowTreasury: STREAMFLOW_TREASURY_PUBLIC_KEY,
          streamflowTreasuryTokens: streamflowTreasuryTokens,
          partner: partner || STREAMFLOW_TREASURY_PUBLIC_KEY,
          partnerTokens: partnerTokens,
          mint,
          feeOracle: STREAMFLOW_TREASURY_PUBLIC_KEY,
          rent: SYSVAR_RENT_PUBKEY,
          timelockProgram: program.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
        signers,
      }
    );

    const stream = await this.getOne({
      connection,
      id: metadata.publicKey.toBase58(),
    });

    return { tx, id: metadata.publicKey.toBase58(), data: stream };
  }

  /**
   * Attempts withdrawal from a specified stream.
   * @param {WithdrawStreamParams} data
   */
  static async withdraw({
    connection,
    invoker,
    id,
    amount,
    cluster = Cluster.Mainnet,
  }: WithdrawStreamParams): Promise<TransactionResponse> {
    const program = initProgram(connection, invoker, cluster);
    const streamPublicKey = new PublicKey(id);
    const escrow = await connection.getAccountInfo(streamPublicKey);

    if (!escrow?.data) {
      throw new Error("Couldn't get account info");
    }

    const data = decodeStream(escrow.data);

    const streamflowTreasuryTokens = await ata(
      data.mint,
      STREAMFLOW_TREASURY_PUBLIC_KEY
    );
    const partnerTokens = await ata(data.mint, data.partner);

    const tx = await program.rpc.withdraw(new BN(amount), {
      accounts: {
        authority: invoker.publicKey,
        recipient: invoker.publicKey,
        recipientTokens: data.recipientTokens,
        metadata: streamPublicKey,
        escrowTokens: data.escrowTokens,
        streamflowTreasury: STREAMFLOW_TREASURY_PUBLIC_KEY,
        streamflowTreasuryTokens,
        partner: data.partner,
        partnerTokens,
        mint: data.mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });

    return { tx };
  }

  /**
   * Attempts canceling the specified stream.
   * @param {CancelStreamParams} data
   */
  static async cancel({
    connection,
    invoker,
    id,
    cluster = Cluster.Mainnet,
  }: CancelStreamParams): Promise<TransactionResponse> {
    const program = initProgram(connection, invoker, cluster);
    const streamPublicKey = new PublicKey(id);
    let escrow_acc = await connection.getAccountInfo(streamPublicKey);
    if (!escrow_acc?.data) {
      throw new Error("Couldn't get account info");
    }

    const data = decodeStream(escrow_acc?.data);

    const streamflowTreasuryTokens = await ata(
      data.mint,
      STREAMFLOW_TREASURY_PUBLIC_KEY
    );
    const partnerTokens = await ata(data.mint, data.partner);

    const tx = await program.rpc.cancel({
      accounts: {
        authority: invoker.publicKey,
        sender: data.sender,
        senderTokens: data.senderTokens,
        recipient: data.recipient,
        recipientTokens: data.recipientTokens,
        metadata: streamPublicKey,
        escrowTokens: data.escrowTokens,
        streamflowTreasury: STREAMFLOW_TREASURY_PUBLIC_KEY,
        streamflowTreasuryTokens: streamflowTreasuryTokens,
        partner: data.partner,
        partnerTokens,
        mint: data.mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });

    return { tx };
  }

  /**
   * Attempts changing the stream/vesting contract's recipient (effectively transferring the stream/vesting contract).
   * Potential associated token account rent fee (to make it rent-exempt) is paid by the transaction initiator (i.e. current recipient)
   * @param {TransferStreamParams} data
   */
  static async transfer({
    connection,
    invoker,
    id,
    recipientId,
    cluster = Cluster.Mainnet,
  }: TransferStreamParams): Promise<TransactionResponse> {
    const program = initProgram(connection, invoker, cluster);
    const streamPublicKey = new PublicKey(id);
    const recipientPublicKey = new PublicKey(recipientId);
    let escrow = await connection.getAccountInfo(streamPublicKey);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info");
    }
    const { mint } = decodeStream(escrow?.data);

    const recipientTokens = await ata(mint, recipientPublicKey);

    const tx = await program.rpc.transferRecipient({
      accounts: {
        authority: invoker.publicKey,
        recipientPublicKey,
        recipientTokens,
        metadata: streamPublicKey,
        mint,
        rent: SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        system: web3.SystemProgram.programId,
      },
    });

    return { tx };
  }

  /**
   * Tops up stream account deposited amount
   * @param {TopupStreamParams} data
   */
  static async topup({
    connection,
    invoker,
    id,
    amount,
    cluster = Cluster.Mainnet,
  }: TopupStreamParams): Promise<TransactionResponse> {
    const program = initProgram(connection, invoker, cluster);
    const streamPublicKey = new PublicKey(id);
    let escrow = await connection.getAccountInfo(streamPublicKey);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info");
    }
    const { mint, partner, senderTokens, escrowTokens } = decodeStream(
      escrow?.data
    );

    const streamflowTreasuryTokens = await ata(
      mint,
      STREAMFLOW_TREASURY_PUBLIC_KEY
    );
    const partnerTokens = await ata(mint, partner);

    const tx = await program.rpc.topup(new BN(amount), {
      accounts: {
        sender: invoker.publicKey,
        senderTokens,
        metadata: streamPublicKey,
        escrowTokens,
        streamflowTreasury: STREAMFLOW_TREASURY_PUBLIC_KEY,
        streamflowTreasuryTokens: streamflowTreasuryTokens,
        partner: partner,
        partnerTokens: partnerTokens,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });

    return { tx };
  }
  /**
   *
   * @param param0
   * @returns
   */
  static async getOne({
    connection,
    id,
  }: GetStreamParams): Promise<StreamData> {
    const escrow = await connection.getAccountInfo(
      new PublicKey(id),
      TX_FINALITY_CONFIRMED
    );
    if (!escrow?.data) {
      throw new Error("Couldn't get account info.");
    }

    return formatDecodedStream(decodeStream(escrow?.data));
  }

  /**
   * Get streams by providing direction (incoming, outgoing, all) and type (stream, vesting, all),
   * streams are sorted by start time value in ascending order
   * @param param
   * @returns
   */
  static async get({
    connection,
    wallet,
    type = StreamType.All,
    direction = StreamDirection.All,
    cluster = Cluster.Mainnet,
  }: GetStreamsParams): Promise<[string, StreamData][]> {
    let accounts: Account[] = [];
    //todo: we need to be smart with our layout so we minimize rpc calls to the chain
    if (direction === "all") {
      const outgoingAccounts = await getProgramAccounts(
        connection,
        wallet,
        STREAM_STRUCT_OFFSET_SENDER,
        cluster
      );
      const incomingAccounts = await getProgramAccounts(
        connection,
        wallet,
        STREAM_STRUCT_OFFSET_RECIPIENT,
        cluster
      );
      accounts = [...outgoingAccounts, ...incomingAccounts];
    } else {
      const offset =
        direction === "outgoing"
          ? STREAM_STRUCT_OFFSET_SENDER
          : STREAM_STRUCT_OFFSET_RECIPIENT;
      accounts = await getProgramAccounts(connection, wallet, offset, cluster);
    }

    let streams: { [s: string]: any } = {};

    accounts.forEach((account) => {
      const decoded = formatDecodedStream(decodeStream(account.account.data));
      streams = { ...streams, [account.pubkey.toBase58()]: decoded };
    });

    const sortedStreams = Object.entries(streams).sort(
      ([, stream1], [, stream2]) => stream2.startTime - stream1.startTime
    );

    if (type === "all") return sortedStreams;

    return type === "stream"
      ? sortedStreams.filter((stream) => stream[1].canTopup)
      : sortedStreams.filter((stream) => !stream[1].canTopup);
  }
}

async function getProgramAccounts(
  connection: Connection,
  wallet: PublicKey,
  offset: number,
  cluster: ClusterExtended = Cluster.Mainnet
): Promise<Account[]> {
  return connection?.getProgramAccounts(new PublicKey(PROGRAM_ID[cluster]), {
    filters: [
      {
        memcmp: {
          offset,
          bytes: wallet.toBase58(),
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

function formatStringToBytesArray(encoder: TextEncoder, text: string) {
  const textCopy = [...text];
  const characters = Array.from(textCopy);
  const utf8EncodedBytes: BN[] = [];

  characters.every((char) => {
    if (utf8EncodedBytes.length > 64) return false;

    const encoded = encoder.encode(char);
    if (utf8EncodedBytes.length + encoded.length > 64) return false;

    encoded.forEach((elem) => utf8EncodedBytes.push(new BN(elem)));
    return true;
  });

  const numberOfBytes = utf8EncodedBytes.length;
  const fill = new Array(64 - numberOfBytes).fill(new BN(0));
  utf8EncodedBytes.push(...fill);

  return utf8EncodedBytes;
}
