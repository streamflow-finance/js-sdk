import BN from "bn.js";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SolanaStreamClient } from "../../../solana/StreamClient.js";

const mockCreate = vi.fn();
vi.mock("../../../solana/api/create.js", () => ({
  create: (...args: unknown[]) => mockCreate(...args),
}));

const mockCreateBatch = vi.fn();
vi.mock("../../../solana/api/create-batch.js", () => ({
  createBatch: (...args: unknown[]) => mockCreateBatch(...args),
}));

const mockBuildCreate = vi.fn();
vi.mock("../../../solana/api/types.js", () => ({
  createClientFromEnv: () => ({ buildCreateTransactionInstructions: mockBuildCreate }),
}));

vi.mock("../../../solana/StreamClient.js", () => ({
  SolanaStreamClient: vi.fn(),
}));

function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    client: {
      buildCreateTransactionInstructions: mockBuildCreate,
    } as unknown as SolanaStreamClient,
    programId: PublicKey.unique(),
    rpcUrl: "https://api.mainnet-beta.solana.com",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveDuration()", () => {
  async function importResolveDuration() {
    const { resolveDuration } = await import("../../../solana/api/create-vesting.js");
    return resolveDuration;
  }

  it("returns endDate - start when endDate provided", async () => {
    const resolveDuration = await importResolveDuration();
    const result = resolveDuration({ start: 1000, endDate: 2200 });
    expect(result).toBe(1200);
  });

  it("returns duration when duration provided", async () => {
    const resolveDuration = await importResolveDuration();
    const result = resolveDuration({ start: 1000, duration: 500 });
    expect(result).toBe(500);
  });

  it("throws when both endDate and duration provided", async () => {
    const resolveDuration = await importResolveDuration();
    expect(() => resolveDuration({ start: 1000, endDate: 2000, duration: 500 })).toThrow(
      "Provide either endDate or duration, not both",
    );
  });

  it("throws when neither endDate nor duration provided", async () => {
    const resolveDuration = await importResolveDuration();
    expect(() => resolveDuration({ start: 1000 })).toThrow("Must provide either endDate or duration");
  });

  it("throws when endDate < start (negative duration)", async () => {
    const resolveDuration = await importResolveDuration();
    expect(() => resolveDuration({ start: 2000, endDate: 1000 })).toThrow("Duration must be positive");
  });
});

describe("computeAmountPerPeriod()", () => {
  async function importComputeAmountPerPeriod() {
    const { computeAmountPerPeriod } = await import("../../../solana/api/create-vesting.js");
    return computeAmountPerPeriod;
  }

  it("computes correct amount per period with divCeil", async () => {
    const computeAmountPerPeriod = await importComputeAmountPerPeriod();
    // remaining=900000000000, numPeriods=14, divCeil=floor((900000000000+13)/14)=64285714286
    const result = computeAmountPerPeriod(new BN(1_000_000_000_000), new BN(100_000_000_000), 1209600, 86400);
    expect(result.eq(new BN(64285714286))).toBe(true);
  });

  it("computes ceiling rounding correctly", async () => {
    const computeAmountPerPeriod = await importComputeAmountPerPeriod();
    // remaining=901, numPeriods=10, divCeil=floor((901+9)/10)=91
    const result = computeAmountPerPeriod(new BN(901), new BN(0), 10, 1);
    expect(result.eq(new BN(91))).toBe(true);
  });

  it("throws when cliffAmount equals amount", async () => {
    const computeAmountPerPeriod = await importComputeAmountPerPeriod();
    expect(() => computeAmountPerPeriod(new BN(1000), new BN(1000), 1209600, 86400)).toThrow(
      "cliffAmount must be less than total amount",
    );
  });

  it("throws when cliffAmount exceeds amount", async () => {
    const computeAmountPerPeriod = await importComputeAmountPerPeriod();
    expect(() => computeAmountPerPeriod(new BN(500), new BN(1000), 1209600, 86400)).toThrow(
      "cliffAmount must be less than total amount",
    );
  });

  it("throws when duration < period", async () => {
    const computeAmountPerPeriod = await importComputeAmountPerPeriod();
    expect(() => computeAmountPerPeriod(new BN(1000), new BN(0), 3600, 86400)).toThrow(
      "Duration must be at least equal to period",
    );
  });
});

