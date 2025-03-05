import { type TransactionInstruction } from "@solana/web3.js";

import { type ICreateDistributorData } from "../types.js";
import {
  type ClawbackAccounts,
  type NewDistributorAccounts,
  clawback,
  newDistributor,
} from "../generated/instructions/index.js";
import BaseDistributorClient from "./BaseDistributorClient.js";

export default class SolanaDistributorClient extends BaseDistributorClient {
  protected async getNewDistributorInstruction(
    data: ICreateDistributorData,
    accounts: NewDistributorAccounts,
  ): Promise<TransactionInstruction> {
    const args = this.getNewDistributorArgs(data);
    return newDistributor(args, accounts, this.programId);
  }

  protected async getClawbackInstruction(accounts: ClawbackAccounts): Promise<TransactionInstruction> {
    return clawback(accounts, this.programId);
  }
}
