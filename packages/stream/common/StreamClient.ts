import {
  ICreateStreamData,
  ICreateMultipleStreamData,
  IWithdrawData,
  ICancelData,
  ITransferData,
  ITopUpData,
  IGetOneData,
} from "./types";

export abstract class GenericStreamClient {
  public abstract create(
    streamData: ICreateStreamData,
    ...chainSpecificParams: any[]
  ): Promise<any>;

  public abstract createMultiple(
    multipleStreamData: ICreateMultipleStreamData,
    ...chainSpecificParams: any[]
  ): Promise<any>;

  public abstract withdraw(
    withdrawData: IWithdrawData,
    ...chainSpecificParams: any[]
  ): Promise<any>;

  public abstract cancel(cancelData: ICancelData, ...chainSpecificParams: any[]): Promise<any>;

  public abstract transfer(
    transferData: ITransferData,
    ...chainSpecificParams: any[]
  ): Promise<any>;

  public abstract topup(topupData: ITopUpData, ...chainSpecificParams: any[]): Promise<any>;

  public abstract getOne(getOneData: IGetOneData, ...chainSpecificParams: any[]): Promise<any>;
}
