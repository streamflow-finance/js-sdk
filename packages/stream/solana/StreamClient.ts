// Latest version of the SDK that does not use Anchor. It supports raw instructions.

import BN from "bn.js";
import bs58 from "bs58";
import { Buffer } from "buffer";
import type PQueue from "p-queue";
import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionMessage,
  VersionedTransaction,
  type TransactionInstruction,
  type Commitment,
  type ConnectionConfig,
  type MemcmpFilter,
  type DataSizeFilter,
} from "@solana/web3.js";
import {
  ata,
  checkOrCreateAtaBatch,
  signAndExecuteTransaction,
  getProgramAccounts,
  prepareWrappedAccount,
  prepareTransaction,
  prepareBaseInstructions,
  getMintAndProgram,
  executeTransaction,
  executeMultipleTransactions,
  buildSendThrottler,
  type IProgramAccount,
  type ThrottleParams,
  getMultipleAccountsInfoBatched,
} from "@streamflow/common/solana";
import * as borsh from "borsh";
import { Program } from "@coral-xyz/anchor";
import { getBN } from "@streamflow/common";
import type { SignerWalletAdapter } from "@solana/wallet-adapter-base";

import {
  type MetadataRecipientHashMap,
  Contract,
  type BatchItem,
  type ICreateStreamSolanaExt,
  type IInteractStreamSolanaExt,
  type ITopUpStreamSolanaExt,
  type ITransactionSolanaExtWithInstructions,
  type ISearchStreams,
  type ICreateStreamInstructions,
  AlignedContract,
  type DecodedStream,
  type OracleType,
} from "./types.js";
import {
  decodeStream,
  extractSolanaErrorCode,
  sendAndConfirmStreamRawTransaction,
  signAllTransactionWithRecipients,
} from "./lib/utils.js";
import {
  PROGRAM_ID,
  STREAMFLOW_TREASURY_PUBLIC_KEY,
  STREAM_STRUCT_OFFSET_RECIPIENT,
  STREAM_STRUCT_OFFSET_SENDER,
  TX_FINALITY_CONFIRMED,
  WITHDRAWOR_PUBLIC_KEY,
  FEE_ORACLE_PUBLIC_KEY,
  DEFAULT_STREAMFLOW_FEE,
  PARTNER_ORACLE_PROGRAM_ID,
  FEES_METADATA_SEED,
  PARTNERS_SCHEMA,
  STREAM_STRUCT_OFFSETS,
  ORIGINAL_CONTRACT_SENDER_OFFSET,
  ALIGNED_PRECISION_FACTOR_POW,
  ALIGNED_COMPUTE_LIMIT,
} from "./constants.js";
import {
  withdrawStreamInstruction,
  cancelStreamInstruction,
  transferStreamInstruction,
  topupStreamInstruction,
  createStreamInstruction,
  createUncheckedStreamInstruction,
  updateStreamInstruction,
} from "./instructions.js";
import {
  type ICancelData,
  ICluster,
  type ICreateMultipleStreamData,
  type ICreateResult,
  type ICreateStreamData,
  type IGetAllData,
  type IGetFeesData,
  type IGetOneData,
  type IFees,
  type IMultiTransactionResult,
  type ITopUpData,
  type ITransactionResult,
  type ITransferData,
  type IUpdateData,
  type IWithdrawData,
  StreamDirection,
  StreamType,
  type Stream,
  type ICreateMultiError,
  type ICreateAlignedStreamData,
  type SolanaStreamClientOptions,
} from "../common/types.js";
import { BaseStreamClient } from "../common/BaseStreamClient.js";
import type { IPartnerLayout } from "./instructionTypes.js";
import { calculateTotalAmountToDeposit } from "../common/utils.js";
import { WITHDRAW_AVAILABLE_AMOUNT } from "../common/constants.js";
import type { StreamflowAlignedUnlocks as AlignedUnlocksProgramType } from "./descriptor/streamflow_aligned_unlocks.js";
import StreamflowAlignedUnlocksIDL from "./descriptor/idl/streamflow_aligned_unlocks.json" with { type: "json" };
import { deriveContractPDA, deriveEscrowPDA, deriveTestOraclePDA } from "./lib/derive-accounts.js";
import { isCreateAlignedStreamData } from "../common/contractUtils.js";

const METADATA_ACC_SIZE = 1104;
const ALIGNED_METADATA_ACC_SIZE = 320;

/**
 * Solana Client creation options
 * @property cluster {@link ICluster} cluster type
 * @property clusterUrl cluster url
 * @interface ClientCreationOptions
 */
export type ClientCreationOptions = Omit<SolanaStreamClientOptions, "chain" | "sendRate" | "sendThrottler">;

export class SolanaStreamClient extends BaseStreamClient {
  private readonly connection: Connection;

  private readonly programId: PublicKey;

  private readonly commitment: Commitment | ConnectionConfig;

  public readonly alignedProxyProgram: Program<AlignedUnlocksProgramType>;

  private readonly schedulingParams: ThrottleParams;

  /**
   * Create Stream instance with flat arguments
   */
  constructor(
    clusterUrl: string,
    cluster?: ICluster,
    commitment?: Commitment | ConnectionConfig,
    programId?: string,
    sendRate?: number,
    sendThrottler?: PQueue,
  );

  /**
   * Create Stream instance with options
   */
  constructor(options: ClientCreationOptions);

  /**
   * Create Stream instance
   */
  constructor(
    optionsOrClusterUrl: string | ClientCreationOptions,
    cluster: ICluster = ICluster.Mainnet,
    commitment: Commitment | ConnectionConfig = "confirmed",
    programId = "",
    sendRate = 1,
    sendThrottler?: PQueue,
  ) {
    super();
    if (typeof optionsOrClusterUrl === "string") {
      this.commitment = commitment;
      this.connection = new Connection(optionsOrClusterUrl, this.commitment);
      this.programId = programId !== "" ? new PublicKey(programId) : new PublicKey(PROGRAM_ID[cluster]);
      this.schedulingParams = {
        sendThrottler: sendThrottler ?? buildSendThrottler(sendRate),
      };
    } else {
      const {
        clusterUrl,
        cluster = ICluster.Mainnet,
        commitment = "confirmed",
        programId = "",
        sendScheduler,
      } = optionsOrClusterUrl;
      this.commitment = commitment;
      this.connection = new Connection(clusterUrl, this.commitment);
      this.programId = programId !== "" ? new PublicKey(programId) : new PublicKey(PROGRAM_ID[cluster]);
      const schedulingOptions = sendScheduler && "sendRate" in sendScheduler ? sendScheduler : undefined;
      const sendThrottler = !sendScheduler
        ? buildSendThrottler(1)
        : "sendRate" in sendScheduler
          ? buildSendThrottler(sendScheduler.sendRate ?? 1, sendScheduler.sendInterval)
          : sendScheduler;
      this.schedulingParams = {
        ...schedulingOptions,
        sendThrottler,
      };
    }
    const alignedUnlocksProgram = {
      ...StreamflowAlignedUnlocksIDL,
      address: StreamflowAlignedUnlocksIDL.address,
    } as AlignedUnlocksProgramType;
    this.alignedProxyProgram = new Program(alignedUnlocksProgram, { connection: this.connection });
  }

