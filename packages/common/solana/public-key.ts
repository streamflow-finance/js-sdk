import { PublicKey } from "@solana/web3.js";

/**
 * Converts a string or PublicKey to a PublicKey object.
 * @param address - The input address as a string or PublicKey.
 * @returns The PublicKey object.
 */
export const pk = (address: string | PublicKey): PublicKey => {
  return typeof address === "string" ? new PublicKey(address) : address;
};
