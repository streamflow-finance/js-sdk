import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import BN from "bn.js";

import { ICluster, ContractErrorCode, AlignedProxyErrorCode } from "./types.js";
import type { ISearchStreams } from "./types.js";

export const TX_FINALITY_CONFIRMED = "confirmed";

export const ORIGINAL_CONTRACT_SENDER_OFFSET = 9;

export const STREAM_STRUCT_OFFSET_SENDER = 49;
export const STREAM_STRUCT_OFFSET_RECIPIENT = 113;
export const STREAM_STRUCT_OFFSET_MINT = 177;
export const STREAM_STRUCT_OFFSET_CLOSED = 671;
export const STREAM_STRUCT_OFFSET_OLD_METADATA_KEY = 714;

export const MAX_SAFE_UNIX_TIME_VALUE = 8640000000000;

export const WITHDRAW_AVAILABLE_AMOUNT = new BN("18446744073709551615"); // Magical number to withdraw all available amount from a Contract

export const ALIGNED_PRECISION_FACTOR_POW = 9;

export const STREAM_STRUCT_OFFSETS: Record<keyof ISearchStreams, number> = {
  mint: STREAM_STRUCT_OFFSET_MINT,
  recipient: STREAM_STRUCT_OFFSET_RECIPIENT,
  sender: STREAM_STRUCT_OFFSET_SENDER,
  closed: STREAM_STRUCT_OFFSET_CLOSED,
};

// Defined: https://github.com/streamflow-finance/protocol/blob/main/programs/protocol/src/state.rs#L25
export const CREATE_PARAMS_PADDING = 121;

export const PROGRAM_ID = {
  [ICluster.Devnet]: "HqDGZjaVRXJ9MGRQEw7qDc2rAr6iH1n1kAQdCZaCMfMZ",
  [ICluster.Mainnet]: "strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m",
  [ICluster.Testnet]: "HqDGZjaVRXJ9MGRQEw7qDc2rAr6iH1n1kAQdCZaCMfMZ",
  [ICluster.Local]: "HqDGZjaVRXJ9MGRQEw7qDc2rAr6iH1n1kAQdCZaCMfMZ",
};

export const ALIGNED_UNLOCKS_PROGRAM_ID = {
  [ICluster.Devnet]: "aSTRM2NKoKxNnkmLWk9sz3k74gKBk9t7bpPrTGxMszH",
  [ICluster.Mainnet]: "aSTRM2NKoKxNnkmLWk9sz3k74gKBk9t7bpPrTGxMszH",
  [ICluster.Testnet]: "aSTRM2NKoKxNnkmLWk9sz3k74gKBk9t7bpPrTGxMszH",
  [ICluster.Local]: "aSTRM2NKoKxNnkmLWk9sz3k74gKBk9t7bpPrTGxMszH",
};

export const PARTNER_ORACLE_PROGRAM_ID = {
  [ICluster.Devnet]: "pardoTarcc6HKsPcbXkVycxsJsoN9QEzrdHgVdHAGY3",
  [ICluster.Mainnet]: "pardpVtPjC8nLj1Dwncew62mUzfChdCX1EaoZe8oCAa",
  [ICluster.Testnet]: "pardoTarcc6HKsPcbXkVycxsJsoN9QEzrdHgVdHAGY3",
  [ICluster.Local]: "pardoTarcc6HKsPcbXkVycxsJsoN9QEzrdHgVdHAGY3",
};

// const [feeOracle] = PublicKey.findProgramAddressSync(
//   [Buffer.from(FEES_METADATA_SEED)],
//   new PublicKey(PARTNER_ORACLE_PROGRAM_ID[cluster]),
// );
export const FEE_ORACLE_PUBLIC_KEY = {
  [ICluster.Devnet]: "Aa2JJfFzUN3V54DXUHRBJowFw416xfZHpPk9DaNy3iYs",
  [ICluster.Mainnet]: "B743wFVk2pCYhV91cn287e1xY7f1vt4gdY48hhNiuQmT",
  [ICluster.Testnet]: "Aa2JJfFzUN3V54DXUHRBJowFw416xfZHpPk9DaNy3iYs",
  [ICluster.Local]: "Aa2JJfFzUN3V54DXUHRBJowFw416xfZHpPk9DaNy3iYs",
};

// Aligned Unlocks Program transactions require a higher comput limit
export const ALIGNED_COMPUTE_LIMIT = 300000;