  public getConnection(): Connection {
    return this.connection;
  }

  public getCommitment(): Commitment | undefined {
    return typeof this.commitment == "string" ? this.commitment : this.commitment.commitment;
  }

  public getProgramId(): string {
    return this.programId.toBase58();
  }

  /**
   * Creates a new stream/vesting contract.
   * All fees are paid by sender (escrow metadata account rent, escrow token account rent, recipient's associated token account rent, Streamflow's service fee).
   */
  public async create(data: ICreateStreamData, extParams: ICreateStreamSolanaExt): Promise<ICreateResult> {
    const { partner, amount, tokenProgramId } = data;
    const { isNative, sender, customInstructions } = extParams;

    const partnerPublicKey = partner ? new PublicKey(partner) : WITHDRAWOR_PUBLIC_KEY;
    const mintPublicKey = new PublicKey(data.tokenId);

    if (!sender.publicKey) {
      throw new Error("Sender's PublicKey is not available, check passed wallet adapter!");
    }

    const ixs: TransactionInstruction[] = await this.getCreateATAInstructions(
      [STREAMFLOW_TREASURY_PUBLIC_KEY, partnerPublicKey],
      mintPublicKey,
      sender,
      true,
      tokenProgramId ? new PublicKey(tokenProgramId) : undefined,
    );

    const { ixs: createIxs, metadata, metadataPubKey } = await this.prepareCreateInstructions(data, extParams);

    ixs.push(...createIxs);

    if (isNative) {
      const totalFee = await this.getTotalFee({
        address: partnerPublicKey.toString(),
      });
      const totalAmount = calculateTotalAmountToDeposit(amount, totalFee);
      ixs.push(...(await prepareWrappedAccount(this.connection, sender.publicKey, totalAmount)));
    }

    await this.applyCustomAfterInstructions(ixs, customInstructions, metadataPubKey);

    const { tx, hash, context } = await prepareTransaction(this.connection, ixs, sender.publicKey, undefined, metadata);
    const signature = await signAndExecuteTransaction(
      this.connection,
      extParams.sender,
      tx,
      {
        hash,
        context,
        commitment: this.getCommitment(),
      },
      this.schedulingParams,
    );

    return { ixs, txId: signature, metadataId: metadataPubKey.toBase58() };
  }

  async prepareCreateInstructions(
    streamParams: ICreateStreamData,
    extParams: ICreateStreamSolanaExt,
  ): Promise<ICreateStreamInstructions> {
    const { ixs, metadata, metadataPubKey } = isCreateAlignedStreamData(streamParams)
      ? await this.prepareCreateAlignedUnlockInstructions(streamParams, extParams)
      : await this.prepareCreateStreamInstructions(streamParams, extParams);

    return { ixs, metadata, metadataPubKey };
  }

  async prepareCreateAlignedUnlockInstructions(
    streamParams: ICreateAlignedStreamData,
    extParams: ICreateStreamSolanaExt,
  ): Promise<ICreateStreamInstructions> {
    const {
      tokenId: mint,
      start,
      period,
      cliff,
      canTopup,
      cancelableBySender,
      cancelableByRecipient,
      transferableBySender,
      transferableByRecipient,
      partner,
      recipient,
      cliffAmount,
      amountPerPeriod,
      amount: depositedAmount,
      name: streamName,
      minPrice,
      maxPercentage,
      minPercentage,
      maxPrice,
      skipInitial,
      tickSize,
      priceOracle,
      oracleType,
      tokenProgramId: streamTokenProgramId,
    } = streamParams;
    const { isNative, sender, computeLimit, computePrice, metadataPubKeys } = extParams;

    if (!sender.publicKey) {
      throw new Error("Sender's PublicKey is not available, check passed wallet adapter!");
    }

    if (!priceOracle && oracleType && oracleType !== "none") {
      throw new Error("Price oracle is required for the specified oracle type");
    }

    const recipientPublicKey = new PublicKey(recipient);
    const mintPublicKey = isNative ? NATIVE_MINT : new PublicKey(mint);

    const metadata = !metadataPubKeys ? Keypair.generate() : undefined;
    const metadataPubKey = metadata ? metadata.publicKey : metadataPubKeys![0];

    if (!metadataPubKey) {
      throw new Error("Metadata public key is required");
    }

    let tokenProgramId = streamTokenProgramId ? new PublicKey(streamTokenProgramId) : undefined;
    if (!tokenProgramId) {
      tokenProgramId = (await getMintAndProgram(this.connection, mintPublicKey)).tokenProgramId;
    }
    const partnerPublicKey = partner ? new PublicKey(partner) : WITHDRAWOR_PUBLIC_KEY;

    const streamflowProgramPublicKey = new PublicKey(this.programId);

    const escrowPDA = deriveEscrowPDA(streamflowProgramPublicKey, metadataPubKey);

    const oracle =
      priceOracle ?? deriveTestOraclePDA(this.alignedProxyProgram.programId, mintPublicKey, sender.publicKey);

    const ixs: TransactionInstruction[] = prepareBaseInstructions(this.connection, {
      computePrice,
      computeLimit: computeLimit ?? ALIGNED_COMPUTE_LIMIT,
    });

    ixs.push(
      ...(await this.getCreateATAInstructions([recipientPublicKey], mintPublicKey, sender, true, tokenProgramId)),
    );

    const encodedUIntArray = new TextEncoder().encode(streamName);
    const streamNameArray = Array.from(encodedUIntArray);

    const createIx = await this.alignedProxyProgram.methods
      .create({
        startTime: new BN(start),
        netAmountDeposited: depositedAmount,
        period: new BN(period),
        amountPerPeriod: amountPerPeriod,
        cliff: new BN(cliff),
        cliffAmount: cliffAmount,
        transferableBySender,
        transferableByRecipient,
        cancelableByRecipient,
        cancelableBySender,
        canTopup,
        oracleType: (!!oracleType ? { [oracleType]: {} } : { none: {} }) as OracleType,
        streamName: streamNameArray,
        minPrice: minPrice instanceof BN ? minPrice : getBN(minPrice, ALIGNED_PRECISION_FACTOR_POW),
        maxPrice: maxPrice instanceof BN ? maxPrice : getBN(maxPrice, ALIGNED_PRECISION_FACTOR_POW),
        minPercentage: minPercentage instanceof BN ? minPercentage : getBN(minPercentage, ALIGNED_PRECISION_FACTOR_POW),
        maxPercentage: maxPercentage instanceof BN ? maxPercentage : getBN(maxPercentage, ALIGNED_PRECISION_FACTOR_POW),
        tickSize: new BN(tickSize || 1),
        skipInitial: skipInitial ?? false,
      })
      .accountsPartial({
        payer: sender.publicKey,
        sender: sender.publicKey,
        streamMetadata: metadataPubKey,
        escrowTokens: escrowPDA,
        mint: mintPublicKey,
        partner: partnerPublicKey,
        recipient: recipientPublicKey,
        withdrawor: WITHDRAWOR_PUBLIC_KEY,
        feeOracle: FEE_ORACLE_PUBLIC_KEY,
        priceOracle: oracle,
        tokenProgram: tokenProgramId,
        streamflowProgram: this.programId,
      })
      .instruction();

    ixs.push(createIx);

    return { ixs, metadata, metadataPubKey };
  }

