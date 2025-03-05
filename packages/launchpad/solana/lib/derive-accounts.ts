import { PublicKey } from "@solana/web3.js";
// eslint-disable-next-line no-restricted-imports
import BN from "bn.js";

import { DEPOSIT_PREFIX, LAUNCHPAD_PREFIX, VAULT_PREFIX } from "../constants.js";

export const deriveLaunchpadPDA = (programId: PublicKey, baseMint: PublicKey, nonce: number): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [LAUNCHPAD_PREFIX, baseMint.toBuffer(), new BN(nonce).toArrayLike(Buffer, "le", 1)],
    programId,
  )[0];
};

export const deriveDepositPDA = (programId: PublicKey, launchpad: PublicKey, owner: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([DEPOSIT_PREFIX, launchpad.toBuffer(), owner.toBuffer()], programId)[0];
};

export const deriveVaultPDA = (programId: PublicKey, launchpad: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([VAULT_PREFIX, launchpad.toBuffer()], programId)[0];
};
