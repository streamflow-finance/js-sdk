import { TransactionInstruction } from "@solana/web3.js";

import { ICreateDistributorData } from "../types";
import { ClawbackAccounts, NewDistributorAccounts, clawback, newDistributor } from "../generated/instructions";
import BaseDistributorClient from "./BaseDistributorClient.js";

export default class SolanaDistributorClient extends BaseDistributorClient {
  protected async prepareNewDistributorInstruction(
    data: ICreateDistributorData,
    accounts: NewDistributorAccounts,
  ): Promise<TransactionInstruction> {
    const args = this.getNewDistributorArgs(data);
    return newDistributor(args, accounts, this.programId);
  }

  protected async prepareClawbackInstruction(accounts: ClawbackAccounts): Promise<TransactionInstruction> {
    return clawback(accounts, this.programId);
  }
}
