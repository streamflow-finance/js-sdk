// Latest version of the SDK that does not use Anchor. It supports raw instructions.

import BN from "bn.js";
import { Buffer } from "buffer";
import PQueue from "p-queue";
import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  Commitment,
  ConnectionConfig,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  CheckAssociatedTokenAccountsData,
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
} from "@streamflow/common/solana";
import * as borsh from "borsh";

import {
  Account,
  MetadataRecipientHashMap,
  Contract,
  BatchItem,
  ICreateStreamSolanaExt,
  IInteractStreamSolanaExt,
  ITopUpStreamSolanaExt,
} from "./types";
import {
  decodeStream,
  extractSolanaErrorCode,
  sendAndConfirmStreamRawTransaction,
  signAllTransactionWithRecipients,
} from "./utils";
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
} from "./constants";
import {
  withdrawStreamInstruction,
  cancelStreamInstruction,
  transferStreamInstruction,
  topupStreamInstruction,
  createStreamInstruction,
  createUncheckedStreamInstruction,
  updateStreamInstruction,
} from "./instructions";
import {
  ICancelData,
  ICluster,
  ICreateMultipleStreamData,
  ICreateResult,
  ICreateStreamData,
  IGetAllData,
  IGetFeesData,
  IGetOneData,
  IFees,
  IMultiTransactionResult,
  IRecipient,
  IStreamConfig,
  ITopUpData,
  ITransactionResult,
  ITransferData,
  IUpdateData,
  IWithdrawData,
  StreamDirection,
  StreamType,
  Stream,
  ICreateMultiError,
} from "../common/types";
import { BaseStreamClient } from "../common/BaseStreamClient";
import { IPartnerLayout } from "./instructionTypes";
import { calculateTotalAmountToDeposit } from "../common/utils";
import { WITHDRAW_AVAILABLE_AMOUNT } from "../common/constants";

const METADATA_ACC_SIZE = 1104;

export default class SolanaStreamClient extends BaseStreamClient {
  private connection: Connection;

  private programId: PublicKey;

  private commitment: Commitment | ConnectionConfig;

  private sendThrottler: PQueue;

  /**
   * Create Stream instance
   */
  constructor(
    clusterUrl: string,
    cluster: ICluster = ICluster.Mainnet,
    commitment: Commitment | ConnectionConfig = "confirmed",
    programId = "",
    sendRate = 1,
    sendThrottler?: PQueue,
  ) {
    super();
    this.commitment = commitment;
    this.connection = new Connection(clusterUrl, this.commitment);
    this.programId = programId !== "" ? new PublicKey(programId) : new PublicKey(PROGRAM_ID[cluster]);
    this.sendThrottler = sendThrottler ?? buildSendThrottler(sendRate);
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
    const { ixs, metadata, metadataPubKey } = await this.prepareCreateInstructions(data, extParams);
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
      { sendThrottler: this.sendThrottler },
    );

