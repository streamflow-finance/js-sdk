# StreamFlow Timelock

**Security audit passed. [Report here.](https://github.com/StreamFlow-Finance/timelock/blob/master/TIMELOCK_IMPLEMENTATION_COMMUNITY_REPORT_FINAL.pdf) ✅**

-----
## Token Vesting and Streaming Payments for SPL tokens.

This is a free and open-source version of [Streamflow Timelock](../../tree/master) protocol.

**JS SDK** interacts with Anchor program deployed on Solana mainnet.
The Anchor program integrates and relies heavily on
accompanying [Streamflow Timelock Rust crate (v0.3.2)](https://docs.rs/0.3.2/streamflow-timelock),
([source](https://github.com/streamflow-finance/timelock-crate/tree/community))

**Mainnet program ID:** `8e72pYCDaxu3GqMfeQ5r8wFgoZSYk6oua1Qo9XpsZjX`

___
**Functionalities are:**

- `create` a vesting contract.
- `withdraw` from a vesting contract. _Invoked by recipient (beneficiary)_
- `cancel` a vesting contract. _Invoked by sender (creator)_
- `transfer_recipient` of a vesting contract. _Invoked by recipient (beneficiary)_

There are several ways to use Streamflow Timelock protocol:

- **`[preferred]` Application with UI** available at [https://app.streamflow.finance/vesting](https://app.streamflow.finance/vesting)
- **JS SDK** (NPM package) available [here](https://www.npmjs.com/package/@streamflow/timelock/v/0.3.2-community)
- **Rust SDK (crate)** for integration within Solana programs available [here](https://docs.rs/0.3.2/streamflow-timelock)

### System overview

System has 4 composable layers. These are (top to bottom):

- `streamflow-app` — React/TypeScript [web application that hosts user interface](https://app.streamflow.finance).
- `@streamflow/timelock` — a [NPM package](https://www.npmjs.com/package/@streamflow/timelock) used by the web app.
  Interacts with provided `timelock` program deployed on Solana chain. (part of this repository)
- `timelock` — simple implementation of Solana/Anchor program that integrates `timelock-crate` (this repository).
- `timelock-crate` — a crate that provides `create`, `withdraw`, `cancel`, `transfer` stream/vesting contract
  functionalities out of the box. Can be used in other Solana/Anchor programs, as demonstrated here.

![Platform overview](/misc/platform.png)

### Development

#### Tests

Run tests from the: 
   - Command line using `anchor test`.
   - IDE using run configuration.
     IntelliJ IDEA will automatically load `.run/timelock.run.xml`.
     Start the local validator with `anchor localnet` (Anchor 0.18+) or `anchor test --detach` and run/debug configuration `tests`


### Legal

This file is part of `streamflow-finance/timelock`

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public
License version 3 as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
details.

You should have received a copy of the GNU Affero General Public License along with this program. If not,
see <https://www.gnu.org/licenses/>.
