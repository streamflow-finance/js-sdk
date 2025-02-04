import { GetTransactionBlockParams, SuiClient, SuiTransactionBlockResponse } from "@mysten/sui/client";
import pRetry from "p-retry";

import { SUI_ERROR_MATCH_REGEX, SUI_MODULE_ERROR_MAP } from "./constants.js";
import { SuiErrorInfo } from "./types.js";

export function extractSuiErrorInfo(errorText: string): SuiErrorInfo {
  const error: SuiErrorInfo = { text: errorText };
  const match = SUI_ERROR_MATCH_REGEX.exec(errorText);

  if (!match) {
    return error;
  }

  const moduleName = match[2] as "protocol" | "admin" | "fee_manager";
  const errorCode = Number(match[4]);
  const errorName = SUI_MODULE_ERROR_MAP[moduleName] ? SUI_MODULE_ERROR_MAP[moduleName][errorCode] : undefined;
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

/**
 * Fetches transaction block with a retry:
 * retries `Could not find the referenced transaction` error as it could be that some validators still don't have the tx;
 *
 * @param client sui client to use
 * @param input transaction fetch payload,
 */
export function getTransactionBlock(
  client: SuiClient,
  input: GetTransactionBlockParams,
): Promise<SuiTransactionBlockResponse> {
  return pRetry(() => client.getTransactionBlock(input), {
    retries: 5,
    shouldRetry: (error) => error.message.includes("Could not find the referenced transaction"),
    minTimeout: 500,
    maxTimeout: 1000,
  });
}
