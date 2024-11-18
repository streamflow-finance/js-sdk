import { ICluster } from "@streamflow/common";

export const ANCHOR_DISCRIMINATOR_OFFSET = 8;
export const DISTRIBUTOR_MINT_OFFSET = ANCHOR_DISCRIMINATOR_OFFSET + 41;
export const DISTRIBUTOR_ADMIN_OFFSET = ANCHOR_DISCRIMINATOR_OFFSET + 201;

export const DISTRIBUTOR_PREFIX = Buffer.from("MerkleDistributor", "utf-8");
export const ALIGNED_DISTRIBUTOR_PREFIX = Buffer.from("aligned-distributor", "utf-8");
export const TEST_ORACLE_PREFIX = Buffer.from("test-oracle", "utf-8");
export const CLAIM_STATUS_PREFIX = Buffer.from("ClaimStatus", "utf-8");
export const ALIGNED_PRECISION_FACTOR_POW = 9;

export const ONE_IN_BASIS_POINTS = BigInt(10_000);

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
