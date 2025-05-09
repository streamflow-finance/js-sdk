import BN from "bn.js";
import type PQueue from "p-queue";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import type { TransactionInstruction, Commitment, ConnectionConfig, MemcmpFilter } from "@solana/web3.js";
import { ICluster, type ITransactionResult } from "@streamflow/common";
import {
  ata,
  checkOrCreateAtaBatch,
  prepareBaseInstructions,
  prepareTransaction,
  getMintAndProgram,
  buildSendThrottler,
  prepareWrappedAccount,
  type IProgramAccount,
  pk,
} from "@streamflow/common/solana";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createTransferCheckedInstruction,
  createTransferCheckedWithFeeInstruction,
  getTransferFeeConfig,
  NATIVE_MINT,
} from "@solana/spl-token";
import bs58 from "bs58";

import {
  AIRDROP_CLAIM_FEE,
  DISTRIBUTOR_ADMIN_OFFSET,
  DISTRIBUTOR_MINT_OFFSET,
  DISTRIBUTOR_PROGRAM_ID,
  STREAMFLOW_TREASURY_PUBLIC_KEY,
} from "../constants.js";
import type {
  IClaimData,
  IClawbackData,
  ICreateDistributorResult,
  IGetClaimData,
  IGetDistributors,
  ICreateSolanaExt,
  IInteractSolanaExt,
  ICreateDistributorData,
  ICreateAlignedDistributorData,
  ISearchDistributors,
  ICloseClaimData,
} from "../types.js";
import {
  type ClaimLockedAccounts,
  type ClawbackAccounts,
  type NewClaimAccounts,
  type NewClaimArgs,
  type NewDistributorAccounts,
  type NewDistributorArgs,
  claimLocked,
  newClaim,
} from "../generated/instructions/index.js";
import { ClaimStatus, MerkleDistributor } from "../generated/accounts/index.js";
import {
  calculateAmountWithTransferFees,
  getClaimantStatusPda,
  getDistributorPda,
  getEventAuthorityPda,
  wrappedSignAndExecuteTransaction,
} from "../utils.js";
import { closeClaim, type CloseClaimAccounts, type CloseClaimArgs } from "../generated/instructions/closeClaim.js";

export interface IInitOptions {
  clusterUrl: string;
  cluster?: ICluster;
  commitment?: Commitment | ConnectionConfig;
  programId?: string;
  sendRate?: number;
  sendThrottler?: PQueue;
}

export default abstract class BaseDistributorClient {
  protected connection: Connection;

  protected programId: PublicKey;

  protected commitment: Commitment | ConnectionConfig;

  protected sendThrottler: PQueue;

  public constructor({
    clusterUrl,
    cluster = ICluster.Mainnet,
    commitment = "confirmed",
    programId = "",
    sendRate = 1,
    sendThrottler,
  }: IInitOptions) {
    this.commitment = commitment;
    this.connection = new Connection(clusterUrl, this.commitment);
    this.programId = programId !== "" ? new PublicKey(programId) : new PublicKey(DISTRIBUTOR_PROGRAM_ID[cluster]);
    this.sendThrottler = sendThrottler ?? buildSendThrottler(sendRate);
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
    extParams: ICreateSolanaExt,
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
      distributor: distributorPublicKey,
      clawbackReceiver: senderTokens,
      mint: mintPublicKey,
      tokenVault,
      admin: extParams.invoker.publicKey,
      systemProgram: SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
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
    extParams: ICreateSolanaExt,
  ): Promise<ICreateDistributorResult> {
    const { ixs, distributorPublicKey } = await this.prepareCreateInstructions(data, extParams);
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
      { sendThrottler: this.sendThrottler },
    );

