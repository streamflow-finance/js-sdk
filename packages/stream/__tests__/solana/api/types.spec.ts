import { Connection, PublicKey } from "@solana/web3.js";
import { ICluster } from "@streamflow/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type SolanaStreamClient } from "../../../solana/StreamClient.js";

vi.mock("../../../solana/StreamClient.js", () => ({
  SolanaStreamClient: vi.fn().mockImplementation(() => ({})),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveConnection()", () => {
  async function imp() {
    const { resolveConnection } = await import("../../../solana/api/types.js");
    return resolveConnection;
  }

  it("returns env.connection when connection property exists", async () => {
    const resolveConnection = await imp();
    const conn = new Connection("https://api.mainnet-beta.solana.com");
    const result = resolveConnection({ connection: conn, cluster: ICluster.Mainnet, programId: PublicKey.unique() });
    expect(result).toBe(conn);
  });

  it("creates new Connection(rpcUrl, { commitment }) when using rpcUrl env", async () => {
    const resolveConnection = await imp();
    const result = resolveConnection({
      rpcUrl: "https://api.devnet.solana.com",
      programId: PublicKey.unique(),
      commitment: "finalized",
    });
    expect(result).toBeInstanceOf(Connection);
    expect(result.commitment).toBe("finalized");
  });
});

describe("createClientFromEnv()", () => {
  async function imp() {
    const { createClientFromEnv } = await import("../../../solana/api/types.js");
    return createClientFromEnv;
  }

  it("returns env.client directly when provided (short-circuit)", async () => {
    const createClientFromEnv = await imp();
    const mockClient = {} as SolanaStreamClient;
    const result = createClientFromEnv({
      client: mockClient,
      rpcUrl: "https://api.mainnet-beta.solana.com",
      programId: PublicKey.unique(),
    });
    expect(result).toBe(mockClient);
  });

  it("constructs SolanaStreamClient with connection/cluster/commitment/programId for connection-based env", async () => {
    const { SolanaStreamClient: MockClient } = await import("../../../solana/StreamClient.js");
    const createClientFromEnv = await imp();
    const conn = new Connection("https://api.mainnet-beta.solana.com");
    const programId = PublicKey.unique();
    createClientFromEnv({ connection: conn, cluster: ICluster.Devnet, programId, commitment: "confirmed" });
    expect(vi.mocked(MockClient)).toHaveBeenCalledWith({
      connection: conn,
      cluster: ICluster.Devnet,
      commitment: "confirmed",
      programId: programId.toBase58(),
    });
  });

  it("constructs SolanaStreamClient with rpcUrl/cluster/commitment/programId for rpcUrl-based env", async () => {
    const { SolanaStreamClient: MockClient } = await import("../../../solana/StreamClient.js");
    const createClientFromEnv = await imp();
    const programId = PublicKey.unique();
    createClientFromEnv({
      rpcUrl: "https://api.devnet.solana.com",
      cluster: ICluster.Devnet,
      programId,
      commitment: "confirmed",
    });
    expect(vi.mocked(MockClient)).toHaveBeenCalledWith(
      "https://api.devnet.solana.com",
      ICluster.Devnet,
      "confirmed",
      programId.toBase58(),
    );
  });

  it("defaults cluster to ICluster.Mainnet when not specified in rpcUrl env", async () => {
    const { SolanaStreamClient: MockClient } = await import("../../../solana/StreamClient.js");
    const createClientFromEnv = await imp();
    const programId = PublicKey.unique();
    createClientFromEnv({ rpcUrl: "https://api.mainnet-beta.solana.com", programId });
    expect(vi.mocked(MockClient)).toHaveBeenCalledWith(
      "https://api.mainnet-beta.solana.com",
      ICluster.Mainnet,
      undefined,
      programId.toBase58(),
    );
  });
});
