import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars

import { PROGRAM_ID } from "../programId";

export interface ClaimLockedAccounts {
  /** The [MerkleDistributor]. */
  distributor: PublicKey;
  /** Claim Status PDA */
  claimStatus: PublicKey;
  /** Distributor ATA containing the tokens to distribute. */
  from: PublicKey;
  /**
   * Account to send the claimed tokens to.
   * Claimant must sign the transaction and can only claim on behalf of themself
   */
  to: PublicKey;
  /** Who is claiming the tokens. */
  claimant: PublicKey;
  /** The mint to claim. */
  mint: PublicKey;
  /** SPL [Token] program. */
  tokenProgram: PublicKey;
  eventAuthority: PublicKey;
  program: PublicKey;
}

export function claimLocked(accounts: ClaimLockedAccounts, programId: PublicKey = PROGRAM_ID) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.distributor, isSigner: false, isWritable: true },
    { pubkey: accounts.claimStatus, isSigner: false, isWritable: true },
    { pubkey: accounts.from, isSigner: false, isWritable: true },
    { pubkey: accounts.to, isSigner: false, isWritable: true },
    { pubkey: accounts.claimant, isSigner: true, isWritable: true },
    { pubkey: accounts.mint, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.eventAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.program, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([34, 206, 181, 23, 11, 207, 147, 90]);
  const data = identifier;
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
