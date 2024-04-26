import { ContractErrorCode, ICluster } from "../common/types";

// TODO: remove Devnet and Local addresses as they are not deployed, they are just a copy Testnet values
export const SUI_PROGRAM_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0xe456a3a1d4e58e85b4b7175fabe6dae895b983f1379bb8948d6ec2f137b08a7b",
  [ICluster.Devnet]: "0x34dacd839e1758ebb70bdcd4e08f18fbfef5e2b96d9aa7ce2b4a71d96ca0df5a",
  [ICluster.Testnet]: "0x34dacd839e1758ebb70bdcd4e08f18fbfef5e2b96d9aa7ce2b4a71d96ca0df5a",
  [ICluster.Local]: "0x34dacd839e1758ebb70bdcd4e08f18fbfef5e2b96d9aa7ce2b4a71d96ca0df5a",
};

export const SUI_CONFIG_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0x6cf6760b64245b8d23ef57c28ddceb6adbd540a23a509fef29b82237da4ab87b",
  [ICluster.Devnet]: "0xd6c9f5074584f58074ce56e3c5cc436d82258ec3285f186a0d6438a60bacdbf8",
  [ICluster.Testnet]: "0xd6c9f5074584f58074ce56e3c5cc436d82258ec3285f186a0d6438a60bacdbf8",
  [ICluster.Local]: "0xd6c9f5074584f58074ce56e3c5cc436d82258ec3285f186a0d6438a60bacdbf8",
};

export const SUI_FEE_TABLE_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0xad9b75399632583fb9fcae6b5bcca34e6542ab3bedb630ecbd3f15cb1cc48dbe",
  [ICluster.Devnet]: "0x6057b093904c5bdfec1067d2b8a4dc35f65bcab03b3029ad716c4882b0f36078",
  [ICluster.Testnet]: "0x6057b093904c5bdfec1067d2b8a4dc35f65bcab03b3029ad716c4882b0f36078",
  [ICluster.Local]: "0x6057b093904c5bdfec1067d2b8a4dc35f65bcab03b3029ad716c4882b0f36078",
};

export const SUI_ERROR_MATCH_REGEX =
  /MoveAbort\(MoveLocation \{ module: ModuleId \{ address: (\w+), name: Identifier\("([\w_]+)"\) }, function: \d+, instruction: \d+, function_name: Some\("([\w_]+)"\) }, (\d+)\) in command (\d+)/;

export const SUI_MODULE_ERROR_MAP: {
  [key: string]: { [key: number]: string };
} = {
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
