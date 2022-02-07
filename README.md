# JavaScript SDK to interact with Streamflow protocol.

Check `packages/` folder for specific exports that you can use in your apps.

There is currently only one package under `packages/stream` which enables you to:

1. `create`, `withdraw`, `cancel`, `topup` and `transfer` a stream,

2. `getOne` stream and `get` multiple streams.

<br>

**JS SDK** interacts with Anchor program deployed on Solana mainnet.

Devnet Program ID: `HqDGZjaVRXJ9MGRQEw7qDc2rAr6iH1n1kAQdCZaCMfMZ`.
Mainnet Program ID: `strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m`.

There are several ways to use Streamflow protocol:

- **`[preferred]` Application with UI** available at [https://app.streamflow.finance/vesting](https://app.streamflow.finance/vesting)
- **JS SDK** (NPM package) available [here](https://www.npmjs.com/package/@streamflow/stream/v/2.0.0)
- **Rust SDK (crate)** for integration within Solana programs available [here](https://docs.rs/0.3.2/streamflow-timelock)

### Legal

This file is part of `streamflow-finance/js-sdk`

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public
License version 3 as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
details.

You should have received a copy of the GNU Affero General Public License along with this program. If not,
see <https://www.gnu.org/licenses/>.
