import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import {
  AccountInfo,
  PublicKey,
  Keypair,
  TransactionSignature,
  TransactionInstruction,
} from "@solana/web3.js";

export { WalletAdapterNetwork as Cluster } from "@solana/wallet-adapter-base";

export interface Account {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
}

export interface IInteractStreamSolanaExt {
  invoker: SignerWalletAdapter | Keypair;
}

export interface TransactionResponse {
  tx: TransactionSignature;
}

export interface TxResponse {
  ixs: TransactionInstruction[];
  tx: TransactionSignature;
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
}
