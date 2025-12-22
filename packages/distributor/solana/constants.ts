import { parseIdlErrors } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { ICluster } from "@streamflow/common";

import { type MerkleDistributor } from "./descriptor/merkle_distributor.js";
import MerkleDistributorIDL from "./descriptor/idl/merkle_distributor.json";
import { type AlignedDistributor } from "./descriptor/aligned_distributor.js";
import AlignedDistributorIDL from "./descriptor/idl/aligned_distributor.json";

export const MERKLE_DISTRIBUTOR_ERRORS = parseIdlErrors(MerkleDistributorIDL as MerkleDistributor);
export const ALIGNED_DISTRIBUTOR_ERRORS = parseIdlErrors(AlignedDistributorIDL as AlignedDistributor);

export const ANCHOR_DISCRIMINATOR_OFFSET = 8;
export const DISTRIBUTOR_MINT_OFFSET = ANCHOR_DISCRIMINATOR_OFFSET + 41;
export const DISTRIBUTOR_ADMIN_OFFSET = ANCHOR_DISCRIMINATOR_OFFSET + 201;

export const DISTRIBUTOR_PREFIX = Buffer.from("MerkleDistributor", "utf-8");
export const ALIGNED_DISTRIBUTOR_PREFIX = Buffer.from("aligned-distributor", "utf-8");
export const TEST_ORACLE_PREFIX = Buffer.from("test-oracle", "utf-8");
export const CLAIM_STATUS_PREFIX = Buffer.from("ClaimStatus", "utf-8");
export const ALIGNED_PRECISION_FACTOR_POW = 9;

export const AIRDROP_CLAIM_FEE = BigInt(10_000_000);
export const STREAMFLOW_TREASURY_PUBLIC_KEY = new PublicKey("5SEpbdjFK5FxwTvfsGMXVQTD2v4M2c5tyRTxhdsPkgDw");

export const ONE_IN_BASIS_POINTS = BigInt(10_000);

export const SOL_FEE_PROGRAM_VERSION = 1;

export const ALIGNED_DISTRIBUTOR_PROGRAM_ID = {
  [ICluster.Devnet]: "aMERKpFAWoChCi5oZwPvgsSCoGpZKBiU7fi76bdZjt2",
  [ICluster.Mainnet]: "aMERKpFAWoChCi5oZwPvgsSCoGpZKBiU7fi76bdZjt2",
  [ICluster.Testnet]: "aMERKpFAWoChCi5oZwPvgsSCoGpZKBiU7fi76bdZjt2",
  [ICluster.Local]: "aMERKpFAWoChCi5oZwPvgsSCoGpZKBiU7fi76bdZjt2",
};

export const DISTRIBUTOR_PROGRAM_ID = {
  [ICluster.Devnet]: "MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N",
  [ICluster.Mainnet]: "MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N",
  [ICluster.Testnet]: "MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N",
  [ICluster.Local]: "MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N",
};

export const PARTNER_ORACLE_PROGRAM_ID = {
  [ICluster.Devnet]: "pardoTarcc6HKsPcbXkVycxsJsoN9QEzrdHgVdHAGY3",
  [ICluster.Mainnet]: "pardpVtPjC8nLj1Dwncew62mUzfChdCX1EaoZe8oCAa",
  [ICluster.Testnet]: "pardoTarcc6HKsPcbXkVycxsJsoN9QEzrdHgVdHAGY3",
  [ICluster.Local]: "pardoTarcc6HKsPcbXkVycxsJsoN9QEzrdHgVdHAGY3",
};

// const [feeOracle] = PublicKey.findProgramAddressSync(
//   [Buffer.from(b"airdrop_config")],
//   new PublicKey(PARTNER_ORACLE_PROGRAM_ID[cluster]),
// );
export const FEE_CONFIG_PUBLIC_KEY = {
  [ICluster.Devnet]: "5HCju3fLTQGNNPZyZwaWGQqRcTRKE1VEdr7HFZKc7NhB",
  [ICluster.Mainnet]: "5WHEQeA5uX7zJ8r7yAzsxomF7LTnX9acQy3V8oWXHa8b",
  [ICluster.Testnet]: "5HCju3fLTQGNNPZyZwaWGQqRcTRKE1VEdr7HFZKc7NhB",
  [ICluster.Local]: "5HCju3fLTQGNNPZyZwaWGQqRcTRKE1VEdr7HFZKc7NhB",
};
