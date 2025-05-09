# Streamflow SDK Examples

This directory contains standalone example applications that demonstrate how to use the Streamflow SDK in various environments and configurations.

## Examples Structure

Each example is a standalone application with its own `package.json` and configuration files. The examples are organized by the following dimensions:

- **Language**: JavaScript (js) or TypeScript (ts)
- **Module system**: CommonJS (cjs) or ECMAScript Modules (esm)
- **Bundling**: With bundler (bundled) or without bundler (unbundled)

## Node.js Version Compatibility

Each example includes an `.nvmrc` file that specifies Node.js 22 as the default version. You can test with different Node.js versions using NVM:

```bash
# Using the default version (from .nvmrc)
nvm use

# Or specifying a different version
nvm use 20
```

## Example Naming Convention

Examples follow this naming convention:

```
{language}-{module-system}-{bundling}
```

For example:
- `ts-esm-unbundled`: TypeScript with ESM and no bundler
- `js-cjs-bundled`: JavaScript with CommonJS and a bundler

## Running Examples

Each example contains:
- `README.md`: Instructions specific to the example
- `package.json`: Dependencies and scripts
- Source code in `src/` directory
- `.nvmrc`: Default Node.js version

To run an example:

1. Navigate to the example directory:
   ```
   cd examples/ts-esm-unbundled
   ```

2. Use the specified Node.js version:
   ```
   nvm use
   ```

3. Install dependencies:
   ```
   pnpm install
   ```

4. Build the example (if needed):
   ```
   pnpm build
   ```

5. Run the example:
   ```
   pnpm start
   ```

## Verification

Each example also serves as an integration verification for the Streamflow SDK. The examples include validation to ensure that the SDK works correctly in each environment.

To verify an example:

```
pnpm verify
```

This will build and run the example, checking that it completes successfully.

## Testing with Multiple Node.js Versions

To verify compatibility with multiple Node.js versions:

```bash
# Test with Node.js 20
nvm use 20
pnpm verify

# Test with Node.js 22 (default)
nvm use 22
pnpm verify
```

## Working with All Examples

You can use the following root-level scripts to work with all examples at once:

```bash
# Install dependencies for all examples
pnpm examples:install

# Build all examples in parallel
pnpm examples:build

# Verify all examples in parallel
pnpm examples:verify

# Build packages, then install, build, and verify all examples
pnpm examples
```

These commands should be run from the root directory of the repository. Note that the examples depend on the packages in the `packages/` directory, so you need to build those packages before running the examples. The `pnpm examples` command handles this automatically by building the packages first. 