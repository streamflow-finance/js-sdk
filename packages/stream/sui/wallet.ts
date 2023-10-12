import { Keypair } from "@mysten/sui.js/cryptography";
import { WalletContextState } from "@suiet/wallet-kit";
import { SuiClient, SuiTransactionBlockResponse } from "@mysten/sui.js/client";

import { SuiSignAndExecuteTransactionBlockInput } from "./types";

export class SuiWalletWrapper<T extends WalletContextState | Keypair> {
  wallet: T;

  address: string;

  client: SuiClient;

  constructor(wallet: T, client: SuiClient) {
    this.client = client;
    this.wallet = wallet;
    if (wallet instanceof Keypair) {
      this.address = wallet.toSuiAddress();
    } else {
      this.address = wallet.address!;
    }
  }

  public async signAndExecuteTransactionBlock(
    input: SuiSignAndExecuteTransactionBlockInput
  ): Promise<SuiTransactionBlockResponse> {
    if (this.wallet instanceof Keypair) {
      return this.client.signAndExecuteTransactionBlock({
        ...input,
        signer: this.wallet,
      });
    }
    return this.wallet.signAndExecuteTransactionBlock(input);
  }
}
