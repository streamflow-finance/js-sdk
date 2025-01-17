import BN from "bn.js";
import { CoinStruct, SuiClient } from "@mysten/sui/client";
import { Transaction, TransactionObjectArgument } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID, SUI_TYPE_ARG } from "@mysten/sui/utils";
import { bcs } from "@mysten/sui/bcs";

import { BaseStreamClient } from "../common/BaseStreamClient.js";
import {
  ICancelData,
  ICluster,
  ICreateMultiError,
  ICreateMultipleStreamData,
  ICreateResult,
  ICreateStreamData,
  IGetFeesData,
  IGetOneData,
  IFees,
  IMultiTransactionResult,
  IRecipient,
  ITopUpData,
  ITransactionResult,
  ITransferData,
  IUpdateData,
  IWithdrawData,
} from "../common/types.js";
import { SUI_PROGRAM_IDS, SUI_FEE_TABLE_IDS, SUI_CONFIG_IDS } from "./constants.js";
import {
  Contract,
  IContractCreated,
  ICreateStreamSuiExt,
  ITransactionSuiExt,
  ISuiIdParameters,
  StreamResource,
  ClassResource,
  FeeTableResource,
  FeeValueResource,
} from "./types.js";
import { extractSuiErrorInfo } from "./utils.js";
import { SuiWalletWrapper } from "./wallet.js";
import { calculateTotalAmountToDeposit } from "../common/utils.js";
import { WITHDRAW_AVAILABLE_AMOUNT } from "../common/constants.js";

export default class SuiStreamClient extends BaseStreamClient {
  private programId: string;

  private configId: string;

  private feeTableId: string;

  private client: SuiClient;

  constructor(clusterUrl: string, cluster: ICluster = ICluster.Mainnet, ids?: ISuiIdParameters) {
    super();

    this.programId = ids?.program ? ids.program : SUI_PROGRAM_IDS[cluster];
    this.configId = ids?.config ? ids.config : SUI_CONFIG_IDS[cluster];
    this.feeTableId = ids?.feeTable ? ids.feeTable : SUI_FEE_TABLE_IDS[cluster];

    this.client = new SuiClient({ url: clusterUrl });
  }

  /**
   * Creates a new stream/vesting contract.
   */
  public async create(streamData: ICreateStreamData, { senderWallet }: ICreateStreamSuiExt): Promise<ICreateResult> {
    const wallet = new SuiWalletWrapper(senderWallet, this.client);
    const totalFee = await this.getTotalFee({
      address: streamData.partner ?? wallet.address,
    });
    const [tx] = await this.generateCreateBlock(
      wallet.address,
      {
        ...streamData,
        recipients: [{ ...streamData }],
      },
      totalFee,
    );

    const { digest, events } = await wallet.signAndExecuteTransaction({
      transaction: tx,
      options: { showEvents: true },
    });

    return {
      ixs: [],
      txId: digest,
      metadataId: (events![0].parsedJson as IContractCreated).address,
    };
  }

  /**
   * Creates multiple stream/vesting contracts.
   * We don't chain transactions in one Block so that one failed transaction does not revert all others.
   */
  public async createMultiple(
    multipleStreamData: ICreateMultipleStreamData,
    { senderWallet }: ICreateStreamSuiExt,
  ): Promise<IMultiTransactionResult> {
    const wallet = new SuiWalletWrapper(senderWallet, this.client);
    const totalFee = await this.getTotalFee({
      address: multipleStreamData.partner ?? wallet.address,
    });
    const [tx, firstIndex] = await this.generateCreateBlock(wallet.address, multipleStreamData, totalFee);

    const txs: string[] = [];
    const metadatas: string[] = [];
    const metadataToRecipient: Record<string, IRecipient> = {};
    const errors: ICreateMultiError[] = [];

    try {
      const { digest, events, effects } = await wallet.signAndExecuteTransaction({
        transaction: tx,
        options: { showEffects: true, showEvents: true },
      });
      txs.push(digest);

      if (effects!.status.status === "failure") {
        multipleStreamData.recipients.forEach((recipient) => {
          errors.push({
            error: effects!.status.error ?? "Unknown error!",
            recipient: recipient.recipient,
          });
        });
      } else {
        multipleStreamData.recipients.forEach((recipient, index) => {
          const metadataId = (events![index].parsedJson as IContractCreated).address;
          metadatas.push(metadataId);
          metadataToRecipient[metadataId] = recipient;
        });
      }
    } catch (e: any) {
      const errorInfo = extractSuiErrorInfo(e.toString() ?? "Unknown error!");
      multipleStreamData.recipients.forEach((recipient, index) => {
        if (
          errorInfo.index === undefined ||
          errorInfo.index < index + firstIndex ||
          errorInfo.index >= multipleStreamData.recipients.length + firstIndex ||
          errorInfo.index === index + firstIndex
        ) {
          errors.push({
            error: errorInfo.text,
            recipient: recipient.recipient,
            contractErrorCode: errorInfo.parsed?.name,
          });
        }
      });
    }

    return {
      txs,
      metadatas,
      metadataToRecipient,
      errors,
    };
  }

