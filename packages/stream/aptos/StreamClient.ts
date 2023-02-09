import { AptosAccount, Types, AptosClient } from "aptos";

import { BaseStreamClient } from "../common/BaseStreamClient";
import {
  ICancelData,
  ICluster,
  ICreateMultipleStreamData,
  ICreateStreamData,
  IGetOneData,
  IRecipient,
  ITopUpData,
  ITransferData,
  IUpdateData,
  IWithdrawData,
} from "../common/types";
import { APTOS_PROGRAM_IDS } from "./constants";
import {
  Contract,
  CreateMultiError,
  ICreateStreamAptosExt,
  IMultiTransactionResult,
  ITransactionAptosExt,
  ITransactionResult,
  StreamResource,
} from "./types";

export default class AptosStreamClient extends BaseStreamClient {
  private programId: string;

  private maxGas: string;

  private client: AptosClient;

  constructor(
    clusterUrl: string,
    cluster: ICluster = ICluster.Mainnet,
    maxGas = "10000",
    programId?: string
  ) {
    super();

    this.programId = programId ? programId : APTOS_PROGRAM_IDS[cluster];

    this.maxGas = maxGas;

    this.client = new AptosClient(clusterUrl);
  }

  /**
   * Creates a new stream/vesting contract.
   */
  public async create(
    streamData: ICreateStreamData,
    { senderWallet }: ICreateStreamAptosExt
  ): Promise<ITransactionResult> {
    const acc = new AptosAccount(); // Generate random address as seeds for derriving "escrow" account
    const seeds = acc.address().hex();
    const payload = {
      type: "create",
      function: `${this.programId}::protocol::create`,
      type_arguments: [streamData.tokenId],
      arguments: [
        seeds,
        streamData.amount.toString(),
        streamData.period,
        streamData.amountPerPeriod.toString(),
        streamData.start,
        streamData.cliffAmount.toString(),
        streamData.cancelableBySender,
        streamData.cancelableByRecipient,
        streamData.transferableBySender,
        streamData.transferableByRecipient,
        streamData.canTopup,
        streamData.canPause || false,
        streamData.canUpdateRate || false,
        streamData.automaticWithdrawal || false,
        streamData.withdrawalFrequency || 0,
        streamData.name,
        streamData.recipient,
      ],
    };

    const { hash } = await senderWallet.signAndSubmitTransaction(payload);

    return { txId: hash };
  }

