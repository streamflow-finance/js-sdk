import { type TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";

import { type ICreateDistributorData, type NewDistributorAccounts, type ClawbackAccounts } from "../types.js";
import BaseDistributorClient from "./BaseDistributorClient.js";

export default class SolanaDistributorClient extends BaseDistributorClient {
  protected async getNewDistributorInstruction(
    data: ICreateDistributorData,
    accounts: Required<NewDistributorAccounts>,
  ): Promise<TransactionInstruction> {
    this.validateDistributorArgs(data);
    return this.merkleDistributorProgram.methods
      .newDistributor(
        new BN(data.version),
        data.root,
        new BN(data.maxTotalClaim),
        new BN(data.maxNumNodes),
        new BN(data.unlockPeriod),
        new BN(data.startVestingTs),
        new BN(data.endVestingTs),
        new BN(data.clawbackStartTs),
        data.claimsClosableByAdmin,
        null, // can_update_duration
        null, // total_amount_unlocked
        null, // total_amount_locked
        data.claimsClosableByClaimant ?? null,
        data.claimsLimit ?? null,
      )
      .accounts(accounts)
      .accountsPartial({ partnerOracle: this.partnerOracleProgramId, partnerOracleConfig: this.feeConfigPublicKey })
      .instruction();
  }

  protected async getClawbackInstruction(accounts: ClawbackAccounts): Promise<TransactionInstruction> {
    return this.merkleDistributorProgram.methods.clawback().accounts(accounts).instruction();
  }
}
