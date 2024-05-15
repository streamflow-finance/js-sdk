# Streamflow

Streamflow is a token vesting and streaming payments platform.

There are several ways to use **Streamflow**:

- **(easiest) [app.streamflow.finance](https://app.streamflow.finance?utm_medium=github.com&utm_source=referral&utm_campaign=js-sdk-repo)** (React application that uses JS SDK directly)
- **[JS SDK](https://github.com/streamflow-finance/js-sdk)** to interact with the protocol => [NPM package](https://www.npmjs.com/package/@streamflow/stream)
- **[Rust SDK](https://github.com/streamflow-finance/rust-sdk)** to integrate within a Solana program => [Rust Crate](https://docs.rs/streamflow-sdk/)

**Security audit passed ✅**

Protocol audits available [here](https://www.notion.so/streamflow/Streamflow-Security-Audits-3250070c0b3a4a0690385d96316d645c).  
Partner oracle audit available here [here](https://github.com/streamflow-finance/rust-sdk/blob/main/partner_oracle_audit.pdf).

## Documentation
API Documentation available here: [docs site →](https://streamflow-finance.github.io/js-sdk/)

## JS SDK to interact with Streamflow protocols

This repo consists of js-sdk to interact with several protocol exposed by streamflow:
- `packages/stream` - core Streamflow Protocol that allows to create a vesting/payment/lock Stream to a Recipient;
- `packages/distributor` - Distirbutor Streamflow Protocol that allows to Airdrop tokens to large amount of Recipients (thousands or even millions);
- `packages/common` - common utilities and types used by Streamflow SDK;

## Installation

### Instal Stream Protocol SDK

`npm i -s @streamflow/stream`

or

`yarn add @streamflow/stream`


### Install Distributor Protocol SDK

`npm i -s @streamflow/common @streamflow/distributor`

or

`yarn add @streamflow/common @streamflow/distributor`
