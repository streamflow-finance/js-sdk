import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Buffer } from "buffer";

import { PROGRAM_ID } from "../programId";

export interface SetClawbackReceiverAccounts {
  /** The [MerkleDistributor]. */
  distributor: PublicKey;
  /** New clawback account */
  newClawbackAccount: PublicKey;
  /** Admin signer */
  admin: PublicKey;
}

export function setClawbackReceiver(accounts: SetClawbackReceiverAccounts, programId: PublicKey = PROGRAM_ID) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.distributor, isSigner: false, isWritable: true },
    { pubkey: accounts.newClawbackAccount, isSigner: false, isWritable: false },
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
  ];
  const identifier = Buffer.from([153, 217, 34, 20, 19, 29, 229, 75]);
  const data = identifier;
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}
