import BN from "bn.js";
import type { TransactionInstruction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { getBN, getNumberFromBN, invariant } from "@streamflow/common";

import {
  type ICreateAlignedDistributorData,
  type AlignedDistributorData,
  type NewAlignedDistributorArgs,
  type OracleType,
  type OracleTypeName,
} from "../types.js";
import { type ClawbackAccounts, type NewDistributorAccounts } from "../generated/instructions/index.js";
import BaseDistributorClient, { type IInitOptions } from "./BaseDistributorClient.js";
import { type AlignedDistributor as AlignedAirdropsProgramType } from "../descriptor/aligned_distributor.js";
import StreamflowAlignedAirdropsIDL from "../descriptor/idl/aligned_distributor.json";
import { ALIGNED_PRECISION_FACTOR_POW } from "../constants.js";
import { getAlignedDistributorPda, getTestOraclePda } from "../utils.js";

export default class SolanaAlignedDistributorClient extends BaseDistributorClient {
  public alignedProxyProgram: Program<AlignedAirdropsProgramType>;

  public constructor({ clusterUrl, cluster, commitment, programId, sendRate, sendThrottler }: IInitOptions) {
    super({ clusterUrl, cluster, commitment, programId, sendRate, sendThrottler });
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
    accounts: NewDistributorAccounts,
  ): Promise<TransactionInstruction> {
    const { distributor, mint, clawbackReceiver, tokenProgram, tokenVault, admin } = accounts;

    const baseArgs = this.getNewDistributorArgs(data);
    const alignedArgs = this.getNewAlignedDistributorArgs(data);
    const oracle = data.oracleAddress
      ? new PublicKey(data.oracleAddress)
      : getTestOraclePda(this.alignedProxyProgram.programId, mint, admin);

    const newDistributorIx = await this.alignedProxyProgram.methods
      .newDistributor({
        claimsClosable: baseArgs.claimsClosableByAdmin,
        version: baseArgs.version,
        root: baseArgs.root,
        maxTotalClaim: baseArgs.maxTotalClaim,
        maxNumNodes: baseArgs.maxNumNodes,
        unlockPeriod: baseArgs.unlockPeriod,
        startVestingTs: baseArgs.startVestingTs,
        endVestingTs: baseArgs.endVestingTs,
        clawbackStartTs: baseArgs.clawbackStartTs,
        ...alignedArgs,
      })
      .accounts({
        admin,
        tokenVault,
        distributor,
        clawbackReceiver,
        mint,
        tokenProgram,
        priceOracle: oracle,
      })
      .instruction();

    return newDistributorIx;
  }

  protected async getClawbackInstruction(accounts: ClawbackAccounts): Promise<TransactionInstruction> {
    const { distributor, from, to, mint, tokenProgram, admin } = accounts;
    const alignedDistributorKey = getAlignedDistributorPda(this.alignedProxyProgram.programId, distributor);

    const alignedProxy = await this.alignedProxyProgram.account.alignedDistributor.fetch(alignedDistributorKey);
    invariant(alignedProxy, "Aligned Distributor proxy account not found");

    const clawbackInstruction = await this.alignedProxyProgram.methods
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

    return clawbackInstruction;
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
