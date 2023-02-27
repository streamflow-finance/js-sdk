import { Commitment, ConnectionConfig } from "@solana/web3.js";
import { Signer } from "ethers";

import SolanaStreamClient from "../solana/StreamClient";
import AptosStreamClient from "../aptos/StreamClient";
import { BaseStreamClient } from "./BaseStreamClient";
import {
  ICancelData,
  IChain,
  ICluster,
  ICreateMultipleStreamData,
  ICreateStreamData,
  IGetOneData,
  ITopUpData,
  ITransferData,
  IUpdateData,
  IWithdrawData,
  ITransactionResult,
  IMultiTransactionResult,
  ICreateResult,
  IGetAllData,
} from "./types";
import {
  ICreateStreamSolanaExt,
  IInteractStreamSolanaExt,
  ITopUpStreamSolanaExt,
  Stream,
} from "../solana";
import { ICreateStreamAptosExt, ITransactionAptosExt } from "../aptos";
import { EvmStreamClient } from "../evm";

export interface SolanaStreamClientOptions {
  chain: IChain.Solana;
  clusterUrl: string;
  cluster?: ICluster;
  programId?: string;
  commitment?: Commitment | ConnectionConfig;
}

export interface AptosStreamClientOptions {
  chain: IChain.Aptos;
  clusterUrl: string;
  cluster?: ICluster;
  programId?: string;
  maxGas?: string;
}

export interface EvmStreamClientOptions {
  chain: IChain.Etherium | IChain.BSC;
  clusterUrl: string;
  signer: Signer;
  cluster?: ICluster;
  programId?: string;
}

type GenericStreamClientOptions =
  | SolanaStreamClientOptions
  | AptosStreamClientOptions
  | EvmStreamClientOptions;

export default class GenericStreamClient extends BaseStreamClient {
  public nativeStreamClient: SolanaStreamClient | AptosStreamClient | EvmStreamClient;

  public chain: IChain;

  constructor(options: GenericStreamClientOptions) {
    super();

    this.chain = options.chain;

    switch (options.chain) {
      case IChain.Solana:
        this.nativeStreamClient = new SolanaStreamClient(
          options.clusterUrl,
          options.cluster,
          options.commitment,
          options.programId
        );
        break;
      case IChain.Aptos:
        this.nativeStreamClient = new AptosStreamClient(
          options.clusterUrl,
          options.cluster,
          options.maxGas,
          options.programId
        );
        break;
      case IChain.BSC:
      case IChain.Etherium:
        this.nativeStreamClient = new EvmStreamClient(
          options.clusterUrl,
          options.chain,
          options.signer,
          options.cluster,
          options.programId
        );
        break;
    }
  }

  /**
   * Creates a new stream/vesting contract.
   */
  public create(
    streamData: ICreateStreamData,
    chainSpecificParams: ICreateStreamAptosExt | ICreateStreamSolanaExt
  ): Promise<ICreateResult> {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      const params = <ICreateStreamSolanaExt>chainSpecificParams;
      return this.nativeStreamClient.create(streamData, params);
    } else {
      const params = <ICreateStreamAptosExt>chainSpecificParams;
      return this.nativeStreamClient.create(streamData, params);
    }
  }

  /**
   * Creates multiple stream/vesting contracts.
   */
  public createMultiple(
    multipleStreamData: ICreateMultipleStreamData,
    chainSpecificParams: ICreateStreamAptosExt | ICreateStreamSolanaExt
  ): Promise<IMultiTransactionResult> {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      const params = <ICreateStreamSolanaExt>chainSpecificParams;
      return this.nativeStreamClient.createMultiple(multipleStreamData, params);
    } else {
      const params = <ICreateStreamAptosExt>chainSpecificParams;
      return this.nativeStreamClient.createMultiple(multipleStreamData, params);
    }
  }

  /**
   * Attempts withdrawing from the specified stream.
   */
  public withdraw(
    withdrawData: IWithdrawData,
    chainSpecificParams: ITransactionAptosExt | IInteractStreamSolanaExt
  ): Promise<ITransactionResult> {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      const params = <IInteractStreamSolanaExt>chainSpecificParams;
      return this.nativeStreamClient.withdraw(withdrawData, params);
    } else {
      const params = <ITransactionAptosExt>chainSpecificParams;
      return this.nativeStreamClient.withdraw(withdrawData, params);
    }
  }

  /**
   * Attempts canceling the specified stream.
   */
  public cancel(
    cancelData: ICancelData,
    chainSpecificParams: ITransactionAptosExt | IInteractStreamSolanaExt
  ): Promise<ITransactionResult> {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      const params = <IInteractStreamSolanaExt>chainSpecificParams;
      return this.nativeStreamClient.cancel(cancelData, params);
    } else {
      const params = <ITransactionAptosExt>chainSpecificParams;
      return this.nativeStreamClient.cancel(cancelData, params);
    }
  }

  /**
   * Attempts changing the stream/vesting contract's recipient (effectively transferring the stream/vesting contract).
   */
  public transfer(
    transferData: ITransferData,
    chainSpecificParams: ITransactionAptosExt | IInteractStreamSolanaExt
  ): Promise<ITransactionResult> {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      const params = <IInteractStreamSolanaExt>chainSpecificParams;
      return this.nativeStreamClient.transfer(transferData, params);
    } else {
      const params = <ITransactionAptosExt>chainSpecificParams;
      return this.nativeStreamClient.transfer(transferData, params);
    }
  }

  /**
   * Tops up stream account with specified amount.
   */
  public topup(
    topupData: ITopUpData,
    chainSpecificParams: ITransactionAptosExt | ITopUpStreamSolanaExt
  ): Promise<ITransactionResult> {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      const params = <ITopUpStreamSolanaExt>chainSpecificParams;
      return this.nativeStreamClient.topup(topupData, params);
    } else {
      const params = <ITransactionAptosExt>chainSpecificParams;
      return this.nativeStreamClient.topup(topupData, params);
    }
  }

  /**
   * Fetch stream data by its id (address).
   */
  public getOne(getOneData: IGetOneData): Promise<Stream> {
    return this.nativeStreamClient.getOne(getOneData);
  }

  /**
   * Fetch streams by sender or recipient address.
   */
  public get(getAllData: IGetAllData): Promise<[string, Stream][]> {
    return this.nativeStreamClient.get(getAllData);
  }

  /**
   * Attempts updating the stream auto withdrawal params and amount per period
   */
  public update(
    updateData: IUpdateData,
    chainSpecificParams: ITransactionAptosExt | IInteractStreamSolanaExt
  ): Promise<ITransactionResult> {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      const params = <IInteractStreamSolanaExt>chainSpecificParams;
      return this.nativeStreamClient.update(updateData, params);
    } else {
      const params = <ITransactionAptosExt>chainSpecificParams;
      return this.nativeStreamClient.update(updateData, params);
    }
  }
}
