import { ICluster } from "../common/types";

export const SUI_PROGRAM_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0xa283fd6b45f1103176e7ae27e870c89df7c8783b15345e2b13faa81ec25c4fa6",
  [ICluster.Devnet]: "0x97e9a9fb1392e9785319f5512d0bfde6ecf7757b09c6de41cec89e798dd361f2",
  [ICluster.Testnet]: "0xf1916c119a6c917d4b36f96ffc0443930745789f3126a716e05a62223c48993a",
  [ICluster.Local]: "0x97e9a9fb1392e9785319f5512d0bfde6ecf7757b09c6de41cec89e798dd361f2",
};

export const SUI_CONFIG_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0x6cf6760b64245b8d23ef57c28ddceb6adbd540a23a509fef29b82237da4ab87b",
  [ICluster.Devnet]: "0xb235494fd29ad70647bfb15c18d0b9ca2aa568ab94ec27fd53a43715775dd5d8",
  [ICluster.Testnet]: "0x9cdb344873cd2995cab624f192fbe0b358e136c33acbdf7523916e32f24df44b",
  [ICluster.Local]: "0xb235494fd29ad70647bfb15c18d0b9ca2aa568ab94ec27fd53a43715775dd5d8",
};

export const SUI_FEE_TABLE_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0xad9b75399632583fb9fcae6b5bcca34e6542ab3bedb630ecbd3f15cb1cc48dbe",
  [ICluster.Devnet]: "0x321175a859a97c2ade153d302d3c777247f24a3836c84d2d1fb78369c1403d81",
  [ICluster.Testnet]: "0xf3661941207b5027fb4b85a74ca5a9fd1389fb57a8f2c57bd312b950e7d48012",
  [ICluster.Local]: "0x321175a859a97c2ade153d302d3c777247f24a3836c84d2d1fb78369c1403d81",
};
