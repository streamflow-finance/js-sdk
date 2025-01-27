import { PublicKey } from "@solana/web3.js";

/**
 * Converts a string or PublicKey to a PublicKey object.
<<<<<<< HEAD
 * @param address - The input address as a string or PublicKey.
=======
 * @param key - The input key as a string or PublicKey.
>>>>>>> e7ef5e6 (address PR comments)
 * @returns The PublicKey object.
 */
export const pk = (address: string | PublicKey): PublicKey => {
  return typeof address === "string" ? new PublicKey(address) : address;
};