  /**
   * Creates a new stream/vesting contract.
   * All fees are paid by sender (escrow metadata account rent, escrow token account rent, recipient's associated token account rent, Streamflow's service fee).
   */
  public async prepareCreateStreamInstructions(
    {
      recipient,
      tokenId: mint,
      start,
      amount: depositedAmount,
      period,
      cliff,
      cliffAmount,
      amountPerPeriod,
      name,
      canPause,
      canUpdateRate,
      canTopup,
      cancelableBySender,
      cancelableByRecipient,
      transferableBySender,
      transferableByRecipient,
      automaticWithdrawal = false,
      withdrawalFrequency = 0,
      partner,
      tokenProgramId: streamTokenProgramId,
    }: ICreateStreamData,
    { sender, metadataPubKeys, isNative = false, computePrice, computeLimit }: ICreateStreamSolanaExt,
  ): Promise<ICreateStreamInstructions> {
    if (!sender.publicKey) {
      throw new Error("Sender's PublicKey is not available, check passed wallet adapter!");
    }

    const ixs: TransactionInstruction[] = prepareBaseInstructions(this.connection, {
      computePrice,
      computeLimit,
    });
    const mintPublicKey = isNative ? NATIVE_MINT : new PublicKey(mint);
    const recipientPublicKey = new PublicKey(recipient);

    const { metadata, metadataPubKey } = this.getOrCreateStreamMetadata(metadataPubKeys);
    const [escrowTokens] = PublicKey.findProgramAddressSync(
      [Buffer.from("strm"), metadataPubKey.toBuffer()],
      this.programId,
    );

    let tokenProgramId = streamTokenProgramId ? new PublicKey(streamTokenProgramId) : undefined;
    if (!tokenProgramId) {
      tokenProgramId = (await getMintAndProgram(this.connection, mintPublicKey)).tokenProgramId;
    }
    const senderTokens = await ata(mintPublicKey, sender.publicKey, tokenProgramId);
    const recipientTokens = await ata(mintPublicKey, recipientPublicKey, tokenProgramId);
    const streamflowTreasuryTokens = await ata(mintPublicKey, STREAMFLOW_TREASURY_PUBLIC_KEY, tokenProgramId);

    const partnerPublicKey = partner ? new PublicKey(partner) : WITHDRAWOR_PUBLIC_KEY;

    const partnerTokens = await ata(mintPublicKey, partnerPublicKey, tokenProgramId);

    ixs.push(
      await createStreamInstruction(
        {
          start: new BN(start),
          depositedAmount,
          period: new BN(period),
          amountPerPeriod,
          cliff: new BN(cliff),
          cliffAmount: new BN(cliffAmount),
          cancelableBySender,
          cancelableByRecipient,
          automaticWithdrawal,
          transferableBySender,
          transferableByRecipient,
          canTopup,
          canUpdateRate: !!canUpdateRate,
          canPause: !!canPause,
          name,
          withdrawFrequency: new BN(automaticWithdrawal ? withdrawalFrequency : period),
        },
        this.programId,
        {
          sender: sender.publicKey,
          senderTokens,
          recipient: new PublicKey(recipient),
          metadata: metadataPubKey,
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
          tokenProgram: tokenProgramId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          withdrawor: WITHDRAWOR_PUBLIC_KEY,
          systemProgram: SystemProgram.programId,
        },
      ),
    );

    return { ixs, metadata, metadataPubKey };
  }

  /**
   * Creates a new stream/vesting contract using unchecked instruction.
   *
   * Unchecked instruction differs from the regular in:
   * - does not check for initialized associated token account (wallets with no control over their ATA should not be used
   * as sender/recipient/partner or there are risks of funds being locked in the contract)
   * - initialized contract PDA off chain
   *
   * If you are not sure if you should use create or create_unchecked, go for create to be safer.
   */
  public async createUnchecked(data: ICreateStreamData, extParams: ICreateStreamSolanaExt): Promise<ICreateResult> {
    const { ixs, metadata, metadataPubKey } = await this.prepareCreateUncheckedInstructions(data, extParams);
    const { tx, hash, context } = await prepareTransaction(
      this.connection,
      ixs,
      extParams.sender.publicKey,
      undefined,
      metadata,
    );
    const signature = await signAndExecuteTransaction(
      this.connection,
      extParams.sender,
      tx,
      {
        hash,
        context,
        commitment: this.getCommitment(),
      },
      this.schedulingParams,
    );

    return { ixs, txId: signature, metadataId: metadataPubKey.toBase58() };
  }

  /**
   * Create Transaction instructions for `createUnchecked`
   */
  public async prepareCreateUncheckedInstructions(
    {
      recipient,
      tokenId: mint,
      start,
      amount: depositedAmount,
      period,
      cliff,
      cliffAmount,
      amountPerPeriod,
      name,
      canTopup,
      canUpdateRate,
      canPause,
      cancelableBySender,
      cancelableByRecipient,
      transferableBySender,
      transferableByRecipient,
      automaticWithdrawal = false,
      withdrawalFrequency = 0,
      partner,
    }: ICreateStreamData,
    { sender, metadataPubKeys, isNative = false, computePrice, computeLimit }: ICreateStreamSolanaExt,
  ): Promise<{
    ixs: TransactionInstruction[];
    metadata: Keypair | undefined;
    metadataPubKey: PublicKey;
  }> {
    if (!sender.publicKey) {
      throw new Error("Sender's PublicKey is not available, check passed wallet adapter!");
    }

    const mintPublicKey = new PublicKey(mint);
    const recipientPublicKey = new PublicKey(recipient);
    const { metadata, metadataPubKey } = this.getOrCreateStreamMetadata(metadataPubKeys);

    const rentToExempt = await this.connection.getMinimumBalanceForRentExemption(METADATA_ACC_SIZE);
    const createMetadataInstruction = SystemProgram.createAccount({
      programId: this.programId,
      space: METADATA_ACC_SIZE,
      lamports: rentToExempt,
      fromPubkey: sender?.publicKey,
      newAccountPubkey: metadataPubKey,
    });

    const [escrowTokens] = PublicKey.findProgramAddressSync(
      [Buffer.from("strm"), metadataPubKey.toBuffer()],
      this.programId,
    );

    const { tokenProgramId } = await getMintAndProgram(this.connection, mintPublicKey);
    const senderTokens = await ata(mintPublicKey, sender.publicKey, tokenProgramId);

    const partnerPublicKey = partner ? new PublicKey(partner) : WITHDRAWOR_PUBLIC_KEY;

    const ixs: TransactionInstruction[] = prepareBaseInstructions(this.connection, {
      computePrice,
      computeLimit,
    });
    if (isNative) {
      const totalFee = await this.getTotalFee({ address: partnerPublicKey.toString() });
      const totalAmount = calculateTotalAmountToDeposit(depositedAmount, totalFee);
      ixs.push(...(await prepareWrappedAccount(this.connection, sender.publicKey, totalAmount)));
    }

    const createInstruction = await createUncheckedStreamInstruction(
      {
        start: new BN(start),
        depositedAmount,
        period: new BN(period),
        amountPerPeriod,
        cliff: new BN(cliff),
        cliffAmount: new BN(cliffAmount),
        cancelableBySender,
        cancelableByRecipient,
        automaticWithdrawal,
        transferableBySender,
        transferableByRecipient,
        canTopup,
        canUpdateRate: !!canUpdateRate,
        canPause: !!canPause,
        name,
        withdrawFrequency: new BN(automaticWithdrawal ? withdrawalFrequency : period),
        recipient: recipientPublicKey,
        partner: partnerPublicKey,
      },
      this.programId,
      {
        sender: sender.publicKey,
        senderTokens,
        metadata: metadataPubKey,
        escrowTokens,
        mint: new PublicKey(mint),
        feeOracle: FEE_ORACLE_PUBLIC_KEY,
        rent: SYSVAR_RENT_PUBKEY,
        timelockProgram: this.programId,
        tokenProgram: tokenProgramId,
        withdrawor: WITHDRAWOR_PUBLIC_KEY,
        systemProgram: SystemProgram.programId,
      },
    );
    ixs.push(createMetadataInstruction, createInstruction);

    return { ixs, metadata, metadataPubKey };
  }

