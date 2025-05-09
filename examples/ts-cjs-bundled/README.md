# TypeScript + CommonJS + Bundled Example

This example demonstrates how to use the Streamflow SDK in a TypeScript project with CommonJS modules and bundling using Vite.

## Node.js Version

This example requires Node.js version 22. If you have [nvm](https://github.com/nvm-sh/nvm) installed, you can run:

```bash
nvm use
```

## Setup

Install dependencies:

```bash
npm install
```

## Build

Build the project:

```bash
npm run build
```

This will:
1. Compile TypeScript to JavaScript
2. Bundle the code using Vite
3. Generate type declarations

The output will be in the `dist` directory.

## Run

After building, you can run the example:

```bash
npm start
```

## Verify Types

To verify TypeScript types:

```bash
npm run typecheck
```

## Key Points

- **TypeScript Configuration**: The `tsconfig.json` file is configured for CommonJS modules with Node.js compatibility.
- **Bundling**: Vite is used as the bundler, configured to output CommonJS format.
- **Type Declarations**: The build process generates `.d.ts` files for type support.
- **External Dependencies**: The Streamflow SDK packages are marked as external in the bundle configuration.

## Configuration Details

### package.json

The `package.json` file includes:
- Dependencies for the Streamflow SDK
- Development dependencies for TypeScript and Vite
- Scripts for building, running, and type checking

### vite.config.ts

The Vite configuration:
- Specifies CommonJS as the output format
- Sets up proper bundling options
- Configures the TypeScript plugin for declaration file generation

### tsconfig.json

The TypeScript configuration:
- Sets `module` to "CommonJS"
- Enables strict type checking
- Configures output options for declaration files and source maps

## Customizing the Example

To use this example with your own Streamflow streams:

1. Replace `YOUR_STREAM_ID` in `src/index.ts` with an actual stream ID
2. Modify the client configuration if needed (e.g., change from devnet to mainnet)
3. Add additional functionality as required for your use case 