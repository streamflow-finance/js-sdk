# TypeScript + ESM + Vite (Bundled) Example

This example demonstrates using the Streamflow SDK with:
- TypeScript
- ECMAScript Modules (ESM)
- Vite bundler

## Node.js Version

This example includes an `.nvmrc` file that specifies Node.js 22 as the default version. You can test with different Node.js versions by:

```bash
# Using the default version (from .nvmrc)
nvm use

# Or specifying a different version
nvm use 20
```

## Setup

```bash
# Install dependencies
pnpm install
```

## Build

```bash
pnpm build
```

## Run

```bash
pnpm start
```

## Verify

```bash
pnpm verify
```

## Testing with Different Node.js Versions

To verify compatibility with multiple Node.js versions:

```bash
# Test with Node.js 20
nvm use 20
pnpm verify

# Test with Node.js 22 (default)
nvm use 22
pnpm verify
```

## Key Points

This example demonstrates:

1. **ESM Imports**: Using ECMAScript module imports with TypeScript
2. **Bundling with Vite**: Using Vite to bundle the application
3. **TypeScript Configuration**: Proper TypeScript configuration for bundling
4. **Workspace Dependencies**: Using packages from the monorepo workspace

## Configuration Details

- `"type": "module"` in package.json to enable ESM
- `"module": "ESNext"` in tsconfig.json for modern module output
- `"moduleResolution": "Bundler"` for bundler-specific module resolution
- Vite configuration in `vite.config.ts`
- External dependencies configuration to prevent bundling workspace packages 