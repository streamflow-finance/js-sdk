import BN from "bn.js";
import { afterEach, describe, expect, test, vi } from "vitest";

import {
  divCeilN,
  getBN,
  getNumberFromBN,
  handleContractError,
  multiplyBigIntByNumber,
  sleep,
} from "../../lib/utils.js";

describe("getBN", () => {
  test("whole tokens with zero decimals", () => {
    expect(getBN(10, 0).toString()).toBe("10");
  });

  test("fractional value respects decimals", () => {
    const bn = getBN(1.5, 9);
    expect(bn.toString()).toBe("1500000000");
  });

  test("zero amount", () => {
    expect(getBN(0, 6).toString()).toBe("0");
  });
});

describe("getNumberFromBN", () => {
  test("round-trip with moderate value", () => {
    const decimals = 9;
    const n = 123.456789;
    const bn = getBN(n, decimals);
    expect(getNumberFromBN(bn, decimals)).toBeCloseTo(n, 6);
  });

  test("uses division path when BN exceeds max safe integer but quotient fits in float", () => {
    const decimals = 9;
    // smallest-units value is huge, but value / 10^decimals is within MAX_SAFE_INTEGER
    const smallestUnits = new BN("9007199254740990000000000");
    const result = getNumberFromBN(smallestUnits, decimals);
    expect(result).toBe(9007199254740990);
  });
});

describe("divCeilN", () => {
  test("divides with ceiling when remainder exists", () => {
    expect(divCeilN(7n, 3n)).toBe(3n);
  });

  test("exact division has no extra increment", () => {
    expect(divCeilN(6n, 3n)).toBe(2n);
  });

  test("zero numerator", () => {
    expect(divCeilN(0n, 5n)).toBe(0n);
  });
});

describe("multiplyBigIntByNumber", () => {
  test("multiplies by fractional number using fixed-point scale", () => {
    expect(multiplyBigIntByNumber(100n, 1.5)).toBe(150n);
  });

  test("returns zero for non-finite multiplier", () => {
    expect(multiplyBigIntByNumber(100n, Number.NaN)).toBe(0n);
    expect(multiplyBigIntByNumber(100n, Infinity)).toBe(0n);
  });

  test("returns zero when multiplier is zero", () => {
    expect(multiplyBigIntByNumber(100n, 0)).toBe(0n);
  });

  test("applies sign from negative bigint and positive number", () => {
    expect(multiplyBigIntByNumber(-10n, 2)).toBe(-20n);
  });

  test("applies sign from positive bigint and negative number", () => {
    expect(multiplyBigIntByNumber(10n, -2)).toBe(-20n);
  });
});

describe("sleep", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("resolves after the given delay", async () => {
    vi.useFakeTimers();
    const p = sleep(1000);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(p).resolves.toBeUndefined();
  });
});

describe("handleContractError", () => {
  test("returns result when inner function succeeds", async () => {
    const result = await handleContractError(async () => 42);
    expect(result).toBe(42);
  });

  test("wraps Error in ContractError", async () => {
    await expect(
      handleContractError(async () => {
        throw new Error("chain failed");
      }),
    ).rejects.toMatchObject({ contractErrorCode: null, name: "ContractError" });
  });

  test("passes extracted code from callback", async () => {
    await expect(
      handleContractError(
        async () => {
          throw new Error("simulated");
        },
        () => "E_CUSTOM",
      ),
    ).rejects.toMatchObject({ contractErrorCode: "E_CUSTOM", name: "ContractError" });
  });

  test("rethrows non-Error values unchanged", async () => {
    await expect(
      handleContractError(async () => {
        throw "string-throw";
      }),
    ).rejects.toBe("string-throw");
  });
});