  /**
   * Attempts withdrawing from the specified stream.
   */
  public async withdraw(
    { id, amount = WITHDRAW_AVAILABLE_AMOUNT }: IWithdrawData,
    { senderWallet, tokenId }: ITransactionSuiExt,
  ): Promise<ITransactionResult> {
    const wallet = new SuiWalletWrapper(senderWallet, this.client);
    const tx = new Transaction();
    tx.moveCall({
      target: `${this.programId}::protocol::withdraw`,
      typeArguments: [tokenId],
      arguments: [
        tx.object(id),
        tx.object(this.configId),
        tx.object(SUI_CLOCK_OBJECT_ID),
        tx.pure.u64(amount.toString()),
      ],
    });

    const { digest } = await wallet.signAndExecuteTransaction({
      transaction: tx,
    });

    return {
      ixs: [],
      txId: digest,
    };
  }

  /**
   * Attempts canceling the specified stream.
   */
  public async cancel(
    cancelData: ICancelData,
    { senderWallet, tokenId }: ITransactionSuiExt,
  ): Promise<ITransactionResult> {
    const wallet = new SuiWalletWrapper(senderWallet, this.client);
    const tx = new Transaction();
    tx.moveCall({
      target: `${this.programId}::protocol::cancel`,
      typeArguments: [tokenId],
      arguments: [tx.object(cancelData.id), tx.object(this.configId), tx.object(SUI_CLOCK_OBJECT_ID)],
    });

    const { digest } = await wallet.signAndExecuteTransaction({
      transaction: tx,
    });

    return {
      ixs: [],
      txId: digest,
    };
  }

  /**
   * Attempts changing the stream/vesting contract's recipient (effectively transferring the stream/vesting contract).
   */
  public async transfer(
    transferData: ITransferData,
    { senderWallet, tokenId }: ITransactionSuiExt,
  ): Promise<ITransactionResult> {
    const wallet = new SuiWalletWrapper(senderWallet, this.client);
    const tx = new Transaction();
    tx.moveCall({
      target: `${this.programId}::protocol::transfer`,
      typeArguments: [tokenId],
      arguments: [tx.object(transferData.id), tx.pure.address(transferData.newRecipient)],
    });

    const { digest } = await wallet.signAndExecuteTransaction({
      transaction: tx,
    });

    return {
      ixs: [],
      txId: digest,
    };
  }

  /**
   * Tops up stream account with specified amount.
   */
  public async topup(
    topupData: ITopUpData,
    { senderWallet, tokenId }: ITransactionSuiExt,
  ): Promise<ITransactionResult> {
    const wallet = new SuiWalletWrapper(senderWallet, this.client);
    const tx = new Transaction();
    const coins = await this.getAllCoins(wallet.address, tokenId);
    const stream = await this.getOne({ id: topupData.id });
    const totalFee = (stream.partnerFeePercent + stream.streamflowFeePercent) / 100;
    const coinObject = this.splitCoinObjectForAmount(tx, topupData.amount, tokenId, coins, totalFee);
    tx.moveCall({
      target: `${this.programId}::protocol::topup`,
      typeArguments: [tokenId],
      arguments: [
        tx.object(topupData.id),
        tx.object(this.configId),
        coinObject,
        tx.gas,
        tx.pure.u64(topupData.amount.toString()),
      ],
    });
    this.returnSplittedCoinObject(tx, tokenId, coins, coinObject);

    const { digest } = await wallet.signAndExecuteTransaction({
      transaction: tx,
    });

    return {
      ixs: [],
      txId: digest,
    };
  }

