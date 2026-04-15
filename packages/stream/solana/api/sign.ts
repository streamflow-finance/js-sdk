import type { Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import type { SignerWalletAdapter } from "@solana/wallet-adapter-base";

type SignerInput = SignerWalletAdapter | Keypair | { publicKey: PublicKey };

function isKeypair(signer: SignerInput): signer is Keypair {
  return "secretKey" in signer;
}

function isWalletAdapter(signer: SignerInput): signer is SignerWalletAdapter {
  return "signTransaction" in signer;
}

export async function sign(transaction: VersionedTransaction, signers: SignerInput[]): Promise<VersionedTransaction> {
  for (const signer of signers) {
    if (isKeypair(signer)) {
      transaction.sign([signer]);
    } else if (isWalletAdapter(signer)) {
      await signer.signTransaction(transaction);
    }
  }
  return transaction;
}