    return {
      ixs,
      txId: signature,
      metadataId: distributorPublicKey.toBase58(),
    };
  }

  public async claim(data: IClaimData, extParams: IInteractSolanaExt): Promise<ITransactionResult> {
    const ixs = await this.prepareClaimInstructions(data, extParams);
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
      { sendThrottler: this.sendThrottler },
    );

    return { ixs, txId: signature };
  }

  public async prepareClaimInstructions(
    data: IClaimData,
    extParams: IInteractSolanaExt,
  ): Promise<TransactionInstruction[]> {
    if (!extParams.invoker.publicKey) {
      throw new Error("Invoker's PublicKey is not available, check passed wallet adapter!");
    }

    const distributorPublicKey = new PublicKey(data.id);
    const distributor = await MerkleDistributor.fetch(this.connection, distributorPublicKey);

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
      )),
    );
    const invokerTokens = await ata(distributor.mint, extParams.invoker.publicKey, tokenProgramId);
    const claimStatusPublicKey = getClaimantStatusPda(
      this.programId,
      distributorPublicKey,
      extParams.invoker.publicKey,
    );
    const eventAuthorityPublicKey = getEventAuthorityPda(this.programId);
    const claimStatus = await ClaimStatus.fetch(this.connection, claimStatusPublicKey);

    const accounts: ClaimLockedAccounts | NewClaimAccounts = {
      distributor: distributorPublicKey,
      claimStatus: claimStatusPublicKey,
      from: distributor.tokenVault,
      to: invokerTokens,
      claimant: extParams.invoker.publicKey,
      mint: distributor.mint,
      tokenProgram: tokenProgramId,
      systemProgram: SystemProgram.programId,
      eventAuthority: eventAuthorityPublicKey,
      program: this.programId,
    };

    if (!claimStatus) {
      const args: NewClaimArgs = {
        amountLocked: new BN(data.amountLocked),
        amountUnlocked: new BN(data.amountUnlocked),
        proof: data.proof,
      };
      ixs.push(newClaim(args, accounts, this.programId));
    }

    const nowTs = new BN(Math.floor(Date.now() / 1000));
    if (
      claimStatus ||
      (new BN(data.amountLocked).gtn(0) && nowTs.sub(distributor.startTs).gte(distributor.unlockPeriod))
    ) {
      ixs.push(claimLocked(accounts, this.programId));
    }

    ixs.push(this.prepareClaimFeeInstruction(extParams.invoker.publicKey));

    return ixs;
  }

  public async closeClaim(data: ICloseClaimData, extParams: IInteractSolanaExt): Promise<ITransactionResult> {
    const ixs = await this.prepareCloseClaimInstructions(data, extParams);
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
      { sendThrottler: this.sendThrottler },
    );

    return { ixs, txId: signature };
  }

  public async prepareCloseClaimInstructions(
    data: ICloseClaimData,
    extParams: IInteractSolanaExt,
  ): Promise<TransactionInstruction[]> {
    if (!extParams.invoker.publicKey) {
      throw new Error("Invoker's PublicKey is not available, check passed wallet adapter!");
    }

    const distributorPublicKey = new PublicKey(data.id);
    const distributor = await MerkleDistributor.fetch(this.connection, distributorPublicKey);

    const claimantPublicKey = pk(data.claimant);

    if (!distributor) {
      throw new Error("Couldn't get distributor account info");
    }

    const ixs: TransactionInstruction[] = prepareBaseInstructions(this.connection, extParams);

    const claimStatusPublicKey = getClaimantStatusPda(this.programId, distributorPublicKey, claimantPublicKey);
    const eventAuthorityPublicKey = getEventAuthorityPda(this.programId);

    const closeClaimAccounts: CloseClaimAccounts = {
      adminOrClaimant: extParams.invoker.publicKey,
      distributor: distributorPublicKey,
      claimStatus: claimStatusPublicKey,
      claimant: claimantPublicKey,
      systemProgram: SystemProgram.programId,
      eventAuthority: eventAuthorityPublicKey,
      program: this.programId,
    };

    const closeClaimArgs: CloseClaimArgs = {
      amountLocked: data.amountLocked ? new BN(data.amountLocked) : undefined,
      amountUnlocked: data.amountUnlocked ? new BN(data.amountUnlocked) : undefined,
      proof: data.proof,
    };

    ixs.push(closeClaim(closeClaimArgs, closeClaimAccounts, this.programId));

    return ixs;
  }

  public async prepareClawbackInstructions(
    data: IClawbackData,
    extParams: IInteractSolanaExt,
  ): Promise<TransactionInstruction[]> {
    if (!extParams.invoker.publicKey) {
      throw new Error("Invoker's PublicKey is not available, check passed wallet adapter!");
    }

    const distributorPublicKey = new PublicKey(data.id);
    const distributor = await MerkleDistributor.fetch(this.connection, distributorPublicKey);

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
      )),
    );

    const accounts: ClawbackAccounts = {
      distributor: distributorPublicKey,
      from: distributor.tokenVault,
      to: distributor.clawbackReceiver,
      admin: extParams.invoker.publicKey,
      mint: distributor.mint,
      systemProgram: SystemProgram.programId,
      tokenProgram: tokenProgramId,
    };

    const clawbackInstruction = await this.getClawbackInstruction(accounts);

    ixs.push(clawbackInstruction);

    return ixs;
  }

  public async clawback(data: IClawbackData, extParams: IInteractSolanaExt): Promise<ITransactionResult> {
    const ixs = await this.prepareClawbackInstructions(data, extParams);
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
      { sendThrottler: this.sendThrottler },
    );

    return { ixs, txId: signature };
  }

  public async getClaims(data: IGetClaimData[]): Promise<(ClaimStatus | null)[]> {
    const claimStatusPublicKeys = data.map(({ id, recipient }) => {
      return getClaimantStatusPda(this.programId, new PublicKey(id), new PublicKey(recipient));
    });
    return ClaimStatus.fetchMultiple(this.connection, claimStatusPublicKeys, this.programId);
  }

  public async getDistributors(data: IGetDistributors): Promise<(MerkleDistributor | null)[]> {
    const distributorPublicKeys = data.ids.map((distributorId) => new PublicKey(distributorId));
    return MerkleDistributor.fetchMultiple(this.connection, distributorPublicKeys, this.programId);
  }

  public async searchDistributors(data: ISearchDistributors): Promise<IProgramAccount<MerkleDistributor>[]> {
    const filters: MemcmpFilter[] = [{ memcmp: { offset: 0, bytes: bs58.encode(MerkleDistributor.discriminator) } }];
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
    const accounts = await this.connection.getProgramAccounts(this.programId, { filters });

    return accounts.map(({ pubkey, account }) => ({
      publicKey: pubkey,
      account: MerkleDistributor.decode(account.data),
    }));
  }

  protected prepareClaimFeeInstruction(payer: PublicKey): TransactionInstruction {
    return SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: STREAMFLOW_TREASURY_PUBLIC_KEY,
      lamports: AIRDROP_CLAIM_FEE,
    });
  }

  protected getNewDistributorArgs(data: ICreateDistributorData): NewDistributorArgs {
    const args = {
      version: new BN(data.version),
      root: data.root,
      maxTotalClaim: new BN(data.maxTotalClaim),
      maxNumNodes: new BN(data.maxNumNodes),
      unlockPeriod: new BN(data.unlockPeriod),
      startVestingTs: new BN(data.startVestingTs),
      endVestingTs: new BN(data.endVestingTs),
      clawbackStartTs: new BN(data.clawbackStartTs),
      claimsClosableByAdmin: data.claimsClosableByAdmin,
      claimsClosableByClaimant: data.claimsClosableByClaimant,
      claimsLimit: data.claimsLimit,
    };

    const nowTs = new BN(Math.floor(Date.now() / 1000));
    const endVestingTs = args.endVestingTs.isZero() ? nowTs : args.endVestingTs;
    const startVestingTs = args.startVestingTs.isZero() ? nowTs : args.startVestingTs;
    if (endVestingTs.gt(startVestingTs) && endVestingTs.sub(startVestingTs).lt(args.unlockPeriod)) {
      throw new Error("The unlock period cannot be longer than the total vesting duration!");
    }

    return args;
  }
}