  /**
   * Creates multiple stream/vesting contracts.
   * All fees are paid by sender (escrow metadata account rent, escrow token account rent, recipient's associated token account rent, Streamflow's service fee).
   */
  public async createMultiple(
    data: ICreateMultipleStreamData,
    extParams: ICreateStreamSolanaExt,
  ): Promise<IMultiTransactionResult> {
    const { recipients, ...streamParams } = data;

    const {
      sender,
      metadataPubKeys: metadataPubKeysExt,
      isNative,
      computePrice,
      computeLimit,
      customInstructions,
    } = extParams;

    const metadatas: string[] = [];
    const metadataToRecipient: MetadataRecipientHashMap = {};
    const errors: ICreateMultiError[] = [];
    const signatures: string[] = [];
    const batch: BatchItem[] = [];
    const instructionsBatch: {
      ixs: TransactionInstruction[];
      metadata: Keypair | undefined;
      recipient: string;
    }[] = [];
    const metadataPubKeys = metadataPubKeysExt || [];

    const partnerPublicKey = data.partner ? new PublicKey(data.partner) : WITHDRAWOR_PUBLIC_KEY;
    const mintPublicKey = new PublicKey(data.tokenId);

    if (recipients.length === 0) {
      throw new Error("Recipients array is empty!");
    }

    if (!sender.publicKey) {
      throw new Error("Sender's PublicKey is not available, check passed wallet adapter!");
    }

    for (let i = 0; i < recipients.length; i++) {
      const recipientData = recipients[i];
      const createStreamData = { ...streamParams, ...recipientData };
      const createStreamExtParams = {
        sender,
        metadataPubKeys: metadataPubKeys[i] ? [metadataPubKeys[i]] : undefined,
        computePrice,
        computeLimit,
        customInstructions,
      };

      const { ixs, metadata, metadataPubKey } = await this.prepareCreateInstructions(
        createStreamData,
        createStreamExtParams,
      );

      await this.applyCustomAfterInstructions(ixs, customInstructions, metadataPubKey);
      metadataToRecipient[metadataPubKey.toBase58()] = recipientData;

      metadatas.push(metadataPubKey.toBase58());
      instructionsBatch.push({
        ixs,
        metadata,
        recipient: recipientData.recipient,
      });
    }

    const { value: hash, context } = await this.connection.getLatestBlockhashAndContext();

    for (const { ixs, metadata, recipient } of instructionsBatch) {
      const messageV0 = new TransactionMessage({
        payerKey: sender.publicKey,
        recentBlockhash: hash.blockhash,
        instructions: ixs,
      }).compileToV0Message();
      const tx = new VersionedTransaction(messageV0);
      if (metadata) {
        tx.sign([metadata]);
      }
      batch.push({ tx, recipient });
    }

    const prepareInstructions = await this.getCreateATAInstructions(
      [STREAMFLOW_TREASURY_PUBLIC_KEY, partnerPublicKey],
      mintPublicKey,
      sender,
      true,
    );

    if (isNative) {
      const totalDepositedAmount = recipients.reduce((acc, recipient) => recipient.amount.add(acc), new BN(0));
      const nativeInstructions = await prepareWrappedAccount(this.connection, sender.publicKey, totalDepositedAmount);
      prepareInstructions.push(...nativeInstructions);
    }

    if (prepareInstructions.length > 0) {
      const messageV0 = new TransactionMessage({
        payerKey: sender.publicKey,
        recentBlockhash: hash.blockhash,
        instructions: prepareInstructions,
      }).compileToV0Message();
      const tx = new VersionedTransaction(messageV0);

      batch.push({
        tx,
        recipient: sender.publicKey.toBase58(),
      });
    }

    const signedBatch: BatchItem[] = await signAllTransactionWithRecipients(sender, batch);

    if (prepareInstructions.length > 0) {
      const prepareTx = signedBatch.pop();
      await sendAndConfirmStreamRawTransaction(this.connection, prepareTx!, { hash, context }, this.schedulingParams);
    }

    const responses: PromiseSettledResult<string>[] = [];
    if (metadataPubKeys.length > 0) {
      //if metadata pub keys were passed we should execute transaction sequentially
      //ephemeral signer need to be used first before proceeding with the next
      for (const batchTx of signedBatch) {
        responses.push(
          ...(await Promise.allSettled([
            executeTransaction(this.connection, batchTx.tx, { hash, context }, this.schedulingParams),
          ])),
        );
      }
    } else {
      //send all transactions in parallel and wait for them to settle.
      //it allows to speed up the process of sending transactions
      //we then filter all promise responses and handle failed transactions
      responses.push(
        ...(await executeMultipleTransactions(
          this.connection,
          signedBatch.map((item) => item.tx),
          { hash, context },
          this.schedulingParams,
        )),
      );
    }

    responses.forEach((item, index) => {
      if (item.status === "fulfilled") {
        signatures.push(item.value);
      } else {
        errors.push({
          recipient: signedBatch[index].recipient,
          error: item.reason,
          contractErrorCode: this.extractErrorCode(item.reason) || undefined,
        });
      }
    });

    return { txs: signatures, metadatas, metadataToRecipient, errors };
  }

