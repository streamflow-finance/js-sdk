import { Transaction, VersionedTransaction, type PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";

interface TransactionAccountsProvider {
  accountKeys: PublicKey[];
}

export function deserializeRawTransaction(serializedTx: string) {
  const txBuffer = Buffer.from(serializedTx, "base64");
  try {
    const tx = Transaction.from(txBuffer);
    return resolveTransactionAccounts(tx);
  } catch (error) {
    try {
      const vtx = VersionedTransaction.deserialize(txBuffer);
      return resolveTransactionAccounts(vtx);
    } catch (vError) {
      throw new Error("Failed to deserialize transaction: " + (vError instanceof Error ? vError.message : vError), {
        cause: vError,
      });
    }
  }
}

export const resolveTransactionAccounts = (tx: VersionedTransaction | Transaction) => {
  if (tx instanceof Transaction) {
    const message = tx.compileMessage();
    const accounts = message.accountKeys;
    const writableAccounts = accounts.filter((_, idx) => message.isAccountWritable(idx));
    return {
      type: "legacy",
      transaction: tx,
      accounts,
      writableAccounts,
    };
  }

  const message = tx.message;
  const accounts =
    "staticAccountKeys" in message
      ? message.staticAccountKeys
      : (message as unknown as TransactionAccountsProvider).accountKeys;

  const writableAccounts = accounts.filter((_, idx) => message.isAccountWritable(idx));
  return {
    type: "versioned",
    transaction: tx,
    accounts,
    writableAccounts,
  };
};
