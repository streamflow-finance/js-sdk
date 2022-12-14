import { ICluster } from "../common/types";

export const APTOS_PROGRAM_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0x9009d93d52576bf9ac6dc6cf10b870610bcb316342fef6eff80662fbbfce51b0",
  [ICluster.Devnet]: "0x1dda724347d7776cb1817054eaf49d03cb6f58dae92c90d62edd5d3b90ba733c",
  // TODO: Add a correct programID for Test net
  [ICluster.Testnet]: "0x1dda724347d7776cb1817054eaf49d03cb6f58dae92c90d62edd5d3b90ba733c",
  [ICluster.Local]: "0x9009d93d52576bf9ac6dc6cf10b870610bcb316342fef6eff80662fbbfce51b0",
};
