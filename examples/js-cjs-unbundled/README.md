# JavaScript + CommonJS (Unbundled) Example

This example demonstrates using the Streamflow SDK with:
- JavaScript (not TypeScript)
- CommonJS modules
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

1. **CommonJS Imports in JavaScript**: Using CommonJS module imports with plain JavaScript
2. **No Bundler**: Direct imports without a bundler
3. **No TypeScript**: Using the SDK with JavaScript directly
4. **Workspace Dependencies**: Using packages from the monorepo workspace

## Configuration Details

- No `"type": "module"` in package.json (defaults to CommonJS)
- Using `require()` syntax for imports
- Workspace dependencies with `"@streamflow/stream": "workspace:*"`
