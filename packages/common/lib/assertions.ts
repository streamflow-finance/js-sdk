import type { PublicKey } from "@solana/web3.js";

const prefix = "Assertion failed";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const invariant: (condition: any, message?: string | (() => string)) => asserts condition = (
  condition,
  message,
) => {
  if (condition) {
    return;
  }
  const provided: string | undefined = typeof message === "function" ? message() : message;
  const value: string = provided ? `${prefix}: ${provided}` : prefix;
  throw new Error(value);
};

export function assertHasPublicKey<T extends { publicKey?: PublicKey | null }>(
  value: T,
  message?: string | (() => string),
): asserts value is T & { publicKey: PublicKey } {
  invariant(value.publicKey, message ?? "publicKey is missing");
}

