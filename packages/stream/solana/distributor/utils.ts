import { PublicKey } from "@solana/web3.js";

export function getDistributorPda(
  programId: PublicKey,
  mint: PublicKey,
  version: number
): PublicKey {
  // Constructing the seed for the PDA
  const seeds = [
    Buffer.from("MerkleDistributor"),
    mint.toBuffer(),
    Buffer.from(new Uint8Array(new BigUint64Array([BigInt(version)]).buffer)),
  ];

  // Finding the PDA
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
}

export function getClaimantStatusPda(
  programId: PublicKey,
  distributor: PublicKey,
  claimant: PublicKey
): PublicKey {
  // Constructing the seed for the PDA
  const seeds = [Buffer.from("ClaimStatus"), claimant.toBuffer(), distributor.toBuffer()];

  // Finding the PDA
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
}
