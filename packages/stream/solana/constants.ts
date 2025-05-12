import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";

import { ICluster, SolanaContractErrorCode, SolanaAlignedProxyErrorCode } from "../common/types.js";
import type { ISearchStreams } from "./types.js";

export const TX_FINALITY_CONFIRMED = "confirmed";

export const ORIGINAL_CONTRACT_SENDER_OFFSET = 9;

export const STREAM_STRUCT_OFFSET_SENDER = 49;
export const STREAM_STRUCT_OFFSET_RECIPIENT = 113;
export const STREAM_STRUCT_OFFSET_MINT = 177;
export const STREAM_STRUCT_OFFSET_CLOSED = 671;

export const ALIGNED_PRECISION_FACTOR_POW = 9;

export const STREAM_STRUCT_OFFSETS: Record<keyof ISearchStreams, number> = {
  mint: STREAM_STRUCT_OFFSET_MINT,
  recipient: STREAM_STRUCT_OFFSET_RECIPIENT,
  sender: STREAM_STRUCT_OFFSET_SENDER,
  closed: STREAM_STRUCT_OFFSET_CLOSED,
};

// Defined: https://github.com/streamflow-finance/protocol/blob/main/programs/protocol/src/state.rs#L25
export const CREATE_PARAMS_PADDING = 126;

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

// Aligned Unlocks Program transactions require a higher comput limit
export const ALIGNED_COMPUTE_LIMIT = 300000;

export const CONTRACT_DISCRIMINATOR = [172, 138, 115, 242, 121, 67, 183, 26];
export const TEST_ORACLE_DISCRIMINATOR = [198, 49, 63, 134, 232, 251, 168, 28];
export const CONTRACT_SEED = Buffer.from("contract", "utf-8");
export const ESCROW_SEED = Buffer.from("strm", "utf-8");
export const TEST_ORACLE_SEED = Buffer.from("test-oracle", "utf-8");

export const PARTNER_ORACLE_PROGRAM_ID = "pardpVtPjC8nLj1Dwncew62mUzfChdCX1EaoZe8oCAa";

export const STREAMFLOW_TREASURY_PUBLIC_KEY = new PublicKey("5SEpbdjFK5FxwTvfsGMXVQTD2v4M2c5tyRTxhdsPkgDw");

export const WITHDRAWOR_PUBLIC_KEY = new PublicKey("wdrwhnCv4pzW8beKsbPa4S2UDZrXenjg16KJdKSpb5u");

export const FEE_ORACLE_PUBLIC_KEY = new PublicKey("B743wFVk2pCYhV91cn287e1xY7f1vt4gdY48hhNiuQmT");

export const AIRDROP_TEST_TOKEN = "Gssm3vfi8s65R31SBdmQRq6cKeYojGgup7whkw4VCiQj";

export const FEES_METADATA_SEED = Buffer.from("strm_fees");

export const DEFAULT_STREAMFLOW_FEE = 0.99;

export const AIRDROP_AMOUNT = 1; // 1 SOL is the cap on the testnet

export const PARTNER_SCHEMA = {
  struct: {
    pubkey: { array: { type: "u8", len: 32 } },
    partner_fee: "f32",
    strm_fee: "f32",
  },
};
export const PARTNERS_SCHEMA = { array: { type: PARTNER_SCHEMA } };

export const SOLANA_ERROR_MATCH_REGEX = /custom program error: (0x\d{2})/;

export const SOLANA_ERROR_MAP: { [key: number]: string } = {
  0x60: SolanaContractErrorCode.AccountsNotWritable,
  0x61: SolanaContractErrorCode.InvalidMetadata,
  0x62: SolanaContractErrorCode.InvalidMetadataAccount,
  0x63: SolanaContractErrorCode.MetadataAccountMismatch,
  0x64: SolanaContractErrorCode.InvalidEscrowAccount,
  0x65: SolanaContractErrorCode.NotAssociated,
  0x66: SolanaContractErrorCode.MintMismatch,
  0x67: SolanaContractErrorCode.TransferNotAllowed,
  0x68: SolanaContractErrorCode.ContractClosed,
  0x69: SolanaContractErrorCode.InvalidTreasury,
  0x70: SolanaContractErrorCode.InvalidTimestamps,
  0x71: SolanaContractErrorCode.InvalidDepositConfiguration,
  0x72: SolanaContractErrorCode.AmountIsZero,
  0x73: SolanaContractErrorCode.AmountMoreThanAvailable,
  0x74: SolanaContractErrorCode.AmountAvailableIsZero,
  0x80: SolanaContractErrorCode.ArithmeticError,
  0x81: SolanaContractErrorCode.InvalidMetadataSize,
  0x82: SolanaContractErrorCode.UninitializedMetadata,
  0x83: SolanaContractErrorCode.Unauthorized,
  0x84: SolanaContractErrorCode.SelfTransfer,
  0x85: SolanaContractErrorCode.AlreadyPaused,
  0x86: SolanaContractErrorCode.NotPaused,
  0x87: SolanaContractErrorCode.MetadataNotRentExempt,
  0x1770: SolanaAlignedProxyErrorCode.Unauthorized,
  0x1771: SolanaAlignedProxyErrorCode.ArithmeticError,
  0x1772: SolanaAlignedProxyErrorCode.UnsupportedTokenExtensions,
  0x1773: SolanaAlignedProxyErrorCode.PeriodTooShort,
  0x1774: SolanaAlignedProxyErrorCode.InvalidTickSize,
  0x1775: SolanaAlignedProxyErrorCode.InvalidPercentageBoundaries,
  0x1776: SolanaAlignedProxyErrorCode.InvalidPriceBoundaries,
  0x1777: SolanaAlignedProxyErrorCode.UnsupportedOracle,
  0x1778: SolanaAlignedProxyErrorCode.InvalidOracleAccount,
  0x1779: SolanaAlignedProxyErrorCode.InvalidOraclePrice,
  0x177a: SolanaAlignedProxyErrorCode.InvalidStreamMetadata,
  0x177b: SolanaAlignedProxyErrorCode.AmountAlreadyUpdated,
  0x177c: SolanaAlignedProxyErrorCode.AllFundsUnlocked,
};
