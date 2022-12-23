import { ICluster } from "../common/types";

export const APTOS_PROGRAM_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0x9009d93d52576bf9ac6dc6cf10b870610bcb316342fef6eff80662fbbfce51b0",
  // TODO: Add a correct programID for Test net
  [ICluster.Devnet]: "0xc6737de143d91b2f99a7e490d4f8348fdfa3bdd1eb8737a27d0455f8a3625688",
  [ICluster.Testnet]: "0xc6737de143d91b2f99a7e490d4f8348fdfa3bdd1eb8737a27d0455f8a3625688",
  [ICluster.Local]: "0x9009d93d52576bf9ac6dc6cf10b870610bcb316342fef6eff80662fbbfce51b0",
};
