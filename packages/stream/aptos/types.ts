import { WalletContextState } from "@manahippo/aptos-wallet-adapter";

export interface ICreateStreamAptosExt {
  senderWallet: WalletContextState;
}

export interface ITransactionResult {
  txId: string;
}

export type ITransactionAptosExt = ICreateStreamAptosExt & {
  tokenId: string;
};
