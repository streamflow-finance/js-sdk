import { ICluster } from "../common/types";

export const ETHEREUM_PROGRAM_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0x94d4646Bd307Bf91CB1893BC64d976BF9E60D9B2",
  [ICluster.Devnet]: "0x5Db7a43D20De64E3a3BC765334a477026FD13E7d",
  [ICluster.Testnet]: "0x5Db7a43D20De64E3a3BC765334a477026FD13E7d",
  [ICluster.Local]: "0x5Db7a43D20De64E3a3BC765334a477026FD13E7d",
};

export const BNB_PROGRAM_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0x94d4646Bd307Bf91CB1893BC64d976BF9E60D9B2",
  [ICluster.Devnet]: "0x5Db7a43D20De64E3a3BC765334a477026FD13E7d",
  [ICluster.Testnet]: "0x5Db7a43D20De64E3a3BC765334a477026FD13E7d",
  [ICluster.Local]: "0x5Db7a43D20De64E3a3BC765334a477026FD13E7d",
};

export const POLYGON_PROGRAM_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0x94d4646Bd307Bf91CB1893BC64d976BF9E60D9B2",
  [ICluster.Devnet]: "0x5Db7a43D20De64E3a3BC765334a477026FD13E7d",
  [ICluster.Testnet]: "0x5Db7a43D20De64E3a3BC765334a477026FD13E7d",
  [ICluster.Local]: "0x5Db7a43D20De64E3a3BC765334a477026FD13E7d",
};
