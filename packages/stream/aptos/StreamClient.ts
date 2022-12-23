import { AptosAccount, Types } from "aptos";

import { BaseStreamClient } from "../common/BaseStreamClient";
import {
  ICancelData,
  ICluster,
  ICreateMultipleStreamData,
  ICreateStreamData,
  IRecipient,
  ITopUpData,
  ITransferData,
  IWithdrawData,
} from "../common/types";
import { APTOS_PROGRAM_IDS } from "./constants";
import {
  CreateMultiError,
  ICreateStreamAptosExt,
  IMultiTransactionResult,
  ITransactionAptosExt,
  ITransactionResult,
} from "./types";

export default class AptosStreamClient extends BaseStreamClient {
  private programId: string;

  private maxGas: string;

  constructor(cluster: ICluster = ICluster.Mainnet, maxGas = "10000", programId?: string) {
    super();

    this.programId = programId ? programId : APTOS_PROGRAM_IDS[cluster];

    this.maxGas = maxGas;
  }

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
        const metadataId = (payload as any).arguments[0];
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

  public async cancel(
    cancelData: ICancelData,
    { senderWallet, tokenId }: ITransactionAptosExt
  ): Promise<any> {
    const payload = {
      type: "cancel",
      function: `${this.programId}::protocol::cancel`,
      type_arguments: [tokenId],
      arguments: [cancelData.id],
    };

    const { hash } = await senderWallet.signAndSubmitTransaction(payload);

    return { txId: hash };
  }

  public async transfer(
    transferData: ITransferData,
    { senderWallet, tokenId }: ITransactionAptosExt
  ): Promise<any> {
    const payload = {
      type: "transfer",
      function: `${this.programId}::protocol::transfer`,
      type_arguments: [tokenId],
      arguments: [transferData.id, transferData.newRecipient],
    };

    const { hash } = await senderWallet.signAndSubmitTransaction(payload);

    return { txId: hash };
  }

  public async topup(
    topupData: ITopUpData,
    { senderWallet, tokenId }: ITransactionAptosExt
  ): Promise<any> {
    const payload = {
      type: "topup",
      function: `${this.programId}::protocol::topup`,
      type_arguments: [tokenId],
      arguments: [topupData.id, topupData.amount.toString()],
    };

    const { hash } = await senderWallet.signAndSubmitTransaction(payload);

    return { txId: hash };
  }

  public async getOne(): Promise<any> {
    throw new Error("Not implemented.");
  }

  public getProgramId() {
    return this.programId;
  }

  public getMaxGas() {
    return { max_gas_amount: this.maxGas };
  }

  private generateMultiPayloads(
    multipleStreamData: ICreateMultipleStreamData
  ): Types.TransactionPayload[] {
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
