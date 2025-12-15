import { Program, type AccountsCoder, type Idl, type IdlAccounts } from "@coral-xyz/anchor";
import {
  createTransferCheckedInstruction,
  createTransferCheckedWithFeeInstruction,
  getTransferFeeConfig,
  NATIVE_MINT,
} from "@solana/spl-token";
import type { AccountInfo, Commitment, ConnectionConfig, MemcmpFilter, TransactionInstruction } from "@solana/web3.js";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ICluster,
  invariant,
  type ITransactionResult,
  ata,
  buildSendThrottler,
  checkOrCreateAtaBatch,
  createAndEstimateTransaction,
  getMintAndProgram,
  pk,
  prepareBaseInstructions,
  prepareTransaction,
  prepareWrappedAccount,
  unwrapExecutionParams,
  type IProgramAccount,
  type ITransactionExtResolved,
  type PartnerOracle,
  buildPartnerOracle,
} from "@streamflow/common";
import BN from "bn.js";
import type PQueue from "p-queue";

import {
  AIRDROP_CLAIM_FEE,
  DISTRIBUTOR_ADMIN_OFFSET,
  DISTRIBUTOR_MINT_OFFSET,
  DISTRIBUTOR_PROGRAM_ID,
  FEE_CONFIG_PUBLIC_KEY,
  PARTNER_ORACLE_PROGRAM_ID,
  SOL_FEE_PROGRAM_VERSION,
  STREAMFLOW_TREASURY_PUBLIC_KEY,
} from "../constants.js";
import { MINIMUM_FEE_FALLBACK, resolveAirdropFeeLamportsUsingApi } from "../fees.js";
import MerkleDistributorIDL from "../descriptor/idl/merkle_distributor.json";
import type { MerkleDistributor as MerkleDistributorProgramType } from "../descriptor/merkle_distributor.js";
import type {
  AnyClaimStatus,
  MerkleDistributor,
  IClaimData,
  IClawbackData,
  ICloseClaimData,
  ICreateAlignedDistributorData,
  ICreateDistributorData,
  ICreateDistributorResult,
  ICreateExt,
  IGetClaimData,
  IGetDistributors,
  IInteractExt,
  ISearchDistributors,
  ClawbackAccounts,
  NewDistributorAccounts,
  Fees,
  FeeConfig,
} from "../types.js";
import {
  calculateAmountWithTransferFees,
  getClaimantStatusPda,
  getDistributorPda,
  wrappedSignAndExecuteTransaction,
} from "../utils.js";

export interface IInitOptions {
  clusterUrl: string;
  cluster?: ICluster;
  commitment?: Commitment | ConnectionConfig;
  programId?: string;
  sendRate?: number;
  sendThrottler?: PQueue;
  apiUrl: string;
  apiKey?: string;
}

export default abstract class BaseDistributorClient {
  protected connection: Connection;

  protected programId: PublicKey;

  protected partnerOracleProgramId: PublicKey;

  protected partnerOracle: Program<PartnerOracle>;

  protected feeConfigPublicKey: PublicKey;

  protected commitment: Commitment | ConnectionConfig;

  protected sendThrottler: PQueue;

  public merkleDistributorProgram: Program<MerkleDistributorProgramType>;

  protected cluster: ICluster;

  protected apiUrl: string;

  protected apiKey?: string;

