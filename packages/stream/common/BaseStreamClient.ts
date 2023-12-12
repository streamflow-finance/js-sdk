import {
  ICreateStreamData,
  ICreateMultipleStreamData,
  IFees,
  IWithdrawData,
  ICancelData,
  ITransferData,
  ITopUpData,
  IGetFeesData,
  IGetOneData,
  IUpdateData,
  ITransactionResult,
  IMultiTransactionResult,
  ICreateResult,
  IGetAllData,
  Stream,
} from "./types";

export abstract class BaseStreamClient {
  abstract create(streamData: ICreateStreamData, chainSpecificParams: any): Promise<ICreateResult>;

  abstract createMultiple(
    multipleStreamData: ICreateMultipleStreamData,
    chainSpecificParams: any
  ): Promise<IMultiTransactionResult>;

  abstract withdraw(
    withdrawData: IWithdrawData,
    chainSpecificParams: any
  ): Promise<ITransactionResult>;

  abstract cancel(cancelData: ICancelData, chainSpecificParams: any): Promise<ITransactionResult>;

  abstract transfer(
    transferData: ITransferData,
    chainSpecificParams: any
  ): Promise<ITransactionResult>;

  abstract topup(topupData: ITopUpData, chainSpecificParams: any): Promise<ITransactionResult>;

  abstract getOne(getOneData: IGetOneData, chainSpecificParams: any): Promise<Stream>;

  abstract get(getAllData: IGetAllData, chainSpecificParams: any): Promise<[string, Stream][]>;

  abstract update(updateData: IUpdateData, chainSpecificParams: any): Promise<ITransactionResult>;

  abstract getFees(getFeesData: IGetFeesData, chainSpecificParams: any): Promise<IFees | null>;

  abstract getDefaultStreamflowFee(chainSpecificParams: any): Promise<number>;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  extractErrorCode(err: Error): string | null {
    return null;
  }
}
