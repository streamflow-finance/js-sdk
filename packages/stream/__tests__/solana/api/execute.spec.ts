import { Connection, PublicKey, type VersionedTransaction } from "@solana/web3.js";
import { executeMultipleTransactions, executeTransaction, ICluster } from "@streamflow/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BuiltTransaction, ExecutionEnv } from "../../../solana/api/types.js";

vi.mock("@streamflow/common", async (importActual) => {
  const actual = (await importActual()) as Record<string, unknown>;
  return {
    ...actual,
    executeTransaction: vi.fn(),
    executeMultipleTransactions: vi.fn(),
  };
});

const mockExecuteTransaction = vi.mocked(executeTransaction);
const mockExecuteMultipleTransactions = vi.mocked(executeMultipleTransactions);

const BLOCKHASH = "testblockhash111111111111111111111111111111";
const fakeConnection = new Connection("https://api.mainnet-beta.solana.com");
const PROGRAM_ID = PublicKey.unique();

function makeBuiltTx(blockhash = BLOCKHASH): BuiltTransaction {
  return {
    transaction: {} as VersionedTransaction,
    blockhashWithExpiryBlockHeight: { blockhash, lastValidBlockHeight: 100 },
    context: { slot: 1 },
  };
}

function makeEnv(overrides: Partial<ExecutionEnv> = {}): ExecutionEnv {
  return {
    connection: fakeConnection,
    cluster: ICluster.Mainnet,
    programId: PROGRAM_ID,
    commitment: "confirmed",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("execute()", () => {
  async function imp() {
    const { execute } = await import("../../../solana/api/execute.js");
    return execute;
  }

  it("calls executeTransaction with correct args and returns the signature", async () => {
    const execute = await imp();
    mockExecuteTransaction.mockResolvedValue("sig123");
    const builtTx = makeBuiltTx();
    const env = makeEnv({ sendRate: 2, skipPreflight: true });
    const result = await execute(builtTx, env);
    expect(mockExecuteTransaction).toHaveBeenCalledWith(
      fakeConnection,
      builtTx.transaction,
      { hash: builtTx.blockhashWithExpiryBlockHeight, context: builtTx.context, commitment: "confirmed" },
      { sendRate: 2, sendThrottler: undefined, skipSimulation: true },
    );
    expect(result).toBe("sig123");
  });

  it("passes undefined for optional env fields when omitted", async () => {
    const execute = await imp();
    mockExecuteTransaction.mockResolvedValue("sig456");
    await execute(makeBuiltTx(), makeEnv());
    expect(mockExecuteTransaction).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(), {
      sendRate: undefined,
      sendThrottler: undefined,
      skipSimulation: undefined,
    });
  });
});

describe("executeBatch()", () => {
  async function imp() {
    const { executeBatch } = await import("../../../solana/api/execute.js");
    return executeBatch;
  }

  it("returns { signatures: [], errors: [] } for empty input", async () => {
    const executeBatch = await imp();
    const result = await executeBatch([], makeEnv());
    expect(result).toEqual({ signatures: [], errors: [] });
  });

  it("throws when transactions have mismatched blockhashes", async () => {
    const executeBatch = await imp();
    await expect(executeBatch([makeBuiltTx("hash1"), makeBuiltTx("hash2")], makeEnv())).rejects.toThrow(
      "All transactions in executeBatch must share the same blockhash",
    );
  });

  it("calls executeMultipleTransactions with correct args for matching blockhashes", async () => {
    const executeBatch = await imp();
    mockExecuteMultipleTransactions.mockResolvedValue([{ status: "fulfilled", value: "sig1" }]);
    const tx = makeBuiltTx();
    await executeBatch([tx], makeEnv({ sendRate: 3, skipPreflight: true }));
    expect(mockExecuteMultipleTransactions).toHaveBeenCalledWith(
      fakeConnection,
      [tx.transaction],
      { hash: tx.blockhashWithExpiryBlockHeight, context: tx.context, commitment: "confirmed" },
      { sendRate: 3, sendThrottler: undefined, skipSimulation: true },
    );
  });

  it("collects fulfilled results into signatures", async () => {
    const executeBatch = await imp();
    mockExecuteMultipleTransactions.mockResolvedValue([
      { status: "fulfilled", value: "sig1" },
      { status: "fulfilled", value: "sig2" },
    ]);
    const result = await executeBatch([makeBuiltTx(), makeBuiltTx()], makeEnv());
    expect(result.signatures).toEqual(["sig1", "sig2"]);
    expect(result.errors).toEqual([]);
  });

  it("collects rejected results into errors and wraps non-Error reasons", async () => {
    const executeBatch = await imp();
    const err = new Error("rpc fail");
    mockExecuteMultipleTransactions.mockResolvedValue([
      { status: "rejected", reason: err },
      { status: "rejected", reason: "string reason" },
    ]);
    const result = await executeBatch([makeBuiltTx(), makeBuiltTx()], makeEnv());
    expect(result.signatures).toEqual([]);
    expect(result.errors[0]).toBe(err);
    expect(result.errors[1]).toBeInstanceOf(Error);
    expect(result.errors[1]?.message).toBe("string reason");
  });

  it("handles mixed fulfilled and rejected results", async () => {
    const executeBatch = await imp();
    const err = new Error("oops");
    mockExecuteMultipleTransactions.mockResolvedValue([
      { status: "fulfilled", value: "sig1" },
      { status: "rejected", reason: err },
    ]);
    const result = await executeBatch([makeBuiltTx(), makeBuiltTx()], makeEnv());
    expect(result.signatures).toEqual(["sig1"]);
    expect(result.errors).toEqual([err]);
  });
});

describe("executeBatchSequential()", () => {
  async function imp() {
    const { executeBatchSequential } = await import("../../../solana/api/execute.js");
    return executeBatchSequential;
  }

  it("executes each transaction in sequence and collects all signatures", async () => {
    const executeBatchSequential = await imp();
    mockExecuteTransaction.mockResolvedValueOnce("sig1").mockResolvedValueOnce("sig2");
    const result = await executeBatchSequential([makeBuiltTx(), makeBuiltTx()], makeEnv());
    expect(result.signatures).toEqual(["sig1", "sig2"]);
    expect(result.errors).toEqual([]);
  });

  it("catches errors and continues processing without early abort", async () => {
    const executeBatchSequential = await imp();
    const err = new Error("tx failed");
    mockExecuteTransaction.mockRejectedValueOnce(err).mockResolvedValueOnce("sig2");
    const result = await executeBatchSequential([makeBuiltTx(), makeBuiltTx()], makeEnv());
    expect(result.signatures).toEqual(["sig2"]);
    expect(result.errors).toEqual([err]);
  });

  it("wraps non-Error throws into Error instances", async () => {
    const executeBatchSequential = await imp();
    mockExecuteTransaction.mockRejectedValue("string error");
    const result = await executeBatchSequential([makeBuiltTx()], makeEnv());
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toBeInstanceOf(Error);
    expect(result.errors[0]?.message).toBe("string error");
  });

  it("calls executeTransaction with correct args for each transaction", async () => {
    const executeBatchSequential = await imp();
    mockExecuteTransaction.mockResolvedValue("sig");
    const tx1 = makeBuiltTx("hash1");
    const tx2 = makeBuiltTx("hash2");
    const env = makeEnv({ sendRate: 5 });
    await executeBatchSequential([tx1, tx2], env);
    expect(mockExecuteTransaction).toHaveBeenCalledTimes(2);
    expect(mockExecuteTransaction).toHaveBeenNthCalledWith(
      1,
      fakeConnection,
      tx1.transaction,
      { hash: tx1.blockhashWithExpiryBlockHeight, context: tx1.context, commitment: "confirmed" },
      { sendRate: 5, sendThrottler: undefined, skipSimulation: undefined },
    );
    expect(mockExecuteTransaction).toHaveBeenNthCalledWith(
      2,
      fakeConnection,
      tx2.transaction,
      { hash: tx2.blockhashWithExpiryBlockHeight, context: tx2.context, commitment: "confirmed" },
      { sendRate: 5, sendThrottler: undefined, skipSimulation: undefined },
    );
  });
});