export const CONTRACT_DISCRIMINATOR = [172, 138, 115, 242, 121, 67, 183, 26];
export const TEST_ORACLE_DISCRIMINATOR = [198, 49, 63, 134, 232, 251, 168, 28];
export const CONTRACT_SEED = Buffer.from("contract", "utf-8");
export const ESCROW_SEED = Buffer.from("strm", "utf-8");
export const TEST_ORACLE_SEED = Buffer.from("test-oracle", "utf-8");
export const METADATA_SEED = Buffer.from("strm-met", "utf-8");
export const REPOPULATED_METADATA_SEED = Buffer.from("strm-rep", "utf-8");

export const STREAMFLOW_TREASURY_PUBLIC_KEY = new PublicKey("5SEpbdjFK5FxwTvfsGMXVQTD2v4M2c5tyRTxhdsPkgDw");

export const WITHDRAWOR = "wdrwhnCv4pzW8beKsbPa4S2UDZrXenjg16KJdKSpb5u";

export const WITHDRAWOR_PUBLIC_KEY = new PublicKey(WITHDRAWOR);

export const AIRDROP_TEST_TOKEN = "Gssm3vfi8s65R31SBdmQRq6cKeYojGgup7whkw4VCiQj";

export const FEES_METADATA_SEED = Buffer.from("strm_fees");

// Default creation fee, 0.09 SOL
export const DEFAULT_CREATION_FEE_SOL = 90_000_000;

// Default auto claim fee, 0.19 SOL
export const DEFAULT_AUTO_CLAIM_FEE_SOL = 190_000_000;

// Default token fee %, 0.19%
export const DEFAULT_STREAMFLOW_FEE = 0.19;

export const AIRDROP_AMOUNT = 1; // 1 SOL is the cap on the testnet

export const PARTNER_SCHEMA = {
  struct: {
    pubkey: { array: { type: "u8", len: 32 } },
    creation_fee: "u32",
    auto_claim_fee: "u32",
    token_fee_percent: "f32",
    buffer: { array: { type: "u8", len: 16 } },
  },
};
export const PARTNERS_SCHEMA = { array: { type: PARTNER_SCHEMA } };

export const SOLANA_ERROR_MATCH_REGEX = /custom program error: (0x\d{2})/;

export const SOLANA_ERROR_MAP: { [key: number]: string } = {
  0x60: ContractErrorCode.AccountsNotWritable,
  0x61: ContractErrorCode.InvalidMetadata,
  0x62: ContractErrorCode.InvalidMetadataAccount,
  0x63: ContractErrorCode.MetadataAccountMismatch,
  0x64: ContractErrorCode.InvalidEscrowAccount,
  0x65: ContractErrorCode.NotAssociated,
  0x66: ContractErrorCode.MintMismatch,
  0x67: ContractErrorCode.TransferNotAllowed,
  0x68: ContractErrorCode.ContractClosed,
  0x69: ContractErrorCode.InvalidTreasury,
  0x70: ContractErrorCode.InvalidTimestamps,
  0x71: ContractErrorCode.InvalidDepositConfiguration,
  0x72: ContractErrorCode.AmountIsZero,
  0x73: ContractErrorCode.AmountMoreThanAvailable,
  0x74: ContractErrorCode.AmountAvailableIsZero,
  0x80: ContractErrorCode.ArithmeticError,
  0x81: ContractErrorCode.InvalidMetadataSize,
  0x82: ContractErrorCode.UninitializedMetadata,
  0x83: ContractErrorCode.Unauthorized,
  0x84: ContractErrorCode.SelfTransfer,
  0x85: ContractErrorCode.AlreadyPaused,
  0x86: ContractErrorCode.NotPaused,
  0x87: ContractErrorCode.MetadataNotRentExempt,
  0x1770: AlignedProxyErrorCode.Unauthorized,
  0x1771: AlignedProxyErrorCode.ArithmeticError,
  0x1772: AlignedProxyErrorCode.UnsupportedTokenExtensions,
  0x1773: AlignedProxyErrorCode.PeriodTooShort,
  0x1774: AlignedProxyErrorCode.InvalidTickSize,
  0x1775: AlignedProxyErrorCode.InvalidPercentageBoundaries,
  0x1776: AlignedProxyErrorCode.InvalidPriceBoundaries,
  0x1777: AlignedProxyErrorCode.UnsupportedOracle,
  0x1778: AlignedProxyErrorCode.InvalidOracleAccount,
  0x1779: AlignedProxyErrorCode.InvalidOraclePrice,
  0x177a: AlignedProxyErrorCode.InvalidStreamMetadata,
  0x177b: AlignedProxyErrorCode.AmountAlreadyUpdated,
  0x177c: AlignedProxyErrorCode.AllFundsUnlocked,
};
