import { PublicKey } from "@solana/web3.js";

export const pk = (address: string | PublicKey): PublicKey => {
  return typeof address === "string" ? new PublicKey(address) : address;
};
