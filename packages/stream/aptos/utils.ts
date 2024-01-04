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

// Per this: https://github.com/aptos-labs/aptos-ts-sdk/blob/main/src/core/accountAddress.ts#L115
export function normalizeAptosAddress(address: string): string {
  if (isAddressSpecial(address)) {
    return address;
  }

  const length = address.length;
  if (length === 64) {
    return address;
  }

  const missingZeros = 64 - length;
  return address.slice(0, 2) + "0".repeat(missingZeros) + address.slice(2);
}
