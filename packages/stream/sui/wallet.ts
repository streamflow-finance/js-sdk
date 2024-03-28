import { Keypair } from "@mysten/sui.js/cryptography";
import { WalletContextState } from "@suiet/wallet-kit";
import { SuiClient, SuiTransactionBlockResponse } from "@mysten/sui.js/client";

import { SuiSignAndExecuteTransactionBlockInput } from "./types";

/**
 * Utility function to check if the transaction initiator is a Wallet object
 * @param {Keypair | SignerWalletAdapter} walletOrKeypair - Wallet or Keypair in question
 * @return {boolean} - Returns true if parameter is a Wallet.
 */
export function isSignerKeypair(walletOrKeypair: Keypair | WalletContextState): walletOrKeypair is Keypair {
  return (
    walletOrKeypair instanceof Keypair ||
    walletOrKeypair.constructor === Keypair ||
    walletOrKeypair.constructor.name === Keypair.prototype.constructor.name
  );
}

export class SuiWalletWrapper<T extends WalletContextState | Keypair> {
  wallet: T;

  address: string;

  client: SuiClient;

  constructor(wallet: T, client: SuiClient) {
    this.client = client;
    this.wallet = wallet;
    if (isSignerKeypair(wallet)) {
      this.address = wallet.toSuiAddress();
    } else {
      this.address = wallet.address!;
    }
  }

  public async signAndExecuteTransactionBlock(
    input: SuiSignAndExecuteTransactionBlockInput,
  ): Promise<SuiTransactionBlockResponse> {
    if (isSignerKeypair(this.wallet)) {
      return this.client.signAndExecuteTransactionBlock({
        ...input,
        // @ts-ignore
        signer: this.wallet,
      });
    }
    // @ts-ignore
    return this.wallet.signAndExecuteTransactionBlock(input);
  }
}
