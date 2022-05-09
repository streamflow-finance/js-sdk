import { Wallet } from "@project-serum/anchor";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getTestTokenAirdrop } from "./airdrop";
import { AIRDROP_AMOUNT } from "../constants";
import { TX_FINALITY_CONFIRMED } from "../constants";

export const requestAirdrop = async (
  wallet: Wallet,
  connection: Connection
) => {
  if (!wallet?.publicKey || !connection) {
    return;
  }

  const txSolAirdrop = await connection.requestAirdrop(
    wallet.publicKey,
    AIRDROP_AMOUNT * LAMPORTS_PER_SOL
  );

  await connection.confirmTransaction(txSolAirdrop, TX_FINALITY_CONFIRMED);
  const txTestTokenAirdrop = await getTestTokenAirdrop(connection, wallet);
  return Promise.all([
    connection.confirmTransaction(txTestTokenAirdrop, TX_FINALITY_CONFIRMED),
  ]);
};
