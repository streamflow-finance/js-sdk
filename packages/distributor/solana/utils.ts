import { type TransferFeeConfig } from "@solana/spl-token";
import { type SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { Buffer } from "buffer";
import { Connection, Keypair, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { ContractError, divCeilN } from "@streamflow/common";
import { type ConfirmationParams, signAndExecuteTransaction, type ThrottleParams } from "@streamflow/common/solana";

import {
  ONE_IN_BASIS_POINTS,
  ALIGNED_DISTRIBUTOR_PREFIX,
  TEST_ORACLE_PREFIX,
  DISTRIBUTOR_PREFIX,
  CLAIM_STATUS_PREFIX,
} from "./constants.js";
import { fromTxError } from "./generated/errors/index.js";

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
  throttleParams: ThrottleParams,
): Promise<string> {
  try {
    return await signAndExecuteTransaction(connection, invoker, tx, confirmationParams, throttleParams);
  } catch (err: unknown) {
    if (err instanceof Error) {
      const parsed = fromTxError(err);
      if (parsed) {
        throw new ContractError(err, parsed.name, parsed.msg);
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
