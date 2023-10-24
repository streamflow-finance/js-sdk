import {
  ICreateStreamData,
  ICreateMultipleStreamData,
  IWithdrawData,
  ICancelData,
  ITransferData,
  ITopUpData,
  IGetOneData,
  IUpdateData,
  ITransactionResult,
  IMultiTransactionResult,
  ICreateResult,
  IGetAllData,
  Stream,
} from "./types";

export abstract class BaseStreamClient {
  protected abstract create(
    streamData: ICreateStreamData,
    chainSpecificParams: any
  ): Promise<ICreateResult>;

  protected abstract createMultiple(
    multipleStreamData: ICreateMultipleStreamData,
    chainSpecificParams: any
  ): Promise<IMultiTransactionResult>;

  protected abstract withdraw(
    withdrawData: IWithdrawData,
    chainSpecificParams: any
  ): Promise<ITransactionResult>;

  protected abstract cancel(
    cancelData: ICancelData,
    chainSpecificParams: any
  ): Promise<ITransactionResult>;

  protected abstract transfer(
    transferData: ITransferData,
    chainSpecificParams: any
  ): Promise<ITransactionResult>;

  protected abstract topup(
    topupData: ITopUpData,
    chainSpecificParams: any
  ): Promise<ITransactionResult>;

  protected abstract getOne(getOneData: IGetOneData, chainSpecificParams: any): Promise<Stream>;

  protected abstract get(
    getAllData: IGetAllData,
    chainSpecificParams: any
  ): Promise<[string, Stream][]>;

  protected abstract update(
    updateData: IUpdateData,
    chainSpecificParams: any
  ): Promise<ITransactionResult>;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  extractErrorCode(err: Error): string | null {
    return null;
  }
}
