import { PublicKey } from "@solana/web3.js";

import { CONTRACT_SEED, ESCROW_SEED, TEST_ORACLE_SEED } from "../constants";

export const deriveContractPDA = (programId: PublicKey, streamMetadata: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([CONTRACT_SEED, streamMetadata.toBuffer()], programId)[0];
};

export const deriveEscrowPDA = (programId: PublicKey, streamMetadata: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([ESCROW_SEED, streamMetadata.toBuffer()], programId)[0];
};

export const deriveTestOraclePDA = (programId: PublicKey, mint: PublicKey, creator: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([TEST_ORACLE_SEED, mint.toBuffer(), creator.toBuffer()], programId)[0];
};
