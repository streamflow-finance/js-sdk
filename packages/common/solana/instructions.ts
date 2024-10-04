import {
  getAssociatedTokenAddress,
  NATIVE_MINT,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
} from "@solana/spl-token";
import { Connection, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";

export const prepareWrappedAccount = async (
  connection: Connection,
  senderAddress: PublicKey,
  amount: BN,
): Promise<TransactionInstruction[]> => {
  const tokenAccount = await getAssociatedTokenAddress(NATIVE_MINT, senderAddress, true);

  const accInfo = await connection.getParsedAccountInfo(tokenAccount);

  const instructions =
    (accInfo.value?.lamports ?? 0) > 0
      ? []
      : [createAssociatedTokenAccountInstruction(senderAddress, tokenAccount, senderAddress, NATIVE_MINT)];

  return [
    ...instructions,
    SystemProgram.transfer({
      fromPubkey: senderAddress,
      toPubkey: tokenAccount,
      lamports: amount.toNumber(),
    }),
    createSyncNativeInstruction(tokenAccount),
  ];
};
