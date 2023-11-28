import { ContractErrorCode, ICluster } from "../common/types";

// TODO: remove Devnet and Local addresses as they are not deployed, they are just a copy Testnet values
export const SUI_PROGRAM_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0x19007172b22fcfc00c22f1598a9cec7ab52de2b0ea0d111813bc1295a136fc10",
  [ICluster.Devnet]: "0xf1916c119a6c917d4b36f96ffc0443930745789f3126a716e05a62223c48993a",
  [ICluster.Testnet]: "0xf1916c119a6c917d4b36f96ffc0443930745789f3126a716e05a62223c48993a",
  [ICluster.Local]: "0xf1916c119a6c917d4b36f96ffc0443930745789f3126a716e05a62223c48993a",
};

export const SUI_CONFIG_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0x6cf6760b64245b8d23ef57c28ddceb6adbd540a23a509fef29b82237da4ab87b",
  [ICluster.Devnet]: "0x9cdb344873cd2995cab624f192fbe0b358e136c33acbdf7523916e32f24df44b",
  [ICluster.Testnet]: "0x9cdb344873cd2995cab624f192fbe0b358e136c33acbdf7523916e32f24df44b",
  [ICluster.Local]: "0x9cdb344873cd2995cab624f192fbe0b358e136c33acbdf7523916e32f24df44b",
};

export const SUI_FEE_TABLE_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0xad9b75399632583fb9fcae6b5bcca34e6542ab3bedb630ecbd3f15cb1cc48dbe",
  [ICluster.Devnet]: "0xf3661941207b5027fb4b85a74ca5a9fd1389fb57a8f2c57bd312b950e7d48012",
  [ICluster.Testnet]: "0xf3661941207b5027fb4b85a74ca5a9fd1389fb57a8f2c57bd312b950e7d48012",
  [ICluster.Local]: "0xf3661941207b5027fb4b85a74ca5a9fd1389fb57a8f2c57bd312b950e7d48012",
};

export const SUI_ERROR_MATCH_REGEX =
  /MoveAbort\(MoveLocation \{ module: ModuleId \{ address: (\w+), name: Identifier\("([\w_]+)"\) }, function: \d+, instruction: \d+, function_name: Some\("([\w_]+)"\) }, (\d+)\) in command (\d+)/;

export const SUI_MODULE_ERROR_MAP: { [key: string]: { [key: number]: string } } = {
  protocol: {
    1: ContractErrorCode.ECONTRACT_NOT_INIT,
    2: ContractErrorCode.EBAD_AMOUNT,
    3: ContractErrorCode.ENO_PERMISSIONS,
    4: ContractErrorCode.EBADINPUT,
    5: ContractErrorCode.ECLOSED,
    6: ContractErrorCode.EBAD_INPUT_AMOUNT_PER_PERIOD,
    8: ContractErrorCode.EBAD_INPUT_UPDATE_RATE,
    9: ContractErrorCode.EBAD_INPUT_CLIFF_AMOUNT,
    10: ContractErrorCode.EBAD_INPUT_PERIOD,
    11: ContractErrorCode.EBAD_INPUT_START,
    13: ContractErrorCode.EBAD_INSUFFICIENT_WITHDRAWAL_FEES,
    14: ContractErrorCode.EBAD_INSUFFICIENT_AMOUNT,
    15: ContractErrorCode.EPAUSED,
    16: ContractErrorCode.ENOTPAUSED,
  },
};
