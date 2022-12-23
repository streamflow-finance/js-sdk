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
import { ICreateStreamSolanaExt, IInteractStreamSolanaExt, ITopUpStreamSolanaExt } from "../solana";
import { ICreateStreamAptosExt, ITransactionAptosExt } from "../aptos";

export interface SolanaStreamClientOptions {
  chain: IChain.Solana;
  clusterUrl: string;
  commitment?: Commitment | ConnectionConfig;
  cluster?: ICluster;
  programId?: string;
}

export interface AptosStreamClientOptions {
  chain: IChain.Aptos;
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
        options.cluster,
        options.maxGas,
        options.programId
      );
    }
  }

  public create(
    streamData: ICreateStreamData,
    chainSpecificParams: ICreateStreamAptosExt | ICreateStreamSolanaExt
  ) {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      const params = <ICreateStreamSolanaExt>chainSpecificParams;
      return this.nativeStreamClient.create(streamData, params);
    } else {
      const params = <ICreateStreamAptosExt>chainSpecificParams;
      return this.nativeStreamClient.create(streamData, params);
    }
  }

  public createMultiple(
    multipleStreamData: ICreateMultipleStreamData,
    chainSpecificParams: ICreateStreamAptosExt | ICreateStreamSolanaExt
  ) {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      const params = <ICreateStreamSolanaExt>chainSpecificParams;
      return this.nativeStreamClient.createMultiple(multipleStreamData, params);
    } else {
      const params = <ICreateStreamAptosExt>chainSpecificParams;
      return this.nativeStreamClient.createMultiple(multipleStreamData, params);
    }
  }

  public withdraw(
    withdrawData: IWithdrawData,
    chainSpecificParams: ITransactionAptosExt | IInteractStreamSolanaExt
  ) {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      const params = <IInteractStreamSolanaExt>chainSpecificParams;
      return this.nativeStreamClient.withdraw(withdrawData, params);
    } else {
      const params = <ITransactionAptosExt>chainSpecificParams;
      return this.nativeStreamClient.withdraw(withdrawData, params);
    }
  }

  public cancel(
    cancelData: ICancelData,
    chainSpecificParams: ITransactionAptosExt | IInteractStreamSolanaExt
  ) {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      const params = <IInteractStreamSolanaExt>chainSpecificParams;
      return this.nativeStreamClient.cancel(cancelData, params);
    } else {
      const params = <ITransactionAptosExt>chainSpecificParams;
      return this.nativeStreamClient.cancel(cancelData, params);
    }
  }

  public transfer(
    transferData: ITransferData,
    chainSpecificParams: ITransactionAptosExt | IInteractStreamSolanaExt
  ) {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      const params = <IInteractStreamSolanaExt>chainSpecificParams;
      return this.nativeStreamClient.transfer(transferData, params);
    } else {
      const params = <ITransactionAptosExt>chainSpecificParams;
      return this.nativeStreamClient.transfer(transferData, params);
    }
  }

  public topup(
    topupData: ITopUpData,
    chainSpecificParams: ITransactionAptosExt | ITopUpStreamSolanaExt
  ) {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      const params = <ITopUpStreamSolanaExt>chainSpecificParams;
      return this.nativeStreamClient.topup(topupData, params);
    } else {
      const params = <ITransactionAptosExt>chainSpecificParams;
      return this.nativeStreamClient.topup(topupData, params);
    }
  }

  public getOne(getOneData: IGetOneData) {
    return this.nativeStreamClient.getOne(getOneData);
  }
}
