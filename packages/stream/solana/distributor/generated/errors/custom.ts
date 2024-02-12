export type CustomError =
  | InsufficientUnlockedTokens
  | StartTooFarInFuture
  | InvalidProof
  | ExceededMaxClaim
  | MaxNodesExceeded
  | Unauthorized
  | OwnerMismatch
  | ClawbackBeforeVesting
  | ClawbackBeforeStart
  | ClawbackAlreadyClaimed
  | InsufficientClawbackDelay
  | SameClawbackReceiver
  | SameAdmin
  | ClaimExpired
  | ArithmeticError
  | StartTimestampAfterEnd
  | TimestampsNotInFuture
  | InvalidVersion
  | InvalidMint
  | ClaimIsClosed
  | ClaimsAreNotClosable;

export class InsufficientUnlockedTokens extends Error {
  static readonly code = 6000;

  readonly code = 6000;

  readonly name = "InsufficientUnlockedTokens";

  readonly msg = "Insufficient unlocked tokens";

  constructor(readonly logs?: string[]) {
    super("6000: Insufficient unlocked tokens");
  }
}

export class StartTooFarInFuture extends Error {
  static readonly code = 6001;

  readonly code = 6001;

  readonly name = "StartTooFarInFuture";

  readonly msg = "Deposit Start too far in future";

  constructor(readonly logs?: string[]) {
    super("6001: Deposit Start too far in future");
  }
}

export class InvalidProof extends Error {
  static readonly code = 6002;

  readonly code = 6002;

  readonly name = "InvalidProof";

  readonly msg = "Invalid Merkle proof";

  constructor(readonly logs?: string[]) {
    super("6002: Invalid Merkle proof");
  }
}

export class ExceededMaxClaim extends Error {
  static readonly code = 6003;

  readonly code = 6003;

  readonly name = "ExceededMaxClaim";

  readonly msg = "Exceeded maximum claim amount";

  constructor(readonly logs?: string[]) {
    super("6003: Exceeded maximum claim amount");
  }
}

export class MaxNodesExceeded extends Error {
  static readonly code = 6004;

  readonly code = 6004;

  readonly name = "MaxNodesExceeded";

  readonly msg = "Exceeded maximum node count";

  constructor(readonly logs?: string[]) {
    super("6004: Exceeded maximum node count");
  }
}

export class Unauthorized extends Error {
  static readonly code = 6005;

  readonly code = 6005;

  readonly name = "Unauthorized";

  readonly msg = "Account is not authorized to execute this instruction";

  constructor(readonly logs?: string[]) {
    super("6005: Account is not authorized to execute this instruction");
  }
}

export class OwnerMismatch extends Error {
  static readonly code = 6006;

  readonly code = 6006;

  readonly name = "OwnerMismatch";

  readonly msg = "Token account owner did not match intended owner";

  constructor(readonly logs?: string[]) {
    super("6006: Token account owner did not match intended owner");
  }
}

export class ClawbackBeforeVesting extends Error {
  static readonly code = 6007;

  readonly code = 6007;

  readonly name = "ClawbackBeforeVesting";

  readonly msg = "Clawback cannot be before vesting starts";

  constructor(readonly logs?: string[]) {
    super("6007: Clawback cannot be before vesting starts");
  }
}

export class ClawbackBeforeStart extends Error {
  static readonly code = 6008;

  readonly code = 6008;

  readonly name = "ClawbackBeforeStart";

  readonly msg = "Attempted clawback before start";

  constructor(readonly logs?: string[]) {
    super("6008: Attempted clawback before start");
  }
}

export class ClawbackAlreadyClaimed extends Error {
  static readonly code = 6009;

  readonly code = 6009;

  readonly name = "ClawbackAlreadyClaimed";

  readonly msg = "Clawback already claimed";

  constructor(readonly logs?: string[]) {
    super("6009: Clawback already claimed");
  }
}

export class InsufficientClawbackDelay extends Error {
  static readonly code = 6010;

  readonly code = 6010;

  readonly name = "InsufficientClawbackDelay";

  readonly msg = "Clawback start must be at least one day after vesting end";

  constructor(readonly logs?: string[]) {
    super("6010: Clawback start must be at least one day after vesting end");
  }
}

export class SameClawbackReceiver extends Error {
  static readonly code = 6011;

  readonly code = 6011;