  /**
   * Creates multiple stream/vesting contracts, and send all transactions sequentially.
   * All fees are paid by sender (escrow metadata account rent, escrow token account rent, recipient's associated token account rent, Streamflow's service fee).
   * In most cases, createMultiple should be used instead.
   */
  public async createMultipleSequential(
    data: ICreateMultipleStreamData,
    extParams: ICreateStreamSolanaExt,
  ): Promise<IMultiTransactionResult> {
    const { recipients, ...streamParams } = data;

    const {
      sender,
      metadataPubKeys: metadataPubKeysExt,
      isNative,
      computePrice,
      computeLimit,
      customInstructions,
    } = extParams;

    const metadatas: string[] = [];
    const metadataToRecipient: MetadataRecipientHashMap = {};
    const errors: ICreateMultiError[] = [];
    const signatures: string[] = [];
    const batch: BatchItem[] = [];
    const instructionsBatch: {
      ixs: TransactionInstruction[];
      metadata: Keypair | undefined;
      recipient: string;
    }[] = [];
    const metadataPubKeys = metadataPubKeysExt || [];

    const partnerPublicKey = data.partner ? new PublicKey(data.partner) : WITHDRAWOR_PUBLIC_KEY;
    const mintPublicKey = new PublicKey(data.tokenId);

    if (recipients.length === 0) {
      throw new Error("Recipients array is empty!");
    }

    if (!sender.publicKey) {
      throw new Error("Sender's PublicKey is not available, check passed wallet adapter!");
    }

    for (let i = 0; i < recipients.length; i++) {
      const recipientData = recipients[i];
      const createStreamData = { ...streamParams, ...recipientData };
      const createStreamExtParams = {
        sender,
        metadataPubKeys: metadataPubKeys[i] ? [metadataPubKeys[i]] : undefined,
        computePrice,
        computeLimit,
        customInstructions,
      };

      const { ixs, metadata, metadataPubKey } = await this.prepareCreateInstructions(
        createStreamData,
        createStreamExtParams,
      );

      await this.applyCustomAfterInstructions(ixs, customInstructions, metadataPubKey);
      metadataToRecipient[metadataPubKey.toBase58()] = recipientData;

      metadatas.push(metadataPubKey.toBase58());
      instructionsBatch.push({
        ixs,
        metadata,
        recipient: recipientData.recipient,
      });
    }

    const { value: hash, context } = await this.connection.getLatestBlockhashAndContext();

    for (const { ixs, metadata, recipient } of instructionsBatch) {
      const messageV0 = new TransactionMessage({
        payerKey: sender.publicKey,
        recentBlockhash: hash.blockhash,
        instructions: ixs,
      }).compileToV0Message();
      const tx = new VersionedTransaction(messageV0);
      if (metadata) {
        tx.sign([metadata]);
      }
      batch.push({ tx, recipient });
    }

    const prepareInstructions = await this.getCreateATAInstructions(
      [STREAMFLOW_TREASURY_PUBLIC_KEY, partnerPublicKey],
      mintPublicKey,
      sender,
      true,
    );

    if (isNative) {
      const totalDepositedAmount = recipients.reduce((acc, recipient) => recipient.amount.add(acc), new BN(0));
      const nativeInstructions = await prepareWrappedAccount(this.connection, sender.publicKey, totalDepositedAmount);
      prepareInstructions.push(...nativeInstructions);
    }

    if (prepareInstructions.length > 0) {
      const messageV0 = new TransactionMessage({
        payerKey: sender.publicKey,
        recentBlockhash: hash.blockhash,
        instructions: prepareInstructions,
      }).compileToV0Message();
      const tx = new VersionedTransaction(messageV0);

      batch.push({
        tx,
        recipient: sender.publicKey.toBase58(),
      });
    }

    const signedBatch: BatchItem[] = await signAllTransactionWithRecipients(sender, batch);

    if (prepareInstructions.length > 0) {
      const prepareTx = signedBatch.shift();
      await sendAndConfirmStreamRawTransaction(this.connection, prepareTx!, { hash, context }, this.schedulingParams);
    }

    const responses: PromiseSettledResult<string>[] = [];

    for (const batchTx of signedBatch) {
      responses.push(
        ...(await Promise.allSettled([
          executeTransaction(this.connection, batchTx.tx, { hash, context }, this.schedulingParams),
        ])),
      );
    }

    responses.forEach((item, index) => {
      if (item.status === "fulfilled") {
        signatures.push(item.value);
      } else {
        errors.push({
          recipient: signedBatch[index].recipient,
          error: item.reason,
          contractErrorCode: this.extractErrorCode(item.reason) || undefined,
        });
      }
    });

    return { txs: signatures, metadatas, metadataToRecipient, errors };
  }

  /**
   * Attempts withdrawing from the specified stream.
   */
  public async withdraw(
    { id, amount = WITHDRAW_AVAILABLE_AMOUNT }: IWithdrawData,
    extParams: IInteractStreamSolanaExt,
  ): Promise<ITransactionResult> {
    const { invoker, customInstructions } = extParams;

    if (!invoker.publicKey) {
      throw new Error("Invoker's PublicKey is not available, check passed wallet adapter!");
    }

    const ixs: TransactionInstruction[] = await this.prepareWithdrawInstructions({ id, amount }, extParams);

    const metadata = new PublicKey(id);
    await this.applyCustomAfterInstructions(ixs, customInstructions, metadata);

    const { tx, hash, context } = await prepareTransaction(this.connection, ixs, invoker.publicKey);
    const signature = await signAndExecuteTransaction(
      this.connection,
      extParams.invoker,
      tx,
      {
        hash,
        context,
        commitment: this.getCommitment(),
      },
      this.schedulingParams,
    );

    return { ixs, txId: signature };
  }

  /**
   * Creates Transaction Instructions for withdrawal
   */
  public async prepareWithdrawInstructions(
    { id, amount = WITHDRAW_AVAILABLE_AMOUNT }: IWithdrawData,
    { invoker, checkTokenAccounts, computePrice, computeLimit }: IInteractStreamSolanaExt,
  ): Promise<TransactionInstruction[]> {
    if (!invoker.publicKey) {
      throw new Error("Invoker's PublicKey is not available, check passed wallet adapter!");
    }

    const ixs: TransactionInstruction[] = prepareBaseInstructions(this.connection, {
      computePrice,
      computeLimit,
    });
    const streamPublicKey = new PublicKey(id);

    const escrow = await this.connection.getAccountInfo(streamPublicKey);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info");
    }

    const data = decodeStream(escrow.data);
    const { sender, recipient, mint, streamflowTreasury, partner, recipientTokens, escrowTokens } = data;
    const { tokenProgramId } = await getMintAndProgram(this.connection, mint);
    const streamflowTreasuryTokens = await ata(mint, STREAMFLOW_TREASURY_PUBLIC_KEY, tokenProgramId);
    const partnerTokens = await ata(mint, partner, tokenProgramId);
    const ataIx = await this.getCreateATAInstructions(
      [sender, recipient, streamflowTreasury, partner],
      mint,
      invoker,
      checkTokenAccounts,
      tokenProgramId,
    );

