import BN from "bn.js";

/**
 * Used for conversion of token amounts to their Big Number representation.
 * Get Big Number representation in the smallest units from the same value in the highest units.
 * @param {number} value - Number of tokens you want to convert to its BN representation.
 * @param {number} decimals - Number of decimals the token has.
 */
export const getBN = (value: number, decimals: number): BN =>
  value > (2 ** 53 - 1) / 10 ** decimals
    ? new BN(value).mul(new BN(10 ** decimals))
    : new BN(value * 10 ** decimals);

/**
 * Used for token amounts conversion from their Big Number representation to number.
 * Get value in the highest units from BN representation of the same value in the smallest units.
 * @param {BN} value - Big Number representation of value in the smallest units.
 * @param {number} decimals - Number of decimals the token has.
 */
export const getNumberFromBN = (value: BN, decimals: number): number =>
  value.gt(new BN(2 ** 53 - 1))
    ? value.div(new BN(10 ** decimals)).toNumber()
    : value.toNumber() / 10 ** decimals;
