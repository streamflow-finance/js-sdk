import { AptosAccount, Types } from "aptos";

import { GenericStreamClient } from "../common/StreamClient";
import {
  ICancelData,
  ICluster,
  ICreateMultipleStreamData,
  ICreateStreamData,
  ITopUpData,
  ITransferData,
  IWithdrawData,
} from "../common/types";
import { APTOS_PROGRAM_IDS } from "./constants";
import { ICreateStreamAptosExt, ITransactionAptosExt, ITransactionResult } from "./types";

export default class AptosStreamClient extends GenericStreamClient {
  private programId: string;

  private maxGas: string;

  constructor(cluster: ICluster, maxGas = "10000", programId?: string) {
    super();

    this.programId = programId
      ? programId
      : APTOS_PROGRAM_IDS[cluster] || APTOS_PROGRAM_IDS[ICluster.Mainnet];

    this.maxGas = maxGas;
  }

  public async create(
    streamData: ICreateStreamData,
    { senderWallet }: ICreateStreamAptosExt
  ): Promise<ITransactionResult> {
    const acc = new AptosAccount(); // Generate random address as seeds for derriving "escrow" account
    const seeds = acc.address().hex();
    const strmEncoded: ArrayBuffer = new TextEncoder().encode("STRM");
    const name: string = Buffer.from(strmEncoded).toString("hex");
    const payload = {
      type: "create",
      function: `${this.programId}::protocol::create`,
      type_arguments: [streamData.tokenId],
      arguments: [
        seeds,
        streamData.amount,
        streamData.period,
        streamData.amountPerPeriod,
        streamData.start,
        streamData.cliffAmount,
        streamData.cancelableBySender,
        streamData.cancelableByRecipient,
        streamData.transferableBySender,
        streamData.transferableByRecipient,
        streamData.canTopup,
        streamData.canPause,
        streamData.canUpdateRate,
        streamData.automaticWithdrawal,
        streamData.withdrawalFrequency,
        name,
        streamData.recipient,
      ],
    };

    const { hash } = await senderWallet.signAndSubmitTransaction(payload);

    return { txId: hash };
  }

  public async createMultiple(
    multipleStreamData: ICreateMultipleStreamData,
    { senderWallet }: ICreateStreamAptosExt
  ): Promise<ITransactionResult[]> {
    const payloads = this.generateMultiPayloads(multipleStreamData);

    const ids: { txId: string }[] = [];

    for (const payload of payloads) {
      const { hash } = await senderWallet.signAndSubmitTransaction(payload);

      ids.push({ txId: hash });
    }

    return ids;
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
      const strmEncoded: ArrayBuffer = new TextEncoder().encode("STRM");
      const name: string = Buffer.from(strmEncoded).toString("hex");
      return {
        type: "create",
        function: `${this.programId}::protocol::create`,
        type_arguments: [multipleStreamData.tokenId],
        arguments: [
          seeds,
          recipient.amount,
          multipleStreamData.period,
          recipient.amountPerPeriod,
          multipleStreamData.start,
          recipient.cliffAmount,
          multipleStreamData.cancelableBySender,
          multipleStreamData.cancelableByRecipient,
          multipleStreamData.transferableBySender,
          multipleStreamData.transferableByRecipient,
          multipleStreamData.canTopup,
          multipleStreamData.canPause,
          multipleStreamData.canUpdateRate,
          multipleStreamData.automaticWithdrawal,
          multipleStreamData.withdrawalFrequency,
          name,
          recipient.recipient,
        ],
      };
    });
  }
}