  /**
   * Fetch stream data by its id (address).
   */
  public async getOne({ id }: IGetOneData): Promise<Contract> {
    const response = await this.client.getObject({
      id,
      options: {
        showContent: true,
      },
    });

    if (!response.data) {
      throw new Error(`Contract with id ${id} could not be found!`);
    }
    const content = response.data.content!;
    if (content.dataType !== "moveObject") {
      throw new Error(`Not a Move Object!`);
    }

    return new Contract(
      content.fields! as unknown as StreamResource,
      "0x97e9a9fb1392e9785319f5512d0bfde6ecf7757b09c6de41cec89e798dd361f2::strmt::STRMT",
    );
  }

  public async get(): Promise<[string, Contract][]> {
    throw new Error("Get all method is not supported for Sui chain!");
  }

  /**
   * Attempts updating the stream auto withdrawal params and amount per period
   */
  public async update(
    updateData: IUpdateData,
    { senderWallet, tokenId }: ITransactionSuiExt,
  ): Promise<ITransactionResult> {
    const wallet = new SuiWalletWrapper(senderWallet, this.client);
    const tx = new Transaction();
    tx.moveCall({
      target: `${this.programId}::protocol::update`,
      typeArguments: [tokenId],
      arguments: [
        tx.object(updateData.id),
        tx.object(this.configId),
        tx.object(SUI_CLOCK_OBJECT_ID),
        tx.gas,
        bcs
          .vector(bcs.bool())
          .serialize(updateData.enableAutomaticWithdrawal !== undefined ? [updateData.enableAutomaticWithdrawal] : []),
        bcs
          .vector(bcs.u64())
          .serialize(updateData.withdrawFrequency !== undefined ? [updateData.withdrawFrequency.toString()] : []),
        bcs
          .vector(bcs.u64())
          .serialize(updateData.amountPerPeriod !== undefined ? [updateData.amountPerPeriod.toString()] : []),
      ],
    });

    const { digest } = await wallet.signAndExecuteTransaction({
      transaction: tx,
    });

    return {
      ixs: [],
      txId: digest,
    };
  }

  public extractErrorCode(err: Error): string | null {
    const errorInfo = extractSuiErrorInfo(err.toString() ?? "Unknown error!");
    return errorInfo?.parsed?.name || null;
  }

  public async getFees({ address }: IGetFeesData): Promise<IFees | null> {
    const response = await this.client.getObject({
      id: this.feeTableId,
      options: {
        showContent: true,
      },
    });

    const content = response.data!.content!;
    if (content.dataType !== "moveObject") {
      throw new Error(`Not a Move Object!`);
    }
    const fields = content.fields as unknown as FeeTableResource;

    const fieldsResponse = await this.client.getDynamicFields({
      parentId: fields.values.fields.id.id,
    });
    const partnerDynamicField = fieldsResponse.data.filter((item) => item.name.value === address)[0];

    if (!partnerDynamicField) {
      return null;
    }

    const valueResponse = await this.client.getObject({
      id: partnerDynamicField.objectId,
      options: {
        showContent: true,
      },
    });
    const valueContent = valueResponse.data!.content!;
    if (valueContent.dataType !== "moveObject") {
      throw new Error(`Not a Move Object!`);
    }
    const valueFields = (valueContent.fields as unknown as FeeValueResource).value.fields;

    return {
      streamflowFee: Number(valueFields.streamflow_fee) / 100,
      partnerFee: Number(valueFields.partner_fee) / 100,
    };
  }

  public async getDefaultStreamflowFee(): Promise<number> {
    const response = await this.client.getObject({
      id: this.configId,
      options: {
        showContent: true,
      },
    });

    const content = response.data!.content!;
    if (content.dataType !== "moveObject") {
      throw new Error(`Not a Move Object!`);
    }
    const fields = content.fields as unknown as ClassResource;
    return Number(fields.streamflow_fee) / 100;
  }

  /**
   * Returns StreamClient protocol program ID.
   */
  public getProgramId(): string {
    return this.programId;
  }

