import { ICluster } from "@streamflow/common";

export const ANCHOR_DISCRIMINATOR_OFFSET = 8;
export const DISTRIBUTOR_MINT_OFFSET = ANCHOR_DISCRIMINATOR_OFFSET + 41;
export const DISTRIBUTOR_ADMIN_OFFSET = ANCHOR_DISCRIMINATOR_OFFSET + 201;

export const ONE_IN_BASIS_POINTS = BigInt(10_000);

export const DISTRIBUTOR_PROGRAM_ID = {
  [ICluster.Devnet]: "MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N",
  [ICluster.Mainnet]: "MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N",
  [ICluster.Testnet]: "MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N",
  [ICluster.Local]: "MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N",
};
