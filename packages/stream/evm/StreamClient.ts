import { ethers } from "ethers";
import BN from "bn.js";
import { toChecksumAddress } from "ethereum-checksum-address";

import { BaseStreamClient } from "../common/BaseStreamClient";
import {
  ICancelData,
  IChain,
  ICluster,
  ICreateMultipleStreamData,
  ICreateResult,
  ICreateStreamData,
  IGetFeesData,
  IGetAllData,
  IGetOneData,
  IFees,
  IMultiTransactionResult,
  IRecipient,
  ITopUpData,
  ITransactionResult,
  ITransferData,
  IUpdateData,
  IWithdrawData,
  Stream,
  StreamDirection,
} from "../common/types";
import { BNB_PROGRAM_IDS, ETHEREUM_PROGRAM_IDS, POLYGON_PROGRAM_IDS } from "./constants";
import abi from "./abi";
import ercAbi from "./ercAbi";
import { BASE_FEE } from "../common/constants";
import { EvmContract, FeesAbiResult, StreamAbiResult } from "./types";
import { extractEvmErrorCode } from "./utils";

export default class EvmStreamClient extends BaseStreamClient {
  private programId: string;

  private provider: ethers.providers.JsonRpcProvider;

  private signer: ethers.Signer;

  private readContract: ethers.Contract;

  private writeContract: ethers.Contract;

  constructor(
    clusterUrl: string,
    chain: IChain,
    signer: ethers.Signer,
    cluster: ICluster = ICluster.Mainnet,
    programId?: string
  ) {
    super();

    if (chain !== IChain.Ethereum && chain !== IChain.BNB && chain !== IChain.Polygon) {
      throw new Error("Wrong chain. Supported chains are Ethereum , BNB and Polygon!");
    }

    if (programId) {
      this.programId = programId;
    } else {
      switch (chain) {
        case IChain.Ethereum:
          this.programId = ETHEREUM_PROGRAM_IDS[cluster];
          break;
        case IChain.BNB:
          this.programId = BNB_PROGRAM_IDS[cluster];
          break;
        case IChain.Polygon:
          this.programId = POLYGON_PROGRAM_IDS[cluster];
          break;
      }
    }

    this.provider = new ethers.providers.JsonRpcProvider(clusterUrl);
    this.signer = signer;

    const baseContract = new ethers.Contract(this.programId, abi);
    this.readContract = baseContract.connect(this.provider);
    this.writeContract = baseContract.connect(this.signer);
  }

  public async create(streamData: ICreateStreamData): Promise<ICreateResult> {
    const multiParams = {
      ...streamData,
      recipients: [streamData],
    };

    const fees = await this.readContract.getWithdrawalFees(...this.getFeeParams(multiParams));

    const args = (await this.generateMultiPayloads(multiParams))[0];

    const sum = streamData.amount.mul(new BN(BASE_FEE)).div(new BN(1000000));

    await this.approveTokens(streamData.tokenId, sum);

    const result = await this.writeContract.create(...args, { value: fees.value });

    const confirmedTx = await result.wait();

    const metadataId = this.formatMetadataId(
      confirmedTx.events!.find((item: ethers.Event) => item.event === "ContractCreated")!.args![0]
    );

    return {
      ixs: [],
      txId: result.hash,
      metadataId,
    };
  }

  public async createMultiple(
    multipleStreamData: ICreateMultipleStreamData
  ): Promise<IMultiTransactionResult> {
    const fees = await this.readContract.getWithdrawalFees(
      ...this.getFeeParams(multipleStreamData)
    );

    const args = await this.generateMultiPayloads(multipleStreamData);

    const sum = multipleStreamData.recipients
      .reduce((acc, v) => acc.add(v.amount), new BN(0))
      .mul(new BN(BASE_FEE))
      .div(new BN(1000000));
    await this.approveTokens(multipleStreamData.tokenId, sum);

    const creationPromises = args.map((item) =>
      this.writeContract.create(...item, { value: fees.value })
    );

    const signatures: string[] = [];
    const results = await Promise.all(creationPromises);

    const confirmations = await Promise.allSettled(results.map((result) => result.wait()));
    const successes = confirmations
      .filter((el): el is PromiseFulfilledResult<any> => el.status === "fulfilled")
      .map((el) => el.value);
    signatures.push(...successes.map((el) => el.hash));

    const metadatas = confirmations.map((result: PromiseSettledResult<any>) =>
      result.status === "fulfilled"
        ? this.formatMetadataId(
            result.value.events!.find((item: ethers.Event) => item.event === "ContractCreated")!
              .args![0]
          )
        : null
    );
    const metadataToRecipient = metadatas.reduce((acc, value, index) => {
      if (value) {
        acc[value] = multipleStreamData.recipients[index];
      }

      return acc;
    }, {} as Record<string, IRecipient>);

    const failures = confirmations
      .filter((el): el is PromiseRejectedResult => el.status === "rejected")
      .map((el) => el.reason);

    return {
      txs: signatures,
      metadatas: metadatas.filter(Boolean) as string[],
      metadataToRecipient,
      errors: failures,
    };
  }

