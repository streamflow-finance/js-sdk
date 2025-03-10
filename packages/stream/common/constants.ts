import BN from "bn.js";

export const MAX_SAFE_UNIX_TIME_VALUE = 8640000000000;

export const BASE_FEE = 1009900; // Buffer to include usual fees when calculating stream amount
export const WITHDRAW_AVAILABLE_AMOUNT = new BN("18446744073709551615"); // Magical number to withdraw all available amount from a Contract