describe("buildVestingParams()", () => {
  async function importBuildVestingParams() {
    const { buildVestingParams } = await import("../../../solana/api/create-vesting.js");
    return buildVestingParams;
  }

  const baseVestingParams = () => ({
    recipient: Keypair.generate().publicKey.toBase58(),
    tokenId: Keypair.generate().publicKey.toBase58(),
    amount: new BN(1_000_000_000_000),
    start: 1700000000,
    period: 86400,
    name: "Test Vesting",
    duration: 1209600, // 14 days
  });

  it("sets all vesting defaults correctly", async () => {
    const buildVestingParams = await importBuildVestingParams();
    const result = buildVestingParams(baseVestingParams());

    expect(result.canTopup).toBe(false);
    expect(result.cancelableByRecipient).toBe(false);
    expect(result.cancelableBySender).toBe(false);
    expect(result.transferableBySender).toBe(false);
    expect(result.transferableByRecipient).toBe(false);
    expect(result.automaticWithdrawal).toBe(false);
    expect(result.withdrawalFrequency).toBe(0);
  });

  it("sets cliff equal to start (no cliff wait)", async () => {
    const buildVestingParams = await importBuildVestingParams();
    const result = buildVestingParams(baseVestingParams());

    expect(result.cliff).toBe(1700000000);
    expect(result.start).toBe(1700000000);
  });

  it("defaults cliffAmount to BN(0) when not provided", async () => {
    const buildVestingParams = await importBuildVestingParams();
    const result = buildVestingParams(baseVestingParams());

    expect(result.cliffAmount.eq(new BN(0))).toBe(true);
  });

  it("auto-computes amountPerPeriod when not provided", async () => {
    const buildVestingParams = await importBuildVestingParams();
    const params = baseVestingParams();
    const result = buildVestingParams(params);

    // computeAmountPerPeriod(1_000_000_000_000, 0, 1209600, 86400)
    // numPeriods=14, divCeil=floor((1000000000000+13)/14)=71428571429
    const expected = new BN(1_000_000_000_000).addn(13).divn(14);
    expect(result.amountPerPeriod.eq(expected)).toBe(true);
  });

  it("uses explicit amountPerPeriod override when provided", async () => {
    const buildVestingParams = await importBuildVestingParams();
    const explicit = new BN(50_000_000_000);
    const result = buildVestingParams({ ...baseVestingParams(), amountPerPeriod: explicit });

    expect(result.amountPerPeriod.eq(explicit)).toBe(true);
  });

  it("omits partner and tokenProgramId when not provided", async () => {
    const buildVestingParams = await importBuildVestingParams();
    const result = buildVestingParams(baseVestingParams());

    expect("partner" in result).toBe(false);
    expect("tokenProgramId" in result).toBe(false);
  });

  it("includes optional partner when provided", async () => {
    const buildVestingParams = await importBuildVestingParams();
    const partner = Keypair.generate().publicKey.toBase58();
    const result = buildVestingParams({ ...baseVestingParams(), partner });

    expect(result.partner).toBe(partner);
  });

  it("includes optional tokenProgramId when provided", async () => {
    const buildVestingParams = await importBuildVestingParams();
    const tokenProgramId = PublicKey.unique().toBase58();
    const result = buildVestingParams({ ...baseVestingParams(), tokenProgramId });

    expect(result.tokenProgramId).toBe(tokenProgramId);
  });

  it("propagates transferableByRecipient when set to true", async () => {
    const buildVestingParams = await importBuildVestingParams();
    const result = buildVestingParams({ ...baseVestingParams(), transferableByRecipient: true });

    expect(result.transferableByRecipient).toBe(true);
  });

  it("resolves endDate into duration", async () => {
    const buildVestingParams = await importBuildVestingParams();
    const { duration, ...noDuration } = baseVestingParams();
    const result = buildVestingParams({ ...noDuration, endDate: 1700000000 + 1209600 });

    // Should compute same amountPerPeriod as with duration=1209600
    const expected = new BN(1_000_000_000_000).addn(13).divn(14);
    expect(result.amountPerPeriod.eq(expected)).toBe(true);
  });
});

