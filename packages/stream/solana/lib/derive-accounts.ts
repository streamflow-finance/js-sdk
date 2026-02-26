import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";

import {
  CONTRACT_SEED,
  ESCROW_SEED,
  METADATA_SEED,
  REPOPULATED_METADATA_SEED,
  TEST_ORACLE_SEED,
} from "../constants.js";
import BN from "bn.js";

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
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [METADATA_SEED, mint.toBuffer(), sender.toBuffer(), new BN(nonce).toArrayLike(Buffer, "le", 4)],
    programId,
  )[0];
};

export const deriveRepopulatedMetadataPDA = (programId: PublicKey, streamMetadata: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([REPOPULATED_METADATA_SEED, streamMetadata.toBuffer()], programId)[0];
};
