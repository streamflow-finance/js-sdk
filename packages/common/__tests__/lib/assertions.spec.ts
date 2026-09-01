import { PublicKey } from "@solana/web3.js";
import { describe, expect, test } from "vitest";

import { assertHasPublicKey, invariant } from "../../lib/assertions.js";

describe("invariant", () => {
  test("does nothing when condition is truthy", () => {
    expect(() => invariant(true)).not.toThrow();
    expect(() => invariant(1)).not.toThrow();
  });

  test("throws with default message when condition is falsy", () => {
    expect(() => invariant(false)).toThrow("Assertion failed");
  });

  test("includes string message when provided", () => {
    expect(() => invariant(false, "missing field")).toThrow("Assertion failed: missing field");
  });

  test("supports lazy message function", () => {
    expect(() =>
      invariant(false, () => {
        return "lazy detail";
      }),
    ).toThrow("Assertion failed: lazy detail");
  });
});

describe("assertHasPublicKey", () => {
  const key = new PublicKey("So11111111111111111111111111111111111111112");

  test("narrows type when publicKey is present", () => {
    const wallet = { publicKey: key };
    assertHasPublicKey(wallet);
    expect(wallet.publicKey.equals(key)).toBe(true);
  });

  test("throws when publicKey is missing", () => {
    expect(() => assertHasPublicKey({})).toThrow(/publicKey is missing/);
  });

  test("throws when publicKey is null", () => {
    expect(() => assertHasPublicKey({ publicKey: null })).toThrow(/publicKey is missing/);
  });
});