describe("buildVestingParams() — stream type classification", () => {
  async function importBuildVestingParams() {
    const { buildVestingParams } = await import("../../../solana/api/create-vesting.js");
    return buildVestingParams;
  }

  const baseVestingParams = () => ({
    recipient: Keypair.generate().publicKey.toBase58(),
    tokenId: Keypair.generate().publicKey.toBase58(),
    amount: new BN(1_000_000_000_000),
    start: 1700000000,
    period: 86400,
    name: "Test Vesting",
    duration: 1209600,
  });

  it("classifies as Vesting when cliffAmount is 0", async () => {
    const buildVestingParams = await importBuildVestingParams();
    const { buildStreamType } = await import("../../../solana/contractUtils.js");
    const { StreamType } = await import("../../../solana/types.js");

    const result = buildVestingParams(baseVestingParams());
    const streamType = buildStreamType({ ...result, depositedAmount: result.amount, automaticWithdrawal: false });

    expect(streamType).toBe(StreamType.Vesting);
  });

  it("classifies as Vesting with cliffAmount = 50% of amount", async () => {
    const buildVestingParams = await importBuildVestingParams();
    const { buildStreamType } = await import("../../../solana/contractUtils.js");
    const { StreamType } = await import("../../../solana/types.js");

    const cliffAmount = new BN(500_000_000_000);
    const result = buildVestingParams({ ...baseVestingParams(), cliffAmount });
    const streamType = buildStreamType({ ...result, depositedAmount: result.amount, automaticWithdrawal: false });

    expect(streamType).toBe(StreamType.Vesting);
  });

  it("classifies as Lock when cliffAmount equals amount - 1 (lock-like vesting is indistinguishable from a lock)", async () => {
    const buildVestingParams = await importBuildVestingParams();
    const { buildStreamType } = await import("../../../solana/contractUtils.js");
    const { StreamType } = await import("../../../solana/types.js");

    const amount = new BN(1_000_000_000_000);
    const cliffAmount = amount.subn(1);
    const result = buildVestingParams({ ...baseVestingParams(), amount, cliffAmount });
    const streamType = buildStreamType({ ...result, depositedAmount: result.amount, automaticWithdrawal: false });

    expect(streamType).toBe(StreamType.Lock);
  });
});

describe("buildVestingParams() — automaticWithdrawal + withdrawalFrequency", () => {
  async function importBuildVestingParams() {
    const { buildVestingParams } = await import("../../../solana/api/create-vesting.js");
    return buildVestingParams;
  }

  const baseVestingParams = () => ({
    recipient: Keypair.generate().publicKey.toBase58(),
    tokenId: Keypair.generate().publicKey.toBase58(),
    amount: new BN(1_000_000_000_000),
    start: 1700000000,
    period: 86400,
    name: "Test Vesting",
    duration: 1209600,
  });

  it("sets withdrawalFrequency to period when automaticWithdrawal=true and no explicit frequency", async () => {
    const buildVestingParams = await importBuildVestingParams();
    const result = buildVestingParams({ ...baseVestingParams(), automaticWithdrawal: true });

    expect(result.automaticWithdrawal).toBe(true);
    expect(result.withdrawalFrequency).toBe(86400);
  });

  it("sets withdrawalFrequency to 0 when automaticWithdrawal=false and no explicit frequency", async () => {
    const buildVestingParams = await importBuildVestingParams();
    const result = buildVestingParams({ ...baseVestingParams(), automaticWithdrawal: false });

    expect(result.automaticWithdrawal).toBe(false);
    expect(result.withdrawalFrequency).toBe(0);
  });

  it("uses explicit withdrawalFrequency when provided with automaticWithdrawal=true", async () => {
    const buildVestingParams = await importBuildVestingParams();
    const result = buildVestingParams({
      ...baseVestingParams(),
      automaticWithdrawal: true,
      withdrawalFrequency: 3600,
    });

    expect(result.automaticWithdrawal).toBe(true);
    expect(result.withdrawalFrequency).toBe(3600);
  });
});