  /**
   * Utility function to generate Transaction Block to create streams
   */
  private async generateCreateBlock(
    walletAddress: string,
    multipleStreamData: ICreateMultipleStreamData,
    totalFee: number,
  ): Promise<[Transaction, number]> {
    let coins = await this.getAllCoins(walletAddress, multipleStreamData.tokenId);
    const totalAmount = multipleStreamData.recipients
      .map((recipiient) => recipiient.amount)
      .reduce((prev, current) => current.add(prev));
    const tx = new Transaction();
    const coinObject = this.splitCoinObjectForAmount(tx, totalAmount, multipleStreamData.tokenId, coins, totalFee);
    coins = [coins[0]];
    let firstIndex: number | null = null;

    multipleStreamData.recipients.forEach((recipient) => {
      const result = tx.moveCall({
        target: `${this.programId}::protocol::create`,
        typeArguments: [multipleStreamData.tokenId],
        arguments: [
          tx.object(this.configId),
          tx.object(this.feeTableId),
          tx.object(SUI_CLOCK_OBJECT_ID),
          coinObject,
          tx.gas,
          tx.pure.u64(recipient.amount.toString()),
          tx.pure.u64(multipleStreamData.period),
          tx.pure.u64(recipient.amountPerPeriod.toString()),
          tx.pure.u64(multipleStreamData.start),
          tx.pure.u64(recipient.cliffAmount.toString()),
          tx.pure.bool(multipleStreamData.cancelableBySender),
          tx.pure.bool(multipleStreamData.cancelableByRecipient),
          tx.pure.bool(multipleStreamData.transferableBySender),
          tx.pure.bool(multipleStreamData.transferableByRecipient),
          tx.pure.bool(multipleStreamData.canTopup),
          tx.pure.bool(!!multipleStreamData.canPause),
          tx.pure.bool(!!multipleStreamData.canUpdateRate),
          tx.pure.bool(!!multipleStreamData.automaticWithdrawal),
          tx.pure.u64(multipleStreamData.withdrawalFrequency || 0),
          tx.pure.string(recipient.name),
          tx.pure.address(recipient.recipient),
          tx.pure.address(multipleStreamData.partner || walletAddress),
        ],
      });
      if (result.$kind === "Result" && firstIndex === null) {
        firstIndex = result.Result;
      }
    });
    this.returnSplittedCoinObject(tx, multipleStreamData.tokenId, coins, coinObject);
    return [tx, firstIndex!];
  }

  /**
   * Returns all coins owned by a Wallet
   * @param walletAddress wallet address
   * @param coinType coin type
   * @returns Array of Coin Structs
   */
  private async getAllCoins(walletAddress: string, coinType: string) {
    let coinsResponse = await this.client.getCoins({
      owner: walletAddress,
      coinType: coinType,
    });
    const coins = coinsResponse.data;
    while (coinsResponse.hasNextPage) {
      coinsResponse = await this.client.getCoins({
        owner: walletAddress,
        coinType: coinType,
        cursor: coinsResponse.nextCursor!,
      });
      coins.push(...coinsResponse.data);
    }
    return coins;
  }

  /**
   * Utility function to split Coin object and use splitted object for stream operations.
   * We do it like thid to mitigate risk of Transaction reverting in case Stream is created for Sui Coin object.
   * This way we can safely pass splitted Sui Coin object in Stream payload and use another object for gas/withdrawal fees.
   * @param tx current transanction block
   * @param amount minimal amount of coins requried
   * @param coinType coin type
   * @param coins array of owned coins of the same type
   * @param totalFee partner and treasury fees
   * @returns Coin Object to use in a Move Call
   */
  private splitCoinObjectForAmount(
    tx: Transaction,
    amount: BN,
    coinType: string,
    coins: CoinStruct[],
    totalFee: number,
  ): TransactionObjectArgument {
    const coinObject = coinType === SUI_TYPE_ARG ? tx.gas : tx.object(coins[0].coinObjectId);

    if (coins.length > 1) {
      tx.mergeCoins(
        coinObject,
        coins.slice(1).map((item) => tx.object(item.coinObjectId)),
      );
    }
    const totalAmount = calculateTotalAmountToDeposit(amount, totalFee);
    return tx.splitCoins(coinObject, [tx.pure.u64(totalAmount.toString())])[0];
  }

  /**
   * Return previously splitted Coin Object to owner and merge it to to rebate storage fees
   * @param tx current transaction
   * @param coinType coin type
   * @param coinObject splitted object
   * @param coins array of objects used in
   */
  private returnSplittedCoinObject(
    tx: Transaction,
    coinType: string,
    coins: CoinStruct[],
    coinObject: TransactionObjectArgument,
  ): void {
    const firstCoinObject = coinType === SUI_TYPE_ARG ? tx.gas : tx.object(coins[0].coinObjectId);
    tx.mergeCoins(firstCoinObject, [coinObject]);
  }
}
