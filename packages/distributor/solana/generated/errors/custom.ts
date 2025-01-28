export type CustomError =
  | InsufficientUnlockedTokens
  | InvalidProof
  | ExceededMaxClaim
  | MaxNodesExceeded
  | Unauthorized
  | OwnerMismatch
  | ClawbackBeforeStart
  | ClawbackAlreadyClaimed
  | SameClawbackReceiver
  | ClawbackReceiverIsTokenVault
  | SameAdmin
  | ClaimExpired
  | ArithmeticError
  | StartTimestampAfterEnd
  | TimestampsNotInFuture
  | InvalidMint
  | ClaimIsClosed
  | ClaimsAreNotClosable
  | InvalidUnlockPeriod
  | DurationUpdateNotAllowed
  | NoVestingAmount
  | VestingAlreadyFinished
  | InvalidAmounts
  | ClaimsLimitReached;

export class InsufficientUnlockedTokens extends Error {
  static readonly code = 6000;

  readonly code = 6000;

  readonly name = "InsufficientUnlockedTokens";

  readonly msg = "Insufficient unlocked tokens";

  constructor(readonly logs?: string[]) {
    super("6000: Insufficient unlocked tokens");
  }
}

export class InvalidProof extends Error {
  static readonly code = 6001;

  readonly code = 6001;

  readonly name = "InvalidProof";

  readonly msg = "Invalid Merkle proof";

  constructor(readonly logs?: string[]) {
    super("6001: Invalid Merkle proof");
  }
}

export class ExceededMaxClaim extends Error {
  static readonly code = 6002;

  readonly code = 6002;

  readonly name = "ExceededMaxClaim";

  readonly msg = "Exceeded maximum claim amount";

  constructor(readonly logs?: string[]) {
    super("6002: Exceeded maximum claim amount");
  }
}

export class MaxNodesExceeded extends Error {
  static readonly code = 6003;

  readonly code = 6003;

  readonly name = "MaxNodesExceeded";

  readonly msg = "Exceeded maximum node count";

  constructor(readonly logs?: string[]) {
    super("6003: Exceeded maximum node count");
  }
}

export class Unauthorized extends Error {
  static readonly code = 6004;

  readonly code = 6004;

  readonly name = "Unauthorized";

  readonly msg = "Account is not authorized to execute this instruction";

  constructor(readonly logs?: string[]) {
    super("6004: Account is not authorized to execute this instruction");
  }
}

export class OwnerMismatch extends Error {
  static readonly code = 6005;

  readonly code = 6005;

  readonly name = "OwnerMismatch";

  readonly msg = "Token account owner did not match intended owner";

  constructor(readonly logs?: string[]) {
    super("6005: Token account owner did not match intended owner");
  }
}

export class ClawbackBeforeStart extends Error {
  static readonly code = 6006;

  readonly code = 6006;

  readonly name = "ClawbackBeforeStart";

  readonly msg = "Attempted clawback before start";

  constructor(readonly logs?: string[]) {
    super("6006: Attempted clawback before start");
  }
}

export class ClawbackAlreadyClaimed extends Error {
  static readonly code = 6007;

  readonly code = 6007;

  readonly name = "ClawbackAlreadyClaimed";

  readonly msg = "Clawback already claimed";

  constructor(readonly logs?: string[]) {
    super("6007: Clawback already claimed");
  }
}

export class SameClawbackReceiver extends Error {
  static readonly code = 6008;

  readonly code = 6008;

  readonly name = "SameClawbackReceiver";

  readonly msg = "New and old Clawback receivers are identical";

  constructor(readonly logs?: string[]) {
    super("6008: New and old Clawback receivers are identical");
  }
}

export class ClawbackReceiverIsTokenVault extends Error {
  static readonly code = 6009;

  readonly code = 6009;

  readonly name = "ClawbackReceiverIsTokenVault";

  readonly msg = "Clawback receiver can not be the Token Vault";

  constructor(readonly logs?: string[]) {
    super("6009: Clawback receiver can not be the Token Vault");
  }
}

export class SameAdmin extends Error {
  static readonly code = 6010;

  readonly code = 6010;

  readonly name = "SameAdmin";

  readonly msg = "New and old admin are identical";

  constructor(readonly logs?: string[]) {
    super("6010: New and old admin are identical");
  }
}

export class ClaimExpired extends Error {
  static readonly code = 6011;

  readonly code = 6011;

  readonly name = "ClaimExpired";

  readonly msg = "Claim window expired";

  constructor(readonly logs?: string[]) {
    super("6011: Claim window expired");
  }
}

export class ArithmeticError extends Error {
  static readonly code = 6012;

  readonly code = 6012;

  readonly name = "ArithmeticError";

  readonly msg = "Arithmetic Error (overflow/underflow)";

  constructor(readonly logs?: string[]) {
    super("6012: Arithmetic Error (overflow/underflow)");
  }
}

