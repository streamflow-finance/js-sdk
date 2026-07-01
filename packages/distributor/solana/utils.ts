import { createHash } from "crypto";
import { translateError } from "@coral-xyz/anchor";
import { type TransferFeeConfig } from "@solana/spl-token";
import { type Connection, PublicKey } from "@solana/web3.js";
import { ContractError, divCeilN, signAndExecuteTransaction } from "@streamflow/common";
import { Buffer } from "buffer";

import {
  ALIGNED_DISTRIBUTOR_PREFIX,
  ATTESTATION_PREFIX,
  CLAIM_STATUS_PREFIX,
  DISTRIBUTOR_PREFIX,
  MERKLE_DISTRIBUTOR_ERRORS,
  ONE_IN_BASIS_POINTS,
  SOLANA_ATTESTATION_SERVICE_PROGRAM_ID,
  TEST_ORACLE_PREFIX,
} from "./constants.js";
import type { AnyClaimStatus, CompressedClaimStatus, KycNonce } from "./types.js";

export const getAlignedDistributorPda = (programId: PublicKey, distributor: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([ALIGNED_DISTRIBUTOR_PREFIX, distributor.toBuffer()], programId)[0];
};

export const getTestOraclePda = (programId: PublicKey, mint: PublicKey, creator: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([TEST_ORACLE_PREFIX, mint.toBuffer(), creator.toBuffer()], programId)[0];
};

export function getDistributorPda(programId: PublicKey, mint: PublicKey, version: number): PublicKey {
  // Constructing the seed for the PDA
  const seeds = [
    DISTRIBUTOR_PREFIX,
    mint.toBuffer(),
    Buffer.from(new Uint8Array(new BigUint64Array([BigInt(version)]).buffer)),
  ];

  // Finding the PDA
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
}

export function getClaimantStatusPda(programId: PublicKey, distributor: PublicKey, claimant: PublicKey): PublicKey {
  // Constructing the seed for the PDA
  const seeds = [CLAIM_STATUS_PREFIX, claimant.toBuffer(), distributor.toBuffer()];

  // Finding the PDA
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
}

export function getKycNonceBytes(nonce?: KycNonce): Buffer | null {
  if (nonce == null) {
    return null;
  }

  if (typeof nonce === "string") {
    return Buffer.from(nonce);
  }

  const nonceBytes = Array.from(nonce);
  for (const byte of nonceBytes) {
    if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
      throw new Error("KYC nonce must contain only bytes");
    }
  }

  return Buffer.from(nonceBytes);
}

export function getAttestationNonce({ claimant, nonce }: { claimant: PublicKey; nonce?: KycNonce }): PublicKey {
  const nonceBytes = getKycNonceBytes(nonce);

  if (!nonceBytes || nonceBytes.length === 0) {
    return claimant;
  }

  const hash = createHash("sha256").update(`${claimant.toString()}:`).update(nonceBytes).digest();

  return new PublicKey(hash);
}

export function getAttestationPda({
  credential,
  schema,
  nonce,
  programId = SOLANA_ATTESTATION_SERVICE_PROGRAM_ID,
}: {
  credential: PublicKey;
  schema: PublicKey;
  nonce: PublicKey;
  programId?: PublicKey;
}): PublicKey {
  return PublicKey.findProgramAddressSync(
    [ATTESTATION_PREFIX, credential.toBuffer(), schema.toBuffer(), nonce.toBuffer()],
    programId,
  )[0];
}

export function getEventAuthorityPda(programId: PublicKey): PublicKey {
  // Constructing the seed for the PDA
  const seeds = [Buffer.from("__event_authority")];

  // Finding the PDA
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
}

export const isCompressedClaimStatus = (status?: AnyClaimStatus | null): status is CompressedClaimStatus => {
  return !!status && "state" in status;
};

export async function wrappedSignAndExecuteTransaction(
  ...args: Parameters<typeof signAndExecuteTransaction>
): Promise<string> {
  try {
    return await signAndExecuteTransaction(...args);
  } catch (err: unknown) {
    if (err instanceof Error) {
      const parsed = translateError(err, MERKLE_DISTRIBUTOR_ERRORS);
      if ("error" in parsed) {
        throw new ContractError(err, parsed.error.errorCode?.code, parsed.error.errorMessage);
      }
    }
    throw err;
  }
}

export async function calculateAmountWithTransferFees(
  connection: Connection,
  transferFeeConfig: TransferFeeConfig,
  transferAmount: bigint,
): Promise<{ transferAmount: bigint; feeCharged: bigint }> {
  const epoch = await connection.getEpochInfo();
  const transferFee =
    epoch.epoch >= transferFeeConfig.newerTransferFee.epoch
      ? transferFeeConfig.newerTransferFee
      : transferFeeConfig.olderTransferFee;
  const transferFeeBasisPoints = BigInt(transferFee.transferFeeBasisPoints);
  let feeCharged = BigInt(0);

  if (transferFeeBasisPoints !== BigInt(0)) {
    const numerator = transferAmount * ONE_IN_BASIS_POINTS;
    const denominator = ONE_IN_BASIS_POINTS - transferFeeBasisPoints;
    const rawPreFeeAmount = divCeilN(numerator, denominator);
    const fee = rawPreFeeAmount - transferAmount;
    transferAmount = rawPreFeeAmount;
    feeCharged = fee > transferFee.maximumFee ? transferFee.maximumFee : fee;
  }

  return { transferAmount, feeCharged };
}
