import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";

import { CONTRACT_SEED, ESCROW_SEED, METADATA_SEED, REPOPULATED_METADATA_SEED, TEST_ORACLE_SEED } from "../constants.js";

export const deriveContractPDA = (programId: PublicKey, streamMetadata: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([CONTRACT_SEED, streamMetadata.toBuffer()], programId)[0];
};

export const deriveEscrowPDA = (programId: PublicKey, streamMetadata: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([ESCROW_SEED, streamMetadata.toBuffer()], programId)[0];
};

export const deriveTestOraclePDA = (programId: PublicKey, mint: PublicKey, creator: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([TEST_ORACLE_SEED, mint.toBuffer(), creator.toBuffer()], programId)[0];
};

export const deriveStreamMetadataPDA = (
  programId: PublicKey,
  mint: PublicKey,
  sender: PublicKey,
  nonce: number,
): [PublicKey, number] => {
  const nonceBuffer = Buffer.alloc(4);
  nonceBuffer.writeUInt32BE(nonce);
  return PublicKey.findProgramAddressSync(
    [METADATA_SEED, mint.toBuffer(), sender.toBuffer(), nonceBuffer],
    programId,
  );
};

export const deriveRepopulatedMetadataPDA = (programId: PublicKey, streamMetadata: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([REPOPULATED_METADATA_SEED, streamMetadata.toBuffer()], programId)[0];
};