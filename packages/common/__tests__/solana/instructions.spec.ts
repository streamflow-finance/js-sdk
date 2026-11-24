import BN from "bn.js";
import { describe, expect, test } from "vitest";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, NATIVE_MINT } from "@solana/spl-token";
import { type Connection, Keypair, SystemProgram } from "@solana/web3.js";

import { prepareWrappedAccount } from "../../solana/instructions.js";

const connectionWithAccount = (lamports: number | null) =>
  ({
    getParsedAccountInfo: async () => ({ value: lamports === null ? null : { lamports } }),
  }) as unknown as Connection;

describe("prepareWrappedAccount", () => {
  const sender = Keypair.generate().publicKey;
  const wrappedAccount = getAssociatedTokenAddressSync(NATIVE_MINT, sender, true);

  test("creates a missing WSOL account idempotently, so an earlier create of it cannot fail the transaction", async () => {
    const [create, transfer, sync] = await prepareWrappedAccount(connectionWithAccount(null), sender, new BN(1_000));

    expect(create?.programId).toEqual(ASSOCIATED_TOKEN_PROGRAM_ID);
    expect(Array.from(create?.data ?? [])).toEqual([1]);
    expect(create?.keys[1]?.pubkey).toEqual(wrappedAccount);
    expect(transfer?.programId).toEqual(SystemProgram.programId);
    expect(sync?.keys[0]?.pubkey).toEqual(wrappedAccount);
  });

  test("only funds and syncs an existing WSOL account", async () => {
    const ixs = await prepareWrappedAccount(connectionWithAccount(2_039_280), sender, new BN(1_000));

    expect(ixs.map((ix) => ix.programId)).not.toContainEqual(ASSOCIATED_TOKEN_PROGRAM_ID);
    expect(ixs).toHaveLength(2);
  });
});
