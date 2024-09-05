import BigNumber from "bignumber.js";

import { ContractError } from "./types.js";

const FEE_PRECISION = 4;
const FEE_NORMALIZER = 10 ** FEE_PRECISION;
const FEE_MULTIPLIER = BigNumber(10 ** 6);

/**
 * Used for token amounts conversion from their Big Number representation to number.
 * Get value in the highest units from BigNumber representation of the same value in the smallest units.
 * @param {BigNumber} value - Big Number representation of value in the smallest units.
 * @param {number} decimals - Number of decimals the token has.
 */
export const getNumberFromBigNumber = (bigNum: BigNumber, decimals: number): number => {
  return bigNum.div(BigNumber(10).pow(decimals)).toNumber();
};

/**
 * Used for conversion of token amounts to their Big Number representation.
 * Get Big Number representation in the smallest units from the same value in the highest units.
 * @param {number} value - Number of tokens you want to convert to its BigNumber representation.
 * @param {number} decimals - Number of decimals the token has.
 */
export const getScaledBigNumber = (value: number | string | BigNumber, decimals: number): BigNumber => {
  return new BigNumber(value).times(new BigNumber(10).pow(decimals));
};

/**
 * Calculate total amount of a Contract including all fees.
 * - first we convert fee floating to a BigNumber with up to 4 decimals precision
 * - then we reverse the fee with `FEE_MULTIPLIER` to safely multiply it by depositedAmount
 *   to receive a total number and not percentage of depositedAmount
 * @param depositedAmount deposited raw tokens
 * @param totalFee sum of all fees in percentage as floating number, e.g. 0.99% should be supplied as 0.99
 * @returns total tokens amount that Contract will retrieve from the Sender
 */
export const calculateTotalAmountToDeposit = (depositedAmount: BigNumber, totalFee: number): BigNumber => {
  const totalFeeNormalized = BigNumber(totalFee).times(FEE_NORMALIZER);
  return depositedAmount.times(totalFeeNormalized.plus(FEE_MULTIPLIER)).div(FEE_MULTIPLIER);
};

/**
 * Used to make on chain calls to the contract and wrap raised errors if any
 * @param func function that interacts with the contract
 * @param callback callback that may be used to extract error code
 * @returns {T}
 */
export async function handleContractError<T>(
  func: () => Promise<T>,
  callback?: (err: Error) => string | null,
): Promise<T> {
  try {
    return await func();
  } catch (err: any) {
    if (err instanceof Error) {
      if (callback) {
        throw new ContractError(err, callback(err));
      }
      throw new ContractError(err);
    }
    throw err;
  }
}
