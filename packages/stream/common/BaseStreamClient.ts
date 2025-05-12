import {
  type ICancelData,
  type ICreateMultipleStreamData,
  type ICreateResult,
  type ICreateStreamData,
  type IFees,
  type IGetAllData,
  type IGetFeesData,
  type IGetOneData,
  type IMultiTransactionResult,
  type ITopUpData,
  type ITransactionResult,
  type ITransferData,
  type IUpdateData,
  type IWithdrawData,
  type Stream,
} from "./types.js";

export abstract class BaseStreamClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract create(streamData: ICreateStreamData, chainSpecificParams: any): Promise<ICreateResult>;

  abstract createMultiple(
    multipleStreamData: ICreateMultipleStreamData,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chainSpecificParams: any,
  ): Promise<IMultiTransactionResult>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract withdraw(withdrawData: IWithdrawData, chainSpecificParams: any): Promise<ITransactionResult>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract cancel(cancelData: ICancelData, chainSpecificParams: any): Promise<ITransactionResult>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract transfer(transferData: ITransferData, chainSpecificParams: any): Promise<ITransactionResult>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract topup(topupData: ITopUpData, chainSpecificParams: any): Promise<ITransactionResult>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract getOne(getOneData: IGetOneData, chainSpecificParams: any): Promise<Stream>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract get(getAllData: IGetAllData, chainSpecificParams: any): Promise<[string, Stream][]>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract update(updateData: IUpdateData, chainSpecificParams: any): Promise<ITransactionResult>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract getFees(getFeesData: IGetFeesData, chainSpecificParams?: any): Promise<IFees | null>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract getDefaultStreamflowFee(chainSpecificParams?: any): Promise<number>;

  /**
   * Returns total fee percent, streamflow fees + partner fees
   * @param getFeesData structure with address for which we need to derive fee, either sender or partner usually
   * @param chainSpecificParams additional parameters required by chain client
   * @returns fee as floating number, so if fee is 0.99%, it will return 0.99
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
