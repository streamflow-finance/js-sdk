import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { Keypair } from "@solana/web3.js";
import { ITransactionResult } from "@streamflow/common";
import { ITransactionSolanaExt } from "@streamflow/common/solana";
import BigNumber from "bignumber.js";

export interface IInteractSolanaExt extends ITransactionSolanaExt {
  invoker: SignerWalletAdapter | Keypair;
}

export interface ICreateSolanaExt extends IInteractSolanaExt {
  isNative?: boolean;
}

export interface ICreateDistributorData {
  mint: string;
  version: number;

  root: Array<number>;
  maxTotalClaim: BigNumber;
  maxNumNodes: number | string;
  unlockPeriod: number;
  startVestingTs: number;
  endVestingTs: number;
  clawbackStartTs: number;
  claimsClosable: boolean;
}

export interface IClaimData {
  id: string;

  amountUnlocked: BigNumber;
  amountLocked: BigNumber;
  proof: Array<Array<number>>;
}

export interface IClawbackData {
  id: string;
}

export interface IGetClaimData {
  id: string;

  recipient: string;
}

export interface IGetDistributors {
  ids: string[];
}

export interface ISearchDistributors {
  mint?: string;
  admin?: string;
}

export interface ISetDataAdmin {
  id: string;
  newAdmin: string;
}

export interface ISetClawbackReceiverData {
  id: string;
  newReceiver: string;
}

export interface ICreateDistributorResult extends ITransactionResult {
  metadataId: string;
}

export enum AnchorErrorCode {
  /** 8 byte instruction identifier not provided */
  InstructionMissing = "InstructionMissing",
  /** Fallback functions are not supported */
  InstructionFallbackNotFound = "InstructionFallbackNotFound",
  /** The program could not deserialize the given instruction */
  InstructionDidNotDeserialize = "InstructionDidNotDeserialize",
  /** The program could not serialize the given instruction */
  InstructionDidNotSerialize = "InstructionDidNotSerialize",
  /** The program was compiled without idl instructions */
  IdlInstructionStub = "IdlInstructionStub",
  /** The transaction was given an invalid program for the IDL instruction */
  IdlInstructionInvalidProgram = "IdlInstructionInvalidProgram",
  /** A mut constraint was violated */
  ConstraintMut = "ConstraintMut",
  /** A has one constraint was violated */
  ConstraintHasOne = "ConstraintHasOne",
  /** A signer constraint was violated */
  ConstraintSigner = "ConstraintSigner",
  /** A raw constraint was violated */
  ConstraintRaw = "ConstraintRaw",
  /** An owner constraint was violated */
  ConstraintOwner = "ConstraintOwner",
  /** A rent exemption constraint was violated */
  ConstraintRentExempt = "ConstraintRentExempt",
  /** A seeds constraint was violated */
  ConstraintSeeds = "ConstraintSeeds",
  /** An executable constraint was violated */
  ConstraintExecutable = "ConstraintExecutable",
  /** Deprecated Error, feel free to replace with something else */
  ConstraintState = "ConstraintState",
  /** An associated constraint was violated */
  ConstraintAssociated = "ConstraintAssociated",
  /** An associated init constraint was violated */
  ConstraintAssociatedInit = "ConstraintAssociatedInit",
  /** A close constraint was violated */
  ConstraintClose = "ConstraintClose",
  /** An address constraint was violated */
  ConstraintAddress = "ConstraintAddress",
  /** Expected zero account discriminant */
  ConstraintZero = "ConstraintZero",
  /** A token mint constraint was violated */
  ConstraintTokenMint = "ConstraintTokenMint",
  /** A token owner constraint was violated */
  ConstraintTokenOwner = "ConstraintTokenOwner",
  /** A mint mint authority constraint was violated */
  ConstraintMintMintAuthority = "ConstraintMintMintAuthority",
  /** A mint freeze authority constraint was violated */
  ConstraintMintFreezeAuthority = "ConstraintMintFreezeAuthority",
  /** A mint decimals constraint was violated */
  ConstraintMintDecimals = "ConstraintMintDecimals",
  /** A space constraint was violated */
  ConstraintSpace = "ConstraintSpace",
  /** A required account for the constraint is None */
  ConstraintAccountIsNone = "ConstraintAccountIsNone",
  /** A require expression was violated */
  RequireViolated = "RequireViolated",
  /** A require_eq expression was violated */
  RequireEqViolated = "RequireEqViolated",
  /** A require_keys_eq expression was violated */
  RequireKeysEqViolated = "RequireKeysEqViolated",
  /** A require_neq expression was violated */
  RequireNeqViolated = "RequireNeqViolated",
  /** A require_keys_neq expression was violated */
  RequireKeysNeqViolated = "RequireKeysNeqViolated",
  /** A require_gt expression was violated */
  RequireGtViolated = "RequireGtViolated",
  /** A require_gte expression was violated */
  RequireGteViolated = "RequireGteViolated",
  /** The account discriminator was already set on this account */
  AccountDiscriminatorAlreadySet = "AccountDiscriminatorAlreadySet",
  /** No 8 byte discriminator was found on the account */
  AccountDiscriminatorNotFound = "AccountDiscriminatorNotFound",
  /** 8 byte discriminator did not match what was expected */
  AccountDiscriminatorMismatch = "AccountDiscriminatorMismatch",
  /** Failed to deserialize the account */
  AccountDidNotDeserialize = "AccountDidNotDeserialize",
  /** Failed to serialize the account */
  AccountDidNotSerialize = "AccountDidNotSerialize",
  /** Not enough account keys given to the instruction */
  AccountNotEnoughKeys = "AccountNotEnoughKeys",
  /** The given account is not mutable */
  AccountNotMutable = "AccountNotMutable",
  /** The given account is owned by a different program than expected */
  AccountOwnedByWrongProgram = "AccountOwnedByWrongProgram",
  /** Program ID was not as expected */
  InvalidProgramId = "InvalidProgramId",
  /** Program account is not executable */
  InvalidProgramExecutable = "InvalidProgramExecutable",
  /** The given account did not sign */
  AccountNotSigner = "AccountNotSigner",
  /** The given account is not owned by the system program */
  AccountNotSystemOwned = "AccountNotSystemOwned",
  /** The program expected this account to be already initialized */
  AccountNotInitialized = "AccountNotInitialized",
  /** The given account is not a program data account */
  AccountNotProgramData = "AccountNotProgramData",
  /** The given account is not the associated token account */
  AccountNotAssociatedTokenAccount = "AccountNotAssociatedTokenAccount",
  /** The given public key does not match the required sysvar */
  AccountSysvarMismatch = "AccountSysvarMismatch",
  /** The account reallocation exceeds the MAX_PERMITTED_DATA_INCREASE limit */
  AccountReallocExceedsLimit = "AccountReallocExceedsLimit",
  /** The account was duplicated for more than one reallocation */
  AccountDuplicateReallocs = "AccountDuplicateReallocs",
  /** The declared program id does not match the actual program id */
  DeclaredProgramIdMismatch = "DeclaredProgramIdMismatch",
  /** The API being used is deprecated and should no longer be used */
  Deprecated = "Deprecated",
}