  public constructor({
    clusterUrl,
    cluster = ICluster.Mainnet,
    commitment = "confirmed",
    programId = "",
    sendRate = 1,
    sendThrottler,
    apiUrl,
    apiKey,
  }: IInitOptions) {
    this.commitment = commitment;
    this.cluster = cluster;
    this.connection = new Connection(clusterUrl, this.commitment);
    this.programId = programId !== "" ? new PublicKey(programId) : new PublicKey(DISTRIBUTOR_PROGRAM_ID[cluster]);
    this.partnerOracleProgramId = new PublicKey(PARTNER_ORACLE_PROGRAM_ID[cluster]);
    this.partnerOracle = buildPartnerOracle(this.connection);
    this.feeConfigPublicKey = new PublicKey(FEE_CONFIG_PUBLIC_KEY[cluster]);
    this.sendThrottler = sendThrottler ?? buildSendThrottler(sendRate);
    const merkleDistributorProgram = {
      ...MerkleDistributorIDL,
    } as MerkleDistributorProgramType;
    this.merkleDistributorProgram = new Program(merkleDistributorProgram, { connection: this.connection });
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  protected abstract getNewDistributorInstruction(
    data: ICreateDistributorData | ICreateAlignedDistributorData,
    accounts: NewDistributorAccounts,
  ): Promise<TransactionInstruction>;
  protected abstract getClawbackInstruction(account: ClawbackAccounts): Promise<TransactionInstruction>;

  public getConnection(): Connection {
    return this.connection;
  }

  public getCommitment(): Commitment | undefined {
    return typeof this.commitment == "string" ? this.commitment : this.commitment.commitment;
  }

  public getDistributorProgramId(): PublicKey {
    return this.programId;
  }

  public async prepareCreateInstructions(
    data: ICreateDistributorData | ICreateAlignedDistributorData,
    extParams: ITransactionExtResolved<ICreateExt>,
  ): Promise<{ distributorPublicKey: PublicKey; ixs: TransactionInstruction[] }> {
    if (!extParams.invoker.publicKey) {
      throw new Error("Invoker's PublicKey is not available, check passed wallet adapter!");
    }
    const { version, mint } = data;

    const ixs: TransactionInstruction[] = prepareBaseInstructions(this.connection, extParams);
    const mintPublicKey = extParams.isNative ? NATIVE_MINT : new PublicKey(mint);
    const { mint: mintAccount, tokenProgramId } = await getMintAndProgram(this.connection, mintPublicKey);
    const transferFeeConfig = getTransferFeeConfig(mintAccount);
    const distributorPublicKey = getDistributorPda(this.programId, mintPublicKey, version);
    const tokenVault = await ata(mintPublicKey, distributorPublicKey, tokenProgramId);
    const senderTokens = await ata(mintPublicKey, extParams.invoker.publicKey, tokenProgramId);

    const accounts: NewDistributorAccounts = {
      clawbackReceiver: senderTokens,
      mint: mintPublicKey,
      admin: extParams.invoker.publicKey,
      tokenProgram: tokenProgramId,
    };

    if (extParams.isNative) {
      ixs.push(
        ...(await prepareWrappedAccount(this.connection, extParams.invoker.publicKey, new BN(data.maxTotalClaim))),
      );
    }

    const newDistributorInstruction = await this.getNewDistributorInstruction(data, accounts);

    ixs.push(newDistributorInstruction);

    if (transferFeeConfig) {
      const { transferAmount, feeCharged } = await calculateAmountWithTransferFees(
        this.connection,
        transferFeeConfig,
        BigInt(data.maxTotalClaim.toString()),
      );

      ixs.push(
        createTransferCheckedWithFeeInstruction(
          senderTokens,
          mintPublicKey,
          tokenVault,
          extParams.invoker.publicKey,
          transferAmount,
          mintAccount.decimals,
          feeCharged,
          undefined,
          tokenProgramId,
        ),
      );
    } else {
      ixs.push(
        createTransferCheckedInstruction(
          senderTokens,
          mintPublicKey,
          tokenVault,
          extParams.invoker.publicKey,
          BigInt(data.maxTotalClaim.toString()),
          mintAccount.decimals,
          undefined,
          tokenProgramId,
        ),
      );
    }

    return { distributorPublicKey, ixs };
  }

  public async create(
    data: ICreateDistributorData | ICreateAlignedDistributorData,
    extParams: ICreateExt,
  ): Promise<ICreateDistributorResult> {
    const invoker = extParams.invoker.publicKey;
    invariant(invoker, "Invoker's PublicKey is not available, check passed wallet adapter!");
    const executionParams = this.unwrapExecutionParams(extParams);
    const { ixs, distributorPublicKey } = await createAndEstimateTransaction(
      (params) => this.prepareCreateInstructions(data, params),
      executionParams,
      (q) => q.ixs,
    );
    const { tx, hash, context } = await prepareTransaction(this.connection, ixs, extParams.invoker.publicKey);
    const signature = await wrappedSignAndExecuteTransaction(
      this.connection,
      extParams.invoker,
      tx,
      {
        hash,
        context,
        commitment: this.getCommitment(),
      },
      { sendThrottler: this.sendThrottler, skipSimulation: executionParams.skipSimulation },
    );

    return {
      ixs,
      txId: signature,
      metadataId: distributorPublicKey.toBase58(),
    };
  }

  /**
   * @public
   * @overload
   */
  public async claim(data: IClaimData, extParams: IInteractExt): Promise<ITransactionResult>;

  /**
   * @internal
   */
  public async claim(
    data: IClaimData,
    extParams: IInteractExt,
    _serviceTransfer?: unknown,
  ): Promise<ITransactionResult>;
  public async claim(
    data: IClaimData,
    extParams: IInteractExt,
    _serviceTransfer?: unknown,
  ): Promise<ITransactionResult> {
    const executionParams = this.unwrapExecutionParams(extParams);
    const invoker = executionParams.invoker.publicKey;
    invariant(invoker, "Invoker's PublicKey is not available, check passed wallet adapter!");
    const ixs = await createAndEstimateTransaction(
      (params) => this.prepareClaimInstructions(data, params, _serviceTransfer),
      executionParams,
    );
    const { tx, hash, context } = await prepareTransaction(this.connection, ixs, invoker);
    const signature = await wrappedSignAndExecuteTransaction(
      this.connection,
      executionParams.invoker,
      tx,
      {
        hash,
        context,
        commitment: this.getCommitment(),
      },
      { sendThrottler: this.sendThrottler, skipSimulation: true },
    );

    return { ixs, txId: signature };
  }

  /**
   * @public
   * @overload
   */
  public async prepareClaimInstructions(
    data: IClaimData,
    extParams: ITransactionExtResolved<IInteractExt>,
  ): Promise<TransactionInstruction[]>;

  /**
   * @internal
   */
  public async prepareClaimInstructions(
    data: IClaimData,
    extParams: ITransactionExtResolved<IInteractExt>,
    _serviceTransfer?: unknown,
  ): Promise<TransactionInstruction[]>;
  public async prepareClaimInstructions(
    data: IClaimData,
    extParams: ITransactionExtResolved<IInteractExt>,
    _serviceTransfer?: unknown,
  ): Promise<TransactionInstruction[]> {
    if (!extParams.invoker.publicKey) {
      throw new Error("Invoker's PublicKey is not available, check passed wallet adapter!");
    }

    const distributorPublicKey = new PublicKey(data.id);
    const distributor = await this.merkleDistributorProgram.account.merkleDistributor.fetch(distributorPublicKey);

    if (!distributor) {
      throw new Error("Couldn't get account info");
    }

    const { tokenProgramId } = await getMintAndProgram(this.connection, distributor.mint);
    const ixs: TransactionInstruction[] = prepareBaseInstructions(this.connection, extParams);
    ixs.push(
      ...(await checkOrCreateAtaBatch(
        this.connection,
        [extParams.invoker.publicKey],
        distributor.mint,
        extParams.invoker,
        tokenProgramId,
        extParams.feePayer,
      )),
    );
    const invokerTokens = await ata(distributor.mint, extParams.invoker.publicKey, tokenProgramId);
    const claimStatusPublicKey = getClaimantStatusPda(
      this.programId,
      distributorPublicKey,
      extParams.invoker.publicKey,
    );
    const claimStatus = await this.getClaim(claimStatusPublicKey);

    if (!claimStatus) {
      ixs.push(
        await this.merkleDistributorProgram.methods
          .newClaim(new BN(data.amountUnlocked), new BN(data.amountLocked), data.proof)
          .accounts({
            distributor: distributorPublicKey,
            to: invokerTokens,
            claimant: extParams.invoker.publicKey,
            tokenProgram: tokenProgramId,
            program: this.programId,
          })
          .instruction(),
      );
    }

    const nowTs = new BN(Math.floor(Date.now() / 1000));
    if (
      claimStatus ||
      (new BN(data.amountLocked).gtn(0) && nowTs.sub(distributor.startTs).gte(distributor.unlockPeriod))
    ) {
      const claimMethod =
        distributor.programVersion >= SOL_FEE_PROGRAM_VERSION
          ? this.merkleDistributorProgram.methods.claimLockedV2
          : this.merkleDistributorProgram.methods.claimLocked;
      ixs.push(
        await claimMethod()
          .accounts({
            distributor: distributorPublicKey,
            to: invokerTokens,
            claimant: extParams.invoker.publicKey,
            tokenProgram: tokenProgramId,
            program: this.programId,
          })
          .instruction(),
      );
    }

    if (distributor.programVersion >= SOL_FEE_PROGRAM_VERSION) {
      return ixs;
    }

    // Determine fee: prefer service internal (if provided by service), else fetch params from API
    // and compute dynamically through resolver, else default minimum
    let feeLamports = typeof _serviceTransfer === "bigint" ? _serviceTransfer : undefined;
    if (!feeLamports) {
      try {
        const { mint: mintAccount } = await getMintAndProgram(this.connection, distributor.mint);
        // Backward-compatible: compute claimable amount if not provided by the caller
        // Prefer explicit field if present; otherwise default to unlocked + locked inputs
        const claimableAmountRaw = (
          data as unknown as {
            // optional for legacy callers
            claimableAmount?: BN | bigint | number | string;
          }
        )?.claimableAmount;
        // Default legacy fields to 0 when missing
        const unlockedRaw = (data as unknown as { amountUnlocked?: BN | number | string })?.amountUnlocked;
        const lockedRaw = (data as unknown as { amountLocked?: BN | number | string })?.amountLocked;
        const unlocked = unlockedRaw != null ? new BN(unlockedRaw) : new BN(0);
        const locked = lockedRaw != null ? new BN(lockedRaw) : new BN(0);
        const computedFallback = unlocked.add(locked);
        const claimableAmount =
          claimableAmountRaw != null ? BigInt(claimableAmountRaw.toString()) : BigInt(computedFallback.toString());

        feeLamports = await resolveAirdropFeeLamportsUsingApi({
          distributorAddress: distributorPublicKey.toBase58(),
          mintAccount,
          claimableAmount,
          cluster: this.cluster,
          apiUrl: this.apiUrl,
          apiKey: this.apiKey,
        });
      } catch (_) {
        feeLamports = MINIMUM_FEE_FALLBACK;
      }
    }
    ixs.push(this.prepareClaimFeeInstruction(extParams.feePayer ?? extParams.invoker.publicKey, feeLamports));

    return ixs;
  }

  public async closeClaim(data: ICloseClaimData, extParams: IInteractExt): Promise<ITransactionResult> {
    const executionParams = this.unwrapExecutionParams(extParams);
    const invoker = executionParams.invoker.publicKey;
    invariant(invoker, "Invoker's PublicKey is not available, check passed wallet adapter!");
    const ixs = await createAndEstimateTransaction(
      (params) => this.prepareCloseClaimInstructions(data, params),
      executionParams,
    );
    const { tx, hash, context } = await prepareTransaction(this.connection, ixs, invoker);
    const signature = await wrappedSignAndExecuteTransaction(
      this.connection,
      executionParams.invoker,
      tx,
      {
        hash,
        context,
        commitment: this.getCommitment(),
      },
      { sendThrottler: this.sendThrottler, skipSimulation: executionParams.skipSimulation },
    );

    return { ixs, txId: signature };
  }

  public async prepareCloseClaimInstructions(
    data: ICloseClaimData,
    extParams: ITransactionExtResolved<IInteractExt>,
  ): Promise<TransactionInstruction[]> {
    if (!extParams.invoker.publicKey) {
      throw new Error("Invoker's PublicKey is not available, check passed wallet adapter!");
    }

    const distributorPublicKey = new PublicKey(data.id);
    const distributor = await this.merkleDistributorProgram.account.merkleDistributor.fetch(distributorPublicKey);

    const claimantPublicKey = pk(data.claimant);

    if (!distributor) {
      throw new Error("Couldn't get distributor account info");
    }

    const ixs: TransactionInstruction[] = prepareBaseInstructions(this.connection, extParams);

    ixs.push(
      await this.merkleDistributorProgram.methods
        .closeClaim(
          data.amountUnlocked ? new BN(data.amountUnlocked) : null,
          data.amountLocked ? new BN(data.amountLocked) : null,
          data.proof ?? null,
        )
        .accounts({
          adminOrClaimant: extParams.invoker.publicKey,
          payer: extParams.invoker.publicKey,
          distributor: distributorPublicKey,
          claimant: claimantPublicKey,
          program: this.programId,
        })
        .instruction(),
    );

    return ixs;
  }

  public async prepareClawbackInstructions(
    data: IClawbackData,
    extParams: ITransactionExtResolved<IInteractExt>,
  ): Promise<TransactionInstruction[]> {
    if (!extParams.invoker.publicKey) {
      throw new Error("Invoker's PublicKey is not available, check passed wallet adapter!");
    }

    const distributorPublicKey = new PublicKey(data.id);
    const distributor = await this.merkleDistributorProgram.account.merkleDistributor.fetch(distributorPublicKey);

    if (!distributor) {
      throw new Error("Couldn't get account info");
    }

    const { tokenProgramId } = await getMintAndProgram(this.connection, distributor.mint);
    const ixs: TransactionInstruction[] = prepareBaseInstructions(this.connection, extParams);
    ixs.push(
      ...(await checkOrCreateAtaBatch(
        this.connection,
        [extParams.invoker.publicKey],
        distributor.mint,
        extParams.invoker,
        tokenProgramId,
        extParams.feePayer,
      )),
    );

    const accounts: ClawbackAccounts = {
      distributor: distributorPublicKey,
      from: distributor.tokenVault,
      to: distributor.clawbackReceiver,
      admin: extParams.invoker.publicKey,
      mint: distributor.mint,
      tokenProgram: tokenProgramId,
    };

    const clawbackInstruction = await this.getClawbackInstruction(accounts);

    ixs.push(clawbackInstruction);

    return ixs;
  }

  public async clawback(data: IClawbackData, extParams: IInteractExt): Promise<ITransactionResult> {
    const executionParams = this.unwrapExecutionParams(extParams);
    const invoker = executionParams.invoker.publicKey;
    invariant(invoker, "Invoker's PublicKey is not available, check passed wallet adapter!");
    const ixs = await createAndEstimateTransaction(
      (params) => this.prepareClawbackInstructions(data, params),
      executionParams,
    );
    const { tx, hash, context } = await prepareTransaction(this.connection, ixs, invoker);
    const signature = await wrappedSignAndExecuteTransaction(
      this.connection,
      executionParams.invoker,
      tx,
      {
        hash,
        context,
        commitment: this.getCommitment(),
      },
      { sendThrottler: this.sendThrottler, skipSimulation: executionParams.skipSimulation },
    );

    return { ixs, txId: signature };
  }

  public async getClaim(claimStatus: string | PublicKey): Promise<AnyClaimStatus | null> {
    return this.connection.getAccountInfo(pk(claimStatus)).then((account) => this.decodeClaimStatus(account));
  }

  public async getClaims(data: IGetClaimData[]): Promise<(AnyClaimStatus | null)[]> {
    const claimStatusPublicKeys = data.map(({ id, recipient }) => {
      return getClaimantStatusPda(this.programId, new PublicKey(id), new PublicKey(recipient));
    });

    return this.connection.getMultipleAccountsInfo(claimStatusPublicKeys).then((accounts) => {
      return accounts.map((account) => this.decodeClaimStatus(account));
    });
  }

  public async getDistributors(data: IGetDistributors): Promise<(MerkleDistributor | null)[]> {
    const distributorPublicKeys = data.ids.map((distributorId) => new PublicKey(distributorId));
    return this.merkleDistributorProgram.account.merkleDistributor.fetchMultiple(distributorPublicKeys);
  }

  public async searchDistributors(data: ISearchDistributors): Promise<IProgramAccount<MerkleDistributor>[]> {
    const filters: MemcmpFilter[] = [];
    if (data.mint) {
      filters.push({
        memcmp: {
          offset: DISTRIBUTOR_MINT_OFFSET,
          bytes: data.mint,
        },
      });
    }
    if (data.admin) {
      filters.push({
        memcmp: {
          offset: DISTRIBUTOR_ADMIN_OFFSET,
          bytes: data.admin,
        },
      });
    }
    return this.merkleDistributorProgram.account.merkleDistributor.all(filters);
  }

  /**
   * Fetch Fee Config for the Airdrop protocol from Partner Oracle.
   */
  public async getFeeConfig(): Promise<FeeConfig> {
    const accInfo = await this.connection.getAccountInfo(this.feeConfigPublicKey);
    if (!accInfo) {
      throw new Error("Fee config is not initialized!");
    }
    return decode(this.partnerOracle, "airdropConfig", accInfo.data);
  }

  /**
   * Get all defaults fees applied by the protocol.
   */
  public async getDefaultFees(): Promise<Fees> {
    const feeConfig = await this.getFeeConfig();
    return {
      pubkey: PublicKey.default,
      creationFee: feeConfig.creationFee,
      priceOracleFee: feeConfig.priceOracleFee,
      claimMinFee: feeConfig.claimMinFee,
      claimMaxFee: feeConfig.claimMaxFee,
      allocationFactor: feeConfig.allocationFactor,
      clawbackTokenFeePercent: feeConfig.clawbackTokenFeePercent,
    };
  }

  /**
   * Get fees for a given wallet.
   *
   * @param pubkey partner to search fees for
   */
  public async getFees(pubkey: PublicKey): Promise<Fees | null> {
    const feeConfig = await this.getFeeConfig();
    const nowTs = new BN(Math.trunc(Date.now() / 1000));
    return (
      feeConfig.partners.filter((partner) => partner.pubkey.equals(pubkey) && partner.expiryTs.gt(nowTs))[0] ?? null
    );
  }

  protected prepareClaimFeeInstruction(payer: PublicKey, fee = AIRDROP_CLAIM_FEE): TransactionInstruction {
    return SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: STREAMFLOW_TREASURY_PUBLIC_KEY,
      lamports: fee,
    });
  }

  protected validateDistributorArgs(data: ICreateDistributorData): void {
    const nowTs = Math.floor(Date.now() / 1000);
    const endVestingTs = data.endVestingTs === 0 ? nowTs : data.endVestingTs;
    const startVestingTs = data.startVestingTs === 0 ? nowTs : data.startVestingTs;
    if (endVestingTs > startVestingTs && endVestingTs - startVestingTs < data.unlockPeriod) {
      throw new Error("The unlock period cannot be longer than the total vesting duration!");
    }
  }

  protected unwrapExecutionParams<T extends IInteractExt>(extParams: T): ReturnType<typeof unwrapExecutionParams<T>> {
    return unwrapExecutionParams(extParams, this.connection);
  }

  private decodeClaimStatus(account: AccountInfo<Buffer> | null): AnyClaimStatus | null {
    if (!account) {
      return null;
    }

    try {
      return decode(this.merkleDistributorProgram, "claimStatus", account.data);
    } catch (baseClaimStatusError) {
      try {
        return decode(this.merkleDistributorProgram, "compressedClaimStatus", account.data);
      } catch (compressedClaimStatusError) {
        throw new Error("Couldn't decode claim status");
      }
    }
  }
}

/**
 * Strictly typed decode function for Anchor accounts.
 */
function decode<T extends Idl, AccountName extends keyof IdlAccounts<T>>(
  program: Program<T>,
  accountName: AccountName,
  accInfo: Parameters<AccountsCoder["decode"]>[1],
  programKey?: string,
): IdlAccounts<T>[AccountName] {
  const programId = programKey ?? program.programId?.toBase58() ?? "N/A";
  invariant(program, `Decoding program with key ${programId} is not available`);
  const accountEntity = program.idl.accounts?.find((acc) => acc.name === accountName);
  invariant(
    !!accountEntity,
    `Decoding program with key ${programId} doesn't specify account with name ${String(accountName)}`,
  );
  return program.coder.accounts.decode(accountName as string, accInfo) as IdlAccounts<T>[AccountName];
}
