import { ethers } from "ethers";
import { BN } from "bn.js";

import { BaseStreamClient } from "../common/BaseStreamClient";
import {
  ICancelData,
  IChain,
  ICluster,
  ICreateMultipleStreamData,
  ICreateResult,
  ICreateStreamData,
  IGetAllData,
  IGetOneData,
  IMultiTransactionResult,
  ITopUpData,
  ITransactionResult,
  ITransferData,
  IUpdateData,
  IWithdrawData,
  StreamDirection,
} from "../common/types";
import { Stream } from "../solana";
import { BSC_PROGRAM_IDS, ETHERIUM_PROGRAM_IDS } from "./constants";
import abi from "./abi";
import ercAbi from "./ercAbi";
import { BASE_FEE } from "../solana/constants";
import { EvmContract, StreamAbiResult } from "./types";

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

    if (chain !== IChain.Etherium && chain !== IChain.BSC) {
      throw new Error("Wrong chain. Supported chains are Etherium and BSC");
    }

    if (programId) {
      this.programId = programId;
    } else {
      this.programId =
        chain === IChain.Etherium ? ETHERIUM_PROGRAM_IDS[cluster] : BSC_PROGRAM_IDS[cluster];
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

    const args = this.generateMultiPayloads(multiParams)[0];

    const sum = streamData.amount.mul(new BN(BASE_FEE)).div(new BN(1000000));

    const tokenContract = new ethers.Contract(streamData.tokenId, ercAbi, this.signer);
    const approvalTx = await tokenContract.approve(this.programId, sum.toString());
    await approvalTx.wait();

    const result = await this.writeContract.create(...args, { value: fees.value });

    return {
      ixs: [],
      txId: result.hash,
      metadataId: result.hash,
    };
  }

  public async createMultiple(
    multipleStreamData: ICreateMultipleStreamData
  ): Promise<IMultiTransactionResult> {
    const fees = await this.readContract.getWithdrawalFees(
      ...this.getFeeParams(multipleStreamData)
    );

    const args = this.generateMultiPayloads(multipleStreamData);

    const sum = multipleStreamData.recipients
      .reduce((acc, v) => acc.add(v.amount), new BN(0))
      .mul(new BN(BASE_FEE))
      .div(new BN(1000000));

    const tokenContract = new ethers.Contract(multipleStreamData.tokenId, ercAbi, this.signer);
    const approvalTx = await tokenContract.approve(this.programId, sum.toString());
    await approvalTx.wait();

    const creationPromises = args.map((item) =>
      this.writeContract.create(...item, { value: fees.value })
    );

    const signatures: string[] = [];
    const errors: any[] = [];
    const results = await Promise.allSettled(creationPromises);
    const successes = results
      .filter((el): el is PromiseFulfilledResult<any> => el.status === "fulfilled")
      .map((el) => el.value);
    signatures.push(...successes.map((el) => el.hash));

    const failures = results
      .filter((el): el is PromiseRejectedResult => el.status === "rejected")
      .map((el) => el.reason);
    errors.push(...failures);

    return {
      txs: signatures,
      metadatas: [],
      metadataToRecipient: {},
      errors,
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
    const result = await this.writeContract.cancel(transferData.id, transferData.newRecipient);
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

    const result = await this.writeContract.create(topupData.id, topupData.amount.toString(), {
      value: fees.value,
    });
    return {
      ixs: [],
      txId: result.hash,
    };
  }

  public async update(updateData: IUpdateData): Promise<ITransactionResult> {
    console.log(updateData);
    throw new Error("Not Implemented!");
  }

  public async getOne({ id }: IGetOneData): Promise<Stream> {
    const result: StreamAbiResult = await this.readContract.getById(id);
    throw new EvmContract(result);
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

  /**
   * Returns StreamClient protocol program ID.
   */
  public getProgramId(): string {
    return this.programId;
  }

  // Utility function to prepare transaction payloads for multiple recipients.
  private generateMultiPayloads(multipleStreamData: ICreateMultipleStreamData): any[] {
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
}
