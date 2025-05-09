import { TransactionInstruction, type PublicKey, type AccountMeta } from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import type BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Buffer } from "buffer";

import { PROGRAM_ID } from "../programId.js";

export interface CloseClaimArgs {
  amountUnlocked?: BN;
  amountLocked?: BN;
  proof?: Array<Array<number>>;
}
export interface CloseClaimAccounts {
  /** The [MerkleDistributor]. */
  distributor: PublicKey;
  /** Admin signer */
  adminOrClaimant: PublicKey;
  claimant: PublicKey;
  /** Claim Status PDA */
  claimStatus: PublicKey;
  /** The [System] program. */
  systemProgram: PublicKey;
  eventAuthority: PublicKey;
  program: PublicKey;
}

export const layout = borsh.struct([
  borsh.option(borsh.u64(), "amountUnlocked"),
  borsh.option(borsh.u64(), "amountLocked"),
  borsh.option(borsh.vec(borsh.array(borsh.u8(), 32)), "proof"),
]);

export function closeClaim(args: CloseClaimArgs, accounts: CloseClaimAccounts, programId: PublicKey = PROGRAM_ID) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.distributor, isSigner: false, isWritable: true },
    { pubkey: accounts.adminOrClaimant, isSigner: true, isWritable: true },
    { pubkey: accounts.claimant, isSigner: false, isWritable: false },
    { pubkey: accounts.claimStatus, isSigner: false, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.program, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([42, 177, 165, 35, 213, 179, 211, 19]);
  const buffer = Buffer.alloc(1000);
  const len = layout.encode(
    {
      amountUnlocked: args.amountUnlocked ?? null,
      amountLocked: args.amountLocked ?? null,
      proof: args.proof ?? null,
    },
    buffer,
  );
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len);
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
