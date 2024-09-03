import {
  ICancelData,
  ICreateMultipleStreamData,
  ICreateResult,
  ICreateStreamData,
  IFees,
  IGetAllData,
  IGetFeesData,
  IGetOneData,
  IMultiTransactionResult,
  ITopUpData,
  ITransactionResult,
  ITransferData,
  IUpdateData,
  IWithdrawData,
  Stream,
} from "./types.js";

export abstract class BaseStreamClient {
  abstract create(streamData: ICreateStreamData, chainSpecificParams: any): Promise<ICreateResult>;

  abstract createMultiple(
    multipleStreamData: ICreateMultipleStreamData,
    chainSpecificParams: any,
  ): Promise<IMultiTransactionResult>;

  abstract withdraw(withdrawData: IWithdrawData, chainSpecificParams: any): Promise<ITransactionResult>;

  abstract cancel(cancelData: ICancelData, chainSpecificParams: any): Promise<ITransactionResult>;

  abstract transfer(transferData: ITransferData, chainSpecificParams: any): Promise<ITransactionResult>;

  abstract topup(topupData: ITopUpData, chainSpecificParams: any): Promise<ITransactionResult>;

  abstract getOne(getOneData: IGetOneData, chainSpecificParams: any): Promise<Stream>;

  abstract get(getAllData: IGetAllData, chainSpecificParams: any): Promise<[string, Stream][]>;

  abstract update(updateData: IUpdateData, chainSpecificParams: any): Promise<ITransactionResult>;

  abstract getFees(getFeesData: IGetFeesData, chainSpecificParams?: any): Promise<IFees | null>;

  abstract getDefaultStreamflowFee(chainSpecificParams?: any): Promise<number>;

  /**
   * Returns total fee percent, streamflow fees + partner fees
   * @param getFeesData structure with address for which we need to derive fee, either sender or partner usually
   * @param chainSpecificParams additional parameters required by chain client
   * @returns fee as floating number, so if fee is 0.99%, it will return 0.99
   */
  public async getTotalFee(getFeesData: IGetFeesData, chainSpecificParams?: any): Promise<number> {
    const fees = await this.getFees(getFeesData, chainSpecificParams);
    if (fees) {
      return fees.partnerFee + fees.streamflowFee;
    }
    return this.getDefaultStreamflowFee(chainSpecificParams);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  extractErrorCode(err: Error): string | null {
    return null;
  }
}
