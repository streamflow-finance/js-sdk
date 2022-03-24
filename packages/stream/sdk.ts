import { u64 } from "@solana/spl-token";
import { Buffer } from "buffer";
import { Idl, Program, Provider, web3 } from "@project-serum/anchor";
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
  ClusterExtended,
  Cluster,
  GetStreamsParams,
  CreateStreamParams,
  CreateStreamResponse,
  WithdrawStreamParams,
  CancelStreamParams,
  TransactionResponse,
  TopupStreamParams,
  TransferStreamParams,
  GetStreamParams,
} from "./types";
import { decodeStream, formatDecodedStream } from "./utils";
import {
  PROGRAM_ID,
  STREAMFLOW_TREASURY_PUBLIC_KEY,
  STREAM_STRUCT_OFFSET_RECIPIENT,
  STREAM_STRUCT_OFFSET_SENDER,
  TX_FINALITY_CONFIRMED,
  WITHDRAWOR_PUBLIC_KEY,
  FEE_ORACLE_PUBLIC_KEY,
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
   * All fees are paid by sender (escrow metadata account rent, escrow token account rent, recipient's associated token account rent, Streamflow's service fee).
   * @param {CreateStreamParams} data
   * @param {Connection} data.connection - A connection to the cluster.
   * @param {Wallet} data.sender - Wallet signing the transaction. Its address should match the authorized wallet (sender) or transaction will fail.
   * @param {string} data.recipient - Solana address of the recipient. Associated token account will be derived using this address and token mint address.
   * @param {string} data.mint - SPL Token mint.
   * @param {number} data.start - Timestamp (in seconds) when the stream/token vesting starts.
   * @param {BN} data.depositedAmount - Initially deposited amount of tokens (in the smallest units).
   * @param {number} data.period - Time step (period) in seconds per which the unlocking occurs.
   * @param {number} data.cliff - Vesting contract "cliff" timestamp in seconds.
   * @param {BN} data.cliffAmount - Amount unlocked at the "cliff".
   * @param {BN} data.amountPerPeriod - Amount unlocked per each period.
   * @param {string} data.name - Stream name/subject.
   * @param {boolean} data.canTopup - TRUE for streams, FALSE for vesting contracts.
   * @param {boolean} data.cancelableBySender - Whether or not sender can cancel the stream.
   * @param {boolean} data.cancelableByRecipient - Whether or not recipient can cancel the stream.
   * @param {boolean} data.transferableBySender - Whether or not sender can transfer the stream.
   * @param {boolean} data.transferableByRecipient - Whether or not recipient can transfer the stream.
   * @param {boolean} [data.automaticWithdrawal = false] - Whether or not a 3rd party can initiate withdraw in the name of recipient.
   * @param {number} [data.withdrawalFrequency = 0] - Relevant when automatic withdrawal is enabled. If greater than 0 our withdrawor will take care of withdrawals. If equal to 0 our withdrawor will skip, but everyone else can initiate withdrawals.
   * @param {string | null} [data.partner = null] - Partner's wallet address (optional).
   * @param {ClusterExtended} [data.cluster = Cluster.Mainnet] - Cluster: devnet, mainnet-beta, testnet or local (optional).
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
    automaticWithdrawal = false,
    withdrawalFrequency = 0,
    partner = "",
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

    const partnerPublicKey = partner
      ? new PublicKey(partner)
      : STREAMFLOW_TREASURY_PUBLIC_KEY;

    const partnerTokens = await ata(mintPublicKey, partnerPublicKey);

    const signers = [metadata];

    const nameUtf8EncodedArr = encoder.encode(name);

    const tx = await program.rpc.create(
      // Order of the parameters must match the ones in the program
      new u64(start),
      depositedAmount,
      new u64(period),
      amountPerPeriod,
      new u64(cliff),
      cliffAmount,
      cancelableBySender,
      cancelableByRecipient,
      automaticWithdrawal,
      transferableBySender,
      transferableByRecipient,
      canTopup,
      nameUtf8EncodedArr,
      new u64(automaticWithdrawal ? withdrawalFrequency : period),
      {
        accounts: {
          sender: sender.publicKey,
          senderTokens,
          recipient: new PublicKey(recipient),
          metadata: metadata.publicKey,
          escrowTokens,
          recipientTokens,
          streamflowTreasury: STREAMFLOW_TREASURY_PUBLIC_KEY,
          streamflowTreasuryTokens: streamflowTreasuryTokens,
          partner: partnerPublicKey,
          partnerTokens: partnerTokens,
          mint: new PublicKey(mint),
          feeOracle: FEE_ORACLE_PUBLIC_KEY,
          rent: SYSVAR_RENT_PUBKEY,
          timelockProgram: program.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          withdrawor: WITHDRAWOR_PUBLIC_KEY,
          systemProgram: SystemProgram.programId,
        },
        signers,
      }
    );

    return { tx, id: metadata.publicKey.toBase58() };
  }

  /**
   * Attempts withdrawal from the specified stream.
   * @param {WithdrawStreamParams} data
   * @param {Connection} data.connection - A connection to the cluster.
   * @param {Wallet} data.invoker - Wallet signing the transaction. It's address should match authorized wallet (recipient) or transaction will fail.
   * @param {string} data.id - Identifier of a stream (escrow account with metadata) to be withdrawn from.
   * @param {BN} data.amount - Requested amount (in the smallest units) to withdraw (while streaming). If stream is completed, the whole amount will be withdrawn.
   * @param {ClusterExtended} [data.cluster = Cluster.Mainnet] - Cluster: devnet, mainnet-beta, testnet or local (optional).
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

    const tx = await program.rpc.withdraw(amount, {
      accounts: {
        authority: invoker.publicKey,
        recipient: data.recipient,
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
   * @param {Connection} data.connection - A connection to the cluster.
   * @param {Wallet} data.invoker - Wallet signing the transaction. It's address should match authorized wallet (sender or recipient) or transaction will fail.
   * @param {string} data.id - Identifier of a stream (escrow account with metadata) to be canceled.
   * @param {ClusterExtended} [data.cluster = Cluster.Mainnet] - Cluster: devnet, mainnet-beta, testnet or local (optional).
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
   * Potential associated token account rent fee (to make it rent-exempt) is paid by the transaction initiator.
   * @param {TransferStreamParams} data
   * @param {Connection} data.connection - A connection to the cluster.
   * @param {Wallet} data.invoker - Wallet signing the transaction. It's address should match authorized wallet (sender or recipient) or transaction will fail.
   * @param {string} data.id - Identifier of a stream (escrow account with metadata) to be transferred.
   * @param {string} data.recipientId - Address of a new recipient.
   * @param {ClusterExtended} [data.cluster = Cluster.Mainnet] - Cluster: devnet, mainnet-beta, testnet or local (optional).
   */
  static async transfer({
    connection,
    invoker,
    id,
    recipientId,
    cluster = Cluster.Mainnet,
  }: TransferStreamParams): Promise<TransactionResponse> {
    const program = initProgram(connection, invoker, cluster);
    const stream = new PublicKey(id);
    const newRecipient = new PublicKey(recipientId);
    let escrow = await connection.getAccountInfo(stream);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info");
    }
    const { mint } = decodeStream(escrow?.data);

    const newRecipientTokens = await ata(mint, newRecipient);

    const tx = await program.rpc.transferRecipient({
      accounts: {
        authority: invoker.publicKey,
        newRecipient,
        newRecipientTokens,
        metadata: stream,
        mint,
        rent: SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      },
    });

    return { tx };
  }

  /**
   * Tops up stream account deposited amount.
   * @param {TopupStreamParams} data
   * @param {Connection} data.connection - A connection to the cluster.
   * @param {Wallet} data.invoker - Wallet signing the transaction. It's address should match current stream sender or transaction will fail.
   * @param {string} data.id - Identifier of a stream (escrow account with metadata) to be topped up.
   * @param {BN} data.amount - Specified amount (in the smallest units) to topup (increases deposited amount).
   * @param {ClusterExtended} [data.cluster = Cluster.Mainnet] - Cluster: devnet, mainnet-beta, testnet or local (optional).
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

    const tx = await program.rpc.topup(amount, {
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
        withdrawor: WITHDRAWOR_PUBLIC_KEY,
        systemProgram: web3.SystemProgram.programId,
      },
    });

    return { tx };
  }
  /**
   * Fetch stream data by its id (address).
   * @param {GetStreamParams} data
   * @param {Connection} data.connection - A connection to the cluster.
   * @param {string} data.id - Identifier of a stream that is fetched.
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
   * Fetch streams/contracts by providing direction.
   * Streams are sorted by start time in ascending order.
   * @param {GetStreamsParams} data
   * @param {Connection} data.connection - A connection to the cluster.
   * @param {PublicKey} data.wallet - PublicKey of the wallet for which the streams/contracts are fetched.
   * @param {StreamType} [data.type = StreamType.All] - It can be one of: stream, vesting, all.
   * @param {StreamDirection} [data.direction = StreamDirection.All] - It can be one of: incoming, outgoing, all.
   * @param {ClusterExtended} [data.cluster = Cluster.Mainnet] - Cluster: devnet, mainnet-beta, testnet or local (optional).
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
