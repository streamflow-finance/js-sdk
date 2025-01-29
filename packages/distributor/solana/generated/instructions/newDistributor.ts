import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Buffer } from "buffer";

import { PROGRAM_ID } from "../programId";

export interface NewDistributorArgs {
  version: BN;
  root: Array<number>;
  maxTotalClaim: BN;
  maxNumNodes: BN;
  unlockPeriod: BN;
  startVestingTs: BN;
  endVestingTs: BN;
  clawbackStartTs: BN;
  claimsClosableByAdmin: boolean;
  claimsClosableByClaimant?: boolean | null;
  claimsLimit?: number | null;
}

export interface NewDistributorAccounts {
  /** [MerkleDistributor]. */
  distributor: PublicKey;
  /** Clawback receiver token account */
  clawbackReceiver: PublicKey;
  /** The mint to distribute. */
  mint: PublicKey;
  /** Token vault */
  tokenVault: PublicKey;
  /**
   * Admin wallet, responsible for creating the distributor and paying for the transaction.
   * Also has the authority to set the clawback receiver and change itself.
   */
  admin: PublicKey;
  /** The [System] program. */
  systemProgram: PublicKey;
  /** The [Associated Token] program. */
  associatedTokenProgram: PublicKey;
  /** The [Token] program. */
  tokenProgram: PublicKey;
}

export const layout = borsh.struct([
  borsh.u64("version"),
  borsh.array(borsh.u8(), 32, "root"),
  borsh.u64("maxTotalClaim"),
  borsh.u64("maxNumNodes"),
  borsh.u64("unlockPeriod"),
  borsh.u64("startVestingTs"),
  borsh.u64("endVestingTs"),
  borsh.u64("clawbackStartTs"),
  borsh.bool("claimsClosableByAdmin"),
  borsh.option(borsh.bool(), "canUpdateDuration"),
  borsh.option(borsh.u64(), "totalAmountUnlocked"),
  borsh.option(borsh.u64(), "totalAmountLocked"),
  borsh.option(borsh.bool(), "claimsClosableByClaimant"),
  borsh.option(borsh.u16(), "claimsLimit"),
]);

/**
 * READ THE FOLLOWING:
 *
 * This instruction is susceptible to frontrunning that could result in loss of funds if not handled properly.
 *
 * An attack could look like:
 * - A legitimate user opens a new distributor.
 * - Someone observes the call to this instruction.
 * - They replace the clawback_receiver, admin, or time parameters with their own.
 *
 * One situation that could happen here is the attacker replaces the admin and clawback_receiver with their own
 * and sets the clawback_start_ts with the minimal time allowed. After clawback_start_ts has elapsed,
 * the attacker can steal all funds from the distributor to their own clawback_receiver account.
 *
 * HOW TO AVOID:
 * - When you call into this instruction, ensure your transaction succeeds.
 * - To be extra safe, after your transaction succeeds, read back the state of the created MerkleDistributor account and
 * assert the parameters are what you expect, most importantly the clawback_receiver and admin.
 * - If your transaction fails, double check the value on-chain matches what you expect.
 */
export function newDistributor(
  args: NewDistributorArgs,
  accounts: NewDistributorAccounts,
  programId: PublicKey = PROGRAM_ID,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.distributor, isSigner: false, isWritable: true },
    { pubkey: accounts.clawbackReceiver, isSigner: false, isWritable: true },
    { pubkey: accounts.mint, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenVault, isSigner: false, isWritable: true },
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([32, 139, 112, 171, 0, 2, 225, 155]);
  const buffer = Buffer.alloc(1000);
  const len = layout.encode(
    {
      version: args.version,
      root: args.root,
      maxTotalClaim: args.maxTotalClaim,
      maxNumNodes: args.maxNumNodes,
      unlockPeriod: args.unlockPeriod,
      startVestingTs: args.startVestingTs,
      endVestingTs: args.endVestingTs,
      clawbackStartTs: args.clawbackStartTs,
      claimsClosableByAdmin: args.claimsClosableByAdmin,
      canUpdateDuration: null,
      totalAmountUnlocked: null,
      totalAmountLocked: null,
      claimsClosableByClaimant: args.claimsClosableByClaimant ?? null,
      claimsLimit: args.claimsLimit ?? null,
    },
    buffer,
  );
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len);
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
