import { ICluster } from "@streamflow/common";

export const LAUNCHPAD_PREFIX = Buffer.from("launchpad", "utf-8");
export const VAULT_PREFIX = Buffer.from("vault", "utf-8");
export const DEPOSIT_PREFIX = Buffer.from("deposit", "utf-8");

export const ANCHOR_DISCRIMINATOR_OFFSET = 8;

export const LAUNCHPAD_BASE_MINT_OFFSET = ANCHOR_DISCRIMINATOR_OFFSET + 8;
export const LAUNCHPAD_QUOTE_MINT_OFFSET = ANCHOR_DISCRIMINATOR_OFFSET + 32;
export const LAUNCHPAD_BYTE_OFFSETS = {
  baseMint: LAUNCHPAD_BASE_MINT_OFFSET,
  quoteMint: LAUNCHPAD_QUOTE_MINT_OFFSET,
} as const;

export const PROGRAM_ID: Record<ICluster, string> = {
  [ICluster.Mainnet]: "BUYfFzeTWeRW5JrPjCutbsvzjA5ERS8EnGujJjfmnJu6",
  [ICluster.Devnet]: "BUYfFzeTWeRW5JrPjCutbsvzjA5ERS8EnGujJjfmnJu6",
  [ICluster.Testnet]: "BUYfFzeTWeRW5JrPjCutbsvzjA5ERS8EnGujJjfmnJu6",
  [ICluster.Local]: "BUYfFzeTWeRW5JrPjCutbsvzjA5ERS8EnGujJjfmnJu6",
};
