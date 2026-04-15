import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SolanaStreamClient } from "../../../solana/StreamClient.js";

vi.mock("../../../solana/StreamClient.js", () => {
  return {
    SolanaStreamClient: vi.fn().mockImplementation(() => ({
      buildCreateTransactionInstructions: vi.fn(),
    })),
  };
});

const mockBuildCreateTransactionInstructions = vi.fn();

function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    client: {
      buildCreateTransactionInstructions: mockBuildCreateTransactionInstructions,
    } as unknown as SolanaStreamClient,
    programId: PublicKey.unique(),
    rpcUrl: "https://api.mainnet-beta.solana.com",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("create()", () => {
  async function importCreate() {
    const { create } = await import("../../../solana/api/create.js");
    return create;
  }

  it("delegates to StreamClient.buildCreateTransactionInstructions with correct params", async () => {
    const mockIx = new TransactionInstruction({
      programId: PublicKey.unique(),
      keys: [],
      data: Buffer.alloc(0),
    });
    const metadataKeypair = Keypair.generate();
    const metadataId = Keypair.generate().publicKey.toBase58();

    mockBuildCreateTransactionInstructions.mockResolvedValue({
      ixs: [mockIx],
      metadataId,
      metadata: metadataKeypair,
    });

    const create = await importCreate();
    const invokerPk = Keypair.generate().publicKey;

    const result = await create({} as any, { publicKey: invokerPk }, makeEnv({ isNative: false }));

    expect(mockBuildCreateTransactionInstructions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        sender: { publicKey: invokerPk },
        isNative: false,
      }),
    );
    expect(result.instructions).toEqual([mockIx]);
    expect(result.metadataPubKey).toEqual(new PublicKey(metadataId));
  });

  it("returns signers with metadata keypair for V1 path", async () => {
    const metadataKeypair = Keypair.generate();
    mockBuildCreateTransactionInstructions.mockResolvedValue({
      ixs: [],
      metadataId: Keypair.generate().publicKey.toBase58(),
      metadata: metadataKeypair,
    });

    const create = await importCreate();

    const result = await create({} as any, { publicKey: Keypair.generate().publicKey }, makeEnv());

    expect(result.signers).toEqual([metadataKeypair]);
    expect(result.metadata).toBe(metadataKeypair);
  });

  it("returns undefined signers for V2 path (no metadata)", async () => {
    mockBuildCreateTransactionInstructions.mockResolvedValue({
      ixs: [],
      metadataId: Keypair.generate().publicKey.toBase58(),
      metadata: undefined,
    });

    const create = await importCreate();

    const result = await create({} as any, { publicKey: Keypair.generate().publicKey }, makeEnv());

    expect(result.signers).toBeUndefined();
    expect(result.metadata).toBeUndefined();
  });

  it("normalizes string publicKey via pk()", async () => {
    const invokerPk = Keypair.generate();
    const invokerPkString = invokerPk.publicKey.toBase58();
    mockBuildCreateTransactionInstructions.mockResolvedValue({
      ixs: [],
      metadataId: Keypair.generate().publicKey.toBase58(),
      metadata: undefined,
    });

    const create = await importCreate();

    await create({} as any, { publicKey: invokerPkString }, makeEnv());

    expect(mockBuildCreateTransactionInstructions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        sender: { publicKey: invokerPk.publicKey },
      }),
    );
  });
});
