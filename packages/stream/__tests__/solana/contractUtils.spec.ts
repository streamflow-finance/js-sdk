import BN from "bn.js";
import { describe, expect, test } from "vitest";

import { buildStreamType, isTokenLock } from "../../solana/contractUtils.js";
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

  test("legitimate dynamic-period lock (cliff 60s before end) returns true", () => {
    const result = isTokenLock({
      ...baseLockPermissions,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(999_999),
      cliff: 1700000000,
      end: 1700000060,
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

  test("exploit lock at exact threshold boundary (601s gap) returns false", () => {
    const result = isTokenLock({
      ...baseLockPermissions,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(999_999),
      cliff: 1700000000,
      end: 1700000601,
    });
    expect(result).toBe(false);
  });

  test("lock at exact threshold boundary (600s gap) returns true", () => {
    const result = isTokenLock({
      ...baseLockPermissions,
      depositedAmount: new BN(1_000_000),
      cliffAmount: new BN(999_999),
      cliff: 1700000000,
      end: 1700000600,
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
