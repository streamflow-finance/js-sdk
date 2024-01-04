import { APTOS_ERROR_MATCH_REGEX } from "./constants";

export function extractAptosErrorCode(errorText: string): string | null {
  const match = APTOS_ERROR_MATCH_REGEX.exec(errorText);

  if (!match) {
    return null;
  }

  return match[2];
}

function isAddressSpecial(address: string): boolean {
  if (address.length === 3) {
    return true;
  }
  return false;
}

/**
 * Aptos has inconsistencies in how it returns addresses.
 * This method normalizes them to be 64+2(0x...) characters long, or leaves it as SPECIAL ADDRESS (0x0 - 0xf inclusive)
 * Per this: https://github.com/aptos-labs/aptos-ts-sdk/blob/main/src/core/accountAddress.ts#L115
 * */
export function normalizeAptosAddress(address: string): string {
  if (isAddressSpecial(address)) {
    return address;
  }

  const length = address.length;
  if (length === 66 || length < 3) {
    return address;
  }

  const missingZeros = 66 - length;
  return address.slice(0, 2) + "0".repeat(missingZeros) + address.slice(2);
}
