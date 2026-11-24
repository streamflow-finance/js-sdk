import BN from "bn.js";
import { describe, expect, test } from "vitest";

import { buildStreamType, isStrictTokenLockCreate, isTokenLock } from "../../solana/contractUtils.js";
import { StreamType } from "../../solana/types.js";

const baseLockPermissions = {
  canTopup: false,
  automaticWithdrawal: false,
  cancelableBySender: false,
  cancelableByRecipient: false,
  transferableBySender: false,
  transferableByRecipient: false,
};

const baseVestingPermissions = {
  canTopup: true,
  automaticWithdrawal: false,
  cancelableBySender: true,
  cancelableByRecipient: false,
  transferableBySender: false,
  transferableByRecipient: false,
};

describe("isTokenLock", () => {
  test("legitimate time-based lock (cliff close to end) returns true", () => {
    const result = isTokenLock({
      ...baseLockPermissions,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(999_999),
      cliff: 1700000000,
      end: 1700000001,
    });
    expect(result).toBe(true);
  });

  test("exploit lock (cliff far before end) returns false", () => {
    const result = isTokenLock({
      ...baseLockPermissions,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(1_000_000),
      cliff: 1700000000,
      end: 1700000000 + 86400 * 30,
    });
    expect(result).toBe(false);
  });

  test("exploit lock with small gap (2s) returns false", () => {
    const result = isTokenLock({
      ...baseLockPermissions,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(999_999),
      cliff: 1700000000,
      end: 1700000002,
    });
    expect(result).toBe(false);
  });

  test("lock at exact threshold boundary (1s gap) returns true", () => {
    const result = isTokenLock({
      ...baseLockPermissions,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(999_999),
      cliff: 1700000000,
      end: 1700000001,
    });
    expect(result).toBe(true);
  });

  test("lock with zero gap (cliff equals end) returns true", () => {
    const result = isTokenLock({
      ...baseLockPermissions,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(999_999),
      cliff: 1700000000,
      end: 1700000000,
    });
    expect(result).toBe(true);
  });

  test("vesting contract (cliff amount << deposited) returns false", () => {
    const result = isTokenLock({
      ...baseLockPermissions,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(100_000),
      cliff: 1700000000,
      end: 1700086400,
    });
    expect(result).toBe(false);
  });

  test("dynamic lock (isDynamicLock path) returns true regardless of cliff/end gap", () => {
    const result = isTokenLock({
      ...baseLockPermissions,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(100_000),
      cliff: 1700000000,
      end: 1700000000 + 86400 * 365,
      minPrice: 1,
      maxPrice: 1.5,
      minPercentage: 0,
      maxPercentage: 100,
    });
    expect(result).toBe(true);
  });

  test("returns false when any permission is enabled", () => {
    const result = isTokenLock({
      ...baseLockPermissions,
      canTopup: true,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(999_999),
      cliff: 1700000000,
      end: 1700000001,
    });
    expect(result).toBe(false);
  });

  test("backward compat: no cliff/end provided, cliff amount close to deposited returns true", () => {
    const result = isTokenLock({
      ...baseLockPermissions,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(999_999),
    });
    expect(result).toBe(true);
  });

  test("backward compat: no cliff/end provided, cliff amount far from deposited returns false", () => {
    const result = isTokenLock({
      ...baseLockPermissions,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(100_000),
    });
    expect(result).toBe(false);
  });
});

describe("buildStreamType", () => {
  test("legitimate lock returns StreamType.Lock", () => {
    const result = buildStreamType({
      ...baseLockPermissions,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(999_999),
      cliff: 1700000000,
      end: 1700000001,
    });
    expect(result).toBe(StreamType.Lock);
  });

  test("exploit lock returns StreamType.Vesting", () => {
    const result = buildStreamType({
      ...baseLockPermissions,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(1_000_000),
      cliff: 1700000000,
      end: 1700000000 + 86400 * 30,
    });
    expect(result).toBe(StreamType.Vesting);
  });

  test("vesting contract returns StreamType.Vesting", () => {
    const result = buildStreamType({
      ...baseVestingPermissions,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(100_000),
      cliff: 1700000000,
      end: 1700086400,
    });
    expect(result).toBe(StreamType.Vesting);
  });

  test("dynamic lock returns StreamType.Lock", () => {
    const result = buildStreamType({
      ...baseLockPermissions,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(100_000),
      cliff: 1700000000,
      end: 1700000000 + 86400 * 365,
      minPrice: 1,
      maxPrice: 1.5,
      minPercentage: 0,
      maxPercentage: 100,
    });
    expect(result).toBe(StreamType.Lock);
  });

  test("backward compat: no cliff/end, legitimate lock returns StreamType.Lock", () => {
    const result = buildStreamType({
      ...baseLockPermissions,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(999_999),
    });
    expect(result).toBe(StreamType.Lock);
  });
});

describe("isStrictTokenLockCreate", () => {
  const now = 1_700_000_000;
  const lock = {
    ...baseLockPermissions,
    amount: new BN(1_000_000),
    cliffAmount: new BN(1_000_000),
    amountPerPeriod: new BN(1_000_000),
    period: 1,
    start: now + 3600,
    cliff: now + 3600,
  };

  test.each([
    ["a full-cliff lock", {}, true],
    ["a cliff one unit short of the deposit", { cliffAmount: new BN(999_999), amountPerPeriod: new BN(1) }, true],
    ["a cliff two units short of the deposit", { cliffAmount: new BN(999_998), amountPerPeriod: new BN(1) }, false],
    ["a last unit released two seconds after the cliff", { cliffAmount: new BN(999_999), period: 2 }, false],
    ["a vesting schedule", { cliffAmount: new BN(0), amountPerPeriod: new BN(1_000), period: 60 }, false],
    ["a cancelable lock", { cancelableBySender: true }, false],
    ["a lock that can be topped up", { canTopup: true }, false],
    ["a lock with automatic withdrawal", { automaticWithdrawal: true }, false],
    ["a lock transferable by the sender", { transferableBySender: true }, false],
    ["a cliff above the deposit", { cliffAmount: new BN(1_000_001) }, false],
    ["a full-cliff lock starting now (start 0, cliff 0)", { cliff: 0, start: 0 }, true],
    ["start 0 with a future cliff, which the program resets to now", { start: 0, cliff: now + 3600 }, true],
    [
      "start 0 releasing the last unit two seconds later",
      { start: 0, cliff: 0, cliffAmount: new BN(999_999), period: 2 },
      false,
    ],
    ["no cliff with a future start", { cliff: 0 }, false],
  ])("%s", (_name, overrides, expected) => {
    expect(isStrictTokenLockCreate({ ...lock, ...overrides }, now)).toBe(expected);
  });
});
