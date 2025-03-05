import { defineConfig } from "tsup";

import { createPackageConfig } from "../../tsup.config.base.js";

export default defineConfig(
  createPackageConfig({
    entry: {
      index: "index.ts",
      "solana/index": "solana/index.ts",
    },
    external: ["aptos"],
  }),
);
