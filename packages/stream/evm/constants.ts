import { ICluster } from "../common/types";

export const ETHERIUM_PROGRAM_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0x35fC2D13D97c13d6697Dc273fEDF93eBC92B7743",
  [ICluster.Devnet]: "0x35fC2D13D97c13d6697Dc273fEDF93eBC92B7743",
  [ICluster.Testnet]: "0x35fC2D13D97c13d6697Dc273fEDF93eBC92B7743",
  [ICluster.Local]: "0x35fC2D13D97c13d6697Dc273fEDF93eBC92B7743",
};

export const BSC_PROGRAM_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0xb09702834cba4c4BDb03CC7F0Fef48490a44BB50",
  [ICluster.Devnet]: "0xb09702834cba4c4BDb03CC7F0Fef48490a44BB50",
  [ICluster.Testnet]: "0xb09702834cba4c4BDb03CC7F0Fef48490a44BB50",
  [ICluster.Local]: "0xb09702834cba4c4BDb03CC7F0Fef48490a44BB50",
};