    return { ixs, txId: signature, metadataId: metadataPubKey.toBase58() };
  }

  /**
   * Creates a new stream/vesting contract.
   * All fees are paid by sender (escrow metadata account rent, escrow token account rent, recipient's associated token account rent, Streamflow's service fee).
   */
  public async prepareCreateInstructions(
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

    const { tokenProgramId } = await getMintAndProgram(this.connection, mintPublicKey);
    const senderTokens = await ata(mintPublicKey, sender.publicKey, tokenProgramId);
    const recipientTokens = await ata(mintPublicKey, recipientPublicKey, tokenProgramId);
    const streamflowTreasuryTokens = await ata(mintPublicKey, STREAMFLOW_TREASURY_PUBLIC_KEY, tokenProgramId);

    const partnerPublicKey = partner ? new PublicKey(partner) : STREAMFLOW_TREASURY_PUBLIC_KEY;

    const partnerTokens = await ata(mintPublicKey, partnerPublicKey, tokenProgramId);

    if (isNative) {
      const totalFee = await this.getTotalFee({
        address: partner ?? sender.publicKey.toBase58(),
      });
      const totalAmount = calculateTotalAmountToDeposit(depositedAmount, totalFee);
      ixs.push(...(await prepareWrappedAccount(this.connection, sender.publicKey, totalAmount)));
    }

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
      { sendThrottler: this.sendThrottler },
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

    const partnerPublicKey = partner ? new PublicKey(partner) : STREAMFLOW_TREASURY_PUBLIC_KEY;

    const ixs: TransactionInstruction[] = prepareBaseInstructions(this.connection, {
      computePrice,
      computeLimit,
    });
    if (isNative) {
      const totalFee = await this.getTotalFee({ address: partner ?? sender.publicKey.toBase58() });
      const totalAmount = calculateTotalAmountToDeposit(depositedAmount, totalFee);
      ixs.push(...(await prepareWrappedAccount(this.connection, sender.publicKey, totalAmount)));
    }

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
    { sender, metadataPubKeys, isNative = false, computePrice, computeLimit }: ICreateStreamSolanaExt,
  ): Promise<IMultiTransactionResult> {
    const { recipients } = data;

    if (!sender.publicKey) {
      throw new Error("Sender's PublicKey is not available, check passed wallet adapter!");
    }

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
    metadataPubKeys = metadataPubKeys || [];

    for (let i = 0; i < recipients.length; i++) {
      const recipientData = recipients[i];
      const { ixs, metadata, metadataPubKey } = await this.prepareStreamInstructions(recipientData, data, {
        sender,
        metadataPubKeys: metadataPubKeys[i] ? [metadataPubKeys[i]] : undefined,
        computePrice,
        computeLimit,
      });

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

    if (isNative) {
      const totalDepositedAmount = recipients.reduce((acc, recipient) => recipient.amount.add(acc), new BN(0));
      const nativeInstructions = await prepareWrappedAccount(this.connection, sender.publicKey, totalDepositedAmount);

      const messageV0 = new TransactionMessage({
        payerKey: sender.publicKey,
        recentBlockhash: hash.blockhash,
        instructions: nativeInstructions,
      }).compileToV0Message();
      const tx = new VersionedTransaction(messageV0);

      batch.push({
        tx,
        recipient: sender.publicKey.toBase58(),
      });
    }

    const signedBatch: BatchItem[] = await signAllTransactionWithRecipients(sender, batch);

    if (isNative) {
      const prepareTx = signedBatch.pop();
      await sendAndConfirmStreamRawTransaction(
        this.connection,
        prepareTx!,
        { hash, context },
        { sendThrottler: this.sendThrottler },
      );
    }

    const responses: PromiseSettledResult<string>[] = [];
    if (metadataPubKeys.length > 0) {
      //if metadata pub keys were passed we should execute transaction sequentially
      //ephemeral signer need to be used first before proceeding with the next
      for (const batchTx of signedBatch) {
        responses.push(
          ...(await Promise.allSettled([
            executeTransaction(this.connection, batchTx.tx, { hash, context }, { sendThrottler: this.sendThrottler }),
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
          { sendThrottler: this.sendThrottler },
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
   * Attempts withdrawing from the specified stream.
   */
  public async withdraw(
    { id, amount = WITHDRAW_AVAILABLE_AMOUNT }: IWithdrawData,
    extParams: IInteractStreamSolanaExt,
  ): Promise<ITransactionResult> {
    const ixs: TransactionInstruction[] = await this.prepareWithdrawInstructions({ id, amount }, extParams);
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
      { sendThrottler: this.sendThrottler },
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
    const { tokenProgramId } = await getMintAndProgram(this.connection, data.mint);
    const streamflowTreasuryTokens = await ata(data.mint, STREAMFLOW_TREASURY_PUBLIC_KEY, tokenProgramId);
    const partnerTokens = await ata(data.mint, data.partner, tokenProgramId);
    await this.checkAssociatedTokenAccounts(data, { invoker, checkTokenAccounts }, ixs, tokenProgramId);

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
        tokenProgram: tokenProgramId,
      }),
    );

    return ixs;
  }

  /**
   * Attempts canceling the specified stream.
   */
  public async cancel({ id }: ICancelData, extParams: IInteractStreamSolanaExt): Promise<ITransactionResult> {
    const ixs = await this.prepareCancelInstructions({ id }, extParams);
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
      { sendThrottler: this.sendThrottler },
    );

    return { ixs, txId: signature };
  }

  /**
   * Creates Transaction Instructions for cancel
   */
  public async prepareCancelInstructions(
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

    const data = decodeStream(escrowAcc?.data);

    const { tokenProgramId } = await getMintAndProgram(this.connection, data.mint);
    const streamflowTreasuryTokens = await ata(data.mint, STREAMFLOW_TREASURY_PUBLIC_KEY, tokenProgramId);
    const partnerTokens = await ata(data.mint, data.partner, tokenProgramId);

    const ixs: TransactionInstruction[] = prepareBaseInstructions(this.connection, {
      computePrice,
      computeLimit,
    });
    await this.checkAssociatedTokenAccounts(data, { invoker, checkTokenAccounts }, ixs, tokenProgramId);

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
      { sendThrottler: this.sendThrottler },
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
      transferStreamInstruction(this.programId, {
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
      { sendThrottler: this.sendThrottler },
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
    const escrow = await this.connection.getAccountInfo(new PublicKey(id), TX_FINALITY_CONFIRMED);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info.");
    }

    return new Contract(decodeStream(escrow?.data));
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
    let accounts: Account[] = [];
    //todo: we need to be smart with our layout so we minimize rpc calls to the chain
    if (direction === "all") {
      const outgoingAccounts = await getProgramAccounts(
        this.connection,
        publicKey,
        STREAM_STRUCT_OFFSET_SENDER,
        this.programId,
      );
      const incomingAccounts = await getProgramAccounts(
        this.connection,
        publicKey,
        STREAM_STRUCT_OFFSET_RECIPIENT,
        this.programId,
      );
      accounts = [...outgoingAccounts, ...incomingAccounts];
    } else {
      const offset = direction === "outgoing" ? STREAM_STRUCT_OFFSET_SENDER : STREAM_STRUCT_OFFSET_RECIPIENT;
      accounts = await getProgramAccounts(this.connection, publicKey, offset, this.programId);
    }

    let streams: Record<string, Contract> = {};

    accounts.forEach((account) => {
      const decoded = new Contract(decodeStream(account.account.data));
      streams = { ...streams, [account.pubkey.toBase58()]: decoded };
    });

    const sortedStreams = Object.entries(streams).sort(([, stream1], [, stream2]) => stream2.start - stream1.start);

    if (type === "all") return sortedStreams;

    return sortedStreams.filter((stream) => stream[1].type === type);
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
      { sendThrottler: this.sendThrottler },
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
      updateStreamInstruction(data, this.programId, {
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
    const partners = borsh.deserialize(PARTNERS_SCHEMA, data!.data) as unknown as IPartnerLayout[];
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
   * Forms instructions from params, creates a raw transaction and fetch recent blockhash.
   */
  private async prepareStreamInstructions(
    recipient: IRecipient,
    streamParams: IStreamConfig,
    extParams: ICreateStreamSolanaExt,
  ): Promise<{
    ixs: TransactionInstruction[];
    metadata: Keypair | undefined;
    metadataPubKey: PublicKey;
  }> {
    const {
      tokenId: mint,
      start,
      period,
      cliff,
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
    } = streamParams;

    const { sender, metadataPubKeys, computeLimit, computePrice } = extParams;

    if (!sender.publicKey) {
      throw new Error("Sender's PublicKey is not available, check passed wallet adapter!");
    }

    const ixs: TransactionInstruction[] = prepareBaseInstructions(this.connection, {
      computePrice,
      computeLimit,
    });
    const recipientPublicKey = new PublicKey(recipient.recipient);
    const mintPublicKey = new PublicKey(mint);
    const { metadata, metadataPubKey } = this.getOrCreateStreamMetadata(metadataPubKeys);
    const [escrowTokens] = PublicKey.findProgramAddressSync(
      [Buffer.from("strm"), metadataPubKey.toBuffer()],
      this.programId,
    );

    const { tokenProgramId } = await getMintAndProgram(this.connection, mintPublicKey);
    const senderTokens = await ata(mintPublicKey, sender.publicKey, tokenProgramId);
    const recipientTokens = await ata(mintPublicKey, recipientPublicKey, tokenProgramId);
    const streamflowTreasuryTokens = await ata(mintPublicKey, STREAMFLOW_TREASURY_PUBLIC_KEY, tokenProgramId);
    const partnerPublicKey = partner ? new PublicKey(partner) : WITHDRAWOR_PUBLIC_KEY;
    const partnerTokens = await ata(mintPublicKey, partnerPublicKey, tokenProgramId);

    ixs.push(
      createStreamInstruction(
        {
          start: new BN(start),
          depositedAmount: recipient.amount,
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
          canUpdateRate: !!canUpdateRate,
          canPause: !!canPause,
          name: recipient.name,
          withdrawFrequency: new BN(automaticWithdrawal ? withdrawalFrequency : period),
        },
        this.programId,
        {
          sender: sender.publicKey,
          senderTokens,
          recipient: new PublicKey(recipient.recipient),
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
   * Utility function that checks whether associated token accounts still exist and adds instructions to add them if not
   */
  private async checkAssociatedTokenAccounts(
    data: CheckAssociatedTokenAccountsData,
    { invoker, checkTokenAccounts }: IInteractStreamSolanaExt,
    ixs: TransactionInstruction[],
    programId: PublicKey,
  ) {
    if (!checkTokenAccounts) {
      return;
    }
    const owners = Array.from(
      new Set([
        data.sender.toBase58(),
        data.recipient.toBase58(),
        data.partner.toBase58(),
        data.streamflowTreasury.toBase58(),
      ]),
      (address) => new PublicKey(address),
    );
    ixs.push(...(await checkOrCreateAtaBatch(this.connection, owners, data.mint, invoker, programId)));
  }
}
