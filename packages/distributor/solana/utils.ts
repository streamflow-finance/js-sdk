import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { BlockhashWithExpiryBlockHeight, Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { ContractError } from "@streamflow/common";
import { signAndExecuteTransaction } from "@streamflow/common/solana";

import { fromTxError } from "./generated/errors";

export function getDistributorPda(programId: PublicKey, mint: PublicKey, version: number): PublicKey {
  // Constructing the seed for the PDA
  const seeds = [
    Buffer.from("MerkleDistributor"),
    mint.toBuffer(),
    Buffer.from(new Uint8Array(new BigUint64Array([BigInt(version)]).buffer)),
  ];

  // Finding the PDA
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
}

export function getClaimantStatusPda(programId: PublicKey, distributor: PublicKey, claimant: PublicKey): PublicKey {
  // Constructing the seed for the PDA
  const seeds = [Buffer.from("ClaimStatus"), claimant.toBuffer(), distributor.toBuffer()];

  // Finding the PDA
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
}

export async function wrappedSignAndExecuteTransaction(
  connection: Connection,
  invoker: Keypair | SignerWalletAdapter,
  tx: Transaction,
  hash: BlockhashWithExpiryBlockHeight,
): Promise<string> {
  try {
    return await signAndExecuteTransaction(connection, invoker, tx, hash);
  } catch (err: any) {
    if (err instanceof Error) {
      const parsed = fromTxError(err);
      if (parsed) {
        throw new ContractError(err, parsed.name, parsed.msg);
      }
    }
    throw err;
  }
}
