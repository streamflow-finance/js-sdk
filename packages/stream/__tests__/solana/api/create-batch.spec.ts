import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SolanaStreamClient } from "../../../solana/StreamClient.js";

vi.mock("../../../solana/StreamClient.js", () => {
  return {
    SolanaStreamClient: vi.fn().mockImplementation(() => ({})),
  };
});

function makeEnv(mockClient: Partial<SolanaStreamClient>, overrides: Record<string, unknown> = {}) {
  return {
    client: mockClient as unknown as SolanaStreamClient,
    programId: PublicKey.unique(),
    rpcUrl: "https://api.mainnet-beta.solana.com",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createBatch()", () => {
  async function importCreateBatch() {
    const { createBatch } = await import("../../../solana/api/create-batch.js");
    return createBatch;
  }

  it("delegates to buildCreateMultipleTransactionInstructions", async () => {
    const mockIx = new TransactionInstruction({
      programId: PublicKey.unique(),
      keys: [],
      data: Buffer.alloc(0),
    });
    const metadataKeypair = Keypair.generate();
    const metadataPubKeyStr = Keypair.generate().publicKey.toBase58();
    const setupIx = new TransactionInstruction({
      programId: PublicKey.unique(),
      keys: [],
      data: Buffer.alloc(0),
    });

    const mockBuild = vi.fn().mockResolvedValue({
      instructionsBatch: [{ ixs: [mockIx], metadata: metadataKeypair, recipient: "recipient1" }],
      metadatas: [metadataPubKeyStr],
      metadataToRecipient: {},
      prepareInstructions: [setupIx],
    });

    const invokerPk = Keypair.generate().publicKey;
    const createBatch = await importCreateBatch();
    const result = await createBatch(
      {} as any,
      { publicKey: invokerPk },
      makeEnv({ buildCreateMultipleTransactionInstructions: mockBuild }),
    );

    expect(mockBuild).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        sender: { publicKey: invokerPk },
        isNative: false,
      }),
    );
    expect(result.setupInstructions).toEqual([setupIx]);
    expect(result.creationBatches).toHaveLength(1);
    expect(result.creationBatches[0]!.instructions).toEqual([mockIx]);
    expect(result.creationBatches[0]!.signers).toEqual([metadataKeypair]);
    expect(result.creationBatches[0]!.recipient).toBe("recipient1");
    expect(result.creationBatches[0]!.metadataPubKey).toEqual(new PublicKey(metadataPubKeyStr));
  });

  it("maps setupInstructions from prepareInstructions", async () => {
    const setupIx = new TransactionInstruction({
      programId: PublicKey.unique(),
      keys: [],
      data: Buffer.alloc(0),
    });

    const mockBuild = vi.fn().mockResolvedValue({
      instructionsBatch: [],
      metadatas: [],
      metadataToRecipient: {},
      prepareInstructions: [setupIx],
    });

    const createBatch = await importCreateBatch();
    const result = await createBatch(
      {} as any,
      { publicKey: Keypair.generate().publicKey },
      makeEnv({ buildCreateMultipleTransactionInstructions: mockBuild }),
    );

    expect(result.setupInstructions).toEqual([setupIx]);
  });

  it("handles mixed V1/V2 batches (some with signers, some without)", async () => {
    const metadataKeypair = Keypair.generate();
    const meta1 = Keypair.generate().publicKey.toBase58();
    const meta2 = Keypair.generate().publicKey.toBase58();

    const mockBuild = vi.fn().mockResolvedValue({
      instructionsBatch: [
        { ixs: [], metadata: metadataKeypair, recipient: "recipient1" },
        { ixs: [], metadata: undefined, recipient: "recipient2" },
      ],
      metadatas: [meta1, meta2],
      metadataToRecipient: {},
      prepareInstructions: [],
    });

    const createBatch = await importCreateBatch();
    const result = await createBatch(
      {} as any,
      { publicKey: Keypair.generate().publicKey },
      makeEnv({ buildCreateMultipleTransactionInstructions: mockBuild }),
    );

    expect(result.creationBatches).toHaveLength(2);
    expect(result.creationBatches[0]!.signers).toEqual([metadataKeypair]);
    expect(result.creationBatches[1]!.signers).toBeUndefined();
    expect(result.creationBatches[1]!.metadataPubKey).toEqual(new PublicKey(meta2));
  });
});
