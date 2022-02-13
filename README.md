# Streamflow (Community edition)
> **Disclaimer**: This is a v1, free and open-source, **community** version of [Streamflow](../../tree/master) protocol.
> 
> **It is a public good, provided as is, without the additional support.**
> 
> For the upgraded (commercial) version with much richer feature set, like:
> - highly customizable ownership transfer/cancel options,
> - scheduled and automatic token transfers/witdrawals,
> - notifications,
> - tradable streams (vesting contracts), 
> - bulk stream (vesting contract) creation,
> - dedicated support,
> - ...and all the ongoing improvements, 
> 
> please see the master branch of [Streamflow](../../tree/master), the [docs](https://streamflow.finance/js-sdk/), the app ([app.streamflow.finance](https://app.streamflow.finance)), new [Rust SDK](https://github.com/streamflow-finance/rust-sdk) or reach out on [Discord](https://discord.gg/9yyr8UBZjr). ✌️


----
**Security audit done. [Report here.](https://github.com/StreamFlow-Finance/timelock/blob/community/TIMELOCK_IMPLEMENTATION_COMMUNITY_REPORT_FINAL.pdf) ✅**

-----
## Token Vesting and Streaming Payments for SPL tokens.

**JS SDK** interacts with Anchor program deployed on Solana mainnet.
The Anchor program integrates and relies heavily on
accompanying [Streamflow Timelock Rust crate (v0.3.2)](https://docs.rs/0.3.2/streamflow-timelock),
([source code available here](https://github.com/streamflow-finance/timelock-crate/tree/community))

**Mainnet program ID:** `8e72pYCDaxu3GqMfeQ5r8wFgoZSYk6oua1Qo9XpsZjX`

# Streamflow
Streamflow is a token distribution platform powered by a streaming payments' protocol.

## Features

- `create` a vesting contract.
- `withdraw` from a vesting contract. _Invoked by recipient (beneficiary)_
- `cancel` a vesting contract. _Invoked by sender (creator)_
- `transfer_recipient` of a vesting contract. _Invoked by recipient (beneficiary)_

## Usage (**Community edition**):

- **(easiest)** [https://free.streamflow.finance/vesting](https://free.streamflow.finance/vesting) (React application that uses JS SDK directly)
- **JS SDK** (NPM package) available [here](https://www.npmjs.com/package/@streamflow/timelock/v/0.3.2-community)
- **Rust SDK (crate)** for integration within Solana programs available [here](https://docs.rs/0.3.2/streamflow-timelock) ([source code](https://github.com/streamflow-finance/timelock-crate/tree/community))

## System overview

System has 4 composable layers. These are (top to bottom):

- `app` — React/TypeScript [web application that hosts user interface](https://free.streamflow.finance).
- `@streamflow/timelock` — a [NPM package](https://www.npmjs.com/package/@streamflow/timelock) used by the web app.
  Interacts with provided `timelock` program deployed on Solana chain. (part of this repository)
- `timelock` — simple implementation of Solana/Anchor program that integrates `timelock-crate` (this repository).
- `timelock-crate` — a crate that provides `create`, `withdraw`, `cancel`, `transfer` stream/vesting contract
  functionalities out of the box. Can be used in other Solana/Anchor programs, as demonstrated here.

![Platform overview](/misc/platform.png)

### Legal

This file is part of `streamflow-finance/js-sdk`

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public
License version 3 as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
details.

You should have received a copy of the GNU Affero General Public License along with this program. If not,
see <https://www.gnu.org/licenses/>.
