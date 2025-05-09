import { defineConfig } from "tsup";

import { createPackageConfig } from "../../tsup.config.base.js";

export default defineConfig(
  createPackageConfig({
    entry: {
      index: "index.ts",
      "solana/descriptor/reward_pool": "solana/descriptor/reward_pool.ts",
      "solana/descriptor/stake_pool": "solana/descriptor/stake_pool.ts",
      "solana/descriptor/fee_manager": "solana/descriptor/fee_manager.ts",
    },
  }),
);
