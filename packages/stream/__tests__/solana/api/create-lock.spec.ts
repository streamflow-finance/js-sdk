import BN from "bn.js";
import { Keypair, PublicKey } from "@solana/web3.js";
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

function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    client: {} as unknown as SolanaStreamClient,
    programId: PublicKey.unique(),
    rpcUrl: "https://api.mainnet-beta.solana.com",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildLockParams()", () => {
  async function importBuildLockParams() {
    const { buildLockParams } = await import("../../../solana/api/create-lock.js");
    return buildLockParams;
  }

  const baseParams = () => ({
    recipient: Keypair.generate().publicKey.toBase58(),
    tokenId: Keypair.generate().publicKey.toBase58(),
    amount: new BN(1_000_000_000),
    unlockDate: 1700000000,
    name: "Test Lock",
  });

  it("sets all lock defaults correctly", async () => {
    const buildLockParams = await importBuildLockParams();
    const result = buildLockParams(baseParams());

    expect(result.period).toBe(1);
    expect(result.cliffAmount.eq(new BN(999_999_999))).toBe(true);
    expect(result.amountPerPeriod.eq(new BN(1))).toBe(true);
    expect(result.start).toBe(1700000000);
    expect(result.cliff).toBe(1700000000);
    expect(result.canTopup).toBe(false);
    expect(result.cancelableBySender).toBe(false);
    expect(result.cancelableByRecipient).toBe(false);
    expect(result.transferableBySender).toBe(false);
    expect(result.transferableByRecipient).toBe(false);
    expect(result.automaticWithdrawal).toBe(false);
    expect(result.withdrawalFrequency).toBe(0);
  });

  it("propagates transferableByRecipient when set to true", async () => {
    const buildLockParams = await importBuildLockParams();
    const result = buildLockParams({ ...baseParams(), transferableByRecipient: true });

    expect(result.transferableByRecipient).toBe(true);
  });

  it("includes optional partner when provided", async () => {
    const buildLockParams = await importBuildLockParams();
    const partner = Keypair.generate().publicKey.toBase58();
    const result = buildLockParams({ ...baseParams(), partner });

    expect(result.partner).toBe(partner);
  });

  it("includes optional tokenProgramId when provided", async () => {
    const buildLockParams = await importBuildLockParams();
    const tokenProgramId = PublicKey.unique().toBase58();
    const result = buildLockParams({ ...baseParams(), tokenProgramId });

    expect(result.tokenProgramId).toBe(tokenProgramId);
  });

  it("omits partner and tokenProgramId when not provided", async () => {
    const buildLockParams = await importBuildLockParams();
    const result = buildLockParams(baseParams());

    expect("partner" in result).toBe(false);
    expect("tokenProgramId" in result).toBe(false);
  });

  it("classifies as StreamType.Lock", async () => {
    const buildLockParams = await importBuildLockParams();
    const { buildStreamType } = await import("../../../solana/contractUtils.js");
    const { StreamType } = await import("../../../solana/types.js");

    const result = buildLockParams(baseParams());
    const streamType = buildStreamType({ ...result, depositedAmount: result.amount, automaticWithdrawal: false });

    expect(streamType).toBe(StreamType.Lock);
  });

  it("throws for amount = 1", async () => {
    const buildLockParams = await importBuildLockParams();
    const params = { ...baseParams(), amount: new BN(1) };

    expect(() => buildLockParams(params)).toThrow("Lock amount must be greater than 1");
  });

  it("throws for amount = 0", async () => {
    const buildLockParams = await importBuildLockParams();
    const params = { ...baseParams(), amount: new BN(0) };

    expect(() => buildLockParams(params)).toThrow("Lock amount must be greater than 1");
  });
});

describe("createLock()", () => {
  async function importCreateLock() {
    const { createLock } = await import("../../../solana/api/create-lock.js");
    return createLock;
  }

  it("delegates to create() with built lock params", async () => {
    const createLock = await importCreateLock();

    mockCreate.mockResolvedValue({
      instructions: [],
      signers: undefined,
      metadata: undefined,
      metadataPubKey: PublicKey.unique(),
    });

    const params = {
      recipient: Keypair.generate().publicKey.toBase58(),
      tokenId: Keypair.generate().publicKey.toBase58(),
      amount: new BN(1_000_000_000),
      unlockDate: 1700000000,
      name: "Test Lock",
    };
    const invoker = { publicKey: Keypair.generate().publicKey };
    const env = makeEnv();

    await createLock(params, invoker, env);

    expect(mockCreate).toHaveBeenCalledOnce();
    const [actualParams, actualInvoker, actualEnv] = mockCreate.mock.calls[0];

    expect(actualParams.period).toBe(1);
    expect(actualParams.amountPerPeriod.eq(new BN(1))).toBe(true);
    expect(actualParams.cliffAmount.eq(params.amount.subn(1))).toBe(true);
    expect(actualParams.recipient).toBe(params.recipient);
    expect(actualInvoker).toBe(invoker);
    expect(actualEnv).toBe(env);
  });
});

