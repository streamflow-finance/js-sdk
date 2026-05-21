import { Connection, PublicKey, type TransactionInstruction, type VersionedTransaction } from "@solana/web3.js";
import {
  type ComputeLimitEstimate,
  type ComputePriceEstimate,
  ICluster,
  prepareBaseInstructions,
  prepareTransaction,
} from "@streamflow/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@streamflow/common", async (importActual) => {
  const actual = (await importActual()) as Record<string, unknown>;
  return {
    ...actual,
    prepareBaseInstructions: vi.fn(),
    prepareTransaction: vi.fn(),
  };
});

const mockPrepareBaseInstructions = vi.mocked(prepareBaseInstructions);
const mockPrepareTransaction = vi.mocked(prepareTransaction);

const fakeConnection = new Connection("https://api.mainnet-beta.solana.com");
const PROGRAM_ID = PublicKey.unique();

function makeEnv() {
  return {
    connection: fakeConnection,
    cluster: ICluster.Mainnet,
    programId: PROGRAM_ID,
    commitment: "confirmed" as const,
  };
}

function makeMockPrepareResult() {
  return {
    tx: {} as VersionedTransaction,
    hash: { blockhash: "abc123", lastValidBlockHeight: 100 },
    context: { slot: 1 },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrepareBaseInstructions.mockReturnValue([]);
  mockPrepareTransaction.mockResolvedValue(makeMockPrepareResult());
});

describe("buildTransaction()", () => {
  async function imp() {
    const { buildTransaction } = await import("../../../solana/api/build-transaction.js");
    return buildTransaction;
  }

  it("passes numeric computePrice through to prepareBaseInstructions", async () => {
    const buildTransaction = await imp();
    await buildTransaction([], { computePrice: 5000 }, makeEnv());
    expect(mockPrepareBaseInstructions).toHaveBeenCalledWith(
      fakeConnection,
      expect.objectContaining({ computePrice: 5000 }),
    );
  });

  it("filters out function computePrice (passes undefined)", async () => {
    const buildTransaction = await imp();
    const computePriceFn: ComputePriceEstimate = async () => 5000;
    await buildTransaction([], { computePrice: computePriceFn }, makeEnv());
    expect(mockPrepareBaseInstructions).toHaveBeenCalledWith(
      fakeConnection,
      expect.objectContaining({ computePrice: undefined }),
    );
  });

  it("passes numeric computeLimit through to prepareBaseInstructions", async () => {
    const buildTransaction = await imp();
    await buildTransaction([], { computeLimit: 200_000 }, makeEnv());
    expect(mockPrepareBaseInstructions).toHaveBeenCalledWith(
      fakeConnection,
      expect.objectContaining({ computeLimit: 200_000 }),
    );
  });

  it("filters out autoSimulate string computeLimit (passes undefined)", async () => {
    const buildTransaction = await imp();
    await buildTransaction([], { computeLimit: "autoSimulate" }, makeEnv());
    expect(mockPrepareBaseInstructions).toHaveBeenCalledWith(
      fakeConnection,
      expect.objectContaining({ computeLimit: undefined }),
    );
  });

  it("filters out function computeLimit (passes undefined)", async () => {
    const buildTransaction = await imp();
    const computeLimitFn: ComputeLimitEstimate = async () => 200_000;
    await buildTransaction([], { computeLimit: computeLimitFn }, makeEnv());
    expect(mockPrepareBaseInstructions).toHaveBeenCalledWith(
      fakeConnection,
      expect.objectContaining({ computeLimit: undefined }),
    );
  });

  it("prepends compute budget instructions before user instructions", async () => {
    const buildTransaction = await imp();
    const budgetIx = {
      programId: PublicKey.unique(),
      keys: [],
      data: Buffer.alloc(0),
    } as unknown as TransactionInstruction;
    const userIx = {
      programId: PublicKey.unique(),
      keys: [],
      data: Buffer.alloc(0),
    } as unknown as TransactionInstruction;
    mockPrepareBaseInstructions.mockReturnValue([budgetIx]);
    await buildTransaction([userIx], {}, makeEnv());
    expect(mockPrepareTransaction).toHaveBeenCalledWith(fakeConnection, [budgetIx, userIx], undefined, "confirmed");
  });

  it("returns { transaction, blockhashWithExpiryBlockHeight, context } from prepareTransaction", async () => {
    const buildTransaction = await imp();
    const mockResult = makeMockPrepareResult();
    mockPrepareTransaction.mockResolvedValue(mockResult);
    const result = await buildTransaction([], {}, makeEnv());
    expect(result).toEqual({
      transaction: mockResult.tx,
      blockhashWithExpiryBlockHeight: mockResult.hash,
      context: mockResult.context,
    });
  });

  it("passes feePayer and commitment through to prepareTransaction", async () => {
    const buildTransaction = await imp();
    const feePayer = PublicKey.unique();
    await buildTransaction([], { feePayer }, makeEnv());
    expect(mockPrepareTransaction).toHaveBeenCalledWith(fakeConnection, expect.any(Array), feePayer, "confirmed");
  });
});
