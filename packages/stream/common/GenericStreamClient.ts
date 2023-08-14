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
  chain: IChain.Ethereum | IChain.BNB | IChain.Polygon;
  clusterUrl: string;
  signer: Signer;
  cluster?: ICluster;
  programId?: string;
}

type StreamClientOptions<T extends IChain> = T extends IChain.Solana
  ? SolanaStreamClientOptions
  : T extends IChain.Aptos
  ? AptosStreamClientOptions
  : EvmStreamClientOptions;
type StreamClientType<T extends IChain> = T extends IChain.Solana
  ? SolanaStreamClient
  : T extends IChain.Aptos
  ? AptosStreamClient
  : EvmStreamClient;
type ChainSpecificParams<T, SolanaExt, AptosExt> = T extends SolanaStreamClient
  ? SolanaExt
  : T extends AptosStreamClient
  ? AptosExt
  : undefined;
type CreateSpecificParams<T extends IChain> = ChainSpecificParams<
  StreamClientType<T>,
  ICreateStreamSolanaExt,
  ICreateStreamAptosExt
>;
type TopupSpecificParams<T extends IChain> = ChainSpecificParams<
  StreamClientType<T>,
  ITopUpStreamSolanaExt,
  ITransactionAptosExt
>;
type InteractSpecificParams<T extends IChain> = ChainSpecificParams<
  StreamClientType<T>,
  IInteractStreamSolanaExt,
  ITransactionAptosExt
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
    }
  }

  /**
   * Creates a new stream/vesting contract.
   */
  public create(
    streamData: ICreateStreamData,
    chainSpecificParams?: CreateSpecificParams<T>
  ): Promise<ICreateResult> {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      return this.nativeStreamClient.create(
        streamData,
        chainSpecificParams as ICreateStreamSolanaExt
      );
    } else if (this.nativeStreamClient instanceof AptosStreamClient) {
      return this.nativeStreamClient.create(
        streamData,
        chainSpecificParams as ICreateStreamAptosExt
      );
    }
    return this.nativeStreamClient.create(streamData);
  }

  /**
   * Creates multiple stream/vesting contracts.
   */
  public createMultiple(
    multipleStreamData: ICreateMultipleStreamData,
    chainSpecificParams?: CreateSpecificParams<T>
  ): Promise<IMultiTransactionResult> {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      return this.nativeStreamClient.createMultiple(
        multipleStreamData,
        chainSpecificParams as ICreateStreamSolanaExt
      );
    } else if (this.nativeStreamClient instanceof AptosStreamClient) {
      return this.nativeStreamClient.createMultiple(
        multipleStreamData,
        chainSpecificParams as ICreateStreamAptosExt
      );
    }
    return this.nativeStreamClient.createMultiple(multipleStreamData);
  }

  /**
   * Attempts withdrawing from the specified stream.
   */
  public withdraw(
    withdrawData: IWithdrawData,
    chainSpecificParams?: InteractSpecificParams<T>
  ): Promise<ITransactionResult> {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      return this.nativeStreamClient.withdraw(
        withdrawData,
        chainSpecificParams as IInteractStreamSolanaExt
      );
    } else if (this.nativeStreamClient instanceof AptosStreamClient) {
      return this.nativeStreamClient.withdraw(
        withdrawData,
        chainSpecificParams as ITransactionAptosExt
      );
    }
    return this.nativeStreamClient.withdraw(withdrawData);
  }

  /**
   * Attempts canceling the specified stream.
   */
  public cancel(
    cancelData: ICancelData,
    chainSpecificParams?: InteractSpecificParams<T>
  ): Promise<ITransactionResult> {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      return this.nativeStreamClient.cancel(
        cancelData,
        chainSpecificParams as IInteractStreamSolanaExt
      );
    } else if (this.nativeStreamClient instanceof AptosStreamClient) {
      return this.nativeStreamClient.cancel(
        cancelData,
        chainSpecificParams as ITransactionAptosExt
      );
    }
    return this.nativeStreamClient.cancel(cancelData);
  }

  /**
   * Attempts changing the stream/vesting contract's recipient (effectively transferring the stream/vesting contract).
   */
  public transfer(
    transferData: ITransferData,
    chainSpecificParams?: InteractSpecificParams<T>
  ): Promise<ITransactionResult> {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      return this.nativeStreamClient.transfer(
        transferData,
        chainSpecificParams as IInteractStreamSolanaExt
      );
    } else if (this.nativeStreamClient instanceof AptosStreamClient) {
      return this.nativeStreamClient.transfer(
        transferData,
        chainSpecificParams as ITransactionAptosExt
      );
    }
    return this.nativeStreamClient.transfer(transferData);
  }

  /**
   * Tops up stream account with specified amount.
   */
  public topup(
    topupData: ITopUpData,
    chainSpecificParams?: TopupSpecificParams<T>
  ): Promise<ITransactionResult> {
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      return this.nativeStreamClient.topup(topupData, chainSpecificParams as ITopUpStreamSolanaExt);
    } else if (this.nativeStreamClient instanceof AptosStreamClient) {
      return this.nativeStreamClient.topup(topupData, chainSpecificParams as ITransactionAptosExt);
    }
    return this.nativeStreamClient.topup(topupData);
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
    if (this.nativeStreamClient instanceof SolanaStreamClient) {
      return this.nativeStreamClient.update(
        updateData,
        chainSpecificParams as IInteractStreamSolanaExt
      );
    } else if (this.nativeStreamClient instanceof AptosStreamClient) {
      return this.nativeStreamClient.update(
        updateData,
        chainSpecificParams as ITransactionAptosExt
      );
    }
    return this.nativeStreamClient.update(updateData);
  }
}
