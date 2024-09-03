import { Wallet } from "ethers";
import { describe, expect, test } from "vitest";

import { StreamflowAptos, StreamflowEVM, StreamflowSolana, StreamflowSui } from "../../index.js";
import {
  default as GenericStreamClient,
  SolanaStreamClientOptions,
  SuiStreamClientOptions,
  AptosStreamClientOptions,
  EvmStreamClientOptions,
} from "../../common/GenericStreamClient.js";
import { IChain, ICluster } from "../../common/types.js";
import { BaseStreamClient } from "../../common/BaseStreamClient.js";

type StreamClientOptions =
  | SolanaStreamClientOptions
  | SuiStreamClientOptions
  | AptosStreamClientOptions
  | EvmStreamClientOptions;

type ClientConstructor<T extends BaseStreamClient> = new (...args: any[]) => T;

type TestClientConfig<T extends BaseStreamClient> = StreamClientOptions & {
  expected: ClientConstructor<T>;
};

describe("GenericStreamClient", () => {
  describe.each<TestClientConfig<BaseStreamClient>>([
    {
      chain: IChain.Aptos,
      cluster: ICluster.Devnet,
      clusterUrl: "https://cluster",
      expected: StreamflowAptos.AptosStreamClient,
    },
    {
      chain: IChain.Solana,
      cluster: ICluster.Devnet,
      clusterUrl: "https://cluster",
      expected: StreamflowSolana.SolanaStreamClient,
    },
    {
      chain: IChain.Ethereum,
      cluster: ICluster.Devnet,
      clusterUrl: "https://cluster",
      signer: Wallet.createRandom(),
      expected: StreamflowEVM.EvmStreamClient,
    },
    {
      chain: IChain.Sui,
      cluster: ICluster.Devnet,
      clusterUrl: "https://cluster",
      expected: StreamflowSui.SuiStreamClient,
    },
  ])(".init($chain)", (config) => {
    test("should successfully create GenericStreamClient instance", () => {
      const instance = new GenericStreamClient(config);

      expect(instance).toBeInstanceOf(GenericStreamClient);
      expect(instance.nativeStreamClient).toBeInstanceOf(config.expected);
    });
  });
});
