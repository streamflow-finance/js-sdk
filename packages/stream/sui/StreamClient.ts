import BN from "bn.js";
import { CoinStruct, SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock, TransactionArgument } from "@mysten/sui.js/transactions";
import { SUI_CLOCK_OBJECT_ID, SUI_TYPE_ARG } from "@mysten/sui.js/utils";

import { BaseStreamClient } from "../common/BaseStreamClient";
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
} from "../common/types";
import { BASE_FEE } from "../common/constants";
import { SUI_PROGRAM_IDS, SUI_FEE_TABLE_IDS, SUI_CONFIG_IDS } from "./constants";
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
} from "./types";
import { extractSuiErrorInfo } from "./utils";
import { SuiWalletWrapper } from "./wallet";

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
  public async create(
    streamData: ICreateStreamData,
    { senderWallet }: ICreateStreamSuiExt
  ): Promise<ICreateResult> {
    const wallet = new SuiWalletWrapper(senderWallet, this.client);
    const [txb] = await this.generateCreateBlock(wallet.address, {
      ...streamData,
      recipients: [{ ...streamData }],
    });

    const { digest, events } = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: txb,
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
    { senderWallet }: ICreateStreamSuiExt
  ): Promise<IMultiTransactionResult> {
    const wallet = new SuiWalletWrapper(senderWallet, this.client);
    const [txb, firstIndex] = await this.generateCreateBlock(wallet.address, multipleStreamData);

    const txs: string[] = [];
    const metadatas: string[] = [];
    const metadataToRecipient: Record<string, IRecipient> = {};
    const errors: ICreateMultiError[] = [];

    try {
      const { digest, events, effects } = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: txb,
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
    withdrawData: IWithdrawData,
    { senderWallet, tokenId }: ITransactionSuiExt
  ): Promise<ITransactionResult> {
    const wallet = new SuiWalletWrapper(senderWallet, this.client);
    const txb = new TransactionBlock();
    txb.moveCall({
      target: `${this.programId}::protocol::withdraw`,
      typeArguments: [tokenId],
      arguments: [
        txb.object(withdrawData.id),
        txb.object(this.configId),
        txb.object(SUI_CLOCK_OBJECT_ID),
        txb.pure(withdrawData.amount.toString()),
      ],
    });

    const { digest } = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: txb,
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
    { senderWallet, tokenId }: ITransactionSuiExt
  ): Promise<ITransactionResult> {
    const wallet = new SuiWalletWrapper(senderWallet, this.client);
    const txb = new TransactionBlock();
    txb.moveCall({
      target: `${this.programId}::protocol::cancel`,
      typeArguments: [tokenId],
      arguments: [
        txb.object(cancelData.id),
        txb.object(this.configId),
        txb.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    const { digest } = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: txb,
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
    { senderWallet, tokenId }: ITransactionSuiExt
  ): Promise<ITransactionResult> {
    const wallet = new SuiWalletWrapper(senderWallet, this.client);
    const txb = new TransactionBlock();
    txb.moveCall({
      target: `${this.programId}::protocol::transfer`,
      typeArguments: [tokenId],
      arguments: [txb.object(transferData.id), txb.pure(transferData.newRecipient)],
    });

    const { digest } = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: txb,
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
    { senderWallet, tokenId }: ITransactionSuiExt
  ): Promise<ITransactionResult> {
    const wallet = new SuiWalletWrapper(senderWallet, this.client);
    const txb = new TransactionBlock();
    const coins = await this.getAllCoins(wallet.address, tokenId);
    const coinObject = this.splitCoinObjectForAmount(txb, topupData.amount, tokenId, coins);
    txb.moveCall({
      target: `${this.programId}::protocol::topup`,
      typeArguments: [tokenId],
      arguments: [
        txb.object(topupData.id),
        txb.object(this.configId),
        coinObject,
        txb.gas,
        txb.pure(topupData.amount.toString()),
      ],
    });
    this.returnSplittedCoinObject(txb, tokenId, coins, coinObject);

    const { digest } = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: txb,
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
      "0x97e9a9fb1392e9785319f5512d0bfde6ecf7757b09c6de41cec89e798dd361f2::strmt::STRMT"
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
    { senderWallet, tokenId }: ITransactionSuiExt
  ): Promise<ITransactionResult> {
    const wallet = new SuiWalletWrapper(senderWallet, this.client);
    const txb = new TransactionBlock();
    txb.moveCall({
      target: `${this.programId}::protocol::update`,
      typeArguments: [tokenId],
      arguments: [
        txb.object(updateData.id),
        txb.object(this.configId),
        txb.object(SUI_CLOCK_OBJECT_ID),
        txb.gas,
        txb.pure(
          updateData.enableAutomaticWithdrawal !== undefined
            ? [updateData.enableAutomaticWithdrawal]
            : [],
          "vector<bool>"
        ),
        txb.pure(
          updateData.withdrawFrequency !== undefined
            ? [updateData.withdrawFrequency.toString()]
            : [],
          "vector<u64>"
        ),
        txb.pure(
          updateData.amountPerPeriod !== undefined ? [updateData.amountPerPeriod.toString()] : [],
          "vector<u64>"
        ),
      ],
    });

    const { digest } = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: txb,
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
    const partnerDynamicField = fieldsResponse.data.filter(
      (item) => item.name.value === address
    )[0];

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
    multipleStreamData: ICreateMultipleStreamData
  ): Promise<[TransactionBlock, number]> {
    let coins = await this.getAllCoins(walletAddress, multipleStreamData.tokenId);
    const totalAmount = multipleStreamData.recipients
      .map((recipiient) => recipiient.amount)
      .reduce((prev, current) => current.add(prev));
    const txb = new TransactionBlock();
    const coinObject = this.splitCoinObjectForAmount(
      txb,
      totalAmount,
      multipleStreamData.tokenId,
      coins
    );
    coins = [coins[0]];
    let firstIndex: number | null = null;

    multipleStreamData.recipients.forEach((recipient) => {
      const result = txb.moveCall({
        target: `${this.programId}::protocol::create`,
        typeArguments: [multipleStreamData.tokenId],
        arguments: [
          txb.object(this.configId),
          txb.object(this.feeTableId),
          txb.object(SUI_CLOCK_OBJECT_ID),
          coinObject,
          txb.gas,
          txb.pure(recipient.amount.toString()),
          txb.pure(multipleStreamData.period),
          txb.pure(recipient.amountPerPeriod.toString()),
          txb.pure(multipleStreamData.start),
          txb.pure(recipient.cliffAmount.toString()),
          txb.pure(multipleStreamData.cancelableBySender),
          txb.pure(multipleStreamData.cancelableByRecipient),
          txb.pure(multipleStreamData.transferableBySender),
          txb.pure(multipleStreamData.transferableByRecipient),
          txb.pure(multipleStreamData.canTopup),
          txb.pure(!!multipleStreamData.canPause),
          txb.pure(!!multipleStreamData.canUpdateRate),
          txb.pure(!!multipleStreamData.automaticWithdrawal),
          txb.pure(multipleStreamData.withdrawalFrequency || 0),
          txb.pure(recipient.name),
          txb.pure(recipient.recipient),
          txb.pure(multipleStreamData.partner || walletAddress),
        ],
      });
      if (result.kind === "Result" && firstIndex === null) {
        firstIndex = result.index;
      }
    });
    this.returnSplittedCoinObject(txb, multipleStreamData.tokenId, coins, coinObject);
    return [txb, firstIndex!];
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
   * @param txb current transanction block
   * @param amount minimal amount of coins requried
   * @param coinType coin type
   * @param coins array of owned coins of the same type
   * @returns Coin Object to use in a Move Call
   */
  private splitCoinObjectForAmount(
    txb: TransactionBlock,
    amount: BN,
    coinType: string,
    coins: CoinStruct[]
  ): TransactionArgument {
    const coinObject = coinType === SUI_TYPE_ARG ? txb.gas : txb.object(coins[0].coinObjectId);

    if (coins.length > 1) {
      txb.mergeCoins(
        coinObject,
        coins.slice(1).map((item) => txb.object(item.coinObjectId))
      );
    }
    const sum = amount.mul(new BN(BASE_FEE)).div(new BN(1000000));
    return txb.splitCoins(coinObject, [txb.pure(sum.toString())])[0];
  }

  /**
   * Return previously splitted Coin Object to owner and merge it to to rebate storage fees
   * @param txb current transanction block
   * @param coinType coin type
   * @param coinObject splitted object
   * @param coins array of objects used in
   */
  private returnSplittedCoinObject(
    txb: TransactionBlock,
    coinType: string,
    coins: CoinStruct[],
    coinObject: TransactionArgument
  ): void {
    const firstCoinObject = coinType === SUI_TYPE_ARG ? txb.gas : txb.object(coins[0].coinObjectId);
    txb.mergeCoins(firstCoinObject, [coinObject]);
  }
}
