# Advanced: Lock vs Vesting — Protocol-Level Differences

Deep reference on how lock and vesting params differ at the protocol and on-chain classification level. Useful when reasoning about why the SDK defaults are what they are, or when working directly with `ICreateMultipleStreamData` below the composable wrappers.

---

## StreamType and fee tiers

| | Lock | Vesting |
|---|---|---|
| `StreamType` | `StreamType.Lock` | `StreamType.Vesting` |
| Effect | Determines lock fee tier | Determines vesting fee tier |

---

## Core semantic difference

**Lock = "all-at-once" release**
`cliffAmount = total - 1`, `amountPerPeriod = BN(1)`, `period = 1` — effectively the entire amount unlocks at the cliff timestamp (which equals `start`). One instant release point.

**Vesting = "gradual" release**
`amountPerPeriod = divCeil(remaining, periods)`, real configurable `period`, optional cliff, optional initial allocation as a separate bundled stream.

---

## Parameter-by-parameter diff

| Parameter | Lock | Vesting |
|---|---|---|
| `period` | `1` (synthetic) | user-configurable |
| `cliff` | `= start` | `= start` — same |
| `cancelableBySender` | always `false` | user-controlled |
| `cancelableByRecipient` | always `false` | always `false` — same |
| `automaticWithdrawal` | always `false` | user-controlled; `false` for dynamic/price type |
| `withdrawalFrequency` | `0` | `period` when auto-withdrawal on, else `0` |
| `canTopup` | always `false` | `true` for linear vesting |
| `transferableBySender` | always `false` | user-controlled |
| `transferableByRecipient` | configurable | user-controlled |
| `amountPerPeriod` | `BN(1)` (dust) | `divCeil(remaining, periods)` |
| `cliffAmount` (recipient) | `total - BN(1)` | from user input or `BN(0)` |

---

## `isTokenLock()` classification criteria

A stream is classified as a lock when ALL of:
- `canTopup === false`
- `automaticWithdrawal === false`
- `cancelableBySender === false`
- `cancelableByRecipient === false`
- `transferableBySender === false`
- `cliffAmount >= depositedAmount - 1`

The last condition is the dangerous one — a vesting with a very large `cliffAmount` will silently reclassify as a lock.

---

## Initial allocation (vesting-only)

A second lock-like stream created atomically alongside the main vesting stream for upfront token release:

- `period: 1`, `canTopup: false`, `automaticWithdrawal: false`
- `amountPerPeriod: BN(2)` — hardcoded so it avoids lock classification
- `cliffAmount: initialAllocationAmount - BN(2)`
- `cancelableBySender` mirrors the main vesting stream

The SDK's `createVesting` with `initialAllocation` calls `buildCreateTransactionInstructions` twice (in parallel), then combines setup instructions and creates two separate `creationBatches`.

---

## Dynamic / price-triggered streams (out of scope for composable API)

The composable wrappers (`createLock`, `createVesting`, etc.) only support **linear** streams. Dynamic/price-triggered variants require additional `minPrice`, `maxPrice`, `oracleType` fields and must be constructed directly via `SolanaStreamClient`.

| | Dynamic lock | Price vesting |
|---|---|---|
| `minPrice` | `maxPrice - 1` | `0` |
| `minPercentage` | `0` (hardcoded) | `(releases / releasesAtMax) × 100` |
| `vestingDuration` | `1` (synthetic) | `counter × period` (real) |
