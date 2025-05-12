import { defineConfig } from "tsup";

import { createPackageConfig } from "../../tsup.config.base.js";

export default defineConfig(
  createPackageConfig({
    entry: {
      index: "index.ts",
      "aptos/index": "aptos/index.ts",
      "evm/index": "evm/index.ts",
      "solana/index": "solana/index.ts",
      "sui/index": "sui/index.ts",
      "solana/descriptor/streamflow_aligned_unlocks": "solana/descriptor/streamflow_aligned_unlocks.ts",
    },
    external: [
      "@coral-xyz/anchor",
      "@manahippo/aptos-wallet-adapter",
      "@mysten/sui",
      "@suiet/wallet-kit",
      "aptos",
      "ethereum-checksum-address",
      "ethers",
    ],
    noExternal: [],
  }),
);
