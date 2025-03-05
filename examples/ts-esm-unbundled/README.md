# TypeScript + ESM (Unbundled) Example

This example demonstrates using the Streamflow SDK with:
- TypeScript
- ECMAScript Modules (ESM)
- No bundler (direct imports)

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
2. **No Bundler**: Direct imports without a bundler
3. **TypeScript Configuration**: Proper TypeScript configuration for ESM
4. **Workspace Dependencies**: Using packages from the monorepo workspace
5. **Multiple SDK Packages**: Utilizing Streamflow SDK packages

## Streamflow SDK Packages Used

This example demonstrates the usage of the following Streamflow SDK packages:

- **@streamflow/stream**: Core streaming functionality
- **@streamflow/common**: Common utilities and types

## Configuration Details

- `"type": "module"` in package.json to enable ESM
- `"module": "NodeNext"` in tsconfig.json for proper ESM support
- `"moduleResolution": "NodeNext"` for Node.js-specific module resolution
- Workspace dependencies with `"@streamflow/stream": "workspace:*"`, etc. 