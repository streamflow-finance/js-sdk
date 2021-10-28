# StreamFlow Timelock

Token Vesting and Streaming Payments for SPL tokens. **Free and open-source.**

Backed by Serum and Solana.

## Important:

This software is under active development. It's provided as is, without any warranty.

**The code is not yet audited.**

### System overview

System has 4 composable layers. There are (top to bottom):

- `streamflow-app` — React/TypeScript [web application that hosts user interface](https://app.streamflow.finance).
- `@streamflow/timelock` — a [NPM package](https://www.npmjs.com/package/@streamflow/timelock) used by the web app.
  Interacts with provided `timelock` program deployed on Solana chain.
- `timelock` — simple implementation of Solana/Anchor program that integrates `timelock-crate` (described below).
- `timelock-crate` — a crate that provides `create`, `withdraw`, `cancel`, `transfer` stream/vesting contract
  functionalities out of the box. Can be used in other Solana/Anchor programs, as demonstrated here.

![Platform overview](/misc/platform.png)

### Legal

This file is part of `streamflow-finance/timelock`

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public
License version 3 as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
details.

You should have received a copy of the GNU Affero General Public License along with this program. If not,
see <https://www.gnu.org/licenses/>.
