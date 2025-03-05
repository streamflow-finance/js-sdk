import { defineConfig } from "tsup";

import { createPackageConfig } from "../../tsup.config.base.js";

export default defineConfig(
  createPackageConfig({
    entry: {
      index: "index.ts",
      "solana/descriptor/streamflow_launchpad": "solana/descriptor/streamflow_launchpad.ts",
    },
  }),
);
