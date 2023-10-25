import { ContractErrorCode, ICluster } from "../common/types";

export const APTOS_PROGRAM_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0x9009d93d52576bf9ac6dc6cf10b870610bcb316342fef6eff80662fbbfce51b0",
  // TODO: Add a correct programID for Test net
  [ICluster.Devnet]: "0xc6737de143d91b2f99a7e490d4f8348fdfa3bdd1eb8737a27d0455f8a3625688",
  [ICluster.Testnet]: "0xc6737de143d91b2f99a7e490d4f8348fdfa3bdd1eb8737a27d0455f8a3625688",
  [ICluster.Local]: "0x9009d93d52576bf9ac6dc6cf10b870610bcb316342fef6eff80662fbbfce51b0",
};

export const APTOS_ERROR_MATCH_REGEX = /Move abort in [a-z0-9]+::([^:]+): ([A-Z_]+)/;

export const APTOS_MODULE_ERROR_MAP: { [key: string]: { [key: number]: string } } = {
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
    12: ContractErrorCode.ENO_RECIPIENT_COIN_ADDRESS,
  },
};
