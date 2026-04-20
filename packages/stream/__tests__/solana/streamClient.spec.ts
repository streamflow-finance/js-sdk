import { BN } from "bn.js";
import { describe, expect, test, beforeEach, vi } from "vitest";
import { type Keypair, PublicKey, type VersionedTransaction } from "@solana/web3.js";

import { SolanaStreamClient } from "../../solana/StreamClient.js";
import { ICluster } from "../../solana/types.js";

const createTestPublicKey = (seed: number): PublicKey => new PublicKey(new Uint8Array(32).fill(seed));

// Mock Web Crypto API for Node.js test environment
Object.defineProperty(globalThis, "crypto", {
  value: {
    subtle: {
      digest: vi.fn().mockImplementation(async (algorithm: string, data: ArrayBuffer | Uint8Array) => {
        // Simple mock that returns a consistent hash-like array
        const input = new Uint8Array(data as ArrayBuffer);
        const mockHash = new ArrayBuffer(32); // SHA-256 produces 32 bytes
        const mockHashArray = new Uint8Array(mockHash);

        // Fill with some deterministic but fake hash data
        for (let i = 0; i < 32; i++) {
          mockHashArray[i] = (input.length + i) % 256;
        }

        return mockHash;
      }),
    },
    getRandomValues: vi.fn().mockImplementation((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
  },
  writable: true,
});

// Mock external imports - move mock functions inside factory
vi.mock("@streamflow/common", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, any>;
  return {
    ...actual,
    ata: vi.fn(),
    checkOrCreateAtaBatch: vi.fn(),
    prepareTransaction: vi.fn(),
    prepareBaseInstructions: vi.fn(),
    getMintAndProgram: vi.fn(),
    createVersionedTransaction: vi.fn(),
    prepareWrappedAccount: vi.fn(),
    signAndExecuteTransaction: vi.fn(),
    executeTransaction: vi.fn(),
    executeMultipleTransactions: vi.fn(),
    buildSendThrottler: vi.fn(() => ({})),
    getMultipleAccountsInfoBatched: vi.fn(),
    getProgramAccounts: vi.fn(),
  };
});

vi.mock("@solana/spl-token", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, any>;
  return {
    ...actual,
    getTransferHook: vi.fn(),
    addExtraAccountMetasForExecute: vi.fn().mockImplementation(async () => undefined),
  };
});

vi.mock("@coral-xyz/anchor", () => ({
  Program: vi.fn().mockImplementation(() => ({
    programId: new PublicKey("11111111111111111111111111111111"),
    methods: {
      create: vi.fn(() => ({
        accountsPartial: vi.fn(() => {
          let extraAccounts: any[] = [];
          return {
            remainingAccounts: vi.fn((accounts) => {
              extraAccounts = accounts;
              return {
                instruction: vi.fn(() =>
                  Promise.resolve({
                    keys: extraAccounts,
                    programId: new PublicKey("11111111111111111111111111111111"),
                    data: Buffer.alloc(0),
                  }),
                ),
              };
            }),
            instruction: vi.fn(() =>
              Promise.resolve({
                keys: extraAccounts,
                programId: new PublicKey("11111111111111111111111111111111"),
                data: Buffer.alloc(0),
              }),
            ),
          };
        }),
      })),
      cancel: vi.fn(() => ({
        accountsPartial: vi.fn(() => {
          let extraAccounts: any[] = [];
          return {
            remainingAccounts: vi.fn((accounts) => {
              extraAccounts = accounts;
              return {
                instruction: vi.fn(() =>
                  Promise.resolve({
                    keys: extraAccounts,
                    programId: new PublicKey("11111111111111111111111111111111"),
                    data: Buffer.alloc(0),
                  }),
                ),
              };
            }),
            instruction: vi.fn(() =>
              Promise.resolve({
                keys: extraAccounts,
                programId: new PublicKey("11111111111111111111111111111111"),
                data: Buffer.alloc(0),
              }),
            ),
          };
        }),
      })),
    },
  })),
}));

// Mock Solana-specific utils
vi.mock("../../solana/lib/utils.js", () => ({
  signAllTransactionWithRecipients: vi.fn(),
  sendAndConfirmStreamRawTransaction: vi.fn(),
  extractSolanaErrorCode: vi.fn(),
  calculateTotalAmountToDeposit: vi.fn(),
  decodeStream: vi.fn(),
}));

