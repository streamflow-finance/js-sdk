import { PublicKey } from "@solana/web3.js";

import { ICluster } from "../common/types";

export const TX_FINALITY_CONFIRMED = "confirmed";

export const STREAM_STRUCT_OFFSET_SENDER = 49;
export const STREAM_STRUCT_OFFSET_RECIPIENT = 113;

// Defined: https://github.com/streamflow-finance/protocol/blob/main/programs/protocol/src/state.rs#L25
export const CREATE_PARAMS_PADDING = 126;

export const PROGRAM_ID = {
  [ICluster.Devnet]: "HqDGZjaVRXJ9MGRQEw7qDc2rAr6iH1n1kAQdCZaCMfMZ",
  [ICluster.Mainnet]: "strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m",
  [ICluster.Testnet]: "HqDGZjaVRXJ9MGRQEw7qDc2rAr6iH1n1kAQdCZaCMfMZ",
  [ICluster.Local]: "HqDGZjaVRXJ9MGRQEw7qDc2rAr6iH1n1kAQdCZaCMfMZ",
};

export const STREAMFLOW_PROGRAM_ID = "strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m";

export const STREAMFLOW_DEVNET_PROGRAM_ID = "FGjLaVo5zLGdzCxMo9gu9tXr1kzTToKd8C8K7YS5hNM1";

export const STREAMFLOW_TREASURY_PUBLIC_KEY = new PublicKey(
  "5SEpbdjFK5FxwTvfsGMXVQTD2v4M2c5tyRTxhdsPkgDw"
);

export const WITHDRAWOR_PUBLIC_KEY = new PublicKey("wdrwhnCv4pzW8beKsbPa4S2UDZrXenjg16KJdKSpb5u");

export const FEE_ORACLE_PUBLIC_KEY = new PublicKey("B743wFVk2pCYhV91cn287e1xY7f1vt4gdY48hhNiuQmT");

export const AIRDROP_TEST_TOKEN = "Gssm3vfi8s65R31SBdmQRq6cKeYojGgup7whkw4VCiQj";

export const AIRDROP_AMOUNT = 1; // 1 SOL is the cap on the testnet

export const SOLANA_ERROR_MAP: { [key: number]: string } = {
  0x60: "AccountsNotWritable",
  0x61: "InvalidMetadata",
  0x62: "InvalidMetadataAccount",
  0x63: "MetadataAccountMismatch",
  0x64: "InvalidEscrowAccount",
  0x65: "NotAssociated",
  0x66: "MintMismatch",
  0x67: "TransferNotAllowed",
  0x68: "ContractClosed",
  0x69: "InvalidTreasury",
  0x70: "InvalidTimestamps",
  0x71: "InvalidDepositConfiguration",
  0x72: "AmountIsZero",
  0x73: "AmountMoreThanAvailable",
  0x74: "AmountAvailableIsZero",
  0x80: "ArithmeticError",
  0x81: "InvalidMetadataSize",
  0x82: "UninitializedMetadata",
  0x83: "Unauthorized",
  0x84: "SelfTransfer",
  0x85: "AlreadyPaused",
  0x86: "NotPaused",
  0x87: "MetadataNotRentExempt",
};
