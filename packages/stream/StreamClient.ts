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
  BlockheightBasedTransactionConfimationStrategy,
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
  MetadataRecipientHashMap,
  MultiRecipient,
  Contract,
} from "./types";
import { decodeStream } from "./utils";
import {
  PROGRAM_ID,
  STREAMFLOW_TREASURY_PUBLIC_KEY,
  STREAM_STRUCT_OFFSET_RECIPIENT,
  STREAM_STRUCT_OFFSET_SENDER,
  TX_FINALITY_CONFIRMED,
  WITHDRAWOR_PUBLIC_KEY,
  FEE_ORACLE_PUBLIC_KEY,
  STREAMFLOW_PROGRAM_ID,
} from "./constants";
import {
  withdrawStreamInstruction,
  cancelStreamInstruction,
  transferStreamInstruction,
  topupStreamInstruction,
  createStreamInstruction,
  createUncheckedStreamInstruction,
} from "./instructions";
import { Wallet } from "@project-serum/anchor/src/provider";
import { sleep } from "@project-serum/common";
import { encode } from "@project-serum/anchor/dist/cjs/utils/bytes/bs58";

const METADATA_ACC_SIZE = 1104;

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
    commitment: Commitment | ConnectionConfig = "confirmed",
    programId: string = ""
  ) {
    this.commitment = commitment;
    this.cluster = cluster;
    this.connection = new Connection(clusterUrl, this.commitment);
    this.programId = new PublicKey(PROGRAM_ID[cluster]);
    if (programId != "") {
      this.programId = new PublicKey(programId);
    }
  }

  public getConnection() {
    return this.connection;
  }

  public getProgramId(): string {
    return this.programId.toBase58();
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

    let hash = await this.connection.getLatestBlockhash(commitment);
    let tx = new Transaction({
      feePayer: sender.publicKey,
      blockhash: hash.blockhash,
      lastValidBlockHeight: hash.lastValidBlockHeight,
    }).add(...ixs);

    tx.partialSign(metadata);

    const signature = await this.sign(sender, tx, hash);

    return { ixs, tx: signature, metadata };
  }

  /**
   * Creates a new stream/vesting contract using unchecked instruction.
   *
   * Unchecked instruction differes from the regular in:
   * - does not check for initialized associated token account (wallets with no control over their ATA should not be used
   * as sender/recipient/partner or there are risks of funds being locked in the contract)
   * - initialized contract PDA off chain
   *
   * If you are not sure if you should use create or create_unchecked, go for create to be safer.
   *
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
  public async createUnchecked({
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
    const mintPublicKey = new PublicKey(mint);
    const recipientPublicKey = new PublicKey(recipient);

    const metadata = Keypair.generate();

    
    const rentToExempt =
      await this.connection.getMinimumBalanceForRentExemption(METADATA_ACC_SIZE);
    const createMetadataInstruction = SystemProgram.createAccount({
      programId: this.programId,
      space: METADATA_ACC_SIZE,
      lamports: rentToExempt,
      fromPubkey: sender?.publicKey,
      newAccountPubkey: metadata.publicKey,
    });

    const [escrowTokens] = await PublicKey.findProgramAddress(
      [Buffer.from("strm"), metadata.publicKey.toBuffer()],
      this.programId
    );

    const senderTokens = await ata(mintPublicKey, sender.publicKey);

    const partnerPublicKey = partner
      ? new PublicKey(partner)
      : STREAMFLOW_TREASURY_PUBLIC_KEY;

    const createInstruction = createUncheckedStreamInstruction(
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
        recipient: recipientPublicKey,
        partner: partnerPublicKey,
      },
      this.programId,
      {
        sender: sender.publicKey,
        senderTokens,
        metadata: metadata.publicKey,
        escrowTokens,
        mint: new PublicKey(mint),
        feeOracle: FEE_ORACLE_PUBLIC_KEY,
        rent: SYSVAR_RENT_PUBKEY,
        timelockProgram: this.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        withdrawor: WITHDRAWOR_PUBLIC_KEY,
        systemProgram: SystemProgram.programId,
      }
    );
    const commitment =
      typeof this.commitment == "string"
        ? this.commitment
        : this.commitment.commitment;
    let ixs: TransactionInstruction[] = [
      createMetadataInstruction,
      createInstruction,
    ];
    let hash = await this.connection.getLatestBlockhash(commitment);
    let tx = new Transaction({
      feePayer: sender.publicKey,
      blockhash: hash.blockhash,
      lastValidBlockHeight: hash.lastValidBlockHeight,
    }).add(...ixs);

    tx.partialSign(metadata);

    const signature = await this.sign(sender, tx, hash);

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
  public async createMultiple(
    data: CreateMultiParams
  ): Promise<CreateMultiResponse> {
    const { sender, recipientsData } = data;

    const metadatas = [];
    const metadataToRecipient: MetadataRecipientHashMap = {};
    const errors = [];
    const signatures: string[] = [];
    //Put all recipient data to chunks to avoid recent blockhash error
    const chunkSize = 100;
    const chunkes = [];

    //Batch is the object that creates assosiation between transaction and recipient
    //It is used to create error messages when a transaction fails and link to recipient address so client could rerun this transaction with the same recipient
    const batch: BatchItem[] = [];

    for (const recipientData of recipientsData) {
      const { tx, metadata } = await this.prepareStreamTransaction(
        recipientData,
        data
      );

      const metadataPubKey = metadata.publicKey.toBase58();
      metadataToRecipient[metadataPubKey] = recipientData;

      metadatas.push(metadata);
      batch.push({ tx, recipient: recipientData.recipient });
    }

    for (let i = 0; i < batch.length; i += chunkSize) {
      const chunk = batch.slice(i, i + chunkSize);
      chunkes.push(chunk);
    }
    for (const chunk of chunkes) {
      //Extract tx from batch item and sign it
      let signed_batch: BatchItem[] = await signAllTransactionWithRecipients(
        sender,
        chunk
      );

      //send all transactions in parallel and wait for them to settle.
      //it allows to speed up the process of sending transactions
      //we then filter all promise responses and handle failed transactions
      const batchTransactionsCalls = signed_batch.map((el) =>
        sendAndConfirmStreamRawTransaction(this.connection, el)
      );
      const responses = await Promise.allSettled(batchTransactionsCalls);

      const successes = responses
        .filter(
          (el): el is PromiseFulfilledResult<BatchItemSuccess> =>
            el.status === "fulfilled"
        )
        .map((el) => el.value);
      signatures.push(...successes.map((el) => el.signature));

      const failures = responses
        .filter((el): el is PromiseRejectedResult => el.status === "rejected")
        .map((el) => el.reason as BatchItemError);
      errors.push(...failures);
      await sleep(100);
    }

    return { txs: signatures, metadatas, metadataToRecipient, errors };
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
    let hash = await this.connection.getLatestBlockhash(commitment);
    let tx = new Transaction({
      feePayer: invoker.publicKey,
      blockhash: hash.blockhash,
      lastValidBlockHeight: hash.lastValidBlockHeight,
    }).add(...ixs);

    const signature = await this.sign(invoker, tx, hash);

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

    let hash = await this.connection.getLatestBlockhash(commitment);
    let tx = new Transaction({
      feePayer: invoker.publicKey,
      blockhash: hash.blockhash,
      lastValidBlockHeight: hash.lastValidBlockHeight,
    }).add(...ixs);

    const signature = await this.sign(invoker, tx, hash);

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
    let hash = await this.connection.getLatestBlockhash(commitment);

    let tx = new Transaction({
      feePayer: invoker.publicKey,
      blockhash: hash.blockhash,
      lastValidBlockHeight: hash.lastValidBlockHeight,
    }).add(...ixs);

    const signature = await this.sign(invoker, tx, hash);

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
    let hash = await this.connection.getLatestBlockhash(commitment);
    let tx = new Transaction({
      feePayer: invoker.publicKey,
      blockhash: hash.blockhash,
      lastValidBlockHeight: hash.lastValidBlockHeight,
    }).add(...ixs);

    const signature = await this.sign(invoker, tx, hash);

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

    return new Contract(decodeStream(escrow?.data));
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
        this.programId
      );
      const incomingAccounts = await getProgramAccounts(
        this.connection,
        wallet,
        STREAM_STRUCT_OFFSET_RECIPIENT,
        this.programId
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
        this.programId
      );
    }

    let streams: { [s: string]: any } = {};

    accounts.forEach((account) => {
      const decoded = new Contract(decodeStream(account.account.data));
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

  private async sign(
    invoker: any,
    tx: web3.Transaction,
    hash: Readonly<{
      blockhash: string;
      lastValidBlockHeight: number;
    }>
  ) {
    if (isAnchorWallet(invoker)) {
      await invoker.signTransaction(tx);
    } else {
      tx.partialSign(invoker);
    }

    const rawTx = tx.serialize();

    if (!hash.lastValidBlockHeight || !tx.signature || !hash.blockhash)
      throw Error("Error with transaction parameters.");

    const confirmationStrategy: BlockheightBasedTransactionConfimationStrategy =
      {
        lastValidBlockHeight: hash.lastValidBlockHeight,
        signature: encode(tx.signature),
        blockhash: hash.blockhash,
      };
    const signature = await sendAndConfirmRawTransaction(
      this.connection,
      rawTx,
      confirmationStrategy
    );
    return signature;
  }
  /**
   * Forms instructions from params, creates a raw transaction and fetch recent blockhash.
   * @param {MultiRecipient} recipient - Wallet sending stream to
   * @param {CreateMultiParams} streamParams - Parameters of stream user wants to create.
   */
  private async prepareStreamTransaction(
    recipient: MultiRecipient,
    streamParams: CreateMultiParams
  ) {
    const {
      sender,
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
    } = streamParams;
    let ixs: TransactionInstruction[] = [];
    const commitment =
      typeof this.commitment == "string"
        ? this.commitment
        : this.commitment.commitment;
    const recipientPublicKey = new PublicKey(recipient.recipient);
    const mintPublicKey = new PublicKey(mint);
    const metadata = Keypair.generate();
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
    let hash = await this.connection.getLatestBlockhash(commitment);
    let tx = new Transaction({
      feePayer: sender.publicKey,
      blockhash: hash.blockhash,
      lastValidBlockHeight: hash.lastValidBlockHeight,
    }).add(...ixs);
    tx.partialSign(metadata);
    return { tx, metadata };
  }
}