  readonly name = "SameClawbackReceiver";

  readonly msg = "New and old Clawback receivers are identical";

  constructor(readonly logs?: string[]) {
    super("6011: New and old Clawback receivers are identical");
  }
}

export class SameAdmin extends Error {
  static readonly code = 6012;

  readonly code = 6012;

  readonly name = "SameAdmin";

  readonly msg = "New and old admin are identical";

  constructor(readonly logs?: string[]) {
    super("6012: New and old admin are identical");
  }
}

export class ClaimExpired extends Error {
  static readonly code = 6013;

  readonly code = 6013;

  readonly name = "ClaimExpired";

  readonly msg = "Claim window expired";

  constructor(readonly logs?: string[]) {
    super("6013: Claim window expired");
  }
}

export class ArithmeticError extends Error {
  static readonly code = 6014;

  readonly code = 6014;

  readonly name = "ArithmeticError";

  readonly msg = "Arithmetic Error (overflow/underflow)";

  constructor(readonly logs?: string[]) {
    super("6014: Arithmetic Error (overflow/underflow)");
  }
}

export class StartTimestampAfterEnd extends Error {
  static readonly code = 6015;

  readonly code = 6015;

  readonly name = "StartTimestampAfterEnd";

  readonly msg = "Start Timestamp cannot be after end Timestamp";

  constructor(readonly logs?: string[]) {
    super("6015: Start Timestamp cannot be after end Timestamp");
  }
}

export class TimestampsNotInFuture extends Error {
  static readonly code = 6016;

  readonly code = 6016;

  readonly name = "TimestampsNotInFuture";

  readonly msg = "Timestamps cannot be in the past";

  constructor(readonly logs?: string[]) {
    super("6016: Timestamps cannot be in the past");
  }
}

export class InvalidVersion extends Error {
  static readonly code = 6017;

  readonly code = 6017;

  readonly name = "InvalidVersion";

  readonly msg = "Airdrop Version Mismatch";

  constructor(readonly logs?: string[]) {
    super("6017: Airdrop Version Mismatch");
  }
}

export class InvalidMint extends Error {
  static readonly code = 6018;

  readonly code = 6018;

  readonly name = "InvalidMint";

  readonly msg = "Invalid Mint";

  constructor(readonly logs?: string[]) {
    super("6018: Invalid Mint");
  }
}

export class ClaimIsClosed extends Error {
  static readonly code = 6019;

  readonly code = 6019;

  readonly name = "ClaimIsClosed";

  readonly msg = "Claim is closed";

  constructor(readonly logs?: string[]) {
    super("6019: Claim is closed");
  }
}

export class ClaimsAreNotClosable extends Error {
  static readonly code = 6020;

  readonly code = 6020;

  readonly name = "ClaimsAreNotClosable";

  readonly msg = "Claims are not closable";

  constructor(readonly logs?: string[]) {
    super("6020: Claims are not closable");
  }
}

export function fromCode(code: number, logs?: string[]): CustomError | null {
  switch (code) {
    case 6000:
      return new InsufficientUnlockedTokens(logs);
    case 6001:
      return new StartTooFarInFuture(logs);
    case 6002:
      return new InvalidProof(logs);
    case 6003:
      return new ExceededMaxClaim(logs);
    case 6004:
      return new MaxNodesExceeded(logs);
    case 6005:
      return new Unauthorized(logs);
    case 6006:
      return new OwnerMismatch(logs);
    case 6007:
      return new ClawbackBeforeVesting(logs);
    case 6008:
      return new ClawbackBeforeStart(logs);
    case 6009:
      return new ClawbackAlreadyClaimed(logs);
    case 6010:
      return new InsufficientClawbackDelay(logs);
    case 6011:
      return new SameClawbackReceiver(logs);
    case 6012:
      return new SameAdmin(logs);
    case 6013:
      return new ClaimExpired(logs);
    case 6014:
      return new ArithmeticError(logs);
    case 6015:
      return new StartTimestampAfterEnd(logs);
    case 6016:
      return new TimestampsNotInFuture(logs);
    case 6017:
      return new InvalidVersion(logs);
    case 6018:
      return new InvalidMint(logs);
    case 6019:
      return new ClaimIsClosed(logs);
    case 6020:
      return new ClaimsAreNotClosable(logs);
  }

  return null;
}
