---
name: stream-creation
description: Use when creating token locks or vesting schedules with @streamflow/stream. Apply when user calls createLock, createVesting, createLockBatch, createVestingBatch, or their builder variants, or when building ICreateLinearStreamData / ICreateMultipleLinearStreamData params for stream creation.
---

# Stream Creation

Composable API wrappers over `SolanaStreamClient` in `packages/stream/solana/api/`. Pass intent-specific params — lock/vesting defaults are pre-filled and enforced.

## Choose the right function

| Goal | Function | Returns |
|---|---|---|
| Lock tokens until one date | `createLock` | `CreateInstructionResult` |
| Lock — multiple recipients | `createLockBatch` | `BatchInstructionResult` |
| Linear vesting | `createVesting` (no `initialAllocation`) | `CreateInstructionResult` |
| Vesting + upfront release | `createVesting` (with `initialAllocation`) | `BatchInstructionResult` |
| Vesting — multiple recipients | `createVestingBatch` | `BatchInstructionResult` |

```ts
import { createLock, createLockBatch, createVesting, createVestingBatch } from "@streamflow/stream/solana/api";
import type { ICreateLockParams, ICreateLockBatchParams, ICreateVestingParams, ICreateVestingBatchParams } from "@streamflow/stream/solana/api";
```

## `createLock`

```ts
await createLock(
  {
    recipient: "Wallet...", tokenId: "Mint...",
    amount: new BN(1_000_000_000),  // raw units — MUST be > 1
    unlockDate: 1735689600,          // unix timestamp — used as both start and cliff
    name: "Team Lock",
    transferableByRecipient: false,  // only configurable flag, defaults false
    // partner?, tokenProgramId?
  },
  invoker, env,
);
```

**Hardcoded internals — never set these on input:** `period=1`, `cliffAmount=amount-1`, `amountPerPeriod=BN(1)`, all cancel/topup/withdrawal flags `false`. Required for `isTokenLock()` classification.

## `createVesting`

Return type is overloaded: omit `initialAllocation` → `CreateInstructionResult`; include it → `BatchInstructionResult` (2 streams created atomically).

```ts
await createVesting(
  {
    recipient, tokenId, name,
    amount: new BN(1_000_000_000_000),
    start: 1700000000,
    period: 86400,                   // release interval in seconds
    duration: 365 * 86400,           // OR endDate — mutually exclusive, never both
    cliffAmount: new BN(0),          // optional, defaults BN(0)
    // amountPerPeriod auto-computed via divCeil if omitted
    cancelableBySender: false,
    automaticWithdrawal: false,      // withdrawalFrequency defaults to period when true
    transferableBySender: false, transferableByRecipient: false,
    // initialAllocation: { amount: BN(...) }  ← changes return type to BatchInstructionResult
  },
  invoker, env,
);
```

**Duration rules:** exactly one of `duration` / `endDate`; must be positive; must be `>= period`.

**`amountPerPeriod` auto-compute (divCeil):**
```
remaining  = amount - cliffAmount
periods    = floor(duration / period)
result     = ceil(remaining / periods)
```

**Classification gotcha:** `cliffAmount` close to `amount` (within 1) causes the stream to classify as Lock, not Vesting.

## `createLockBatch` / `createVestingBatch`

Per-recipient `amount` and `name`; shared config at top level.

```ts
await createLockBatch(
  { tokenId, unlockDate, recipients: [{ recipient, amount, name }] },
  invoker, env,
);

await createVestingBatch(
  { tokenId, start, period, duration,  // OR endDate
    recipients: [{ recipient, amount, name, cliffAmount?, amountPerPeriod? }] },
  invoker, env,
);
```

- Lock batch: each recipient auto-gets `cliffAmount = r.amount - 1`, `amountPerPeriod = BN(1)`
- Vesting batch: `amountPerPeriod` computed independently per recipient; explicit `r.amountPerPeriod` skips auto-compute
- Batch vesting does **not** support `initialAllocation`

## Builder variants (params only, no execution)

Use when you need the raw params object to inspect or compose with other instructions:

```ts
import { buildLockParams, buildVestingParams, buildLockBatchParams, buildVestingBatchParams, resolveDuration, computeAmountPerPeriod } from "@streamflow/stream/solana/api";

const data: ICreateLinearStreamData = buildLockParams({ ... });
const data: ICreateLinearStreamData = buildVestingParams({ ... });
const data: ICreateMultipleLinearStreamData = buildLockBatchParams({ ... });
const data: ICreateMultipleLinearStreamData = buildVestingBatchParams({ ... });
```

Source: `packages/stream/solana/api/create-lock.ts`, `create-vesting.ts`, `create-lock-batch.ts`, `create-vesting-batch.ts`

## Advanced: protocol-level patterns

Why the defaults are what they are, `isTokenLock()` classification criteria, initial allocation internals, and dynamic/price-triggered stream differences: [assets/advanced.md](./assets/advanced.md)
