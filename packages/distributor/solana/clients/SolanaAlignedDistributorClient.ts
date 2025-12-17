import BN from "bn.js";
import type { TransactionInstruction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { getBN, getNumberFromBN, invariant, pk } from "@streamflow/common";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

import {
  type AlignedDistributorData,
  type ClawbackAccounts,
  type ICreateAlignedDistributorData,
  type NewAlignedDistributorArgs,
  type NewDistributorAccounts,
  type OracleType,
  type OracleTypeName,
} from "../types.js";
import BaseDistributorClient, { type IInitOptions } from "./BaseDistributorClient.js";
import { type AlignedDistributor as AlignedAirdropsProgramType } from "../descriptor/aligned_distributor.js";
import StreamflowAlignedAirdropsIDL from "../descriptor/idl/aligned_distributor.json";
import { ALIGNED_PRECISION_FACTOR_POW } from "../constants.js";
import { getAlignedDistributorPda, getDistributorPda, getTestOraclePda } from "../utils.js";

export default class SolanaAlignedDistributorClient extends BaseDistributorClient {
  public alignedProxyProgram: Program<AlignedAirdropsProgramType>;

  public constructor({
    clusterUrl,
    cluster,
    commitment,
    programId,
    sendRate,
    sendThrottler,
    apiUrl,
    apiKey,
  }: IInitOptions) {
    super({ clusterUrl, cluster, commitment, programId, sendRate, sendThrottler, apiUrl, apiKey });
    const alignedAirdropsProgram = {
      ...StreamflowAlignedAirdropsIDL,
    } as AlignedAirdropsProgramType;
    this.alignedProxyProgram = new Program(alignedAirdropsProgram, { connection: this.connection });
  }

  public getAlignedDistributorProgramId(): PublicKey {
    return this.alignedProxyProgram.programId;
  }

  public getAlignedDistributorAddress(distributorAddress: string): PublicKey {
    const distributorKey = new PublicKey(distributorAddress);
    return getAlignedDistributorPda(this.alignedProxyProgram.programId, distributorKey);
  }

  public async getAlignedDistributorData(distributorAddress: string): Promise<AlignedDistributorData> {
    const alignedDistributorKey = this.getAlignedDistributorAddress(distributorAddress);
    const alignedProxy = await this.alignedProxyProgram.account.alignedDistributor.fetch(alignedDistributorKey);
    invariant(alignedProxy, "Aligned Distributor proxy account not found");

    const oracleType = Object.keys(alignedProxy.priceOracleType).find((key) => !!key) as OracleTypeName;

    return {
      oracleType,
      minPrice: getNumberFromBN(alignedProxy.minPrice, ALIGNED_PRECISION_FACTOR_POW),
      maxPrice: getNumberFromBN(alignedProxy.maxPrice, ALIGNED_PRECISION_FACTOR_POW),
      minPercentage: getNumberFromBN(alignedProxy.minPercentage, ALIGNED_PRECISION_FACTOR_POW),
      maxPercentage: getNumberFromBN(alignedProxy.maxPercentage, ALIGNED_PRECISION_FACTOR_POW),
      priceOracle: oracleType === "none" ? undefined : alignedProxy.priceOracle.toBase58(),
      sender: alignedProxy.admin.toBase58(),
      updatePeriod: getNumberFromBN(alignedProxy.updatePeriod, ALIGNED_PRECISION_FACTOR_POW),
      clawedBack: alignedProxy.distributorClawedBack,
      initialDuration: alignedProxy.initialDuration.toNumber(),
      initialPrice: getNumberFromBN(alignedProxy.initialPrice, ALIGNED_PRECISION_FACTOR_POW),
      lastPrice: getNumberFromBN(alignedProxy.lastPrice, ALIGNED_PRECISION_FACTOR_POW),
      lastDurationUpdateTs: alignedProxy.lastDurationUpdateTs.toNumber(),
    };
  }

  protected async getNewDistributorInstruction(
    data: ICreateAlignedDistributorData,
    accounts: Required<NewDistributorAccounts>,
  ): Promise<TransactionInstruction> {
    const { mint, clawbackReceiver, tokenProgram, admin } = accounts;
    const distributorKey = getDistributorPda(this.merkleDistributorProgram.programId, pk(accounts.mint), data.version);
    const tokenVaultKey = getAssociatedTokenAddressSync(pk(mint), pk(admin), true, pk(tokenProgram));

    this.validateDistributorArgs(data);
    const alignedArgs = this.getNewAlignedDistributorArgs(data);
    const oracle = data.oracleAddress
      ? new PublicKey(data.oracleAddress)
      : getTestOraclePda(this.alignedProxyProgram.programId, pk(mint), pk(admin));

    return this.alignedProxyProgram.methods
      .newDistributor({
        claimsClosable: data.claimsClosableByAdmin,
        version: new BN(data.version),
        root: data.root,
        maxTotalClaim: new BN(data.maxTotalClaim),
        maxNumNodes: new BN(data.maxNumNodes),
        unlockPeriod: new BN(data.unlockPeriod),
        startVestingTs: new BN(data.startVestingTs),
        endVestingTs: new BN(data.endVestingTs),
        clawbackStartTs: new BN(data.clawbackStartTs),
        ...alignedArgs,
      })
      .accounts({
        admin,
        tokenVault: tokenVaultKey,
        distributor: distributorKey,
        clawbackReceiver,
        mint,
        tokenProgram,
        priceOracle: oracle,
      })
      .accountsPartial({ partnerOracle: this.partnerOracleProgramId, partnerOracleConfig: this.feeConfigPublicKey })
      .instruction();
  }

  protected async getClawbackInstruction(accounts: ClawbackAccounts): Promise<TransactionInstruction> {
    const { distributor, from, to, mint, tokenProgram, admin } = accounts;
    const alignedDistributorKey = getAlignedDistributorPda(
      this.alignedProxyProgram.programId,
      pk(accounts.distributor),
    );

    const alignedProxy = await this.alignedProxyProgram.account.alignedDistributor.fetch(alignedDistributorKey);
    invariant(alignedProxy, "Aligned Distributor proxy account not found");

    return this.alignedProxyProgram.methods
      .clawback()
      .accounts({
        admin,
        distributor,
        from,
        to,
        mint,
        tokenProgram,
      })
      .instruction();
  }

  protected getNewAlignedDistributorArgs(data: ICreateAlignedDistributorData): NewAlignedDistributorArgs {
    const {
      oracleType,
      minPrice,
      maxPrice,
      minPercentage,
      maxPercentage,
      tickSize,
      skipInitial,
      totalAmountLocked,
      totalAmountUnlocked,
      unlockPeriod,
    } = data;

    return {
      totalAmountLocked: new BN(totalAmountLocked),
      totalAmountUnlocked: new BN(totalAmountUnlocked),
      oracleType: (!!oracleType ? { [oracleType]: {} } : { none: {} }) as OracleType,
      minPrice: getBN(minPrice, ALIGNED_PRECISION_FACTOR_POW),
      maxPrice: getBN(maxPrice, ALIGNED_PRECISION_FACTOR_POW),
      minPercentage: getBN(minPercentage, ALIGNED_PRECISION_FACTOR_POW),
      maxPercentage: getBN(maxPercentage, ALIGNED_PRECISION_FACTOR_POW),
      tickSize: new BN(tickSize || 1),
      skipInitial: skipInitial ?? false,
      updatePeriod: unlockPeriod < 30 ? new BN(30) : new BN(unlockPeriod),
    };
  }
}
