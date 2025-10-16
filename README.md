# Streamflow

Streamflow is a token vesting and streaming payments platform.

There are several ways to use **Streamflow**:

- **(easiest) [app.streamflow.finance](https://app.streamflow.finance?utm_medium=github.com&utm_source=referral&utm_campaign=js-sdk-repo)** (React application that uses JS SDK directly)
- **[JS SDK](https://github.com/streamflow-finance/js-sdk)** to interact with the protocol => [NPM package](https://www.npmjs.com/package/@streamflow/stream)
- **[Rust SDK](https://github.com/streamflow-finance/rust-sdk)** to integrate within a Solana program => [Rust Crate](https://docs.rs/streamflow-sdk/)

**Security audit passed ✅**

Protocol audits available [here](https://www.notion.so/streamflow/Streamflow-Security-Audits-3250070c0b3a4a0690385d96316d645c).  
Partner oracle audit available [here](https://github.com/streamflow-finance/rust-sdk/blob/main/partner_oracle_audit.pdf).

## Documentation

Have an SDK question? Head over to the AI-powered Q&A platform. Just type your query or search the docs, and get instant answers [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/streamflow-finance/js-sdk)

API Documentation available here:  
[![Streamflow](https://img.shields.io/badge/Streamflow-Typedoc-white?labelColor=7187ff&style=flat&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYuNDI0MzIgM0MzLjQyODU1IDMgMSA1LjQxODA1IDEgOC4zOTk5OUgxNy4yQzIwLjE4MjMgOC4zOTk5OSAyMi41OTk5IDUuOTgyMzQgMjIuNTk5OSAzTDYuNDI0MzIgM1oiIGZpbGw9IiMxOTNERjkiLz4KPHBhdGggZD0iTTYuNDI0MzIgMTUuNkMzLjQyODU0IDE1LjYgMSAxOC4wMTgxIDEgMjFINi4zOTk5OUM5LjM4MjMyIDIxIDExLjggMTguNTgyMyAxMS44IDE1LjZINi40MjQzMloiIGZpbGw9IiMxOTNERjkiLz4KPHBhdGggZD0iTTEgOS4yOTk5OEgxNy4zNTc0QzIwLjI1MjggOS4yOTk5OCAyMi41OTk5IDExLjc2NzMgMjIuNTk5OSAxNC43SDYuMjQyMkMzLjM0Njc4IDE0LjcgMSAxMi4yMzI2IDEgOS4yOTk5OFoiIGZpbGw9IiMxOTNERjkiLz4KPC9zdmc+Cg==&link=https://js-sdk-docs.streamflow.finance)](https://js-sdk-docs.streamflow.finance)

## JS SDK to interact with Streamflow protocols

This repo consists of js-sdk to interact with several protocol exposed by streamflow:
- `packages/stream` - [Core Streamflow Protocol](packages/stream/README.md) that allows to create a vesting/payment/lock Stream to a Recipient;
- `packages/distributor` - [Distributor Streamflow Protocol](packages/distributor/README.md) that allows to Airdrop tokens to large amount of Recipients (thousands or even millions);
- `packages/common` - Common utilities and types used by Streamflow SDK;

## Installation

### Install Stream Protocol SDK

```bash
npm i -s @streamflow/stream
# or
yarn add @streamflow/stream
```

### Install Distributor Protocol SDK

```bash
npm i -s @streamflow/common @streamflow/distributor
# or
yarn add @streamflow/common @streamflow/distributor
```

## Environments
For web browser runtimes polyfills might be required. SDKs use `node:` prefixed modules, for instance: `node:crypto`. However, transitive 3rd parties might use non-prefixed modules so both ways of importing should be polyfilled.

The easiest way to achieve it is using a bundler's plugin.
For polyfills take a look on these libraries:
1. Vite - https://www.npmjs.com/package/vite-plugin-node-polyfills
2. Rsbuild - https://github.com/rspack-contrib/rsbuild-plugin-node-polyfill
3. Webpack - https://www.npmjs.com/package/node-polyfill-webpack-plugin

## Contributing

To contribute to this repository, please follow these steps:
[CONTRIBUTING](./CONTRIBUTING.md)

## Release Notes
Check out our [RELEASE NOTES](./RELEASE_NOTES.md) for the latest updates and migration guides.

## News
Stay updated on our [X/Twitter](https://x.com/streamflow_fi).
