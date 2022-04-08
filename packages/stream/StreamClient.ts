// Latest version of the SDK that does not use Anchor. It supports raw instructions.

import BN from "bn.js";
import { Buffer } from "buffer";
import { web3 } from "@project-serum/anchor";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  Transaction,
  Commitment,
  ConnectionConfig,
  sendAndConfirmRawTransaction,
} from "@solana/web3.js";

import {
  Stream as StreamData,
  StreamDirection,
  StreamType,
  Account,
  CreateParams,
  CreateMultiParams,
  WithdrawParams,
  TopupParams,
  CancelParams,
  TransferParams,
  ClusterExtended,
  Cluster,
  GetAllParams,
  CreateResponse,
  CreateMultiResponse,
  TxResponse,
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
import {
  withdrawStreamInstruction,
  cancelStreamInstruction,
  transferStreamInstruction,
  topupStreamInstruction,
  createStreamInstruction,
} from "./instructions";

export default class StreamClient {
  private connection: Connection;
  private cluster: ClusterExtended;
  private programId: PublicKey;
  private commitment: Commitment | ConnectionConfig;

  /**
   * Create Stream instance
   */
  constructor(
    clusterUrl: string,
    cluster: ClusterExtended = Cluster.Mainnet,
    commitment: Commitment | ConnectionConfig = "confirmed"
  ) {
    this.commitment = commitment;
    this.cluster = cluster;
    this.connection = new Connection(clusterUrl, this.commitment);
    this.programId = new PublicKey(PROGRAM_ID[cluster]);
  }

  public getConnection() {
    return this.connection;
  }

  /**
   * Creates a new stream/vesting contract.
   * All fees are paid by sender (escrow metadata account rent, escrow token account rent, recipient's associated token account rent, Streamflow's service fee).
   * @param {CreateParams} data
   * @param {Wallet | Keypair} data.sender - Wallet signing the transaction. Its address should match the authorized wallet (sender) or transaction will fail.
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
   * @param {boolean} data.automaticWithdrawal - Whether or not a 3rd party can initiate withdraw in the name of recipient.
   * @param {number} [data.withdrawalFrequency = 0] - Relevant when automatic withdrawal is enabled. If greater than 0 our withdrawor will take care of withdrawals. If equal to 0 our withdrawor will skip, but everyone else can initiate withdrawals.
   * @param {string | null} [data.partner = null] - Partner's wallet address (optional).
   */
  public async create({
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
    partner = null,
  }: CreateParams): Promise<CreateResponse> {
    let ixs: TransactionInstruction[] = [];
    const mintPublicKey = new PublicKey(mint);
    const recipientPublicKey = new PublicKey(recipient);

    const metadata = Keypair.generate();
    const [escrowTokens] = await PublicKey.findProgramAddress(
      [Buffer.from("strm"), metadata.publicKey.toBuffer()],
      this.programId
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

    ixs.push(
      createStreamInstruction(
        {
          start: new BN(start),
          depositedAmount,
          period: new BN(period),
          amountPerPeriod,
          cliff: new BN(cliff),
          cliffAmount,
          cancelableBySender,
          cancelableByRecipient,
          automaticWithdrawal,
          transferableBySender,
          transferableByRecipient,
          canTopup,
          name,
          withdrawFrequency: new BN(
            automaticWithdrawal ? withdrawalFrequency : period
          ),
        },
        this.programId,
        {
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
          timelockProgram: this.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          withdrawor: WITHDRAWOR_PUBLIC_KEY,
          systemProgram: SystemProgram.programId,
        }
      )
    );

    const commitment =
      typeof this.commitment == "string"
        ? this.commitment
        : this.commitment.commitment;

    let hash = await this.connection.getRecentBlockhash(commitment);
    let tx = new Transaction({
      feePayer: sender.publicKey,
      recentBlockhash: hash.blockhash,
    }).add(...ixs);

    tx.partialSign(metadata);

    const signature = await this.sign(sender, tx);

    return { ixs, tx: signature, metadata };
  }

  /**
   * Creates a new stream/vesting contract.
   * All fees are paid by sender (escrow metadata account rent, escrow token account rent, recipient's associated token account rent, Streamflow's service fee).
   * @param {CreateMultiParams} data
   * @param {Wallet | Keypair} data.sender - Wallet signing the transaction. Its address should match the authorized wallet (sender) or transaction will fail.
   * @param {MultiRecipient[]} data.recipientsData
   * @param {string} data.mint - SPL Token mint.
   * @param {number} data.start - Timestamp (in seconds) when the stream/token vesting starts.
   * @param {number} data.period - Time step (period) in seconds per which the unlocking occurs.
   * @param {number} data.cliff - Vesting contract "cliff" timestamp in seconds.
   * @param {boolean} data.canTopup - TRUE for streams, FALSE for vesting contracts.
   * @param {boolean} data.cancelableBySender - Whether or not sender can cancel the stream.
   * @param {boolean} data.cancelableByRecipient - Whether or not recipient can cancel the stream.
   * @param {boolean} data.transferableBySender - Whether or not sender can transfer the stream.
   * @param {boolean} data.transferableByRecipient - Whether or not recipient can transfer the stream.
   * @param {boolean} data.automaticWithdrawal - Whether or not a 3rd party can initiate withdraw in the name of recipient.
   * @param {number} [data.withdrawalFrequency = 0] - Relevant when automatic withdrawal is enabled. If greater than 0 our withdrawor will take care of withdrawals. If equal to 0 our withdrawor will skip, but everyone else can initiate withdrawals.
   * @param {string | null} [data.partner = null] - Partner's wallet address (optional).
   */
  public async createMultiple({
    sender,
    recipientsData,
    mint,
    start,
    period,
    cliff,
    canTopup,
    cancelableBySender,
    cancelableByRecipient,
    transferableBySender,
    transferableByRecipient,
    automaticWithdrawal = false,
    withdrawalFrequency = 0,
    partner = null,
  }: CreateMultiParams): Promise<CreateMultiResponse> {
    const mintPublicKey = new PublicKey(mint);

    let batch: Transaction[] = [];

    const commitment =
      typeof this.commitment == "string"
        ? this.commitment
        : this.commitment.commitment;

    const metadatas = [];

    for (const recipient of recipientsData) {
      let ixs: TransactionInstruction[] = [];
      const recipientPublicKey = new PublicKey(recipient.recipient);

      const metadata = Keypair.generate();
      metadatas.push(metadata);
      const [escrowTokens] = await web3.PublicKey.findProgramAddress(
        [Buffer.from("strm"), metadata.publicKey.toBuffer()],
        this.programId
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

      ixs.push(
        createStreamInstruction(
          {
            start: new BN(start),
            depositedAmount: recipient.depositedAmount,
            period: new BN(period),
            amountPerPeriod: recipient.amountPerPeriod,
            cliff: new BN(cliff),
            cliffAmount: recipient.cliffAmount,
            cancelableBySender,
            cancelableByRecipient,
            automaticWithdrawal,
            transferableBySender,
            transferableByRecipient,
            canTopup,
            name: recipient.name,
            withdrawFrequency: new BN(
              automaticWithdrawal ? withdrawalFrequency : period
            ),
          },
          this.programId,
          {
            sender: sender.publicKey,
            senderTokens,
            recipient: new PublicKey(recipient.recipient),
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
            timelockProgram: this.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            withdrawor: WITHDRAWOR_PUBLIC_KEY,
            systemProgram: SystemProgram.programId,
          }
        )
      );
      let hash = await this.connection.getRecentBlockhash(commitment);
      let tx = new Transaction({
        feePayer: sender.publicKey,
        recentBlockhash: hash.blockhash,
      }).add(...ixs);
      tx.partialSign(metadata);
      batch.push(tx);
    }

    var signed_batch: Transaction[];
    if (sender instanceof Keypair) {
      signed_batch = batch.map((t) => {
        t.partialSign(sender);
        return t;
      });
    } else if (sender?.signAllTransactions) {
      signed_batch = await sender.signAllTransactions(batch);
    } else {
      signed_batch = [];
    }

    let sigs: string[] = [];
    for (let i = 0; i < signed_batch.length; i++) {
      let buf = signed_batch[i].serialize();
      const signature = await sendAndConfirmRawTransaction(
        this.connection,
        buf
      );
      sigs.push(signature);
    }

    return { txs: sigs, metadatas };
  }

  /**
   * Attempts withdrawal from the specified stream.
   * @param {WithdrawParams} data
   * @param {Wallet | Keypair} data.invoker - Wallet signing the transaction. It's address should match authorized wallet (recipient) or transaction will fail.
   * @param {string} data.id - Identifier of a stream (escrow account with metadata) to be withdrawn from.
   * @param {BN} data.amount - Requested amount (in the smallest units) to withdraw (while streaming). If stream is completed, the whole amount will be withdrawn.
   */
  public async withdraw({
    invoker,
    id,
    amount,
  }: WithdrawParams): Promise<TxResponse> {
    let ixs: TransactionInstruction[] = [];
    const streamPublicKey = new PublicKey(id);

    const escrow = await this.connection.getAccountInfo(streamPublicKey);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info");
    }

    const data = decodeStream(escrow.data);

    const streamflowTreasuryTokens = await ata(
      data.mint,
      STREAMFLOW_TREASURY_PUBLIC_KEY
    );
    const partnerTokens = await ata(data.mint, data.partner);

    ixs.push(
      withdrawStreamInstruction(amount, this.programId, {
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
      })
    );

    const commitment =
      typeof this.commitment == "string"
        ? this.commitment
        : this.commitment.commitment;
    let hash = await this.connection.getRecentBlockhash(commitment);
    let tx = new Transaction({
      feePayer: invoker.publicKey,
      recentBlockhash: hash.blockhash,
    }).add(...ixs);

    const signature = await this.sign(invoker, tx);

    return { ixs, tx: signature };
  }

  /**
   * Attempts canceling the specified stream.
   * @param {CancelParams} data
   * @param {Wallet | Keypair} data.invoker - Wallet signing the transaction. It's address should match authorized wallet (sender or recipient) or transaction will fail.
   * @param {string} data.id - Identifier of a stream (escrow account with metadata) to be canceled.
   */
  public async cancel({ invoker, id }: CancelParams): Promise<TxResponse> {
    const streamPublicKey = new PublicKey(id);
    let escrow_acc = await this.connection.getAccountInfo(streamPublicKey);
    if (!escrow_acc?.data) {
      throw new Error("Couldn't get account info");
    }

    const data = decodeStream(escrow_acc?.data);

    const streamflowTreasuryTokens = await ata(
      data.mint,
      STREAMFLOW_TREASURY_PUBLIC_KEY
    );
    const partnerTokens = await ata(data.mint, data.partner);

    let ixs: TransactionInstruction[] = [];

    ixs.push(
      cancelStreamInstruction(this.programId, {
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
      })
    );

    const commitment =
      typeof this.commitment == "string"
        ? this.commitment
        : this.commitment.commitment;

    let hash = await this.connection.getRecentBlockhash(commitment);
    let tx = new Transaction({
      feePayer: invoker.publicKey,
      recentBlockhash: hash.blockhash,
    }).add(...ixs);

    const signature = await this.sign(invoker, tx);

    return { ixs, tx: signature };
  }

  /**
   * Attempts changing the stream/vesting contract's recipient (effectively transferring the stream/vesting contract).
   * Potential associated token account rent fee (to make it rent-exempt) is paid by the transaction initiator.
   * @param {TransferParams} data
   * @param {Wallet | Keypair} data.invoker - Wallet signing the transaction. It's address should match authorized wallet (sender or recipient) or transaction will fail.
   * @param {string} data.id - Identifier of a stream (escrow account with metadata) to be transferred.
   * @param {string} data.recipientId - Address of a new recipient.
   */
  public async transfer({
    invoker,
    id,
    recipientId,
  }: TransferParams): Promise<TxResponse> {
    let ixs: TransactionInstruction[] = [];
    const stream = new PublicKey(id);
    const newRecipient = new PublicKey(recipientId);
    let escrow = await this.connection.getAccountInfo(stream);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info");
    }
    const { mint } = decodeStream(escrow?.data);

    const newRecipientTokens = await ata(mint, newRecipient);

    ixs.push(
      transferStreamInstruction(this.programId, {
        authority: invoker.publicKey,
        newRecipient,
        newRecipientTokens,
        metadata: stream,
        mint,
        rent: SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
    );

    const commitment =
      typeof this.commitment == "string"
        ? this.commitment
        : this.commitment.commitment;
    let hash = await this.connection.getRecentBlockhash(commitment);

    let tx = new Transaction({
      feePayer: invoker.publicKey,
      recentBlockhash: hash.blockhash,
    }).add(...ixs);

    const signature = await this.sign(invoker, tx);

    return { ixs, tx: signature };
  }

  /**
   * Tops up stream account deposited amount.
   * @param {TopupParams} data
   * @param {Wallet | Keypair} data.invoker - Wallet signing the transaction. It's address should match current stream sender or transaction will fail.
   * @param {string} data.id - Identifier of a stream (escrow account with metadata) to be topped up.
   * @param {BN} data.amount - Specified amount (in the smallest units) to topup (increases deposited amount).
   */
  public async topup({
    invoker,
    id,
    amount,
  }: TopupParams): Promise<TxResponse> {
    let ixs: TransactionInstruction[] = [];
    const streamPublicKey = new PublicKey(id);
    let escrow = await this.connection.getAccountInfo(streamPublicKey);
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

    ixs.push(
      topupStreamInstruction(amount, this.programId, {
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
        systemProgram: SystemProgram.programId,
      })
    );

    const commitment =
      typeof this.commitment == "string"
        ? this.commitment
        : this.commitment.commitment;
    let hash = await this.connection.getRecentBlockhash(commitment);
    let tx = new Transaction({
      feePayer: invoker.publicKey,
      recentBlockhash: hash.blockhash,
    }).add(...ixs);

    const signature = await this.sign(invoker, tx);

    return { ixs, tx: signature };
  }
  /**
   * Fetch stream data by its id (address).
   * @param {string} id - Identifier of a stream that is fetched.
   */
  public async getOne(id: string): Promise<StreamData> {
    const escrow = await this.connection.getAccountInfo(
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
   * @param {GetAllParams} data
   * @param {PublicKey} data.wallet - PublicKey of the wallet for which the streams/contracts are fetched.
   * @param {StreamType} [data.type = StreamType.All] - It can be one of: stream, vesting, all.
   * @param {StreamDirection} [data.direction = StreamDirection.All] - It can be one of: incoming, outgoing, all.
   */
  public async get({
    wallet,
    type = StreamType.All,
    direction = StreamDirection.All,
  }: GetAllParams): Promise<[string, StreamData][]> {
    let accounts: Account[] = [];
    //todo: we need to be smart with our layout so we minimize rpc calls to the chain
    if (direction === "all") {
      const outgoingAccounts = await getProgramAccounts(
        this.connection,
        wallet,
        STREAM_STRUCT_OFFSET_SENDER,
        this.cluster
      );
      const incomingAccounts = await getProgramAccounts(
        this.connection,
        wallet,
        STREAM_STRUCT_OFFSET_RECIPIENT,
        this.cluster
      );
      accounts = [...outgoingAccounts, ...incomingAccounts];
    } else {
      const offset =
        direction === "outgoing"
          ? STREAM_STRUCT_OFFSET_SENDER
          : STREAM_STRUCT_OFFSET_RECIPIENT;
      accounts = await getProgramAccounts(
        this.connection,
        wallet,
        offset,
        this.cluster
      );
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

  private async sign(invoker: any, tx: web3.Transaction) {
    if (invoker instanceof Keypair) {
      tx.partialSign(invoker);
    } else if (invoker?.signTransaction) {
      await invoker.signTransaction(tx);
    }

    const rawTx = tx.serialize();

    const signature = await sendAndConfirmRawTransaction(
      this.connection,
      rawTx
    );
    return signature;
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