describe("createVesting() — no initial allocation", () => {
  async function importCreateVesting() {
    const { createVesting } = await import("../../../solana/api/create-vesting.js");
    return createVesting;
  }

  it("delegates to create() with built vesting params", async () => {
    const createVesting = await importCreateVesting();

    mockCreate.mockResolvedValue({
      instructions: [],
      signers: undefined,
      metadata: undefined,
      metadataPubKey: PublicKey.unique(),
    });

    const params = {
      recipient: Keypair.generate().publicKey.toBase58(),
      tokenId: Keypair.generate().publicKey.toBase58(),
      amount: new BN(1_000_000_000_000),
      start: 1700000000,
      period: 86400,
      name: "Test Vesting",
      duration: 1209600,
    };
    const invoker = { publicKey: Keypair.generate().publicKey };
    const env = makeEnv();

    await createVesting(params, invoker, env);

    expect(mockCreate).toHaveBeenCalledOnce();
    const [actualParams, actualInvoker, actualEnv] = mockCreate.mock.calls[0];

    expect(actualParams.period).toBe(86400);
    expect(actualParams.cliffAmount.eq(new BN(0))).toBe(true);
    expect(actualParams.canTopup).toBe(false);
    expect(actualParams.cancelableByRecipient).toBe(false);
    expect(actualParams.cancelableBySender).toBe(false);
    expect(actualParams.automaticWithdrawal).toBe(false);
    expect(actualParams.recipient).toBe(params.recipient);
    expect(actualParams.amount.eq(params.amount)).toBe(true);
    expect(actualInvoker).toBe(invoker);
    expect(actualEnv).toBe(env);
  });
});

describe("createVesting() — with initial allocation", () => {
  async function importCreateVesting() {
    const { createVesting } = await import("../../../solana/api/create-vesting.js");
    return createVesting;
  }

  const mockIx1 = new TransactionInstruction({
    keys: [],
    programId: PublicKey.unique(),
    data: Buffer.from([1]),
  });

  const mockIx2 = new TransactionInstruction({
    keys: [],
    programId: PublicKey.unique(),
    data: Buffer.from([2]),
  });

  it("calls buildCreateTransactionInstructions twice and returns BatchInstructionResult", async () => {
    const createVesting = await importCreateVesting();

    const mainMetadata = Keypair.generate();
    const allocMetadata = Keypair.generate();

    mockBuildCreate
      .mockResolvedValueOnce({
        ixs: [mockIx1, mockIx2],
        metadataId: mainMetadata.publicKey.toBase58(),
        metadata: mainMetadata,
      })
      .mockResolvedValueOnce({
        ixs: [mockIx1],
        metadataId: allocMetadata.publicKey.toBase58(),
        metadata: allocMetadata,
      });

    const params = {
      recipient: Keypair.generate().publicKey.toBase58(),
      tokenId: Keypair.generate().publicKey.toBase58(),
      amount: new BN(1_000_000_000_000),
      start: 1700000000,
      period: 86400,
      name: "Test Vesting",
      duration: 1209600,
      cancelableBySender: true,
      initialAllocation: { amount: new BN(100_000_000) },
    };
    const invoker = { publicKey: Keypair.generate().publicKey };
    const env = makeEnv();

    const result = await createVesting(params, invoker, env);

    expect(mockBuildCreate).toHaveBeenCalledTimes(2);
    expect(result.creationBatches).toHaveLength(2);

    // Verify the main stream call
    const mainCall = mockBuildCreate.mock.calls[0];
    expect(mainCall[0].recipient).toBe(params.recipient);
    expect(mainCall[0].amount.eq(params.amount)).toBe(true);

    // Verify the allocation stream call
    const allocCall = mockBuildCreate.mock.calls[1];
    const allocData = allocCall[0];
    expect(allocData.period).toBe(1);
    expect(allocData.amountPerPeriod.eq(new BN(2))).toBe(true);
    expect(allocData.cliffAmount.eq(new BN(100_000_000).subn(2))).toBe(true);
    expect(allocData.cancelableBySender).toBe(true);
    expect(allocData.cancelableByRecipient).toBe(false);
    expect(allocData.automaticWithdrawal).toBe(false);
    expect(allocData.recipient).toBe(params.recipient);

    expect(result.setupInstructions).toHaveLength(1);
    expect(result.setupInstructions[0]).toBe(mockIx1);
    expect(result.creationBatches[0].recipient).toBe(params.recipient);
    expect(result.creationBatches[1].recipient).toBe(params.recipient);
  });

  it("throws when initialAllocation amount is zero", async () => {
    const createVesting = await importCreateVesting();

    const params = {
      recipient: Keypair.generate().publicKey.toBase58(),
      tokenId: Keypair.generate().publicKey.toBase58(),
      amount: new BN(1_000_000_000_000),
      start: 1700000000,
      period: 86400,
      name: "Test Vesting",
      duration: 1209600,
      initialAllocation: { amount: new BN(0) },
    };
    const invoker = { publicKey: Keypair.generate().publicKey };
    const env = makeEnv();

    await expect(createVesting(params, invoker, env)).rejects.toThrow(
      "Initial allocation amount must be greater than zero",
    );
  });
});

