# Streamflow JS SDK v8.0.0 Release Notes

## Overview

Version 8.0.0 improves how the Streamflow SDK works with modern JavaScript environments (like ES Modules and CommonJS) and different bundlers. This update makes using the SDK more reliable and predictable across various project setups.

This guide focuses on the steps you need to take in your application to upgrade to v8.

## Migration Steps for Your Application

Here's what you need to do to update your application to use Streamflow SDK v8:

*   **Update Dependencies:** In your `package.json`, change the version for all `@streamflow/*` packages to `^8.0.0` (or the specific v8 release number) and run your package manager's install command (e.g., `npm install`, `yarn install`, `pnpm install`).
*   **Verify Import Paths for Sub-modules:**
    *   If you only import from the main package entry point (e.g., `import { ... } from "@streamflow/stream";` or `require("@streamflow/stream")`), these imports should work without changes.
    *   **If you import directly from sub-paths** (e.g., `@streamflow/distributor/solana` or internal build files like `dist/...`), review these. You should now use the officially supported entry points like `import { MerkleDistributor } from "@streamflow/distributor/solana";`. Check the relevant package's documentation or `package.json` `exports` field if you need specific sub-modules.
*   **Verify IDL JSON Imports:** If you import Streamflow's IDL JSON files directly, ensure you use the correct syntax for your environment:
    *   **ESM/TypeScript:** `import myIdl from "@streamflow/[package_name]/solana/idl/[idl_name].json" with { type: "json" };`
    *   **CommonJS:** `const myIdl = require("@streamflow/[package_name]/solana/idl/[idl_name].json");`
*   **Check Peer Dependencies:** The Streamflow SDK relies on certain external libraries (peer dependencies) that are *not* included directly in the SDK bundles. Ensure the following packages, with at least the specified versions, are listed as dependencies in your project's `package.json` and installed:

    *   **NPM Scoped Packages:**
        *   `@coral-xyz/`
            *   `@coral-xyz/borsh`: `^0.30.1`
        *   `@solana/`
            *   `@solana/buffer-layout`: `4.0.1`
            *   `@solana/spl-token`: `0.4.9`
            *   `@solana/wallet-adapter-base`: `0.9.19`
            *   `@solana/web3.js`: `1.95.4`
    *   **Other Packages:**
        *   `bn.js`: `5.2.1`
        *   `borsh`: `^2.0.0`

    *(Note: Node.js built-in modules like `buffer`, `crypto`, `fs`, etc., are also externalized but do not need to be explicitly installed as they are part of the Node.js environment).*  
    The easiest way to include these is using a bundler's plugin.
    For polyfills take a look:
    1. Vite - https://www.npmjs.com/package/vite-plugin-node-polyfills
    2. Rsbuild - https://github.com/rspack-contrib/rsbuild-plugin-node-polyfill
    3. Webpack - https://www.npmjs.com/package/node-polyfill-webpack-plugin

## Technical Details (Why these changes?)

*For users interested in the underlying changes:* Version 8 introduces a standardized build process using `tsup` across all packages. This creates distinct `dist/esm` (ECMAScript Modules) and `dist/cjs` (CommonJS) output directories. The `package.json` `exports` map in each package has been carefully configured to ensure that Node.js and bundlers automatically select the correct format (ESM or CJS) based on how you import the package. This resolves previous inconsistencies, particularly with loading specific files like IDLs in CommonJS projects. IDL `.json` files are now explicitly copied during the build and correctly referenced in the exports map. The list of externalized peer dependencies (defined in `tsup.config.base.ts`) remains largely the same, requiring users to manage these dependencies in their own projects.
