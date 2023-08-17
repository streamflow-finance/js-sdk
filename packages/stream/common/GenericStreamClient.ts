import { Commitment, ConnectionConfig } from "@solana/web3.js";
import { Signer } from "ethers";

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
  Stream,
} from "./types";
import { AptosStreamClient, ICreateStreamAptosExt, ITransactionAptosExt } from "../aptos";
import { EvmStreamClient } from "../evm";
import {
  SolanaStreamClient,
  ICreateStreamSolanaExt,
  IInteractStreamSolanaExt,
  ITopUpStreamSolanaExt,
} from "../solana";
import { ICreateStreamSuiExt, ITransactionSuiExt, ISuiIdParameters, SuiStreamClient } from "../sui";

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
  chain: IChain.Ethereum | IChain.BNB | IChain.Polygon;
  clusterUrl: string;
  signer: Signer;
  cluster?: ICluster;
  programId?: string;
}

export interface SuiStreamClientOptions {
  chain: IChain.Sui;
  clusterUrl: string;
  cluster?: ICluster;
  ids?: ISuiIdParameters;
}

type StreamClientOptions<T extends IChain> = T extends IChain.Solana
  ? SolanaStreamClientOptions
  : T extends IChain.Aptos
  ? AptosStreamClientOptions
  : T extends IChain.Sui
  ? SuiStreamClientOptions
  : EvmStreamClientOptions;
type StreamClientType<T extends IChain> = T extends IChain.Solana
  ? SolanaStreamClient
  : T extends IChain.Aptos
  ? AptosStreamClient
  : T extends IChain.Sui
  ? SuiStreamClient
  : EvmStreamClient;
type ChainSpecificParams<T, SolanaExt, AptosExt, SuiExt> = T extends SolanaStreamClient
  ? SolanaExt
  : T extends AptosStreamClient
  ? AptosExt
  : T extends SuiStreamClient
  ? SuiExt
  : undefined;
type CreateSpecificParams<T extends IChain> = ChainSpecificParams<
  StreamClientType<T>,
  ICreateStreamSolanaExt,
  ICreateStreamAptosExt,
  ICreateStreamSuiExt
>;
type TopupSpecificParams<T extends IChain> = ChainSpecificParams<
  StreamClientType<T>,
  ITopUpStreamSolanaExt,
  ITransactionAptosExt,
  ITransactionSuiExt
>;
type InteractSpecificParams<T extends IChain> = ChainSpecificParams<
  StreamClientType<T>,
  IInteractStreamSolanaExt,
  ITransactionAptosExt,
  ITransactionSuiExt
>;

export default class GenericStreamClient<T extends IChain> extends BaseStreamClient {
  public nativeStreamClient: StreamClientType<T>;

  public chain: IChain;

  constructor(options: StreamClientOptions<T>) {
    super();

    this.chain = options.chain;

    switch (options.chain) {
      case IChain.Solana:
        this.nativeStreamClient = new SolanaStreamClient(
          options.clusterUrl,
          options.cluster,
          options.commitment,
          options.programId
        ) as StreamClientType<T>;
        break;
      case IChain.Aptos:
        this.nativeStreamClient = new AptosStreamClient(
          options.clusterUrl,
          options.cluster,
          options.maxGas,
          options.programId
        ) as StreamClientType<T>;
        break;
      case IChain.BNB:
      case IChain.Ethereum:
      case IChain.Polygon:
        this.nativeStreamClient = new EvmStreamClient(
          options.clusterUrl,
          options.chain,
          options.signer,
          options.cluster,
          options.programId
        ) as StreamClientType<T>;
        break;
      case IChain.Sui:
        this.nativeStreamClient = new SuiStreamClient(
          options.clusterUrl,
          options.cluster,
          options.ids
        ) as StreamClientType<T>;
    }
  }

  /**
   * Creates a new stream/vesting contract.
   */
  public create(
    streamData: ICreateStreamData,
    chainSpecificParams?: CreateSpecificParams<T>
  ): Promise<ICreateResult> {
    return this.nativeStreamClient.create(streamData, chainSpecificParams as any);
  }

  /**
   * Creates multiple stream/vesting contracts.
   */
  public createMultiple(
    multipleStreamData: ICreateMultipleStreamData,
    chainSpecificParams?: CreateSpecificParams<T>
  ): Promise<IMultiTransactionResult> {
    return this.nativeStreamClient.createMultiple(multipleStreamData, chainSpecificParams as any);
  }

  /**
   * Attempts withdrawing from the specified stream.
   */
  public withdraw(
    withdrawData: IWithdrawData,
    chainSpecificParams?: InteractSpecificParams<T>
  ): Promise<ITransactionResult> {
    return this.nativeStreamClient.withdraw(withdrawData, chainSpecificParams as any);
  }

  /**
   * Attempts canceling the specified stream.
   */
  public cancel(
    cancelData: ICancelData,
    chainSpecificParams?: InteractSpecificParams<T>
  ): Promise<ITransactionResult> {
    return this.nativeStreamClient.cancel(cancelData, chainSpecificParams as any);
  }

  /**
   * Attempts changing the stream/vesting contract's recipient (effectively transferring the stream/vesting contract).
   */
  public transfer(
    transferData: ITransferData,
    chainSpecificParams?: InteractSpecificParams<T>
  ): Promise<ITransactionResult> {
    return this.nativeStreamClient.transfer(transferData, chainSpecificParams as any);
  }

  /**
   * Tops up stream account with specified amount.
   */
  public topup(
    topupData: ITopUpData,
    chainSpecificParams?: TopupSpecificParams<T>
  ): Promise<ITransactionResult> {
    return this.nativeStreamClient.topup(topupData, chainSpecificParams as any);
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
    chainSpecificParams?: InteractSpecificParams<T>
  ): Promise<ITransactionResult> {
    return this.nativeStreamClient.update(updateData, chainSpecificParams as any);
  }
}
