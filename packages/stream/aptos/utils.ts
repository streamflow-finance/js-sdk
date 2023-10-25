import { APTOS_ERROR_MATCH_REGEX } from "./constants";

export function extractAptosErrorCode(errorText: string): string | null {
  const match = APTOS_ERROR_MATCH_REGEX.exec(errorText);

  if (!match) {
    return null;
  }

  return match[2];
}
