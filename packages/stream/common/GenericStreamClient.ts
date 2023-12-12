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
  IFees,
  IGetFeesData,
} from "./types";
import { handleContractError } from "./utils";
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

/** Type referencing options for specific Chain Client */
type StreamClientOptions<T extends IChain> = T extends IChain.Solana
  ? SolanaStreamClientOptions
  : T extends IChain.Aptos
  ? AptosStreamClientOptions
  : T extends IChain.Sui
  ? SuiStreamClientOptions
  : EvmStreamClientOptions;
/** Type referencing Chain Client implementation */
type StreamClientType<T extends IChain> = T extends IChain.Solana
  ? SolanaStreamClient
  : T extends IChain.Aptos
  ? AptosStreamClient
  : T extends IChain.Sui
  ? SuiStreamClient
  : EvmStreamClient;
/** Type referencing additional parameters used by a Chain Client */
type ChainSpecificParams<T, SolanaExt, AptosExt, SuiExt> = T extends SolanaStreamClient
  ? SolanaExt
  : T extends AptosStreamClient
  ? AptosExt
  : T extends SuiStreamClient
  ? SuiExt
  : undefined;
/** Type referencing additional parameters used on Create by a Chain Client */
type CreateSpecificParams<T extends IChain> = ChainSpecificParams<
  StreamClientType<T>,
  ICreateStreamSolanaExt,
  ICreateStreamAptosExt,
  ICreateStreamSuiExt
>;
/** Type referencing additional parameters used on Topup by a Chain Client */
type TopupSpecificParams<T extends IChain> = ChainSpecificParams<
  StreamClientType<T>,
  ITopUpStreamSolanaExt,
  ITransactionAptosExt,
  ITransactionSuiExt
>;
/** Type referencing additional parameters used on other interactions by a Chain Client */
type InteractSpecificParams<T extends IChain> = ChainSpecificParams<
  StreamClientType<T>,
  IInteractStreamSolanaExt,
  ITransactionAptosExt,
  ITransactionSuiExt
>;

/** Generic Stream Client implementation that wrap Chain Client methods and enriches error messages if possible
 * @property {StreamClientType} - Chain Client implementation
 * @property {chain} - Chain
 */
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
    return handleContractError(
      () => this.nativeStreamClient.create(streamData, chainSpecificParams as any),
      this.nativeStreamClient.extractErrorCode
    );
  }

  /**
   * Creates multiple stream/vesting contracts.
   */
  public createMultiple(
    multipleStreamData: ICreateMultipleStreamData,
    chainSpecificParams?: CreateSpecificParams<T>
  ): Promise<IMultiTransactionResult> {
    return handleContractError(
      () => this.nativeStreamClient.createMultiple(multipleStreamData, chainSpecificParams as any),
      this.nativeStreamClient.extractErrorCode
    );
  }

  /**
   * Attempts withdrawing from the specified stream.
   */
  public withdraw(
    withdrawData: IWithdrawData,
    chainSpecificParams?: InteractSpecificParams<T>
  ): Promise<ITransactionResult> {
    return handleContractError(
      () => this.nativeStreamClient.withdraw(withdrawData, chainSpecificParams as any),
      this.nativeStreamClient.extractErrorCode
    );
  }

  /**
   * Attempts canceling the specified stream.
   */
  public cancel(
    cancelData: ICancelData,
    chainSpecificParams?: InteractSpecificParams<T>
  ): Promise<ITransactionResult> {
    return handleContractError(
      () => this.nativeStreamClient.cancel(cancelData, chainSpecificParams as any),
      this.nativeStreamClient.extractErrorCode
    );
  }

  /**
   * Attempts changing the stream/vesting contract's recipient (effectively transferring the stream/vesting contract).
   */
  public transfer(
    transferData: ITransferData,
    chainSpecificParams?: InteractSpecificParams<T>
  ): Promise<ITransactionResult> {
    return handleContractError(
      () => this.nativeStreamClient.transfer(transferData, chainSpecificParams as any),
      this.nativeStreamClient.extractErrorCode
    );
  }

  /**
   * Tops up stream account with specified amount.
   */
  public topup(
    topupData: ITopUpData,
    chainSpecificParams?: TopupSpecificParams<T>
  ): Promise<ITransactionResult> {
    return handleContractError(
      () => this.nativeStreamClient.topup(topupData, chainSpecificParams as any),
      this.nativeStreamClient.extractErrorCode
    );
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
    return handleContractError(
      () => this.nativeStreamClient.update(updateData, chainSpecificParams as any),
      this.nativeStreamClient.extractErrorCode
    );
  }

  /**
   * Returns streamflow and partner fees for the specific wallet in %
   */
  public getFees(getFeesData: IGetFeesData): Promise<IFees | null> {
    return this.nativeStreamClient.getFees(getFeesData);
  }

  /**
   * Returns default Streamflow Fee in %
   */
  public getDefaultStreamflowFee(): Promise<number> {
    return this.nativeStreamClient.getDefaultStreamflowFee();
  }
}
