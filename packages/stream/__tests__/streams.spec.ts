import StreamClient from "../StreamClient";
import { Cluster } from "../types";
import * as web3 from "@solana/web3.js";
import { getBN } from "../utils";
import { requestAirdrop } from "../airdrop-request";
import { Wallet } from "@project-serum/anchor";
let streamInstance: StreamClient | null = null;
let sender: Wallet;
let recipient: Wallet;
let recipients: Wallet[] = [];
let connection: web3.Connection | null = null;

const CLUSTER_LOCAL = "local";

const clusterUrls: { [s: string]: () => string } = {
  [CLUSTER_LOCAL]: () => "http://localhost:8899", // http://127.0.0.1:8899",
  [Cluster.Devnet]: () =>
    "https://api.devnet.rpcpool.com/8527ad85d20c2f0e6c37b026cab0",
  [Cluster.Mainnet]: () =>
    "https://streamflow.rpcpool.com/8527ad85d20c2f0e6c37b026cab0",
};
beforeAll(async () => {
  streamInstance = new StreamClient(
    clusterUrls[Cluster.Devnet](),
    Cluster.Devnet,
    {
      commitment: "confirmed",
      disableRetryOnRateLimit: true,
    }
  );
  connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");

  sender = new Wallet(web3.Keypair.generate());
  recipient = new Wallet(web3.Keypair.generate());

  await requestAirdrop(sender, connection);
}, 100000);

test("Sender wallet airdropped funds", async () => {
  expect(await connection?.getBalance(sender.publicKey)).toBeGreaterThan(0);
});

test("Stream client connects to cluster", async () => {
  expect(streamInstance).toBeTruthy();
  const streamInstanceConnection = await streamInstance?.getConnection();
  expect(streamInstanceConnection).toBeTruthy();
});
