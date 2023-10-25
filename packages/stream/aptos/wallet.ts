import {
  AptosAccount,
  AptosClient,
  Types,
  TransactionBuilderRemoteABI,
  MaybeHexString,
} from "aptos";
import { WalletContextState } from "@manahippo/aptos-wallet-adapter";

export class AptosWalletWrapper<T extends WalletContextState | AptosAccount> {
  wallet: T;

  address: MaybeHexString;

  client: AptosClient;

  constructor(wallet: T, client: AptosClient) {
    this.client = client;
    this.wallet = wallet;
    if (wallet instanceof AptosAccount) {
      this.address = wallet.address();
    } else {
      this.address = wallet.account!.address!;
    }
  }

  public async signAndSubmitTransaction(
    input: Types.TransactionPayload_EntryFunctionPayload
  ): Promise<string> {
    if (this.wallet instanceof AptosAccount) {
      const builder = new TransactionBuilderRemoteABI(this.client, {
        sender: this.address,
      });
      const rawTxn = await builder.build(input.function, input.type_arguments, input.arguments);
      const res = await this.client.simulateTransaction(this.wallet, rawTxn);
      if (!res[0].success) {
        throw new Error(`Transaction Simulation failed: ${JSON.stringify(res)}`);
      }
      const signedTx = await this.client.signTransaction(this.wallet, rawTxn);
      const tx = await this.client.submitSignedBCSTransaction(signedTx);
      await this.client.waitForTransaction(tx.hash);
      return tx.hash;
    }
    return (await this.wallet.signAndSubmitTransaction(input)).hash;
  }
}
