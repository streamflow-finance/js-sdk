import { BN } from "@coral-xyz/anchor";

export const FEE_PRECISION_FACTOR = 10_000;
export const FEE_PRECISION_FACTOR_BN = new BN(FEE_PRECISION_FACTOR);
export const DEFAULT_FEE = 99;
export const DEFAULT_FEE_BN = new BN(DEFAULT_FEE);
export const SCALE_PRECISION_FACTOR = 1_000_000_000;
export const SCALE_PRECISION_FACTOR_BN = new BN(SCALE_PRECISION_FACTOR);
export const U64_MAX = 18446744073709551615n;
export const STAKE_ENTRY_DISCRIMINATOR = [187, 127, 9, 35, 155, 68, 86, 40];
export const STAKE_ENTRY_PREFIX = Buffer.from("stake-entry", "utf-8");
export const STAKE_POOL_PREFIX = Buffer.from("stake-pool", "utf-8");
export const STAKE_MINT_PREFIX = Buffer.from("stake-mint", "utf-8");
export const STAKE_VAULT_PREFIX = Buffer.from("stake-vault", "utf-8");
export const REWARD_POOL_PREFIX = Buffer.from("reward-pool", "utf-8");
export const REWARD_VAULT_PREFIX = Buffer.from("reward-vault", "utf-8");
export const REWARD_ENTRY_PREFIX = Buffer.from("reward-entry", "utf-8");
export const CONFIG_PREFIX = Buffer.from("config", "utf-8");
export const FEE_VALUE_PREFIX = Buffer.from("fee-value", "utf-8");

export const ANCHOR_DISCRIMINATOR_OFFSET = 8;
export const STAKE_ENTRY_STAKE_POOL_OFFSET = ANCHOR_DISCRIMINATOR_OFFSET + 4;
export const STAKE_ENTRY_OWNER_OFFSET = STAKE_ENTRY_STAKE_POOL_OFFSET + 32;

export const STAKE_POOL_MINT_OFFSET = ANCHOR_DISCRIMINATOR_OFFSET + 8;
