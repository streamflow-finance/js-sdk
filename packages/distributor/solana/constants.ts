import { ICluster } from "@streamflow/common";

export const ONE_IN_BASIS_POINTS = BigInt(10_000);

export const DISTRIBUTOR_PROGRAM_ID = {
  [ICluster.Devnet]: "MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N",
  [ICluster.Mainnet]: "MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N",
  [ICluster.Testnet]: "MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N",
  [ICluster.Local]: "MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N",
};