describe("createVestingBatch()", () => {
  async function importCreateVestingBatch() {
    const { createVestingBatch } = await import("../../../solana/api/create-vesting-batch.js");
    return createVestingBatch;
  }

  it("delegates to createBatch() with built batch params", async () => {
    const createVestingBatch = await importCreateVestingBatch();

    mockCreateBatch.mockResolvedValue({
      setupInstructions: [],
      creationBatches: [],
    });

    const recipientA = Keypair.generate().publicKey.toBase58();
    const recipientB = Keypair.generate().publicKey.toBase58();
    const params = {
      recipients: [
        { recipient: recipientA, amount: new BN(1_000_000_000_000), name: "Vest A" },
        { recipient: recipientB, amount: new BN(500_000_000_000), name: "Vest B" },
      ],
      tokenId: Keypair.generate().publicKey.toBase58(),
      start: 1700000000,
      period: 86400,
      duration: 1209600,
    };
    const invoker = { publicKey: Keypair.generate().publicKey };
    const env = makeEnv();

    await createVestingBatch(params, invoker, env);

    expect(mockCreateBatch).toHaveBeenCalledOnce();
    const [actualParams, actualInvoker, actualEnv] = mockCreateBatch.mock.calls[0];

    expect(actualParams.recipients).toHaveLength(2);
    expect(actualParams.period).toBe(86400);
    expect(actualParams.canTopup).toBe(false);
    expect(actualParams.cancelableBySender).toBe(false);
    expect(actualParams.cancelableByRecipient).toBe(false);
    expect(actualParams.transferableBySender).toBe(false);
    expect(actualParams.transferableByRecipient).toBe(false);
    expect(actualParams.automaticWithdrawal).toBe(false);
    expect(actualInvoker).toBe(invoker);
    expect(actualEnv).toBe(env);
  });

  it("computes per-recipient amountPerPeriod independently for different amounts", async () => {
    const createVestingBatch = await importCreateVestingBatch();

    mockCreateBatch.mockResolvedValue({
      setupInstructions: [],
      creationBatches: [],
    });

    const amountA = new BN(1_000_000_000_000);
    const amountB = new BN(500_000_000_000);

    const params = {
      recipients: [
        { recipient: Keypair.generate().publicKey.toBase58(), amount: amountA, name: "Vest A" },
        { recipient: Keypair.generate().publicKey.toBase58(), amount: amountB, name: "Vest B" },
      ],
      tokenId: Keypair.generate().publicKey.toBase58(),
      start: 1700000000,
      period: 86400,
      duration: 1209600,
    };
    const invoker = { publicKey: Keypair.generate().publicKey };
    const env = makeEnv();

    await createVestingBatch(params, invoker, env);

    const [actualParams] = mockCreateBatch.mock.calls[0];
    // Both have cliffAmount=0, so amountPerPeriod = divCeil(amount, 14)
    const expectedA = amountA.addn(13).divn(14);
    const expectedB = amountB.addn(13).divn(14);
    expect(actualParams.recipients[0].amountPerPeriod.eq(expectedA)).toBe(true);
    expect(actualParams.recipients[1].amountPerPeriod.eq(expectedB)).toBe(true);
    expect(actualParams.recipients[0].cliffAmount.eq(new BN(0))).toBe(true);
    expect(actualParams.recipients[1].cliffAmount.eq(new BN(0))).toBe(true);
  });

  it("throws for empty recipients array", async () => {
    const createVestingBatch = await importCreateVestingBatch();

    const params = {
      recipients: [],
      tokenId: Keypair.generate().publicKey.toBase58(),
      start: 1700000000,
      period: 86400,
      duration: 1209600,
    };

    await expect(createVestingBatch(params, { publicKey: Keypair.generate().publicKey }, makeEnv())).rejects.toThrow(
      "At least one recipient required",
    );
  });

  it("throws when a recipient has zero amount", async () => {
    const createVestingBatch = await importCreateVestingBatch();

    const params = {
      recipients: [
        { recipient: Keypair.generate().publicKey.toBase58(), amount: new BN(5000), name: "Vest A" },
        { recipient: Keypair.generate().publicKey.toBase58(), amount: new BN(0), name: "Vest B" },
      ],
      tokenId: Keypair.generate().publicKey.toBase58(),
      start: 1700000000,
      period: 86400,
      duration: 1209600,
    };

    await expect(createVestingBatch(params, { publicKey: Keypair.generate().publicKey }, makeEnv())).rejects.toThrow(
      "Amount must be greater than zero",
    );
  });
});

