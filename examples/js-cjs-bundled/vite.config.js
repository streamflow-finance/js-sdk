const { defineConfig } = require("vite");
const { resolve } = require("path");

module.exports = defineConfig(({ mode }) => {
  const isVerify = mode === "verify";

  return {
    build: {
      lib: {
        entry: resolve(__dirname, isVerify ? "src/verify-module-type.js" : "src/index.js"),
        formats: ["cjs"],
        fileName: isVerify ? "verify-module-type" : "index",
      },
      target: "node18",
      outDir: "dist",
      sourcemap: true,
      // Don't empty the output directory when building the verification script
      emptyOutDir: !isVerify,
    },
    cacheDir: "dist/.vite",
  };
});
