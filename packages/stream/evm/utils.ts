import { EVM_ERROR_MATCH_REGEX } from "./constants";

export function extractEvmErrorCode(errorText: string): string | null {
  const match = EVM_ERROR_MATCH_REGEX.exec(errorText);

  if (!match) {
    return null;
  }

  return match[1];
}
