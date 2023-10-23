import { SUI_ERROR_MATCH_REGEX, SUI_MODULE_ERROR_MAP } from "./constants";
import { SuiErrorInfo } from "./types";

export function extractSuiErrorInfo(errorText: string): SuiErrorInfo {
  const error: SuiErrorInfo = { text: errorText };
  const match = SUI_ERROR_MATCH_REGEX.exec(errorText);

  if (!match) {
    return error;
  }

  const moduleName = match[2] as "protocol" | "admin" | "fee_manager";
  const errorCode = Number(match[4]);
  const errorName = SUI_MODULE_ERROR_MAP[moduleName]
    ? SUI_MODULE_ERROR_MAP[moduleName][errorCode]
    : undefined;
  const index = Number(match[5]);

  if (index) {
    error.index = index;
  }

  if (errorName) {
    error.parsed = {
      module: moduleName,
      code: errorCode,
      name: errorName,
    };
  }

  return error;
}
