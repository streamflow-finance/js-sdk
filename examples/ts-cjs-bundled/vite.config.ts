import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["cjs"],
      fileName: "index",
    },
    target: "node18",
    outDir: "dist",
    sourcemap: true,
  },
  plugins: [dts(), nodePolyfills()],
  cacheDir: "dist/.vite",
});