describe("buildLockBatchParams()", () => {
  async function importBuildLockBatchParams() {
    const { buildLockBatchParams } = await import("../../../solana/api/create-lock-batch.js");
    return buildLockBatchParams;
  }

  it("constructs per-recipient cliffAmount and amountPerPeriod", async () => {
    const buildLockBatchParams = await importBuildLockBatchParams();

    const amounts = [new BN(1000), new BN(2000), new BN(5000)];
    const params = {
      recipients: amounts.map((amount, i) => ({
        recipient: Keypair.generate().publicKey.toBase58(),
        amount,
        name: `Lock ${i}`,
      })),
      tokenId: Keypair.generate().publicKey.toBase58(),
      unlockDate: 1700000000,
    };

    const result = buildLockBatchParams(params);

    expect(result.recipients).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      expect(result.recipients[i].cliffAmount.eq(amounts[i].subn(1))).toBe(true);
      expect(result.recipients[i].amountPerPeriod.eq(new BN(1))).toBe(true);
    }
    expect(result.period).toBe(1);
    expect(result.canTopup).toBe(false);
    expect(result.cancelableBySender).toBe(false);
    expect(result.cancelableByRecipient).toBe(false);
    expect(result.transferableBySender).toBe(false);
    expect(result.transferableByRecipient).toBe(false);
    expect(result.automaticWithdrawal).toBe(false);
  });

  it("propagates shared fields to all recipients", async () => {
    const buildLockBatchParams = await importBuildLockBatchParams();

    const recipientStrings = [Keypair.generate().publicKey.toBase58(), Keypair.generate().publicKey.toBase58()];
    const amounts = [new BN(3000), new BN(7000)];
    const names = ["Lock A", "Lock B"];

    const params = {
      recipients: recipientStrings.map((r, i) => ({
        recipient: r,
        amount: amounts[i],
        name: names[i],
      })),
      tokenId: Keypair.generate().publicKey.toBase58(),
      unlockDate: 1700000000,
    };

    const result = buildLockBatchParams(params);

    for (let i = 0; i < 2; i++) {
      expect(result.recipients[i].recipient).toBe(recipientStrings[i]);
      expect(result.recipients[i].name).toBe(names[i]);
      expect(result.recipients[i].amount.eq(amounts[i])).toBe(true);
    }
  });
});

describe("createLockBatch()", () => {
  async function importCreateLockBatch() {
    const { createLockBatch } = await import("../../../solana/api/create-lock-batch.js");
    return createLockBatch;
  }

  it("delegates to createBatch() with built batch params", async () => {
    const createLockBatch = await importCreateLockBatch();

    mockCreateBatch.mockResolvedValue({
      setupInstructions: [],
      creationBatches: [],
    });

    const params = {
      recipients: [
        { recipient: Keypair.generate().publicKey.toBase58(), amount: new BN(5000), name: "Lock A" },
        { recipient: Keypair.generate().publicKey.toBase58(), amount: new BN(8000), name: "Lock B" },
      ],
      tokenId: Keypair.generate().publicKey.toBase58(),
      unlockDate: 1700000000,
    };
    const invoker = { publicKey: Keypair.generate().publicKey };
    const env = makeEnv();

    await createLockBatch(params, invoker, env);

    expect(mockCreateBatch).toHaveBeenCalledOnce();
    const [actualParams, actualInvoker, actualEnv] = mockCreateBatch.mock.calls[0];

    expect(actualParams.recipients).toHaveLength(2);
    expect(actualParams.period).toBe(1);
    expect(actualParams.canTopup).toBe(false);
    expect(actualParams.cancelableBySender).toBe(false);
    expect(actualParams.cancelableByRecipient).toBe(false);
    expect(actualParams.transferableBySender).toBe(false);
    expect(actualParams.transferableByRecipient).toBe(false);
    expect(actualInvoker).toBe(invoker);
    expect(actualEnv).toBe(env);
  });

  it("throws for empty recipients array", async () => {
    const createLockBatch = await importCreateLockBatch();

    const params = {
      recipients: [],
      tokenId: Keypair.generate().publicKey.toBase58(),
      unlockDate: 1700000000,
    };

    await expect(createLockBatch(params, { publicKey: Keypair.generate().publicKey }, makeEnv())).rejects.toThrow(
      "At least one recipient required",
    );
  });

  it("throws when any recipient has amount <= 1", async () => {
    const createLockBatch = await importCreateLockBatch();

    const params = {
      recipients: [
        { recipient: Keypair.generate().publicKey.toBase58(), amount: new BN(5000), name: "Lock A" },
        { recipient: Keypair.generate().publicKey.toBase58(), amount: new BN(1), name: "Lock B" },
      ],
      tokenId: Keypair.generate().publicKey.toBase58(),
      unlockDate: 1700000000,
    };

    await expect(createLockBatch(params, { publicKey: Keypair.generate().publicKey }, makeEnv())).rejects.toThrow(
      "Lock amount must be greater than 1",
    );
  });
});