    ixs.push(
      ...ataIx,
      await withdrawStreamInstruction(amount, this.programId, {
        partner,
        partnerTokens,
        mint,
        streamflowTreasuryTokens,
        recipientTokens,
        escrowTokens,
        authority: invoker.publicKey,
        recipient: invoker.publicKey,
        metadata: streamPublicKey,
        streamflowTreasury: STREAMFLOW_TREASURY_PUBLIC_KEY,
        tokenProgram: tokenProgramId,
      }),
    );

    return ixs;
  }

  /**
   * Attempts canceling the specified stream.
   */
  public async cancel(cancelData: ICancelData, extParams: IInteractStreamSolanaExt): Promise<ITransactionResult> {
    const ixs = await this.prepareCancelInstructions(cancelData, extParams);
    const { tx, hash, context } = await prepareTransaction(this.connection, ixs, extParams.invoker.publicKey);
    const signature = await signAndExecuteTransaction(
      this.connection,
      extParams.invoker,
      tx,
      {
        hash,
        context,
        commitment: this.getCommitment(),
      },
      this.schedulingParams,
    );

    return { ixs, txId: signature };
  }

  public async prepareCancelInstructions(
    cancelData: ICancelData,
    extParams: IInteractStreamSolanaExt,
  ): Promise<TransactionInstruction[]> {
    const streamPublicKey = new PublicKey(cancelData.id);
    const account = await this.connection.getAccountInfo(streamPublicKey);
    if (!account) {
      throw new Error("Impossible to cancel a stream contract that does not exist");
    }
    const { sender: senderPublicKey } = decodeStream(account.data);
    const isAlignedUnlock = this.isAlignedUnlock(streamPublicKey, senderPublicKey);

    const ixs = isAlignedUnlock
      ? await this.prepareCancelAlignedUnlockInstructions(cancelData, extParams)
      : await this.prepareCancelStreamInstructions(cancelData, extParams);

    return ixs;
  }

  public async prepareCancelAlignedUnlockInstructions(
    { id }: ICancelData,
    { invoker, checkTokenAccounts, computePrice, computeLimit }: IInteractStreamSolanaExt,
  ): Promise<TransactionInstruction[]> {
    if (!invoker.publicKey) {
      throw new Error("Invoker's PublicKey is not available, check passed wallet adapter!");
    }
    const streamPublicKey = new PublicKey(id);
    const escrowAcc = await this.connection.getAccountInfo(streamPublicKey);
    if (!escrowAcc?.data) {
      throw new Error("Couldn't get account info");
    }

    const streamData = decodeStream(escrowAcc.data);
    const { sender, recipient, mint, streamflowTreasury, partner, escrowTokens } = streamData;
    const { tokenProgramId } = await getMintAndProgram(this.connection, mint);
    const ixs: TransactionInstruction[] = prepareBaseInstructions(this.connection, {
      computePrice,
      computeLimit: computeLimit ?? ALIGNED_COMPUTE_LIMIT,
    });
    const ataIx = await this.getCreateATAInstructions(
      [sender, recipient, partner, streamflowTreasury],
      mint,
      invoker,
      checkTokenAccounts,
      tokenProgramId,
    );

    const cancelIx = await this.alignedProxyProgram.methods
      .cancel()
      .accountsPartial({
        mint,
        partner,
        recipient,
        escrowTokens,
        sender: invoker.publicKey,
        streamMetadata: streamPublicKey,
        streamflowTreasury: STREAMFLOW_TREASURY_PUBLIC_KEY,
        tokenProgram: tokenProgramId,
        streamflowProgram: this.programId,
      })
      .instruction();

    ixs.push(...ataIx, cancelIx);

    return ixs;
  }

  /**
   * Creates Transaction Instructions for cancel
   */
  public async prepareCancelStreamInstructions(
    { id }: ICancelData,
    { invoker, checkTokenAccounts, computePrice, computeLimit }: IInteractStreamSolanaExt,
  ): Promise<TransactionInstruction[]> {
    if (!invoker.publicKey) {
      throw new Error("Invoker's PublicKey is not available, check passed wallet adapter!");
    }

    const streamPublicKey = new PublicKey(id);
    const escrowAcc = await this.connection.getAccountInfo(streamPublicKey);
    if (!escrowAcc?.data) {
      throw new Error("Couldn't get account info");
    }

    const data = decodeStream(escrowAcc.data);
    const { sender, recipient, partner, streamflowTreasury, mint, senderTokens, recipientTokens, escrowTokens } = data;

    const { tokenProgramId } = await getMintAndProgram(this.connection, mint);
    const streamflowTreasuryTokens = await ata(mint, STREAMFLOW_TREASURY_PUBLIC_KEY, tokenProgramId);
    const partnerTokens = await ata(mint, partner, tokenProgramId);

    const ixs: TransactionInstruction[] = prepareBaseInstructions(this.connection, {
      computePrice,
      computeLimit,
    });
    const ixsAta = await this.getCreateATAInstructions(
      [sender, recipient, partner, streamflowTreasury],
      mint,
      invoker,
      checkTokenAccounts,
      tokenProgramId,
    );

    ixs.push(
      ...ixsAta,
      await cancelStreamInstruction(this.programId, {
        sender,
        senderTokens,
        recipient,
        recipientTokens,
        streamflowTreasuryTokens,
        partner,
        partnerTokens,
        mint,
        escrowTokens,
        authority: invoker.publicKey,
        metadata: streamPublicKey,
        streamflowTreasury: STREAMFLOW_TREASURY_PUBLIC_KEY,
        tokenProgram: tokenProgramId,
      }),
    );

    return ixs;
  }

  /**
   * Attempts changing the stream/vesting contract's recipient (effectively transferring the stream/vesting contract).
   * Potential associated token account rent fee (to make it rent-exempt) is paid by the transaction initiator.
   */
  public async transfer(
    { id, newRecipient }: ITransferData,
    extParams: IInteractStreamSolanaExt,
  ): Promise<ITransactionResult> {
    const ixs: TransactionInstruction[] = await this.prepareTransferInstructions({ id, newRecipient }, extParams);
    const { tx, hash, context } = await prepareTransaction(this.connection, ixs, extParams.invoker.publicKey);
    const signature = await signAndExecuteTransaction(
      this.connection,
      extParams.invoker,
      tx,
      {
        hash,
        context,
        commitment: this.getCommitment(),
      },
      this.schedulingParams,
    );

    return { ixs, txId: signature };
  }

  /**
   * Attempts changing the stream/vesting contract's recipient (effectively transferring the stream/vesting contract).
   * Potential associated token account rent fee (to make it rent-exempt) is paid by the transaction initiator.
   */
  public async prepareTransferInstructions(
    { id, newRecipient }: ITransferData,
    { invoker, computePrice, computeLimit = 100001 }: IInteractStreamSolanaExt,
  ): Promise<TransactionInstruction[]> {
    if (!invoker.publicKey) {
      throw new Error("Invoker's PublicKey is not available, check passed wallet adapter!");
    }

    const ixs: TransactionInstruction[] = prepareBaseInstructions(this.connection, {
      computePrice,
      computeLimit,
    });
    const stream = new PublicKey(id);
    const newRecipientPublicKey = new PublicKey(newRecipient);
    const escrow = await this.connection.getAccountInfo(stream);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info");
    }
    const { mint } = decodeStream(escrow?.data);
    const { tokenProgramId } = await getMintAndProgram(this.connection, mint);

    const newRecipientTokens = await ata(mint, newRecipientPublicKey, tokenProgramId);

    ixs.push(
      await transferStreamInstruction(this.programId, {
        authority: invoker.publicKey,
        newRecipient: newRecipientPublicKey,
        newRecipientTokens,
        metadata: stream,
        mint,
        rent: SYSVAR_RENT_PUBKEY,
        tokenProgram: tokenProgramId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      }),
    );

    return ixs;
  }

  /**
   * Tops up stream account with specified amount.
   */
  public async topup({ id, amount }: ITopUpData, extParams: ITopUpStreamSolanaExt): Promise<ITransactionResult> {
    const ixs: TransactionInstruction[] = await this.prepareTopupInstructions({ id, amount }, extParams);
    const { tx, hash, context } = await prepareTransaction(this.connection, ixs, extParams.invoker.publicKey);
    const signature = await signAndExecuteTransaction(
      this.connection,
      extParams.invoker,
      tx,
      {
        hash,
        context,
        commitment: this.getCommitment(),
      },
      this.schedulingParams,
    );

    return { ixs, txId: signature };
  }

  /**
   * Create Transaction instructions for topup
   */
  public async prepareTopupInstructions(
    { id, amount }: ITopUpData,
    { invoker, isNative, computePrice, computeLimit }: ITopUpStreamSolanaExt,
  ): Promise<TransactionInstruction[]> {
    if (!invoker.publicKey) {
      throw new Error("Invoker's PublicKey is not available, check passed wallet adapter!");
    }

    const ixs: TransactionInstruction[] = prepareBaseInstructions(this.connection, {
      computePrice,
      computeLimit,
    });
    const streamPublicKey = new PublicKey(id);
    const escrow = await this.connection.getAccountInfo(streamPublicKey);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info");
    }
    const { mint, partner, senderTokens, escrowTokens } = decodeStream(escrow?.data);

    const { tokenProgramId } = await getMintAndProgram(this.connection, mint);
    const streamflowTreasuryTokens = await ata(mint, STREAMFLOW_TREASURY_PUBLIC_KEY, tokenProgramId);
    const partnerTokens = await ata(mint, partner, tokenProgramId);

    if (isNative) {
      ixs.push(...(await prepareWrappedAccount(this.connection, invoker.publicKey, amount)));
    }

    ixs.push(
      await topupStreamInstruction(amount, this.programId, {
        sender: invoker.publicKey,
        senderTokens,
        metadata: streamPublicKey,
        escrowTokens,
        streamflowTreasury: STREAMFLOW_TREASURY_PUBLIC_KEY,
        streamflowTreasuryTokens: streamflowTreasuryTokens,
        partner: partner,
        partnerTokens: partnerTokens,
        mint,
        tokenProgram: tokenProgramId,
        withdrawor: WITHDRAWOR_PUBLIC_KEY,
        systemProgram: SystemProgram.programId,
      }),
    );

    return ixs;
  }

  /**
   * Fetch stream data by its id (address).
   */
  public async getOne({ id }: IGetOneData): Promise<Stream> {
    const streamPublicKey = new PublicKey(id);
    const escrow = await this.connection.getAccountInfo(streamPublicKey, TX_FINALITY_CONFIRMED);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info.");
    }
    const stream = decodeStream(escrow.data);

    if (this.isAlignedUnlock(streamPublicKey, stream.sender)) {
      const alignedProxy = await this.alignedProxyProgram.account.contract.fetch(
        deriveContractPDA(this.alignedProxyProgram.programId, streamPublicKey),
      );
      if (!alignedProxy) {
        throw new Error("Couldn't get proxy account info.");
      }
      return new AlignedContract(stream, alignedProxy);
    }
    return new Contract(stream);
  }

  /**
   * Fetch all aligned outgoing streams/contracts by the provided public key.
   */
  private async getOutgoingAlignedStreams(sender: string): Promise<Record<string, Stream>> {
    const streams: Record<string, Stream> = {};

    const alignedOutgoingProgramAccounts = await this.alignedProxyProgram.account.contract.all([
      {
        memcmp: {
          offset: ORIGINAL_CONTRACT_SENDER_OFFSET,
          bytes: sender,
        },
      },
      {
        dataSize: ALIGNED_METADATA_ACC_SIZE,
      },
    ]);
    const streamPubKeys = alignedOutgoingProgramAccounts.map((account) => account.account.stream);
    const streamAccounts = await getMultipleAccountsInfoBatched(this.connection, streamPubKeys, TX_FINALITY_CONFIRMED);
    streamAccounts.forEach((account, index) => {
      if (account) {
        const alignedData = alignedOutgoingProgramAccounts[index].account;
        streams[streamPubKeys[index].toBase58()] = new AlignedContract(decodeStream(account.data), alignedData);
      }
    });

    return streams;
  }

  private async getIncomingAlignedStreams(
    streamRecord: Record<string, DecodedStream>,
  ): Promise<Record<string, Stream>> {
    const streams: Record<string, Stream> = {};
    const alignedStreamsPubKeys = Object.keys(streamRecord);
    const alignedProxyPDAs = alignedStreamsPubKeys.map((streamPubKey) =>
      deriveContractPDA(this.alignedProxyProgram.programId, new PublicKey(streamPubKey)),
    );
    const alignedProxyAccounts = await getMultipleAccountsInfoBatched(this.connection, alignedProxyPDAs);
    alignedProxyAccounts.forEach((account, index) => {
      if (account && account.data.length === ALIGNED_METADATA_ACC_SIZE) {
        const alignedData = streamRecord[alignedStreamsPubKeys[index]];
        streams[alignedStreamsPubKeys[index]] = new AlignedContract(
          alignedData,
          this.alignedProxyProgram.account.contract.coder.accounts.decode("contract", account.data),
        );
      }
    });
    return streams;
  }

  /**
   * Fetch streams/contracts by providing direction.
   * Streams are sorted by start time in ascending order.
   */
  public async get({
    address,
    type = StreamType.All,
    direction = StreamDirection.All,
  }: IGetAllData): Promise<[string, Stream][]> {
    const publicKey = new PublicKey(address);
    let streams: Record<string, Stream> = {};
    // don't do unnecessary rpc calls if we are not querying for vesting streams
    const shouldFetchAligned = type === StreamType.All || type === StreamType.Vesting;

    if (direction !== StreamDirection.Incoming) {
      const outgoingStreamAccounts = await getProgramAccounts(
        this.connection,
        publicKey,
        STREAM_STRUCT_OFFSET_SENDER,
        this.programId,
      );
      outgoingStreamAccounts.forEach((account) => {
        streams[account.pubkey.toBase58()] = new Contract(decodeStream(account.account.data));
      });

      if (shouldFetchAligned) {
        const alignedStreams = await this.getOutgoingAlignedStreams(address);
        streams = { ...streams, ...alignedStreams };
      }
    }
    if (direction !== StreamDirection.Outgoing) {
      const allIncomingAccounts = await getProgramAccounts(
        this.connection,
        publicKey,
        STREAM_STRUCT_OFFSET_RECIPIENT,
        this.programId,
      );

      const allIncomingStreams = allIncomingAccounts.map((account) => decodeStream(account.account.data));

      const alignedDecoded: Record<string, DecodedStream> = {};

      // filter out aligned unlocks and store them in a separate object
      allIncomingAccounts.forEach((account, index) => {
        if (this.isAlignedUnlock(account.pubkey, allIncomingStreams[index].sender)) {
          alignedDecoded[account.pubkey.toBase58()] = allIncomingStreams[index];
        } else {
          streams[account.pubkey.toBase58()] = new Contract(allIncomingStreams[index]);
        }
      });

      if (shouldFetchAligned) {
        const incomingAlignedStreams = await this.getIncomingAlignedStreams(alignedDecoded);
        streams = { ...streams, ...incomingAlignedStreams };
      }
    }

    const sortedStreams = Object.entries(streams).sort(([, stream1], [, stream2]) => stream2.start - stream1.start);

    if (type === StreamType.All) return sortedStreams;

    return sortedStreams.filter((stream) => stream[1].type === type);
  }

  public async searchStreams(data: ISearchStreams): Promise<IProgramAccount<Stream>[]> {
    const filters: (MemcmpFilter | DataSizeFilter)[] = Object.entries(data)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, value]) => value !== undefined) // Only keep entries where the value is truthy
      .map(([key, value]) => ({
        memcmp: {
          offset: STREAM_STRUCT_OFFSETS[key as keyof ISearchStreams],
          bytes: typeof value === "boolean" ? bs58.encode([Number(value)]) : value.toString(),
        },
      }));
    filters.push({ dataSize: METADATA_ACC_SIZE });
    const accounts = await this.connection.getProgramAccounts(this.programId, {
      filters,
    });

    return accounts.map(({ pubkey, account }) => ({
      publicKey: pubkey,
      account: new Contract(decodeStream(account.data)),
    }));
  }

  /**
   * Attempts updating the stream auto withdrawal params and amount per period
   */
  public async update(data: IUpdateData, extParams: IInteractStreamSolanaExt): Promise<ITransactionResult> {
    const ixs = await this.prepareUpdateInstructions(data, extParams);
    const { tx, hash, context } = await prepareTransaction(this.connection, ixs, extParams.invoker.publicKey);
    const signature = await signAndExecuteTransaction(
      this.connection,
      extParams.invoker,
      tx,
      {
        hash,
        context,
        commitment: this.getCommitment(),
      },
      this.schedulingParams,
    );

    return {
      ixs,
      txId: signature,
    };
  }

  /**
   * Create Transaction instructions for update
   */
  public async prepareUpdateInstructions(
    data: IUpdateData,
    { invoker, computePrice, computeLimit }: IInteractStreamSolanaExt,
  ): Promise<TransactionInstruction[]> {
    if (!invoker.publicKey) {
      throw new Error("Invoker's PublicKey is not available, check passed wallet adapter!");
    }

    const streamPublicKey = new PublicKey(data.id);
    const escrow = await this.connection.getAccountInfo(streamPublicKey);

    if (!escrow) {
      throw new Error("Couldn't get account info");
    }
    const ixs: TransactionInstruction[] = prepareBaseInstructions(this.connection, {
      computePrice,
      computeLimit,
    });
    ixs.push(
      await updateStreamInstruction(data, this.programId, {
        authority: invoker.publicKey,
        metadata: streamPublicKey,
        withdrawor: WITHDRAWOR_PUBLIC_KEY,
        systemProgram: SystemProgram.programId,
      }),
    );

    return ixs;
  }

  public async getFees({ address }: IGetFeesData): Promise<IFees | null> {
    const [metadataPubKey] = PublicKey.findProgramAddressSync(
      [Buffer.from(FEES_METADATA_SEED)],
      new PublicKey(PARTNER_ORACLE_PROGRAM_ID),
    );
    const data = await this.connection.getAccountInfo(metadataPubKey);
    if (!data) {
      return null;
    }
    const partners = borsh.deserialize(PARTNERS_SCHEMA, data.data) as unknown as IPartnerLayout[];
    const filteredPartners = partners.filter((item) => new PublicKey(item.pubkey).toString() === address);
    if (filteredPartners.length === 0) {
      return null;
    }
    return {
      streamflowFee: Number(filteredPartners[0].strm_fee.toFixed(4)),
      partnerFee: Number(filteredPartners[0].partner_fee.toFixed(4)),
    };
  }

  public async getDefaultStreamflowFee(): Promise<number> {
    return DEFAULT_STREAMFLOW_FEE;
  }

  public extractErrorCode(err: Error): string | null {
    const logs = "logs" in err && Array.isArray(err.logs) ? err.logs : undefined;
    return extractSolanaErrorCode(err.toString() ?? "Unknown error!", logs);
  }

  /**
   * Utility function to generate metadata for a Contract or return existing Pubkey
   */
  private getOrCreateStreamMetadata(metadataPubKeys?: PublicKey[]) {
    let metadata;
    let metadataPubKey;

    if (!metadataPubKeys) {
      metadata = Keypair.generate();
      metadataPubKey = metadata.publicKey;
    } else {
      metadataPubKey = metadataPubKeys[0];
    }

    return { metadata, metadataPubKey };
  }

  /**
   * Utility function that checks whether the associated stream address is an aligned unlock contract, indicated by whether the sender/creator is a PDA
   */
  private isAlignedUnlock(streamPublicKey: PublicKey, senderPublicKey: PublicKey) {
    const pda = deriveContractPDA(this.alignedProxyProgram.programId, streamPublicKey);
    return senderPublicKey.equals(pda);
  }

  /**
   * Returns insrtuctions for creating associated token accounts for the provided owners
   */
  private async getCreateATAInstructions(
    owners: PublicKey[],
    mint: PublicKey,
    invoker: Keypair | SignerWalletAdapter,
    checkTokenAccounts: boolean | undefined,
    programId?: PublicKey,
  ): Promise<TransactionInstruction[]> {
    if (!checkTokenAccounts) {
      return [];
    }
    // filter out duplicate PublicKeys, otherwise transaction will fail
    const uniqueOwners = Array.from(new Set(owners.map((owner) => owner.toBase58()))).map(
      (pkString) => new PublicKey(pkString),
    );
    return checkOrCreateAtaBatch(this.connection, uniqueOwners, mint, invoker, programId);
  }

  private async applyCustomAfterInstructions(
    ixs: TransactionInstruction[],
    customInstructions: ITransactionSolanaExtWithInstructions["customInstructions"],
    metadata?: PublicKey,
  ): Promise<void> {
    if (customInstructions?.after) {
      const afterInstructions =
        typeof customInstructions.after === "function"
          ? await customInstructions.after({
              instructions: ixs,
              metadata,
            })
          : customInstructions.after;
      ixs.push(...afterInstructions);
    }
  }
}