export enum ContractErrorCode {
  /** Insufficient unlocked tokens */
  InsufficientUnlockedTokens = "InsufficientUnlockedTokens",
  /** Deposit Start too far in future */
  StartTooFarInFuture = "StartTooFarInFuture",
  /** Invalid Merkle proof */
  InvalidProof = "InvalidProof",
  /** Exceeded maximum claim amount */
  ExceededMaxClaim = "ExceededMaxClaim",
  /** Exceeded maximum node count */
  MaxNodesExceeded = "MaxNodesExceeded",
  /** Account is not authorized to execute this instruction */
  Unauthorized = "Unauthorized",
  /** Token account owner did not match intended owner */
  OwnerMismatch = "OwnerMismatch",
  /** Clawback cannot be before vesting starts */
  ClawbackBeforeVesting = "ClawbackBeforeVesting",
  /** Attempted clawback before start */
  ClawbackBeforeStart = "ClawbackBeforeStart",
  /** Clawback already claimed */
  ClawbackAlreadyClaimed = "ClawbackAlreadyClaimed",
  /** Clawback start must be at least one day after vesting end */
  InsufficientClawbackDelay = "InsufficientClawbackDelay",
  /** New and old Clawback receivers are identical */
  SameClawbackReceiver = "SameClawbackReceiver",
  /** New and old admin are identical */
  SameAdmin = "SameAdmin",
  /** Claim window expired */
  ClaimExpired = "ClaimExpired",
  /** Arithmetic Error (overflow/underflow) */
  ArithmeticError = "ArithmeticError",
  /** Start Timestamp cannot be after end Timestamp */
  StartTimestampAfterEnd = "StartTimestampAfterEnd",
  /** Timestamps cannot be in the past */
  TimestampsNotInFuture = "TimestampsNotInFuture",
  /** Airdrop Version Mismatch */
  InvalidVersion = "InvalidVersion",
  /** Invalid Mint */
  InvalidMint = "InvalidMint",
  /** Claim is closed */
  ClaimIsClosed = "ClaimIsClosed",
  /** Claims are not closable */
  ClaimsAreNotClosable = "ClaimsAreNotClosable",
}
