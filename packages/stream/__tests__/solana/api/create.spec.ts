import BN from "bn.js";
import { ComputeBudgetProgram, Keypair, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { ICluster } from "@streamflow/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type SolanaStreamClient } from "../../../solana/StreamClient.js";
import { type ICreateStreamData } from "../../../solana/types.js";

vi.mock("../../../solana/StreamClient.js", () => {
  return {
    SolanaStreamClient: vi.fn().mockImplementation(() => ({
      buildCreateTransactionInstructions: vi.fn(),
    })),
  };
});

const mockBuildCreate = vi.fn();

const STREAM_PROGRAM_ID = PublicKey.unique();

/** Fully-typed stream params satisfying ICreateLinearStreamData. */
function makeStreamParams(): ICreateStreamData {
  return {
    recipient: Keypair.generate().publicKey.toBase58(),
    amount: new BN(1_000_000),
    name: "Test Stream",
    cliffAmount: new BN(0),
    amountPerPeriod: new BN(100_000),
    period: 3600,
    start: 1_700_000_000,
    cliff: 0,
    cancelableBySender: true,
    cancelableByRecipient: false,
    transferableBySender: true,
    transferableByRecipient: false,
    canTopup: true,
    tokenId: Keypair.generate().publicKey.toBase58(),
  };
}

/**
 * 18 account keys matching the real create-stream instruction layout.
 * Indices 0 (sender) and 3 (metadata) are signers;
 * indices 0–10 are writable, 11–17 are read-only.
 */
function makeCreateStreamAccountKeys() {
  return [
    { pubkey: PublicKey.unique(), isSigner: true, isWritable: true }, // 0 sender
    { pubkey: PublicKey.unique(), isSigner: false, isWritable: true }, // 1 senderTokens
    { pubkey: PublicKey.unique(), isSigner: false, isWritable: true }, // 2 recipient
    { pubkey: PublicKey.unique(), isSigner: true, isWritable: true }, // 3 metadata
    { pubkey: PublicKey.unique(), isSigner: false, isWritable: true }, // 4 escrowTokens
    { pubkey: PublicKey.unique(), isSigner: false, isWritable: true }, // 5 recipientTokens
    { pubkey: PublicKey.unique(), isSigner: false, isWritable: true }, // 6 streamflowTreasury
    { pubkey: PublicKey.unique(), isSigner: false, isWritable: true }, // 7 streamflowTreasuryTokens
    { pubkey: PublicKey.unique(), isSigner: false, isWritable: true }, // 8 withdrawor
    { pubkey: PublicKey.unique(), isSigner: false, isWritable: true }, // 9 partner
    { pubkey: PublicKey.unique(), isSigner: false, isWritable: true }, // 10 partnerTokens
    { pubkey: PublicKey.unique(), isSigner: false, isWritable: false }, // 11 mint
    { pubkey: PublicKey.unique(), isSigner: false, isWritable: false }, // 12 feeOracle
    { pubkey: PublicKey.unique(), isSigner: false, isWritable: false }, // 13 rent
    { pubkey: STREAM_PROGRAM_ID, isSigner: false, isWritable: false }, // 14 timelockProgram
    { pubkey: PublicKey.unique(), isSigner: false, isWritable: false }, // 15 tokenProgram
    { pubkey: PublicKey.unique(), isSigner: false, isWritable: false }, // 16 associatedTokenProgram
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // 17 systemProgram
  ];
}

/**
 * 148-byte data buffer matching the create-stream instruction layout:
 *   [8B discriminator] [130B createStreamLayout fields] [10B padding]
 */
function makeCreateStreamData(): Buffer {
  const data = Buffer.alloc(148);
  // Discriminator — sha256("global:create")[0:8] placeholder
  data.set([0xf0, 0xc2, 0x1a, 0x7c, 0x05, 0x9b, 0x8e, 0x31], 0);
  // start_time (u64 LE)
  data.writeBigUInt64LE(BigInt(1_700_000_000), 8);
  // net_amount_deposited
  data.writeBigUInt64LE(BigInt(1_000_000), 16);
  // period
  data.writeBigUInt64LE(BigInt(3600), 24);
  // amount_per_period
  data.writeBigUInt64LE(BigInt(100_000), 32);
  // cliff
  data.writeBigUInt64LE(BigInt(0), 40);
  // cliff_amount
  data.writeBigUInt64LE(BigInt(0), 48);
  // boolean flags (1B each)
  data[56] = 1; // cancelable_by_sender
  data[57] = 0; // cancelable_by_recipient
  data[58] = 0; // automatic_withdrawal
  data[59] = 1; // transferable_by_sender
  data[60] = 0; // transferable_by_recipient
  data[61] = 1; // can_topup
  // stream_name (64B at offset 62, zero-padded)
  Buffer.from("Test Stream").copy(data, 62);
  // withdraw_frequency (u64 LE)
  data.writeBigUInt64LE(BigInt(0), 126);
  // optional-field discriminators + values
  data[134] = 1; // _pausable_discriminator
  data[135] = 0; // pausable
  data[136] = 1; // _can_update_rate_discriminator
  data[137] = 0; // can_update_rate
  // bytes 138-147: zero padding
  return data;
}

/** Full create-stream TransactionInstruction with 18 accounts and 148-byte data. */
function makeCreateStreamIx(programId: PublicKey = STREAM_PROGRAM_ID): TransactionInstruction {
  return new TransactionInstruction({
    programId,
    keys: makeCreateStreamAccountKeys(),
    data: makeCreateStreamData(),
  });
}

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

describe("create()", () => {
  async function importCreate() {
    const { create } = await import("../../../solana/api/create.js");
    return create;
  }

  it("preserves full instruction content — programId, 18 account keys, and 148-byte data buffer", async () => {
    const createIx = makeCreateStreamIx();
    const metadataKeypair = Keypair.generate();
    const metadataId = Keypair.generate().publicKey.toBase58();

    mockBuildCreate.mockResolvedValue({
      ixs: [createIx],
      metadataId,
      metadata: metadataKeypair,
    });

    const create = await importCreate();
    const result = await create(makeStreamParams(), { publicKey: Keypair.generate().publicKey }, makeEnv());

    expect(result.instructions).toHaveLength(1);
    const ix = result.instructions[0];

    // programId
    expect(ix.programId.equals(STREAM_PROGRAM_ID)).toBe(true);

    // 18 account keys with correct signer / writable flags
    expect(ix.keys).toHaveLength(18);
    expect(ix.keys[0].isSigner).toBe(true); // sender
    expect(ix.keys[3].isSigner).toBe(true); // metadata
    for (let i = 0; i < 18; i++) {
      expect(ix.keys[i].isWritable).toBe(i <= 10);
      expect(ix.keys[i].isSigner).toBe(i === 0 || i === 3);
    }

    // Full data buffer — byte-for-byte equality
    expect(ix.data.byteLength).toBe(148);
    expect(Buffer.compare(ix.data, createIx.data)).toBe(0);

    // Spot-check serialized values inside the data
    expect(ix.data.subarray(0, 8)).toEqual(Buffer.from([0xf0, 0xc2, 0x1a, 0x7c, 0x05, 0x9b, 0x8e, 0x31]));
    expect(ix.data.readBigUInt64LE(8)).toBe(BigInt(1_700_000_000)); // start_time
    expect(ix.data.readBigUInt64LE(16)).toBe(BigInt(1_000_000)); // net_amount_deposited
    expect(ix.data.readBigUInt64LE(24)).toBe(BigInt(3600)); // period
    expect(ix.data[56]).toBe(1); // cancelable_by_sender
    expect(ix.data[61]).toBe(1); // can_topup
    // Trailing padding is zeroed
    expect(ix.data.subarray(138, 148)).toEqual(Buffer.alloc(10));
  });

  it("preserves multi-instruction array order and content for native SOL path", async () => {
    const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 });
    const senderPk = Keypair.generate().publicKey;
    const wsolAta = Keypair.generate().publicKey;
    const transferIx = SystemProgram.transfer({
      fromPubkey: senderPk,
      toPubkey: wsolAta,
      lamports: 1_000_000,
    });
    const createIx = makeCreateStreamIx();
    const metadataId = Keypair.generate().publicKey.toBase58();

    mockBuildCreate.mockResolvedValue({
      ixs: [computePriceIx, transferIx, createIx],
      metadataId,
      metadata: Keypair.generate(),
    });

    const create = await importCreate();
    const result = await create(
      makeStreamParams(),
      { publicKey: Keypair.generate().publicKey },
      makeEnv({ isNative: true }),
    );

    expect(result.instructions).toHaveLength(3);

    // [0] ComputeBudget — setComputeUnitPrice
    expect(result.instructions[0].programId.equals(ComputeBudgetProgram.programId)).toBe(true);
    expect(result.instructions[0].data).toEqual(computePriceIx.data);

    // [1] SystemProgram.transfer — lamport transfer to WSOL ATA
    expect(result.instructions[1].programId.equals(SystemProgram.programId)).toBe(true);
    expect(result.instructions[1].data).toEqual(transferIx.data);
    expect(result.instructions[1].keys[0].pubkey.equals(senderPk)).toBe(true);
    expect(result.instructions[1].keys[1].pubkey.equals(wsolAta)).toBe(true);

    // [2] Streamflow create — 18 keys, 148-byte data
    expect(result.instructions[2].programId.equals(STREAM_PROGRAM_ID)).toBe(true);
    expect(result.instructions[2].keys).toHaveLength(18);
    expect(result.instructions[2].data.byteLength).toBe(148);
    expect(Buffer.compare(result.instructions[2].data, createIx.data)).toBe(0);
  });

  it("returns signers with metadata keypair for V1 path", async () => {
    const metadataKeypair = Keypair.generate();
    mockBuildCreate.mockResolvedValue({
      ixs: [makeCreateStreamIx()],
      metadataId: Keypair.generate().publicKey.toBase58(),
      metadata: metadataKeypair,
    });

    const create = await importCreate();
    const result = await create(makeStreamParams(), { publicKey: Keypair.generate().publicKey }, makeEnv());

    expect(result.signers).toEqual([metadataKeypair]);
    expect(result.metadata).toBe(metadataKeypair);
  });

  it("returns undefined signers for V2 path (no metadata keypair)", async () => {
    mockBuildCreate.mockResolvedValue({
      ixs: [makeCreateStreamIx()],
      metadataId: Keypair.generate().publicKey.toBase58(),
      metadata: undefined,
    });

    const create = await importCreate();
    const result = await create(makeStreamParams(), { publicKey: Keypair.generate().publicKey }, makeEnv());

    expect(result.signers).toBeUndefined();
    expect(result.metadata).toBeUndefined();
  });

  it("converts metadataId string to PublicKey", async () => {
    const metadataKeypair = Keypair.generate();
    const metadataId = metadataKeypair.publicKey.toBase58();
    mockBuildCreate.mockResolvedValue({
      ixs: [makeCreateStreamIx()],
      metadataId,
      metadata: undefined,
    });

    const create = await importCreate();
    const result = await create(makeStreamParams(), { publicKey: Keypair.generate().publicKey }, makeEnv());

    expect(result.metadataPubKey).toBeInstanceOf(PublicKey);
    expect(result.metadataPubKey.equals(metadataKeypair.publicKey)).toBe(true);
  });

  it("normalizes string publicKey via pk()", async () => {
    const invokerKp = Keypair.generate();
    mockBuildCreate.mockResolvedValue({
      ixs: [],
      metadataId: Keypair.generate().publicKey.toBase58(),
      metadata: undefined,
    });

    const create = await importCreate();
    await create(makeStreamParams(), { publicKey: invokerKp.publicKey.toBase58() }, makeEnv());

    expect(mockBuildCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        sender: { publicKey: invokerKp.publicKey },
      }),
    );
  });

  it("defaults isNative to false when omitted from env", async () => {
    mockBuildCreate.mockResolvedValue({
      ixs: [],
      metadataId: Keypair.generate().publicKey.toBase58(),
      metadata: undefined,
    });

    const create = await importCreate();
    await create(makeStreamParams(), { publicKey: Keypair.generate().publicKey }, makeEnv());

    expect(mockBuildCreate).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ isNative: false }));
  });

  it("forwards isNative: true to buildCreateTransactionInstructions", async () => {
    mockBuildCreate.mockResolvedValue({
      ixs: [],
      metadataId: Keypair.generate().publicKey.toBase58(),
      metadata: undefined,
    });

    const create = await importCreate();
    await create(makeStreamParams(), { publicKey: Keypair.generate().publicKey }, makeEnv({ isNative: true }));

    expect(mockBuildCreate).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ isNative: true }));
  });

  it("forwards params by reference to buildCreateTransactionInstructions", async () => {
    const params = makeStreamParams();
    mockBuildCreate.mockResolvedValue({
      ixs: [],
      metadataId: Keypair.generate().publicKey.toBase58(),
      metadata: undefined,
    });

    const create = await importCreate();
    await create(params, { publicKey: Keypair.generate().publicKey }, makeEnv());

    expect(mockBuildCreate).toHaveBeenCalledWith(params, expect.anything());
  });

  it("creates SolanaStreamClient from rpcUrl when no pre-injected client", async () => {
    const { SolanaStreamClient: MockClient } = await import("../../../solana/StreamClient.js");
    const mockBuild = vi.fn().mockResolvedValue({
      ixs: [],
      metadataId: Keypair.generate().publicKey.toBase58(),
      metadata: undefined,
    });
    vi.mocked(MockClient).mockImplementationOnce(
      () => ({ buildCreateTransactionInstructions: mockBuild }) as unknown as SolanaStreamClient,
    );

    const create = await importCreate();
    const programId = PublicKey.unique();
    const rpcUrl = "https://api.devnet.solana.com";

    await create(makeStreamParams(), { publicKey: Keypair.generate().publicKey }, { programId, rpcUrl });

    expect(vi.mocked(MockClient)).toHaveBeenCalledWith(rpcUrl, ICluster.Mainnet, undefined, programId.toBase58());
  });

  it("propagates errors from buildCreateTransactionInstructions", async () => {
    mockBuildCreate.mockRejectedValue(new Error("RPC node unavailable"));

    const create = await importCreate();
    await expect(create(makeStreamParams(), { publicKey: Keypair.generate().publicKey }, makeEnv())).rejects.toThrow(
      "RPC node unavailable",
    );
  });
});
