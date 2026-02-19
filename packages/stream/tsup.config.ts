import { defineConfig } from "tsup";

import { createPackageConfig } from "../../tsup.config.base.js";

export default defineConfig((options) =>
  createPackageConfig({
    entry: {
      index: "index.ts",
      "solana/index": "solana/index.ts",
      "solana/descriptor/streamflow_aligned_unlocks": "solana/descriptor/streamflow_aligned_unlocks.ts",
    },
    external: [
      "@coral-xyz/anchor",
    ],
    noExternal: [],
  })(options),
);