async function getProgramAccounts(
  connection: Connection,
  wallet: PublicKey,
  offset: number,
  programId: PublicKey
): Promise<Account[]> {
  return connection?.getProgramAccounts(programId, {
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

function isAnchorWallet(wallet: Keypair | Wallet): wallet is Wallet {
  return (<Wallet>wallet).signTransaction !== undefined;
}

interface BatchItem {
  recipient: string;
  tx: web3.Transaction;
}

interface BatchItemSuccess extends BatchItem {
  signature: string;
}

interface BatchItemError extends BatchItem {
  error: string;
}

async function signAllTransactionWithRecipients(
  sender: Keypair | Wallet,
  batch: BatchItem[]
) {
  let signed_batch: BatchItem[] = [];
  const isKeypair = sender instanceof Keypair;
  const isWallet = isAnchorWallet(sender);

  if (!isKeypair && !isWallet) return signed_batch;

  if (isKeypair) {
    signed_batch = batch.map((t) => {
      t.tx.partialSign(sender);
      return { tx: t.tx, recipient: t.recipient };
    });
  }
  if (isWallet) {
    const recipientToBlockhashMap = new Map<string, BatchItem>();

    for (const item of batch) {
      recipientToBlockhashMap.set(item.tx.recentBlockhash!, item);
    }
    const txs = await sender.signAllTransactions(batch.map((t) => t.tx));
    txs.map((tx) => {
      const item = recipientToBlockhashMap.get(tx.recentBlockhash!);
      if (item) {
        signed_batch.push({
          tx,
          recipient: item.recipient,
        });
      }
    });
  }
  return signed_batch;
}

async function sendAndConfirmStreamRawTransaction(
  connection: Connection,
  batchItem: BatchItem
): Promise<BatchItemSuccess | BatchItemError> {
  try {
    const rawTx = batchItem.tx.serialize();
    const { lastValidBlockHeight, signature, recentBlockhash } = batchItem.tx;
    if (!lastValidBlockHeight || !signature || !recentBlockhash)
      throw { recipient: batchItem.recipient, error: "no recent blockhash" };

    const confirmationStrategy: BlockheightBasedTransactionConfimationStrategy =
      {
        lastValidBlockHeight,
        signature: encode(signature),
        blockhash: recentBlockhash,
      };
    const completedTxSignature = await sendAndConfirmRawTransaction(
      connection,
      rawTx,
      confirmationStrategy
    );
    return { ...batchItem, signature: completedTxSignature };
  } catch (error: any) {
    throw { recipient: batchItem.recipient, error };
  }
}
