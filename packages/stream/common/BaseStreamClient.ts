import {
  ICreateStreamData,
  ICreateMultipleStreamData,
  IWithdrawData,
  ICancelData,
  ITransferData,
  ITopUpData,
  IGetOneData,
  IUpdateData,
} from "./types";

export abstract class BaseStreamClient {
  protected abstract create(streamData: ICreateStreamData, chainSpecificParams: any): Promise<any>;

  protected abstract createMultiple(
    multipleStreamData: ICreateMultipleStreamData,
    chainSpecificParams: any
  ): Promise<any>;

  protected abstract withdraw(withdrawData: IWithdrawData, chainSpecificParams: any): Promise<any>;

  protected abstract cancel(cancelData: ICancelData, chainSpecificParams: any): Promise<any>;

  protected abstract transfer(transferData: ITransferData, chainSpecificParams: any): Promise<any>;

  protected abstract topup(topupData: ITopUpData, chainSpecificParams: any): Promise<any>;

  protected abstract getOne(getOneData: IGetOneData, chainSpecificParams: any): Promise<any>;

  protected abstract update(updateData: IUpdateData, chainSpecificParams: any): Promise<any>;
}
