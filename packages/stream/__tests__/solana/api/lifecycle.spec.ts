import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SolanaStreamClient } from "../../../solana/StreamClient.js";

vi.mock("../../../solana/StreamClient.js", () => {
  return {
    SolanaStreamClient: vi.fn().mockImplementation(() => ({})),
  };
});

function makeMockMethod(): ReturnType<typeof vi.fn> {
  return vi.fn();
}

function makeEnv(mockClient: Partial<SolanaStreamClient>) {
  return {
    client: mockClient as unknown as SolanaStreamClient,
    programId: PublicKey.unique(),
    rpcUrl: "https://api.mainnet-beta.solana.com",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("withdraw()", () => {
  async function importWithdraw() {
    const { withdraw } = await import("../../../solana/api/withdraw.js");
    return withdraw;
  }

  it("delegates to prepareWithdrawInstructions and returns InstructionResult", async () => {
    const mockIx = new TransactionInstruction({
      programId: PublicKey.unique(),
      keys: [],
      data: Buffer.alloc(0),
    });
    const mockPrepare = makeMockMethod().mockResolvedValue([mockIx]);
    const invokerPk = Keypair.generate().publicKey;

    const withdraw = await importWithdraw();
    const result = await withdraw(
      { id: "stream123" } as any,
      { publicKey: invokerPk },
      makeEnv({ prepareWithdrawInstructions: mockPrepare }),
    );

    expect(mockPrepare).toHaveBeenCalledWith(
      { id: "stream123" },
      expect.objectContaining({ invoker: { publicKey: invokerPk } }),
    );
    expect(result.instructions).toEqual([mockIx]);
    expect(result.signers).toBeUndefined();
  });

  it("normalizes string publicKey", async () => {
    const invokerKeypair = Keypair.generate();
    const mockPrepare = makeMockMethod().mockResolvedValue([]);

    const withdraw = await importWithdraw();
    await withdraw(
      { id: "stream123" } as any,
      { publicKey: invokerKeypair.publicKey.toBase58() },
      makeEnv({ prepareWithdrawInstructions: mockPrepare }),
    );

    expect(mockPrepare).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ invoker: { publicKey: invokerKeypair.publicKey } }),
    );
  });
});

describe("cancel()", () => {
  async function importCancel() {
    const { cancel } = await import("../../../solana/api/cancel.js");
    return cancel;
  }

  it("delegates to prepareCancelInstructions and returns InstructionResult", async () => {
    const mockIx = new TransactionInstruction({
      programId: PublicKey.unique(),
      keys: [],
      data: Buffer.alloc(0),
    });
    const mockPrepare = makeMockMethod().mockResolvedValue([mockIx]);
    const invokerPk = Keypair.generate().publicKey;

    const cancel = await importCancel();
    const result = await cancel(
      { id: "stream123" },
      { publicKey: invokerPk },
      makeEnv({ prepareCancelInstructions: mockPrepare }),
    );

    expect(mockPrepare).toHaveBeenCalledWith(
      { id: "stream123" },
      expect.objectContaining({ invoker: { publicKey: invokerPk } }),
    );
    expect(result.instructions).toEqual([mockIx]);
  });
});

describe("transfer()", () => {
  async function importTransfer() {
    const { transfer } = await import("../../../solana/api/transfer.js");
    return transfer;
  }

  it("delegates to prepareTransferInstructions and returns InstructionResult", async () => {
    const mockIx = new TransactionInstruction({
      programId: PublicKey.unique(),
      keys: [],
      data: Buffer.alloc(0),
    });
    const mockPrepare = makeMockMethod().mockResolvedValue([mockIx]);
    const invokerPk = Keypair.generate().publicKey;

    const transfer = await importTransfer();
    const result = await transfer(
      { id: "stream123", newRecipient: "newPubKey" } as any,
      { publicKey: invokerPk },
      makeEnv({ prepareTransferInstructions: mockPrepare }),
    );

    expect(mockPrepare).toHaveBeenCalledWith(
      { id: "stream123", newRecipient: "newPubKey" },
      expect.objectContaining({ invoker: { publicKey: invokerPk } }),
    );
    expect(result.instructions).toEqual([mockIx]);
  });
});

describe("topup()", () => {
  async function importTopup() {
    const { topup } = await import("../../../solana/api/topup.js");
    return topup;
  }

  it("delegates to prepareTopupInstructions with as any cast for invoker", async () => {
    const mockIx = new TransactionInstruction({
      programId: PublicKey.unique(),
      keys: [],
      data: Buffer.alloc(0),
    });
    const mockPrepare = makeMockMethod().mockResolvedValue([mockIx]);
    const invokerPk = Keypair.generate().publicKey;

    const topup = await importTopup();
    const result = await topup(
      { id: "stream123", amount: {} as any } as any,
      { publicKey: invokerPk },
      {
        client: { prepareTopupInstructions: mockPrepare } as unknown as SolanaStreamClient,
        programId: PublicKey.unique(),
        rpcUrl: "https://api.mainnet-beta.solana.com",
        isNative: true,
      },
    );

    expect(mockPrepare).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        invoker: { publicKey: invokerPk },
        isNative: true,
      }),
    );
    expect(result.instructions).toEqual([mockIx]);
  });
});

describe("update()", () => {
  async function importUpdate() {
    const { update } = await import("../../../solana/api/update.js");
    return update;
  }

  it("delegates to prepareUpdateInstructions and returns InstructionResult", async () => {
    const mockIx = new TransactionInstruction({
      programId: PublicKey.unique(),
      keys: [],
      data: Buffer.alloc(0),
    });
    const mockPrepare = makeMockMethod().mockResolvedValue([mockIx]);
    const invokerPk = Keypair.generate().publicKey;

    const update = await importUpdate();
    const result = await update(
      { id: "stream123" } as any,
      { publicKey: invokerPk },
      makeEnv({ prepareUpdateInstructions: mockPrepare }),
    );

    expect(mockPrepare).toHaveBeenCalledWith(
      { id: "stream123" },
      expect.objectContaining({ invoker: { publicKey: invokerPk } }),
    );
    expect(result.instructions).toEqual([mockIx]);
  });
});