  /**
   * Creates multiple stream/vesting contracts.
   */
  public async createMultiple(
    multipleStreamData: ICreateMultipleStreamData,
    { senderWallet }: ICreateStreamAptosExt
  ): Promise<IMultiTransactionResult> {
    const payloads = this.generateMultiPayloads(multipleStreamData);

    const txs: string[] = [];
    const metadatas: string[] = [];
    const metadataToRecipient: Record<string, IRecipient> = {};
    const errors: CreateMultiError[] = [];

    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i];
      const recipient = multipleStreamData.recipients[i];
      try {
        const { hash } = await senderWallet.signAndSubmitTransaction(payload);

        txs.push(hash);
      } catch (e: any) {
        errors.push({
          error: e?.toString() ?? "Unkown error!",
          recipient: recipient.recipient,
        });
      } finally {
        const metadataId = payload.arguments[0];
        metadatas.push(metadataId);
        metadataToRecipient[metadataId] = recipient;
      }
    }
    return {
      txs,
      metadatas,
      metadataToRecipient,
      errors,
    };
  }

  /**
   * Attempts withdrawing from the specified stream.
   */
  public async withdraw(
    withdrawData: IWithdrawData,
    { senderWallet, tokenId }: ITransactionAptosExt
  ): Promise<ITransactionResult> {
    const payload = {
      type: "withdraw",
      function: `${this.programId}::protocol::withdraw`,
      type_arguments: [tokenId],
      arguments: [withdrawData.id, withdrawData.amount.toString()],
    };

    const { hash } = await senderWallet.signAndSubmitTransaction(payload);

    return { txId: hash };
  }

  /**
   * Attempts canceling the specified stream.
   */
  public async cancel(
    cancelData: ICancelData,
    { senderWallet, tokenId }: ITransactionAptosExt
  ): Promise<ITransactionResult> {
    const payload = {
      type: "cancel",
      function: `${this.programId}::protocol::cancel`,
      type_arguments: [tokenId],
      arguments: [cancelData.id],
    };

    const { hash } = await senderWallet.signAndSubmitTransaction(payload);

    return { txId: hash };
  }

  /**
   * Attempts changing the stream/vesting contract's recipient (effectively transferring the stream/vesting contract).
   */
  public async transfer(
    transferData: ITransferData,
    { senderWallet, tokenId }: ITransactionAptosExt
  ): Promise<ITransactionResult> {
    const payload = {
      type: "transfer",
      function: `${this.programId}::protocol::transfer`,
      type_arguments: [tokenId],
      arguments: [transferData.id, transferData.newRecipient],
    };

    const { hash } = await senderWallet.signAndSubmitTransaction(payload);

    return { txId: hash };
  }

  /**
   * Tops up stream account with specified amount.
   */
  public async topup(
    topupData: ITopUpData,
    { senderWallet, tokenId }: ITransactionAptosExt
  ): Promise<ITransactionResult> {
    const payload = {
      type: "topup",
      function: `${this.programId}::protocol::topup`,
      type_arguments: [tokenId],
      arguments: [topupData.id, topupData.amount.toString()],
    };

    const { hash } = await senderWallet.signAndSubmitTransaction(payload);

    return { txId: hash };
  }

  /**
   * Fetch stream data by its id (address).
   */
  public async getOne({ id }: IGetOneData): Promise<Contract> {
    const contractResources = await this.client.getAccountResources(id);

    const contract = contractResources.find((r) => r.type.includes("protocol::Contract"));

    if (!contract) {
      throw new Error(`Contract with id ${id} could not be found!`);
    }

    const tokenIdMatch = contract.type.match(/0x[0-9a-f]+::protocol::Contract<(.*)>/);
    const tokenId = tokenIdMatch?.[1] ?? "";

    const { data } = contract;

    return new Contract(data as unknown as StreamResource, tokenId);
  }

  /**
   * Attempts updating the stream auto withdrawal params and amount per period
   */
  public async update(
    updateData: IUpdateData,
    { senderWallet, tokenId }: ITransactionAptosExt
  ): Promise<ITransactionResult> {
    const payload = {
      type: "update",
      function: `${this.programId}::protocol::update`,
      type_arguments: [tokenId],
      arguments: [
        updateData.id,
        updateData.enableAutomaticWithdrawal ? [true] : [],
        updateData.withdrawFrequency ? [updateData.withdrawFrequency.toString()] : [],
        updateData.amountPerPeriod ? [updateData.amountPerPeriod.toString()] : [],
      ],
    };

    const { hash } = await senderWallet.signAndSubmitTransaction(payload);

    return { txId: hash };
  }

  /**
   * Returns StreamClient protocol program ID.
   */
  public getProgramId(): string {
    return this.programId;
  }

  public getMaxGas(): { max_gas_amount: string } {
    return { max_gas_amount: this.maxGas };
  }

  // Utility function to prepare transaction payloads for multiple recipients.
  private generateMultiPayloads(
    multipleStreamData: ICreateMultipleStreamData
  ): Types.TransactionPayload_EntryFunctionPayload[] {
    return multipleStreamData.recipients.map((recipient) => {
      const acc = new AptosAccount(); // Generate random address as seeds for derriving "escrow" account
      const seeds = acc.address().hex();
      return {
        type: "create",
        function: `${this.programId}::protocol::create`,
        type_arguments: [multipleStreamData.tokenId],
        arguments: [
          seeds,
          recipient.amount.toString(),
          multipleStreamData.period,
          recipient.amountPerPeriod.toString(),
          multipleStreamData.start,
          recipient.cliffAmount.toString(),
          multipleStreamData.cancelableBySender,
          multipleStreamData.cancelableByRecipient,
          multipleStreamData.transferableBySender,
          multipleStreamData.transferableByRecipient,
          multipleStreamData.canTopup,
          multipleStreamData.canPause || false,
          multipleStreamData.canUpdateRate || false,
          multipleStreamData.automaticWithdrawal || false,
          multipleStreamData.withdrawalFrequency || 0,
          recipient.name,
          recipient.recipient,
        ],
      };
    });
  }
}