  public async withdraw(withdrawData: IWithdrawData): Promise<ITransactionResult> {
    const result = await this.writeContract.withdraw(
      withdrawData.id,
      withdrawData.amount.toString()
    );
    return {
      ixs: [],
      txId: result.hash,
    };
  }

  public async cancel(cancelData: ICancelData): Promise<ITransactionResult> {
    const result = await this.writeContract.cancel(cancelData.id);
    return {
      ixs: [],
      txId: result.hash,
    };
  }

  public async transfer(transferData: ITransferData): Promise<ITransactionResult> {
    const result = await this.writeContract.transfer(transferData.id, transferData.newRecipient);
    return {
      ixs: [],
      txId: result.hash,
    };
  }

  public async topup(topupData: ITopUpData): Promise<ITransactionResult> {
    const fees = await this.readContract.getTopUpWithdrawalFees(
      topupData.id,
      topupData.amount.toString()
    );

    const sum = topupData.amount.mul(new BN(BASE_FEE)).div(new BN(1000000));

    const stream = await this.getOne({ id: topupData.id });

    await this.approveTokens(stream.mint, sum);

    const result = await this.writeContract.topUp(topupData.id, topupData.amount.toString(), {
      value: fees.value,
    });
    return {
      ixs: [],
      txId: result.hash,
    };
  }

  public async update(updateData: IUpdateData): Promise<ITransactionResult> {
    const result = await this.writeContract.update(
      updateData.id,
      updateData.enableAutomaticWithdrawal ? [true] : [],
      updateData.withdrawFrequency ? [updateData.withdrawFrequency.toString()] : [],
      updateData.amountPerPeriod ? [updateData.amountPerPeriod.toString()] : []
    );
    return {
      ixs: [],
      txId: result.hash,
    };
  }

  public async getOne({ id }: IGetOneData): Promise<Stream> {
    const result: StreamAbiResult = await this.readContract.getById(id);
    return new EvmContract(result);
  }

  public async get({
    address,
    // type = StreamType.All,
    direction = StreamDirection.All,
  }: IGetAllData): Promise<[string, Stream][]> {
    const addresses: string[] = [];
    if (direction === StreamDirection.All || direction === StreamDirection.Outgoing) {
      const senderAddresses = await this.readContract.getBySender(address);
      addresses.push(...senderAddresses);
    }
    if (direction === StreamDirection.All || direction === StreamDirection.Incoming) {
      const recipientAddresses = await this.readContract.getByRecipient(address);
      addresses.push(...recipientAddresses);
    }
    const uniqueAddresses = [...new Set(addresses)];
    const results: StreamAbiResult[] = await this.readContract.getMultiple(uniqueAddresses);
    return results.map((result, index) => [uniqueAddresses[index], new EvmContract(result)]);
  }

  public extractErrorCode(err: Error): string | null {
    return extractEvmErrorCode(err.toString() ?? "Unknown error!");
  }

  public async getFees({ address }: IGetFeesData): Promise<IFees | null> {
    const fees: FeesAbiResult = await this.readContract.getFees(address);
    if (!fees.exists) {
      return null;
    }
    return {
      streamflowFee: fees.streamflow_fee.toNumber() / 100,
      partnerFee: fees.partner_fee.toNumber() / 100,
    };
  }

  public async getDefaultStreamflowFee(): Promise<number> {
    const fee = await this.readContract.getStreamflowFees();
    return fee.toNumber() / 100;
  }

  /**
   * Returns StreamClient protocol program ID.
   */
  public getProgramId(): string {
    return this.programId;
  }

  public async approveTokens(tokenId: string, amount: BN): Promise<void> {
    const tokenContract = new ethers.Contract(tokenId, ercAbi, this.signer);
    const address = await this.signer.getAddress();
    const allowance = await tokenContract.allowance(address, this.programId);
    if (new BN(allowance.toString()).gte(amount)) {
      return;
    }
    const approvalTx = await tokenContract.approve(this.programId, amount.toString());
    await approvalTx.wait();
  }

  // Utility function to prepare transaction payloads for multiple recipients.
  private async generateMultiPayloads(
    multipleStreamData: ICreateMultipleStreamData
  ): Promise<any[]> {
    const sender = await this.signer.getAddress();
    return multipleStreamData.recipients.map((recipient) => {
      return [
        multipleStreamData.tokenId,
        recipient.amount.toString(),
        multipleStreamData.period,
        recipient.amountPerPeriod.toString(),
        multipleStreamData.start,
        recipient.cliffAmount.toString(),
        [
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
        ],
        recipient.recipient,
        multipleStreamData.partner || sender,
      ];
    });
  }

  private getFeeParams(multipleStreamData: ICreateMultipleStreamData): any[] {
    return [
      multipleStreamData.recipients[0].amount.toString(),
      multipleStreamData.period,
      multipleStreamData.recipients[0].amountPerPeriod.toString(),
      multipleStreamData.start,
      multipleStreamData.recipients[0].cliffAmount.toString(),
      multipleStreamData.automaticWithdrawal || false,
      multipleStreamData.withdrawalFrequency || 0,
    ];
  }

  private formatMetadataId(id: string): string {
    // 40 chars is ethereum address size
    return toChecksumAddress(`0x${id.slice(-40)}`);
  }
}
