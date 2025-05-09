import { defineConfig } from "tsup";

import { createPackageConfig } from "../../tsup.config.base.js";

export default defineConfig(
  createPackageConfig({
    entry: {
      index: "index.ts",
      "solana/index": "solana/index.ts",
      "solana/descriptor/merkle_distributor": "solana/descriptor/merkle_distributor.ts",
      "solana/descriptor/aligned_distributor": "solana/descriptor/aligned_distributor.ts",
    },
  }),
);
