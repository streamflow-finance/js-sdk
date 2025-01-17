import { Keypair } from "@mysten/sui/cryptography";
import { WalletContextState } from "@suiet/wallet-kit";
import { SuiClient, SuiTransactionBlockResponse } from "@mysten/sui/client";

import { SuiSignAndExecuteTransactionBlockInput } from "./types.js";

/**
 * Utility function to check if the transaction initiator is a Wallet object
 * @param {Keypair | WalletContextState} walletOrKeypair - Wallet or Keypair in question
 * @return {boolean} - Returns true if parameter is a Wallet.
 */
export function isSignerKeypair(walletOrKeypair: Keypair | WalletContextState): walletOrKeypair is Keypair {
  return (
    walletOrKeypair instanceof Keypair ||
    walletOrKeypair.constructor === Keypair ||
    walletOrKeypair.constructor.name === Keypair.prototype.constructor.name ||
    "getSecretKey" in walletOrKeypair
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

  public async signAndExecuteTransaction(
    input: SuiSignAndExecuteTransactionBlockInput,
  ): Promise<SuiTransactionBlockResponse> {
    if (isSignerKeypair(this.wallet)) {
      return this.client.signAndExecuteTransaction({
        ...input,
        // @ts-ignore
        signer: this.wallet,
      });
    }
    // @ts-ignore
    return this.wallet.signAndExecuteTransaction(input);
  }
}