export class StartTimestampAfterEnd extends Error {
  static readonly code = 6013;

  readonly code = 6013;

  readonly name = "StartTimestampAfterEnd";

  readonly msg = "Start Timestamp cannot be after end Timestamp";

  constructor(readonly logs?: string[]) {
    super("6013: Start Timestamp cannot be after end Timestamp");
  }
}

export class TimestampsNotInFuture extends Error {
  static readonly code = 6014;

  readonly code = 6014;

  readonly name = "TimestampsNotInFuture";

  readonly msg = "Timestamps cannot be in the past";

  constructor(readonly logs?: string[]) {
    super("6014: Timestamps cannot be in the past");
  }
}

export class InvalidMint extends Error {
  static readonly code = 6015;

  readonly code = 6015;

  readonly name = "InvalidMint";

  readonly msg = "Invalid Mint";

  constructor(readonly logs?: string[]) {
    super("6015: Invalid Mint");
  }
}

export class ClaimIsClosed extends Error {
  static readonly code = 6016;

  readonly code = 6016;

  readonly name = "ClaimIsClosed";

  readonly msg = "Claim is closed";

  constructor(readonly logs?: string[]) {
    super("6016: Claim is closed");
  }
}

export class ClaimsAreNotClosable extends Error {
  static readonly code = 6017;

  readonly code = 6017;

  readonly name = "ClaimsAreNotClosable";

  readonly msg = "Claims are not closable";

  constructor(readonly logs?: string[]) {
    super("6017: Claims are not closable");
  }
}

export class InvalidUnlockPeriod extends Error {
  static readonly code = 6018;

  readonly code = 6018;

  readonly name = "InvalidUnlockPeriod";

  readonly msg = "Invalid unlock period";

  constructor(readonly logs?: string[]) {
    super("6018: Invalid unlock period");
  }
}

export class DurationUpdateNotAllowed extends Error {
  static readonly code = 6019;

  readonly code = 6019;

  readonly name = "DurationUpdateNotAllowed";

  readonly msg = "Duration update is not allowed";

  constructor(readonly logs?: string[]) {
    super("6019: Duration update is not allowed");
  }
}

export class NoVestingAmount extends Error {
  static readonly code = 6020;

  readonly code = 6020;

  readonly name = "NoVestingAmount";

  readonly msg = "Vesting amounts are not set";

  constructor(readonly logs?: string[]) {
    super("6020: Vesting amounts are not set");
  }
}

export class VestingAlreadyFinished extends Error {
  static readonly code = 6021;

  readonly code = 6021;

  readonly name = "VestingAlreadyFinished";

  readonly msg = "Vesting already finished";

  constructor(readonly logs?: string[]) {
    super("6021: Vesting already finished");
  }
}

export class InvalidAmounts extends Error {
  static readonly code = 6022;

  readonly code = 6022;

  readonly name = "InvalidAmounts";

  readonly msg = "Provided amounts are invalid";

  constructor(readonly logs?: string[]) {
    super("6022: Provided amounts are invalid");
  }
}

export class ClaimsLimitReached extends Error {
  static readonly code = 6023;

  readonly code = 6023;

  readonly name = "ClaimsLimitReached";

  readonly msg = "Claims limit has been reached";

  constructor(readonly logs?: string[]) {
    super("6023: Claims limit has been reached");
  }
}

export function fromCode(code: number, logs?: string[]): CustomError | null {
  switch (code) {
    case 6000:
      return new InsufficientUnlockedTokens(logs);
    case 6001:
      return new InvalidProof(logs);
    case 6002:
      return new ExceededMaxClaim(logs);
    case 6003:
      return new MaxNodesExceeded(logs);
    case 6004:
      return new Unauthorized(logs);
    case 6005:
      return new OwnerMismatch(logs);
    case 6006:
      return new ClawbackBeforeStart(logs);
    case 6007:
      return new ClawbackAlreadyClaimed(logs);
    case 6008:
      return new SameClawbackReceiver(logs);
    case 6009:
      return new ClawbackReceiverIsTokenVault(logs);
    case 6010:
      return new SameAdmin(logs);
    case 6011:
      return new ClaimExpired(logs);
    case 6012:
      return new ArithmeticError(logs);
    case 6013:
      return new StartTimestampAfterEnd(logs);
    case 6014:
      return new TimestampsNotInFuture(logs);
    case 6015:
      return new InvalidMint(logs);
    case 6016:
      return new ClaimIsClosed(logs);
    case 6017:
      return new ClaimsAreNotClosable(logs);
    case 6018:
      return new InvalidUnlockPeriod(logs);
    case 6019:
      return new DurationUpdateNotAllowed(logs);
    case 6020:
      return new NoVestingAmount(logs);
    case 6021:
      return new VestingAlreadyFinished(logs);
    case 6022:
      return new InvalidAmounts(logs);
    case 6023:
      return new ClaimsLimitReached(logs);
  }

  return null;
}
