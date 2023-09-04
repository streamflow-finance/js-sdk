import { ICluster } from "../common/types";

export const SUI_PROGRAM_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0x02844f6bcf1c2054175cc92627ec74426a890a8a4f6f2c50f8304d34b0aadf12",
  [ICluster.Devnet]: "0x97e9a9fb1392e9785319f5512d0bfde6ecf7757b09c6de41cec89e798dd361f2",
  [ICluster.Testnet]: "0x97e9a9fb1392e9785319f5512d0bfde6ecf7757b09c6de41cec89e798dd361f2",
  [ICluster.Local]: "0x97e9a9fb1392e9785319f5512d0bfde6ecf7757b09c6de41cec89e798dd361f2",
};

export const SUI_CONFIG_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0xae72b9ec8e56a5150c984abcd3392e137c9867981f291f487afa8c41c41152ce",
  [ICluster.Devnet]: "0xb235494fd29ad70647bfb15c18d0b9ca2aa568ab94ec27fd53a43715775dd5d8",
  [ICluster.Testnet]: "0xb235494fd29ad70647bfb15c18d0b9ca2aa568ab94ec27fd53a43715775dd5d8",
  [ICluster.Local]: "0xb235494fd29ad70647bfb15c18d0b9ca2aa568ab94ec27fd53a43715775dd5d8",
};

export const SUI_FEE_TABLE_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0x292595afce98626d2021fa2e2ae9f7fef085e777f9c3560823b580a03455b83f",
  [ICluster.Devnet]: "0x321175a859a97c2ade153d302d3c777247f24a3836c84d2d1fb78369c1403d81",
  [ICluster.Testnet]: "0x321175a859a97c2ade153d302d3c777247f24a3836c84d2d1fb78369c1403d81",
  [ICluster.Local]: "0x321175a859a97c2ade153d302d3c777247f24a3836c84d2d1fb78369c1403d81",
};
