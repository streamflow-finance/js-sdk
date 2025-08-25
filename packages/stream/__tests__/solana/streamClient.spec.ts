import { BN } from "bn.js";
import { describe, expect, test, beforeEach, vi } from "vitest";
import { PublicKey, type VersionedTransaction } from "@solana/web3.js";

import { SolanaStreamClient } from "../../solana/StreamClient.js";
import { ICluster } from "../../common/types.js";

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
vi.mock("@streamflow/common/solana", () => ({
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
}));

vi.mock("@coral-xyz/anchor", () => ({
  Program: vi.fn().mockImplementation(() => ({
    programId: new PublicKey("11111111111111111111111111111111"),
    methods: {
      create: vi.fn(() => ({
        accountsPartial: vi.fn(() => ({
          instruction: vi.fn(() =>
            Promise.resolve({
              keys: [],
              programId: new PublicKey("11111111111111111111111111111111"),
              data: Buffer.alloc(0),
            }),
          ),
        })),
      })),
    },
  })),
}));

// Mock Solana-specific utils
vi.mock("../../solana/lib/utils.js", () => ({
  signAllTransactionWithRecipients: vi.fn(),
  sendAndConfirmStreamRawTransaction: vi.fn(),
  extractSolanaErrorCode: vi.fn(),
}));

describe("SolanaStreamClient Transaction Builders", async () => {
  let instance: SolanaStreamClient;

  // Access mocked functions
  const mockPrepareTransaction = vi.mocked(await import("@streamflow/common/solana")).prepareTransaction;
  const mockGetMintAndProgram = vi.mocked(await import("@streamflow/common/solana")).getMintAndProgram;
  const mockAta = vi.mocked(await import("@streamflow/common/solana")).ata;
  const mockCheckOrCreateAtaBatch = vi.mocked(await import("@streamflow/common/solana")).checkOrCreateAtaBatch;
  const mockPrepareBaseInstructions = vi.mocked(await import("@streamflow/common/solana")).prepareBaseInstructions;
  const mockCreateVersionedTransaction = vi.mocked(
    await import("@streamflow/common/solana"),
  ).createVersionedTransaction;
  const mockPrepareWrappedAccount = vi.mocked(await import("@streamflow/common/solana")).prepareWrappedAccount;
  const mockSignAndExecuteTransaction = vi.mocked(await import("@streamflow/common/solana")).signAndExecuteTransaction;
  const mockExecuteTransaction = vi.mocked(await import("@streamflow/common/solana")).executeTransaction;
  const mockExecuteMultipleTransactions = vi.mocked(
    await import("@streamflow/common/solana"),
  ).executeMultipleTransactions;

  // Access Solana-specific mocked functions
  const mockSignAllTransactionWithRecipients = vi.mocked(
    await import("../../solana/lib/utils.js"),
  ).signAllTransactionWithRecipients;
  const mockSendAndConfirmStreamRawTransaction = vi.mocked(
    await import("../../solana/lib/utils.js"),
  ).sendAndConfirmStreamRawTransaction;
  const mockExtractSolanaErrorCode = vi.mocked(await import("../../solana/lib/utils.js")).extractSolanaErrorCode;

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
        senderPublicKey,
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
        senderPublicKey,
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
        senderPublicKey,
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

    test("should build multiple transactions with native SOL and include prepare transaction", async () => {
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
        senderPublicKey,
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

      // Should have a prepare transaction for native SOL handling
      expect(result.prepareTx).toBeDefined();
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
        senderPublicKey,
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
