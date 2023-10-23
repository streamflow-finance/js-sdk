import { ICluster } from "../common/types";

export const APTOS_PROGRAM_IDS: Record<ICluster, string> = {
  [ICluster.Mainnet]: "0x9009d93d52576bf9ac6dc6cf10b870610bcb316342fef6eff80662fbbfce51b0",
  // TODO: Add a correct programID for Test net
  [ICluster.Devnet]: "0xc6737de143d91b2f99a7e490d4f8348fdfa3bdd1eb8737a27d0455f8a3625688",
  [ICluster.Testnet]: "0xc6737de143d91b2f99a7e490d4f8348fdfa3bdd1eb8737a27d0455f8a3625688",
  [ICluster.Local]: "0x9009d93d52576bf9ac6dc6cf10b870610bcb316342fef6eff80662fbbfce51b0",
};

export const APTOS_MODULE_ERROR_MAP: { [key: string]: { [key: number]: string } } = {
  protocol: {
    1: "ECONTRACT_NOT_INIT",
    2: "EBAD_AMOUNT",
    3: "ENO_PERMISSIONS",
    4: "EBADINPUT",
    5: "ECLOSED",
    6: "EBAD_INPUT_AMOUNT_PER_PERIOD",
    8: "EBAD_INPUT_UPDATE_RATE",
    9: "EBAD_INPUT_CLIFF_AMOUNT",
    10: "EBAD_INPUT_PERIOD",
    11: "EBAD_INPUT_START",
    12: "ENO_RECIPIENT_COIN_ADDRESS",
  },
  admin: {
    0: "EADMIN_NOT_AUTHORIZED",
    1: "EWITHDRAWOR_NOT_AUTHORIZED",
  },
  fees: {
    1: "EFEE_NOT_VALID",
  },
};
