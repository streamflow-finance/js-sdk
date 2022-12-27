import { Commitment, ConnectionConfig } from "@solana/web3.js";

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
  IWithdrawData,
} from "./types";
import {
  CreateMultiResponse,
  CreateResponse,
  ICreateStreamSolanaExt,
  IInteractStreamSolanaExt,
  ITopUpStreamSolanaExt,
  Stream,
  TxResponse,
} from "../solana";
import {
  ICreateStreamAptosExt,
  IMultiTransactionResult,
  ITransactionAptosExt,
  ITransactionResult,
} from "../aptos";

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

type GenericStreamClientOptions = SolanaStreamClientOptions | AptosStreamClientOptions;

export default class GenericStreamClient extends BaseStreamClient {
  public nativeStreamClient: SolanaStreamClient | AptosStreamClient;

  public chain: IChain;

  constructor(options: GenericStreamClientOptions) {
    super();

    this.chain = options.chain;

    if (options.chain === IChain.Solana) {
      this.nativeStreamClient = new SolanaStreamClient(
        options.clusterUrl,
        options.cluster,
        options.commitment,
        options.programId
      );
    } else {
      this.nativeStreamClient = new AptosStreamClient(
        options.clusterUrl,
        options.cluster,
        options.maxGas,
        options.programId
      );
    }
  }

  /**
   * Creates a new stream/vesting contract.
   */
  public create(
    streamData: ICreateStreamData,
    chainSpecificParams: ICreateStreamAptosExt | ICreateStreamSolanaExt
  ): Promise<CreateResponse | ITransactionResult> {
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
  ): Promise<CreateMultiResponse | IMultiTransactionResult> {
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
  ): Promise<TxResponse | ITransactionResult> {
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
  ): Promise<TxResponse | ITransactionResult> {
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
  ): Promise<TxResponse | ITransactionResult> {
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
  ): Promise<TxResponse | ITransactionResult> {
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
}
