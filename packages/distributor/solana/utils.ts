import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { Connection, Keypair, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { ContractError } from "@streamflow/common";
import { ConfirmationParams, signAndExecuteTransaction } from "@streamflow/common/solana";

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

export function getEventAuthorityPda(programId: PublicKey): PublicKey {
  // Constructing the seed for the PDA
  const seeds = [Buffer.from("__event_authority")];

  // Finding the PDA
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
}

export async function wrappedSignAndExecuteTransaction(
  connection: Connection,
  invoker: Keypair | SignerWalletAdapter,
  tx: Transaction | VersionedTransaction,
  confirmationParams: ConfirmationParams,
): Promise<string> {
  try {
    return await signAndExecuteTransaction(connection, invoker, tx, confirmationParams);
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
