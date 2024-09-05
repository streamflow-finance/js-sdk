import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Buffer } from "buffer";

import { PROGRAM_ID } from "../programId";

export interface CloseClaimAccounts {
  /** The [MerkleDistributor]. */
  distributor: PublicKey;
  /** Admin signer */
  admin: PublicKey;
  claimant: PublicKey;
  /** Claim Status PDA */
  claimStatus: PublicKey;
  /** The [System] program. */
  systemProgram: PublicKey;
  eventAuthority: PublicKey;
  program: PublicKey;
}

export function closeClaim(accounts: CloseClaimAccounts, programId: PublicKey = PROGRAM_ID) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.distributor, isSigner: false, isWritable: true },
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: accounts.claimant, isSigner: false, isWritable: false },
    { pubkey: accounts.claimStatus, isSigner: false, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.program, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([42, 177, 165, 35, 213, 179, 211, 19]);
  const data = identifier;
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