describe("buildVestingBatchParams()", () => {
  async function importBuildVestingBatchParams() {
    const { buildVestingBatchParams } = await import("../../../solana/api/create-vesting-batch.js");
    return buildVestingBatchParams;
  }

  it("computes per-recipient amountPerPeriod independently", async () => {
    const buildVestingBatchParams = await importBuildVestingBatchParams();

    const amountA = new BN(1_000_000_000_000);
    const amountB = new BN(500_000_000_000);
    const cliffA = new BN(100_000_000_000);
    const cliffB = new BN(0);

    const params = {
      recipients: [
        {
          recipient: Keypair.generate().publicKey.toBase58(),
          amount: amountA,
          cliffAmount: cliffA,
          name: "Vest A",
        },
        {
          recipient: Keypair.generate().publicKey.toBase58(),
          amount: amountB,
          cliffAmount: cliffB,
          name: "Vest B",
        },
      ],
      tokenId: Keypair.generate().publicKey.toBase58(),
      start: 1700000000,
      period: 86400,
      duration: 1209600,
    };

    const result = buildVestingBatchParams(params);

    expect(result.recipients).toHaveLength(2);

    // A: remaining=900000000000, numPeriods=14, divCeil=floor((900000000000+13)/14)=64285714286
    const expectedA = amountA.sub(cliffA).addn(13).divn(14);
    expect(result.recipients[0].amountPerPeriod.eq(expectedA)).toBe(true);
    expect(result.recipients[0].cliffAmount.eq(cliffA)).toBe(true);

    // B: remaining=500000000000, numPeriods=14, divCeil=floor((500000000000+13)/14)=35714285715
    const expectedB = amountB.sub(cliffB).addn(13).divn(14);
    expect(result.recipients[1].amountPerPeriod.eq(expectedB)).toBe(true);
    expect(result.recipients[1].cliffAmount.eq(cliffB)).toBe(true);

    expect(result.period).toBe(86400);
    expect(result.canTopup).toBe(false);
    expect(result.cancelableByRecipient).toBe(false);
  });

  it("uses explicit amountPerPeriod override on one recipient", async () => {
    const buildVestingBatchParams = await importBuildVestingBatchParams();

    const explicitPeriod = new BN(50_000_000_000);

    const params = {
      recipients: [
        {
          recipient: Keypair.generate().publicKey.toBase58(),
          amount: new BN(1_000_000_000_000),
          name: "Vest A",
        },
        {
          recipient: Keypair.generate().publicKey.toBase58(),
          amount: new BN(500_000_000_000),
          amountPerPeriod: explicitPeriod,
          name: "Vest B",
        },
      ],
      tokenId: Keypair.generate().publicKey.toBase58(),
      start: 1700000000,
      period: 86400,
      duration: 1209600,
    };

    const result = buildVestingBatchParams(params);

    // First recipient: auto-computed
    const expectedA = new BN(1_000_000_000_000).addn(13).divn(14);
    expect(result.recipients[0].amountPerPeriod.eq(expectedA)).toBe(true);

    // Second recipient: explicit override
    expect(result.recipients[1].amountPerPeriod.eq(explicitPeriod)).toBe(true);
  });
});
