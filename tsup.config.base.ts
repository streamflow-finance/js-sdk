import type { Options } from "tsup";

export const baseConfig: Options = {
  clean: true,
  dts: true,
  format: ["esm", "cjs"],
  splitting: false,
  sourcemap: true,
  platform: "neutral",
  target: "es2020",
  treeshake: true,
  minify: false,
  bundle: true,
  outDir: "dist",
  tsconfig: "./tsconfig.json",
};

// Common external dependencies across packages
export const commonExternals = [
  "@coral-xyz/borsh",
  "@solana/buffer-layout",
  "@solana/spl-token",
  "@solana/wallet-adapter-base",
  "@solana/web3.js",
  "bn.js",
  "borsh",
  // Node.js built-in modules that should be external
  "buffer",
  "crypto",
  "stream",
  "util",
  "events",
  "assert",
  "path",
  "fs",
  "os",
];

export const commonNoExternals = ["p-queue", "p-retry"];

// Helper to create package config. Returns a function so tsup can pass watch options.
// When watch is true, clean is false to avoid clearing dist during rebuilds.
export const createPackageConfig = (options: {
  entry: Record<string, string>;
  external?: string[];
  noExternal?: string[];
}) => (tsupOptions?: Pick<Options, "watch">): Options[] => {
  const clean = tsupOptions?.watch ? false : true;
  return [
    // ESM config
    {
      ...baseConfig,
      clean,
      entry: options.entry,
      external: [...commonExternals, ...(options.external || [])],
      noExternal: [...commonNoExternals, ...(options.noExternal || [])],
      format: ["esm"],
      outDir: "dist/esm",
    },
    // CJS config
    {
      ...baseConfig,
      clean,
      entry: options.entry,
      external: [...commonExternals, ...(options.external || [])],
      noExternal: [...commonNoExternals, ...(options.noExternal || [])],
      format: ["cjs"],
      outDir: "dist/cjs",
    },
  ];
};
