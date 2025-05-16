import type { PublicKey } from "@solana/web3.js";

/**
 * @interface GetPriorityFeeEstimateOptions - The options for the priority fee estimate
 */
export interface GetPriorityFeeEstimateOptions {
  /**
   * The accounts or transaction to get the priority fee estimate for.
   * `string` is a serialized base64 transaction.
   * `array` is interpreted as an array of public keys in string format or as PublicKey instances (writable accounts).
   */
  accountsOrTx: (string | PublicKey)[] | string;
  /**
   * The percentile of the priority fee estimate to return.
   *
   * examples: Triton RPC - [0, 10000]
   * @default 5000
   */
  percentile?: number;
  /**
   * The multiplier to apply to the priority fee estimate.
   * The result is multiplied by 1 + increaseFactor.
   * @default 0.05 = 5%
   */
  increaseFactor?: number;
}

/**
 * @interface GetConsumeLimitEstimateOptions - The options for the consume limit estimate
 */
export interface GetConsumeLimitEstimateOptions {
  /**
   * The multiplier to apply to the consume limit estimate.
   * The result is multiplied by 1 + increaseFactor.
   * @default 0.05 = 5%
   */
  increaseFactor?: number;
}
