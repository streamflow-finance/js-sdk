import { AptosAccount, Types, AptosClient } from "aptos";

import { BaseStreamClient } from "../common/BaseStreamClient";
import {
  ICancelData,
  ICluster,
  ICreateMultiError,
  ICreateMultipleStreamData,
  ICreateResult,
  ICreateStreamData,
  IGetFeesData,
  IGetOneData,
  IFees,
  IMultiTransactionResult,
  IRecipient,
  ITopUpData,
  ITransactionResult,
  ITransferData,
  IUpdateData,
  IWithdrawData,
} from "../common/types";
import { APTOS_PROGRAM_IDS } from "./constants";
import {
  ConfigResource,
  Contract,
  FeeTableResource,
  ICreateStreamAptosExt,
  ITransactionAptosExt,
  StreamResource,
} from "./types";
import { AptosWalletWrapper } from "./wallet";
import { extractAptosErrorCode } from "./utils";

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
  ): Promise<ICreateResult> {
    const wallet = new AptosWalletWrapper(senderWallet, this.client);

    const [metadataId, payload] = this.generateMultiPayloads(
      {
        ...streamData,
        recipients: [{ ...streamData }],
      },
      wallet
    )[0];

    const hash = await wallet.signAndSubmitTransaction(payload);

    return { ixs: [payload], txId: hash, metadataId };
  }

  /**
   * Creates multiple stream/vesting contracts.
   */
  public async createMultiple(
    multipleStreamData: ICreateMultipleStreamData,
    { senderWallet }: ICreateStreamAptosExt
  ): Promise<IMultiTransactionResult> {
    const wallet = new AptosWalletWrapper(senderWallet, this.client);

    const payloads = this.generateMultiPayloads(multipleStreamData, wallet);

    const txs: string[] = [];
    const metadatas: string[] = [];
    const metadataToRecipient: Record<string, IRecipient> = {};
    const errors: ICreateMultiError[] = [];

    for (let i = 0; i < payloads.length; i++) {
      const [metadataId, payload] = payloads[i];
      const recipient = multipleStreamData.recipients[i];
      try {
        const hash = await wallet.signAndSubmitTransaction(payload);

        txs.push(hash);
      } catch (e: any) {
        errors.push({
          error: e?.toString() ?? "Unknown error!",
          recipient: recipient.recipient,
        });
      } finally {
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
    const wallet = new AptosWalletWrapper(senderWallet, this.client);

    const hash = await wallet.signAndSubmitTransaction(payload);

    return { ixs: [payload], txId: hash };
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
    const wallet = new AptosWalletWrapper(senderWallet, this.client);

    const hash = await wallet.signAndSubmitTransaction(payload);

    return { ixs: [payload], txId: hash };
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
    const wallet = new AptosWalletWrapper(senderWallet, this.client);

    const hash = await wallet.signAndSubmitTransaction(payload);

    return { ixs: [payload], txId: hash };
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
    const wallet = new AptosWalletWrapper(senderWallet, this.client);

    const hash = await wallet.signAndSubmitTransaction(payload);

    return { ixs: [payload], txId: hash };
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

  public async get(): Promise<[string, Contract][]> {
    throw new Error("Get all method is not supported for Aptos chain!");
  }

  /**
   * Attempts updating the stream auto withdrawal params and amount per period
   */
  public async update(
    updateData: IUpdateData,
    { senderWallet, tokenId }: ITransactionAptosExt
  ): Promise<ITransactionResult> {
    const wallet = new AptosWalletWrapper(senderWallet, this.client);

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

    const hash = await wallet.signAndSubmitTransaction(payload);

    return { ixs: [payload], txId: hash };
  }

  public async getFees({ address }: IGetFeesData): Promise<IFees | null> {
    const resource = await this.client.getAccountResource(
      this.programId,
      `${this.programId}::fees::FeeTable`
    );
    const data = resource.data as unknown as FeeTableResource;
    const value = await this.client.getTableItem(data.values.handle, {
      key_type: "address",
      key: address,
      value_type: "u64",
    });
    if (!value) {
      return null;
    }
    return { streamflowFee: Number(value) / 100, partnerFee: 0 };
  }

  public async getDefaultStreamflowFee(): Promise<number> {
    const resource = await this.client.getAccountResource(
      this.programId,
      `${this.programId}::admin::ConfigV2`
    );
    return Number((resource.data as unknown as ConfigResource).streamflow_fees) / 100;
  }

  public extractErrorCode(err: Error): string | null {
    return extractAptosErrorCode(err.toString() ?? "Unknown error!");
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
    multipleStreamData: ICreateMultipleStreamData,
    wallet: AptosWalletWrapper<any>
  ): [string, Types.TransactionPayload_EntryFunctionPayload][] {
    return multipleStreamData.recipients.map((recipient) => {
      const acc = new AptosAccount(); // Generate random address as seeds for deriving "escrow" account
      const seeds = acc.address();
      const encoder = new TextEncoder();
      // A workaround to pass a String in seeds because different wallets seem
      // to serialize vector<u8> differently and String should be safer that Uin8Array
      const actualSeeds = encoder.encode(seeds.hex());
      const metadataId = AptosAccount.getResourceAccountAddress(wallet.address, actualSeeds);
      return [
        metadataId.toString(),
        {
          type: "create",
          function: `${this.programId}::protocol::create`,
          type_arguments: [multipleStreamData.tokenId],
          arguments: [
            seeds.hex(),
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
        },
      ];
    });
  }
}
