import { AccountInfo, PublicKey } from "@solana/web3.js";

export interface ITransactionSolanaExt {
  computePrice?: number;
  computeLimit?: number;
}

export interface Account {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
}

export interface CheckAssociatedTokenAccountsData {
  sender: PublicKey;
  recipient: PublicKey;
  partner: PublicKey;
  streamflowTreasury: PublicKey;
  mint: PublicKey;
}

export interface AtaParams {
  mint: PublicKey;
  owner: PublicKey;
  programId?: PublicKey;
}