describe("SolanaStreamClient Transaction Builders", async () => {
  let instance: SolanaStreamClient;

  // Access mocked functions
  const mockPrepareTransaction = vi.mocked(await import("@streamflow/common")).prepareTransaction;
  const mockGetMintAndProgram = vi.mocked(await import("@streamflow/common")).getMintAndProgram;
  const mockAta = vi.mocked(await import("@streamflow/common")).ata;
  const mockCheckOrCreateAtaBatch = vi.mocked(await import("@streamflow/common")).checkOrCreateAtaBatch;
  const mockPrepareBaseInstructions = vi.mocked(await import("@streamflow/common")).prepareBaseInstructions;
  const mockCreateVersionedTransaction = vi.mocked(
    await import("@streamflow/common"),
  ).createVersionedTransaction;
  const mockPrepareWrappedAccount = vi.mocked(await import("@streamflow/common")).prepareWrappedAccount;
  const mockSignAndExecuteTransaction = vi.mocked(await import("@streamflow/common")).signAndExecuteTransaction;
  const mockExecuteTransaction = vi.mocked(await import("@streamflow/common")).executeTransaction;
  const mockExecuteMultipleTransactions = vi.mocked(
    await import("@streamflow/common"),
  ).executeMultipleTransactions;

  // Access Solana-specific mocked functions
  const mockSignAllTransactionWithRecipients = vi.mocked(
    await import("../../solana/lib/utils.js"),
  ).signAllTransactionWithRecipients;
  const mockSendAndConfirmStreamRawTransaction = vi.mocked(
    await import("../../solana/lib/utils.js"),
  ).sendAndConfirmStreamRawTransaction;
  const mockExtractSolanaErrorCode = vi.mocked(await import("../../solana/lib/utils.js")).extractSolanaErrorCode;
  const mockCalculateTotalAmountToDeposit = vi.mocked(
    await import("../../solana/lib/utils.js"),
  ).calculateTotalAmountToDeposit;
  const mockDecodeStream = vi.mocked(await import("../../solana/lib/utils.js")).decodeStream;
  const mockGetTransferHook = vi.mocked(await import("@solana/spl-token")).getTransferHook;
  const mockAddExtraAccountMetasForExecute = vi.mocked(await import("@solana/spl-token")).addExtraAccountMetasForExecute;
  const { TOKEN_2022_PROGRAM_ID } = await import("@solana/spl-token");

  beforeEach(async () => {
    vi.clearAllMocks();
    instance = new SolanaStreamClient({
      clusterUrl: "https://api.devnet.solana.com",
      cluster: ICluster.Devnet,
    });

    // Mock connection
    const mockConnection = {
      getLatestBlockhashAndContext: vi.fn().mockResolvedValue({
        value: { blockhash: "mockBlockhash", lastValidBlockHeight: 123456 },
        context: { slot: 123456 },
      }),
      getMinimumBalanceForRentExemption: vi.fn().mockResolvedValue(1000000),
      getAccountInfo: vi.fn(),
    };

    const mockTx = {
      message: { compiledInstructions: [] },
    } as unknown as VersionedTransaction;

    // Set up mocks
    mockPrepareTransaction.mockResolvedValue({
      tx: mockTx,
      hash: { blockhash: "mockBlockhash", lastValidBlockHeight: 123456 },
      context: { slot: 123456 },
    });

    mockCreateVersionedTransaction.mockReturnValue(mockTx);

    // Mock getMintAndProgram to return proper object
    mockGetMintAndProgram.mockResolvedValue({
      tokenProgramId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      mint: {} as any, // Mock Mint object
    });

    // Mock other functions
    mockAta.mockResolvedValue(new PublicKey("11111111111111111111111111111112"));
    mockCheckOrCreateAtaBatch.mockResolvedValue([]);
    mockPrepareBaseInstructions.mockReturnValue([]);
    mockPrepareWrappedAccount.mockResolvedValue([]);

    // Mock execution functions
    mockSignAndExecuteTransaction.mockResolvedValue("mock-signature");
    mockExecuteTransaction.mockResolvedValue("mock-signature");
    mockExecuteMultipleTransactions.mockResolvedValue([
      { status: "fulfilled", value: "mock-signature-1" },
      { status: "fulfilled", value: "mock-signature-2" },
    ]);

    // Mock Solana-specific functions
    mockSignAllTransactionWithRecipients.mockResolvedValue([
      { tx: mockTx, recipient: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
    ]);
    mockSendAndConfirmStreamRawTransaction.mockResolvedValue(undefined as any);
    mockExtractSolanaErrorCode.mockReturnValue("custom_error_code");
    mockCalculateTotalAmountToDeposit.mockImplementation((amount) => amount);
    mockDecodeStream.mockReset();
    mockGetTransferHook.mockReturnValue(null);
    mockAddExtraAccountMetasForExecute.mockReset();
    mockAddExtraAccountMetasForExecute.mockResolvedValue(undefined as any);

    // Mock connection on instance
    (instance as any).connection = mockConnection;
  });

  describe("buildCreateTransaction", () => {
    test("should build a transaction for single recipient without signing", async () => {
      // Arrange
      const senderPublicKey = new PublicKey("11111111111111111111111111111112");
      const mockData = {
        recipient: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        amount: new BN(1000),
        tokenId: "So11111111111111111111111111111111111111112", // SOL mint
        name: "Test Stream",
        cliffAmount: new BN(100),
        amountPerPeriod: new BN(50),
        period: 86400, // 1 day
        start: Math.floor(Date.now() / 1000),
        cliff: 86400 * 7, // 7 days
        cancelableBySender: true,
        cancelableByRecipient: false,
        transferableBySender: true,
        transferableByRecipient: false,
        canTopup: true,
        automaticWithdrawal: false,
        withdrawalFrequency: 86400,
        canPause: false,
        canUpdateRate: false,
      };

      const mockExtParams = {
        sender: { publicKey: senderPublicKey },
        isNative: false,
      };

      // Act
      const result = await instance.buildCreateTransaction(mockData, mockExtParams);

      // Assert
      expect(result).toHaveProperty("tx");
      expect(result).toHaveProperty("metadataId");
      expect(result).toHaveProperty("hash");
      expect(result).toHaveProperty("context");
      expect(result.tx).toBeInstanceOf(Object);
      expect(typeof result.metadataId).toBe("string");
      expect(typeof result.hash).toBe("string");
      expect(result.hash).toBe("mockBlockhash");

      // Verify that prepareTransaction was called to build the transaction
      expect(mockPrepareTransaction).toHaveBeenCalledWith(
        expect.any(Object), // connection
        expect.any(Array), // instructions
        expect.any(Object), // senderPublicKey
        undefined,
        expect.any(Array), // signers
      );
    });

    test("should build a transaction for native SOL stream", async () => {
      // Arrange
      const senderPublicKey = new PublicKey("11111111111111111111111111111112");
      const mockData = {
        recipient: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        amount: new BN(1000000000), // 1 SOL
        tokenId: "So11111111111111111111111111111111111111112", // SOL mint
        name: "Native SOL Stream",
        cliffAmount: new BN(100000000),
        amountPerPeriod: new BN(50000000),
        period: 86400,
        start: Math.floor(Date.now() / 1000),
        cliff: 86400 * 7,
        cancelableBySender: true,
        cancelableByRecipient: false,
        transferableBySender: true,
        transferableByRecipient: false,
        canTopup: true,
        automaticWithdrawal: false,
        withdrawalFrequency: 86400,
        canPause: false,
        canUpdateRate: false,
      };

      const mockExtParams = {
        sender: { publicKey: senderPublicKey },
        isNative: true,
      };

      // Mock getTotalFee method
      const mockGetTotalFee = vi.fn().mockResolvedValue(new BN(1000));
      (instance as any).getTotalFee = mockGetTotalFee;

      // Act
      const result = await instance.buildCreateTransaction(mockData, mockExtParams);

      // Assert
      expect(result).toHaveProperty("tx");
      expect(result).toHaveProperty("metadataId");
      expect(result).toHaveProperty("hash");
      expect(result).toHaveProperty("context");
      expect(mockGetTotalFee).toHaveBeenCalledWith({
        address: expect.any(String),
      });
    });
  });

  describe("transfer hook accounts", () => {
    const publicKeys = {
      sender: createTestPublicKey(1),
      senderTokens: createTestPublicKey(2),
      recipient: createTestPublicKey(3),
      recipientTokens: createTestPublicKey(4),
      mint: createTestPublicKey(5),
      stream: createTestPublicKey(17),
      escrowTokens: createTestPublicKey(6),
      streamflowTreasury: createTestPublicKey(7),
      streamflowTreasuryTokens: createTestPublicKey(8),
      partner: createTestPublicKey(9),
      partnerTokens: createTestPublicKey(10),
      oldMetadata: createTestPublicKey(11),
      payer: createTestPublicKey(12),
      invoker: createTestPublicKey(13),
      transferHookProgram: createTestPublicKey(14),
      partnerLink: createTestPublicKey(18),
      proxyTokens: createTestPublicKey(23),
    } as const;

    const createDecodedStream = () => ({
      magic: new BN(0),
      version: new BN(0),
      createdAt: new BN(0),
      withdrawnAmount: new BN(100),
      canceledAt: new BN(0),
      end: new BN(9999999999),
      lastWithdrawnAt: new BN(0),
      sender: publicKeys.sender,
      senderTokens: publicKeys.senderTokens,
      recipient: publicKeys.recipient,
      recipientTokens: publicKeys.recipientTokens,
      mint: publicKeys.mint,
      escrowTokens: publicKeys.escrowTokens,
      streamflowTreasury: publicKeys.streamflowTreasury,
      streamflowTreasuryTokens: publicKeys.streamflowTreasuryTokens,
      streamflowFeeTotal: new BN(50),
      streamflowFeeWithdrawn: new BN(10),
      streamflowFeePercent: 0,
      partnerFeeTotal: new BN(20),
      partnerFeeWithdrawn: new BN(5),
      partnerFeePercent: 0,
      partner: publicKeys.partner,
      partnerTokens: publicKeys.partnerTokens,
      start: new BN(0),
      depositedAmount: new BN(1000),
      period: new BN(9999999999),
      amountPerPeriod: new BN(0),
      cliff: new BN(0),
      cliffAmount: new BN(0),
      cancelableBySender: true,
      cancelableByRecipient: false,
      automaticWithdrawal: false,
      transferableBySender: true,
      transferableByRecipient: false,
      canTopup: true,
      name: "hooked stream",
      withdrawFrequency: new BN(0),
      isPda: false,
      nonce: 0,
      closed: false,
      currentPauseStart: new BN(0),
      pauseCumulative: new BN(0),
      lastRateChangeTime: new BN(1),
      fundsUnlockedAtLastRateChange: new BN(400),
      oldMetadata: PublicKey.default,
      payer: PublicKey.default,
      bump: 0,
    });

    const setupTransferHookMint = () => {
      mockGetMintAndProgram.mockResolvedValue({
        tokenProgramId: TOKEN_2022_PROGRAM_ID,
        mint: {} as any,
      });
      mockGetTransferHook.mockReturnValue({ programId: publicKeys.transferHookProgram } as any);
    };

    const setupDecodedStreamInstruction = (...ataAddresses: PublicKey[]) => {
      const decodedStream = createDecodedStream();

      setupTransferHookMint();
      mockDecodeStream.mockReturnValue(decodedStream as any);
      (instance as any).connection.getAccountInfo.mockResolvedValue({ data: Buffer.alloc(1) });

      ataAddresses.forEach((address) => {
        mockAta.mockResolvedValueOnce(address);
      });

      return decodedStream;
    };

    const expectTransferHookCalls = (
      instruction: unknown,
      calls: ReadonlyArray<{ source: PublicKey; destination: unknown; owner: unknown }>,
    ) => {
      calls.forEach(({ source, destination, owner }, index) => {
        expect(mockAddExtraAccountMetasForExecute).toHaveBeenNthCalledWith(
          index + 1,
          (instance as any).connection,
          instruction,
          publicKeys.transferHookProgram,
          source,
          publicKeys.mint,
          destination,
          owner,
          1n,
          "confirmed",
        );
      });
    };

    describe("transfer hook: linear", () => {
      test("adds transfer hook accounts to create instructions", async () => {
        setupTransferHookMint();
        mockAta.mockResolvedValue(publicKeys.senderTokens);

        const result = await instance.prepareCreateLinearStreamInstructions(
          {
            recipient: publicKeys.recipient.toBase58(),
            amount: new BN(1000),
            tokenId: publicKeys.mint.toBase58(),
            name: "Hooked Stream",
            cliffAmount: new BN(100),
            amountPerPeriod: new BN(50),
            period: 86400,
            start: 10,
            cliff: 10,
            cancelableBySender: true,
            cancelableByRecipient: false,
            transferableBySender: true,
            transferableByRecipient: false,
            canTopup: true,
            automaticWithdrawal: false,
            withdrawalFrequency: 0,
            canPause: false,
            canUpdateRate: false,
          },
          {
            sender: { publicKey: publicKeys.sender },
          },
        );

        expect(result.ixs.at(-1)).toBeDefined();
        expectTransferHookCalls(result.ixs.at(-1), [
          {
            source: publicKeys.senderTokens,
            destination: expect.any(PublicKey),
            owner: publicKeys.sender,
          },
        ]);
      });

      test("adds transfer hook validation accounts to withdraw instructions", async () => {
        const decodedStream = setupDecodedStreamInstruction(
          publicKeys.streamflowTreasuryTokens,
          publicKeys.partnerTokens,
        );

        const result = await instance.prepareWithdrawInstructions(
          { id: publicKeys.stream.toBase58() },
          {
            invoker: { publicKey: publicKeys.invoker },
            checkTokenAccounts: false,
          },
        );

        expectTransferHookCalls(result.at(-1), [
          {
            source: decodedStream.escrowTokens,
            destination: decodedStream.recipientTokens,
            owner: publicKeys.stream,
          },
          {
            source: decodedStream.escrowTokens,
            destination: publicKeys.streamflowTreasuryTokens,
            owner: publicKeys.stream,
          },
          {
            source: decodedStream.escrowTokens,
            destination: publicKeys.partnerTokens,
            owner: publicKeys.stream,
          },
        ]);
      });

      test("adds transfer hook validation accounts to cancel instructions", async () => {
        const decodedStream = setupDecodedStreamInstruction(
          publicKeys.streamflowTreasuryTokens,
          publicKeys.partnerTokens,
        );

        const result = await instance.prepareCancelLinearStream(
          { id: publicKeys.stream.toBase58() },
          {
            invoker: { publicKey: publicKeys.invoker },
            checkTokenAccounts: false,
          },
        );

        expectTransferHookCalls(result.at(-1), [
          {
            source: decodedStream.escrowTokens,
            destination: decodedStream.recipientTokens,
            owner: publicKeys.stream,
          },
          {
            source: decodedStream.escrowTokens,
            destination: publicKeys.streamflowTreasuryTokens,
            owner: publicKeys.stream,
          },
          {
            source: decodedStream.escrowTokens,
            destination: publicKeys.partnerTokens,
            owner: publicKeys.stream,
          },
          {
            source: decodedStream.escrowTokens,
            destination: decodedStream.senderTokens,
            owner: publicKeys.stream,
          },
        ]);
      });

      test("adds transfer hook validation accounts to topup instructions", async () => {
        const decodedStream = setupDecodedStreamInstruction();
        (instance as any).getTotalFee = vi.fn().mockResolvedValue(0);

        const result = await instance.prepareTopupInstructions(
          { id: publicKeys.stream.toBase58(), amount: new BN(100) },
          {
            invoker: { publicKey: publicKeys.invoker } as unknown as Keypair,
            isNative: false,
          },
        );

        expectTransferHookCalls(result.at(-1), [
          {
            source: decodedStream.senderTokens,
            destination: decodedStream.escrowTokens,
            owner: publicKeys.invoker,
          },
        ]);
      });
    });

    describe("transfer hook: aligned", () => {
      test("adds partnerLink before transfer hook accounts for create remaining accounts", async () => {
        setupTransferHookMint();
        mockAta.mockResolvedValueOnce(publicKeys.senderTokens).mockResolvedValueOnce(publicKeys.proxyTokens);

        const result = await instance.prepareCreateAlignedUnlockInstructions(
          {
            recipient: publicKeys.recipient.toBase58(),
            amount: new BN(1000),
            tokenId: publicKeys.mint.toBase58(),
            name: "Hooked Aligned Stream",
            cliffAmount: new BN(100),
            amountPerPeriod: new BN(50),
            period: 86400,
            start: 10,
            cliff: 10,
            cancelableBySender: true,
            cancelableByRecipient: false,
            transferableBySender: true,
            transferableByRecipient: false,
            canTopup: true,
            partnerLink: { address: publicKeys.partnerLink.toBase58(), isSigner: true },
            minPrice: new BN(1),
            maxPrice: new BN(2),
            minPercentage: new BN(0),
            maxPercentage: new BN(100),
          },
          {
            sender: { publicKey: publicKeys.sender },
          },
        );

        expect(result.ixs.at(-1)?.keys).toEqual([{ pubkey: publicKeys.partnerLink, isSigner: true, isWritable: false }]);
        expectTransferHookCalls(result.ixs.at(-1), [
          {
            source: publicKeys.senderTokens,
            destination: publicKeys.proxyTokens,
            owner: publicKeys.sender,
          },
          {
            source: publicKeys.proxyTokens,
            destination: expect.any(PublicKey),
            owner: expect.any(PublicKey),
          },
        ]);
      });

      test("adds transfer hook validation accounts to cancel remaining accounts", async () => {
        const decodedStream = setupDecodedStreamInstruction(
          publicKeys.senderTokens,
          publicKeys.recipientTokens,
          publicKeys.streamflowTreasuryTokens,
          publicKeys.partnerTokens,
          publicKeys.proxyTokens,
        );

        const result = await instance.prepareCancelAlignedUnlockInstructions(
          { id: publicKeys.stream.toBase58() },
          {
            invoker: { publicKey: publicKeys.invoker },
            checkTokenAccounts: false,
          },
        );

        expectTransferHookCalls(result.at(-1), [
          {
            source: decodedStream.escrowTokens,
            destination: publicKeys.recipientTokens,
            owner: publicKeys.stream,
          },
          {
            source: decodedStream.escrowTokens,
            destination: publicKeys.streamflowTreasuryTokens,
            owner: publicKeys.stream,
          },
          {
            source: decodedStream.escrowTokens,
            destination: publicKeys.partnerTokens,
            owner: publicKeys.stream,
          },
          {
            source: decodedStream.escrowTokens,
            destination: publicKeys.proxyTokens,
            owner: publicKeys.stream,
          },
          {
            source: publicKeys.proxyTokens,
            destination: publicKeys.senderTokens,
            owner: expect.any(PublicKey),
          },
        ]);
      });
    });
  });

  describe("buildCreateMultipleTransactions", () => {
    test("should build multiple transactions for multiple recipients without signing", async () => {
      // Arrange
      const senderPublicKey = new PublicKey("11111111111111111111111111111112");
      const mockData = {
        tokenId: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC mint
        partner: undefined,
        recipients: [
          {
            recipient: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            amount: new BN(1000),
            name: "Stream 1",
            cliffAmount: new BN(100),
            amountPerPeriod: new BN(50),
          },
          {
            recipient: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
            amount: new BN(2000),
            name: "Stream 2",
            cliffAmount: new BN(200),
            amountPerPeriod: new BN(100),
          },
          {
            recipient: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
            amount: new BN(1500),
            name: "Stream 3",
            cliffAmount: new BN(150),
            amountPerPeriod: new BN(75),
          },
        ],
        period: 86400,
        start: Math.floor(Date.now() / 1000),
        cliff: 86400 * 7,
        cancelableBySender: true,
        cancelableByRecipient: false,
        transferableBySender: true,
        transferableByRecipient: false,
        canTopup: true,
        automaticWithdrawal: false,
        withdrawalFrequency: 86400,
        canPause: false,
        canUpdateRate: false,
      };

      const mockExtParams = {
        sender: { publicKey: senderPublicKey },
        isNative: false,
      };

      // Act
      const result = await instance.buildCreateMultipleTransactions(mockData, mockExtParams);

      // Assert
      expect(result).toHaveProperty("transactions");
      expect(result).toHaveProperty("metadatas");
      expect(result).toHaveProperty("metadataToRecipient");
      expect(result).toHaveProperty("hash");
      expect(result).toHaveProperty("context");

      expect(Array.isArray(result.transactions)).toBe(true);
      expect(Array.isArray(result.metadatas)).toBe(true);
      expect(typeof result.metadataToRecipient).toBe("object");
      expect(typeof result.hash).toBe("object");

      // Should have one transaction per recipient
      expect(result.transactions).toHaveLength(3);
      expect(result.metadatas).toHaveLength(3);

      // Each transaction should have the expected structure
      result.transactions.forEach((item) => {
        expect(item).toHaveProperty("tx");
        expect(item).toHaveProperty("recipient");
        expect(typeof item.recipient).toBe("string");
      });

      // Verify metadataToRecipient mapping
      expect(Object.keys(result.metadataToRecipient)).toHaveLength(3);
      Object.values(result.metadataToRecipient).forEach((recipient) => {
        expect(recipient).toHaveProperty("recipient");
        expect(recipient).toHaveProperty("amount");
        expect(recipient).toHaveProperty("name");
      });
    });

    test("should build multiple transactions with native SOL and include wrap instructions per recipient", async () => {
      // Arrange
      const senderPublicKey = new PublicKey("11111111111111111111111111111112");
      const mockData = {
        tokenId: "So11111111111111111111111111111111111111112", // SOL mint
        partner: undefined,
        recipients: [
          {
            recipient: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            amount: new BN(1000000000), // 1 SOL
            name: "SOL Stream 1",
            cliffAmount: new BN(100000000),
            amountPerPeriod: new BN(50000000),
          },
          {
            recipient: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
            amount: new BN(2000000000), // 2 SOL
            name: "SOL Stream 2",
            cliffAmount: new BN(200000000),
            amountPerPeriod: new BN(100000000),
          },
        ],
        period: 86400,
        start: Math.floor(Date.now() / 1000),
        cliff: 86400 * 7,
        cancelableBySender: true,
        cancelableByRecipient: false,
        transferableBySender: true,
        transferableByRecipient: false,
        canTopup: true,
        automaticWithdrawal: false,
        withdrawalFrequency: 86400,
        canPause: false,
        canUpdateRate: false,
      };

      const mockExtParams = {
        sender: { publicKey: senderPublicKey },
        isNative: true,
      };

      // Mock prepareWrappedAccount to return instructions for native SOL
      const mockInstruction = {
        programId: new PublicKey("11111111111111111111111111111112"),
        keys: [],
        data: Buffer.alloc(0),
      };
      mockPrepareWrappedAccount.mockResolvedValue([mockInstruction]);

      // Act
      const result = await instance.buildCreateMultipleTransactions(mockData, mockExtParams);

      // Assert
      expect(result).toHaveProperty("transactions");
      expect(result).toHaveProperty("metadatas");
      expect(result).toHaveProperty("metadataToRecipient");
      expect(result).toHaveProperty("hash");
      expect(result).toHaveProperty("context");
      expect(result).toHaveProperty("prepareTx");

      // Should have one transaction per recipient
      expect(result.transactions).toHaveLength(2);
      expect(result.metadatas).toHaveLength(2);

      // Wrap instructions are now included in each recipient's transaction, not in a separate prepareTx
      expect(result.prepareTx).toBeUndefined();
      // prepareWrappedAccount should be called once per recipient
      expect(mockPrepareWrappedAccount).toHaveBeenCalledTimes(2);
    });

    test("should throw error when recipients array is empty", async () => {
      // Arrange
      const senderPublicKey = new PublicKey("11111111111111111111111111111112");
      const mockData = {
        tokenId: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        partner: undefined,
        recipients: [], // Empty array
        period: 86400,
        start: Math.floor(Date.now() / 1000),
        cliff: 86400 * 7,
        cancelableBySender: true,
        cancelableByRecipient: false,
        transferableBySender: true,
        transferableByRecipient: false,
        canTopup: true,
        automaticWithdrawal: false,
        withdrawalFrequency: 86400,
        canPause: false,
        canUpdateRate: false,
      };

      const mockExtParams = {
        sender: { publicKey: senderPublicKey },
        isNative: false,
      };

      // Act & Assert
      await expect(instance.buildCreateMultipleTransactions(mockData, mockExtParams)).rejects.toThrow(
        "Recipients array is empty!",
      );
    });
  });

  describe("create", () => {
    test("should create a stream and return transaction signature", async () => {
      // Arrange
      const mockSender = {
        publicKey: new PublicKey("11111111111111111111111111111112"),
        signTransaction: vi.fn(),
        signAllTransactions: vi.fn(),
      };

      const mockData = {
        recipient: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        amount: new BN(1000),
        tokenId: "So11111111111111111111111111111111111111112", // SOL mint
        name: "Test Stream",
        cliffAmount: new BN(100),
        amountPerPeriod: new BN(50),
        period: 86400, // 1 day
        start: Math.floor(Date.now() / 1000),
        cliff: 86400 * 7, // 7 days
        cancelableBySender: true,
        cancelableByRecipient: false,
        transferableBySender: true,
        transferableByRecipient: false,
        canTopup: true,
        automaticWithdrawal: false,
        withdrawalFrequency: 86400,
        canPause: false,
        canUpdateRate: false,
      };

      const mockExtParams = {
        sender: mockSender as any,
        isNative: false,
      };

      // Act
      const result = await instance.create(mockData, mockExtParams);

      // Assert
      expect(result).toHaveProperty("ixs");
      expect(result).toHaveProperty("txId");
      expect(result).toHaveProperty("metadataId");
      expect(result.txId).toBe("mock-signature");
      expect(typeof result.metadataId).toBe("string");

      // Verify that signAndExecuteTransaction was called
      expect(mockSignAndExecuteTransaction).toHaveBeenCalledWith(
        expect.any(Object), // connection
        mockSender,
        expect.any(Object), // transaction
        expect.any(Object), // transaction context
        expect.any(Object), // scheduling params
      );
    });

    test("should throw error when sender publicKey is not available", async () => {
      // Arrange
      const mockSender = {
        publicKey: undefined,
        signTransaction: vi.fn(),
        signAllTransactions: vi.fn(),
      };

      const mockData = {
        recipient: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        amount: new BN(1000),
        tokenId: "So11111111111111111111111111111111111111112",
        name: "Test Stream",
        cliffAmount: new BN(100),
        amountPerPeriod: new BN(50),
        period: 86400,
        start: Math.floor(Date.now() / 1000),
        cliff: 86400 * 7,
        cancelableBySender: true,
        cancelableByRecipient: false,
        transferableBySender: true,
        transferableByRecipient: false,
        canTopup: true,
        automaticWithdrawal: false,
        withdrawalFrequency: 86400,
        canPause: false,
        canUpdateRate: false,
      };

      const mockExtParams = {
        sender: mockSender as any,
        isNative: false,
      };

      // Act & Assert
      await expect(instance.create(mockData, mockExtParams)).rejects.toThrow(
        "Sender's PublicKey is not available, check passed wallet adapter!",
      );
    });
  });

  describe("createMultiple", () => {
    test("should create multiple streams and return transaction signatures", async () => {
      // Arrange
      const mockSender = {
        publicKey: new PublicKey("11111111111111111111111111111112"),
        signTransaction: vi.fn(),
        signAllTransactions: vi.fn(),
      };

      const mockData = {
        tokenId: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC mint
        partner: undefined,
        recipients: [
          {
            recipient: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            amount: new BN(1000),
            name: "Stream 1",
            cliffAmount: new BN(100),
            amountPerPeriod: new BN(50),
          },
          {
            recipient: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
            amount: new BN(2000),
            name: "Stream 2",
            cliffAmount: new BN(200),
            amountPerPeriod: new BN(100),
          },
        ],
        period: 86400,
        start: Math.floor(Date.now() / 1000),
        cliff: 86400 * 7,
        cancelableBySender: true,
        cancelableByRecipient: false,
        transferableBySender: true,
        transferableByRecipient: false,
        canTopup: true,
        automaticWithdrawal: false,
        withdrawalFrequency: 86400,
        canPause: false,
        canUpdateRate: false,
      };

      const mockExtParams = {
        sender: mockSender as any,
        isNative: false,
      };

      // Mock executeMultipleTransactions to return multiple signatures
      mockExecuteMultipleTransactions.mockResolvedValue([
        { status: "fulfilled", value: "signature-1" },
        { status: "fulfilled", value: "signature-2" },
      ]);

      // Act
      const result = await instance.createMultiple(mockData, mockExtParams);

      // Assert
      expect(result).toHaveProperty("txs");
      expect(result).toHaveProperty("metadatas");
      expect(result).toHaveProperty("metadataToRecipient");
      expect(result).toHaveProperty("errors");

      expect(Array.isArray(result.txs)).toBe(true);
      expect(Array.isArray(result.metadatas)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.metadataToRecipient).toBe("object");

      expect(result.txs).toHaveLength(2);
      expect(result.txs).toEqual(["signature-1", "signature-2"]);
      expect(result.errors).toHaveLength(0);

      // Verify that signAllTransactionWithRecipients was called
      expect(mockSignAllTransactionWithRecipients).toHaveBeenCalledWith(
        mockSender,
        expect.any(Array), // batch transactions
      );
    });

    test("should handle transaction failures in createMultiple", async () => {
      // Arrange
      const mockSender = {
        publicKey: new PublicKey("11111111111111111111111111111112"),
        signTransaction: vi.fn(),
        signAllTransactions: vi.fn(),
      };

      const mockData = {
        tokenId: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        partner: undefined,
        recipients: [
          {
            recipient: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            amount: new BN(1000),
            name: "Stream 1",
            cliffAmount: new BN(100),
            amountPerPeriod: new BN(50),
          },
        ],
        period: 86400,
        start: Math.floor(Date.now() / 1000),
        cliff: 86400 * 7,
        cancelableBySender: true,
        cancelableByRecipient: false,
        transferableBySender: true,
        transferableByRecipient: false,
        canTopup: true,
        automaticWithdrawal: false,
        withdrawalFrequency: 86400,
        canPause: false,
        canUpdateRate: false,
      };

      const mockExtParams = {
        sender: mockSender as any,
        isNative: false,
      };

      // Mock executeMultipleTransactions to return a failure
      mockExecuteMultipleTransactions.mockResolvedValue([
        { status: "rejected", reason: new Error("Transaction failed") },
      ]);

      // Act
      const result = await instance.createMultiple(mockData, mockExtParams);

      // Assert
      expect(result.txs).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toHaveProperty("recipient");
      expect(result.errors[0]).toHaveProperty("error");
      expect(result.errors[0].recipient).toBe("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    });

    test("should throw error when recipients array is empty in createMultiple", async () => {
      // Arrange
      const mockSender = {
        publicKey: new PublicKey("11111111111111111111111111111112"),
        signTransaction: vi.fn(),
        signAllTransactions: vi.fn(),
      };

      const mockData = {
        tokenId: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        partner: undefined,
        recipients: [], // Empty array
        period: 86400,
        start: Math.floor(Date.now() / 1000),
        cliff: 86400 * 7,
        cancelableBySender: true,
        cancelableByRecipient: false,
        transferableBySender: true,
        transferableByRecipient: false,
        canTopup: true,
        automaticWithdrawal: false,
        withdrawalFrequency: 86400,
        canPause: false,
        canUpdateRate: false,
      };

      const mockExtParams = {
        sender: mockSender as any,
        isNative: false,
      };

      // Act & Assert
      await expect(instance.createMultiple(mockData, mockExtParams)).rejects.toThrow("Recipients array is empty!");
    });
  });

  describe("createMultipleSequential", () => {
    test("should create multiple streams sequentially and return transaction signatures", async () => {
      // Arrange
      const mockSender = {
        publicKey: new PublicKey("11111111111111111111111111111112"),
        signTransaction: vi.fn(),
        signAllTransactions: vi.fn(),
      };

      const mockData = {
        tokenId: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC mint
        partner: undefined,
        recipients: [
          {
            recipient: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            amount: new BN(1000),
            name: "Stream 1",
            cliffAmount: new BN(100),
            amountPerPeriod: new BN(50),
          },
          {
            recipient: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
            amount: new BN(2000),
            name: "Stream 2",
            cliffAmount: new BN(200),
            amountPerPeriod: new BN(100),
          },
        ],
        period: 86400,
        start: Math.floor(Date.now() / 1000),
        cliff: 86400 * 7,
        cancelableBySender: true,
        cancelableByRecipient: false,
        transferableBySender: true,
        transferableByRecipient: false,
        canTopup: true,
        automaticWithdrawal: false,
        withdrawalFrequency: 86400,
        canPause: false,
        canUpdateRate: false,
      };

      const mockExtParams = {
        sender: mockSender as any,
        isNative: false,
      };

      // Mock the buildCreateMultipleTransactionInstructions to return no metadata
      const buildInstructionsSpy = vi.spyOn(instance, "buildCreateMultipleTransactionInstructions");
      buildInstructionsSpy.mockResolvedValue({
        instructionsBatch: [
          { ixs: [], metadata: undefined, recipient: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
          { ixs: [], metadata: undefined, recipient: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" },
        ],
        metadatas: ["metadata-1", "metadata-2"],
        metadataToRecipient: {
          "metadata-1": {
            recipient: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            amount: new BN(1000),
            name: "Stream 1",
            cliffAmount: new BN(100),
            amountPerPeriod: new BN(50),
          },
          "metadata-2": {
            recipient: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
            amount: new BN(2000),
            name: "Stream 2",
            cliffAmount: new BN(200),
            amountPerPeriod: new BN(100),
          },
        },
        prepareInstructions: [],
      });

      // Mock executeTransaction to be called multiple times
      let callCount = 0;
      mockExecuteTransaction.mockImplementation(() => {
        callCount++;
        return Promise.resolve(`signature-${callCount}`);
      });

      // Act
      const result = await instance.createMultipleSequential(mockData, mockExtParams);

      // Assert
      expect(result).toHaveProperty("txs");
      expect(result).toHaveProperty("metadatas");
      expect(result).toHaveProperty("metadataToRecipient");
      expect(result).toHaveProperty("errors");

      expect(Array.isArray(result.txs)).toBe(true);
      expect(Array.isArray(result.metadatas)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.metadataToRecipient).toBe("object");

      // Basic functionality test - should have at least one transaction
      expect(result.txs.length).toBeGreaterThan(0);
      expect(result.metadatas).toEqual(["metadata-1", "metadata-2"]);

      // Verify that signAllTransactionWithRecipients was called
      expect(mockSignAllTransactionWithRecipients).toHaveBeenCalledWith(
        mockSender,
        expect.any(Array), // batch transactions
      );

      // Verify executeTransaction was called at least once
      expect(mockExecuteTransaction).toHaveBeenCalled();
    });

    test("should handle transaction failures in createMultipleSequential", async () => {
      // Arrange
      const mockSender = {
        publicKey: new PublicKey("11111111111111111111111111111112"),
        signTransaction: vi.fn(),
        signAllTransactions: vi.fn(),
      };

      const mockData = {
        tokenId: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        partner: undefined,
        recipients: [
          {
            recipient: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            amount: new BN(1000),
            name: "Stream 1",
            cliffAmount: new BN(100),
            amountPerPeriod: new BN(50),
          },
          {
            recipient: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
            amount: new BN(2000),
            name: "Stream 2",
            cliffAmount: new BN(200),
            amountPerPeriod: new BN(100),
          },
        ],
        period: 86400,
        start: Math.floor(Date.now() / 1000),
        cliff: 86400 * 7,
        cancelableBySender: true,
        cancelableByRecipient: false,
        transferableBySender: true,
        transferableByRecipient: false,
        canTopup: true,
        automaticWithdrawal: false,
        withdrawalFrequency: 86400,
        canPause: false,
        canUpdateRate: false,
      };

      const mockExtParams = {
        sender: mockSender as any,
        isNative: false,
      };

      // Mock the buildCreateMultipleTransactionInstructions to return no metadata
      const buildInstructionsSpy = vi.spyOn(instance, "buildCreateMultipleTransactionInstructions");
      buildInstructionsSpy.mockResolvedValue({
        instructionsBatch: [
          { ixs: [], metadata: undefined, recipient: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
          { ixs: [], metadata: undefined, recipient: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" },
        ],
        metadatas: ["metadata-1", "metadata-2"],
        metadataToRecipient: {
          "metadata-1": {
            recipient: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            amount: new BN(1000),
            name: "Stream 1",
            cliffAmount: new BN(100),
            amountPerPeriod: new BN(50),
          },
          "metadata-2": {
            recipient: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
            amount: new BN(2000),
            name: "Stream 2",
            cliffAmount: new BN(200),
            amountPerPeriod: new BN(100),
          },
        },
        prepareInstructions: [],
      });

      // Mock executeTransaction to succeed first, then fail
      let callCount = 0;
      mockExecuteTransaction.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve("signature-1");
        } else {
          return Promise.reject(new Error("Transaction failed"));
        }
      });

      // Act
      const result = await instance.createMultipleSequential(mockData, mockExtParams);

      // Assert
      expect(result).toHaveProperty("txs");
      expect(result).toHaveProperty("errors");
      expect(Array.isArray(result.txs)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);

      // Should have processed transactions and captured any errors
      expect(result.txs.length + result.errors.length).toBeGreaterThan(0);
    });

    test("should throw error when recipients array is empty in createMultipleSequential", async () => {
      // Arrange
      const mockSender = {
        publicKey: new PublicKey("11111111111111111111111111111112"),
        signTransaction: vi.fn(),
        signAllTransactions: vi.fn(),
      };

      const mockData = {
        tokenId: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        partner: undefined,
        recipients: [], // Empty array
        period: 86400,
        start: Math.floor(Date.now() / 1000),
        cliff: 86400 * 7,
        cancelableBySender: true,
        cancelableByRecipient: false,
        transferableBySender: true,
        transferableByRecipient: false,
        canTopup: true,
        automaticWithdrawal: false,
        withdrawalFrequency: 86400,
        canPause: false,
        canUpdateRate: false,
      };

      const mockExtParams = {
        sender: mockSender as any,
        isNative: false,
      };

      // Act & Assert
      await expect(instance.createMultipleSequential(mockData, mockExtParams)).rejects.toThrow(
        "Recipients array is empty!",
      );
    });
  });
});
