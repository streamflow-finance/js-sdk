Now I have comprehensive data from all 5 agents. Let me synthesize the full diff analysis into a clear prompt.

---

## Comprehensive Diff: `create-lock.tsx` vs `create-vesting.tsx`

Here's the synthesized analysis of every difference, from the form input to what reaches `streamClient.createMultiple`:

---

### 1. **StreamType** (fee calculation)
| | Lock | Vesting |
|---|---|---|
| `useStreamFees()` | `StreamType.Lock` | `StreamType.Vesting` |
| Effect | Determines fee tier for lock contracts | Determines fee tier for vesting contracts |

---

### 2. **Form Type Discriminator**
| | Lock | Vesting |
|---|---|---|
| Discriminator values | `"time"` or `"dynamic"` | `"linear"` or `"price"` |
| Time model | `unlockDate` (single point) | `startDate` + `vestingDurationCounter × period` |
| Dynamic trigger | `form.type === "dynamic"` | `form.type === "price"` |

---

### 3. **`wrap()` Output Shape** — the most critical difference

**Lock** returns a **single** `ICreateMultipleStreamData`:
```ts
return { data: convertLockFormToMultiple(form, dynamicData), isNative, tradingConfig, metadataPubKeys, tokenFeePercentage }
```

**Vesting** returns an **array** of 1-2 `ICreateMultipleStreamData`:
```ts
return { data: [streamData, ...(initialAllocationData ? [initialAllocationData] : [])], isNative, tradingConfig, metadataPubKeys }
```
Vesting can create a **second "initial allocation" lock contract** bundled into the same `createMultiple` call. This is a vesting-only concept — a separate mini-stream representing an upfront token release before vesting begins.

---

### 4. **`tokenFeePercentage`** — lock-only
| | Lock | Vesting |
|---|---|---|
| `tokenFeePercentage` | `streamFees.streamflowFee` ✅ | **Omitted** ❌ |

Lock passes a token-level fee percentage; vesting does not.

---

### 5. **`ICreateMultipleStreamData` Parameter-by-Parameter**

| Parameter | Lock (`convertLockFormToMultiple`) | Vesting (`convertVestingFormToStreamData`) |
|---|---|---|
| **`start`** | `0` (immediate) or `max(now, unlockDate)` | `0` (immediate) or `enforceFutureDate(startDate)` |
| **`period`** | `1` (time) or `PERIOD.SECOND * 60` (dynamic) — **synthetic** | `form.releaseFrequencyPeriod` — **user-configurable** |
| **`cliff`** | `startAt` (= start) | `startAt` (= start) — same |
| **`cancelableBySender`** | **always `false`** | `form.cancelableBySender` — **user-controlled** |
| **`cancelableByRecipient`** | **always `false`** | **always `false`** — same |
| **`automaticWithdrawal`** | **always `false`** | `form.type === "linear" ? form.automaticWithdrawal : false` — **conditional** |
| **`withdrawalFrequency`** | `0` | `form.automaticWithdrawal ? period : 0` — **conditional** |
| **`canTopup`** | **always `false`** | `form.type === "linear"` — **true for linear vesting** |
| **`transferableBySender`** | **always `false`** | `canTransferStream(Sender, form.whoCanTransfer)` — **user-controlled** |
| **`transferableByRecipient`** | `form.destination.tradable \|\| form.transferableByRecipient` | `canTransferStream(Recipient, form.whoCanTransfer)` |
| **`amountPerPeriod`** | `total` (entire amount released per period) | `divCeil(restAfterCliff, numberOfPeriods)` — **distributes across periods** |
| **`cliffAmount` (recipient)** | `total - BN(1)` (effectively everything minus dust) | Computed from `cliffReleaseOption` (percentage or fixed) |
| **`amount` (recipient)** | `total` (full amount) | `total - initialAllocationAmount` (initial allocation subtracted) |

**Key insight**: Lock sets `amountPerPeriod = total` and `cliffAmount = total - 1`, meaning essentially the entire amount unlocks at once at the cliff (which equals start). Vesting distributes the amount across multiple periods using `divCeil`.

---

### 6. **Dynamic Data** (`generateDynamicStreamData`)

| Parameter | Lock (dynamic) | Vesting (price) |
|---|---|---|
| `StreamType` | `StreamType.Lock` | `StreamType.Vesting` |
| `minPrice` | `maxPrice - 1` (1 atom below target) | `0` (no floor) |
| `minPercentage` | `0` (hardcoded — duration params are dead code) | `(releases/releasesAtMax) * 100` — **computed ratio** |
| `floorPrice` | From `form.floorPrice` if enabled | **Always `0`** |
| `expiryTime` / `expiryPercentage` | From `form.expiration` if enabled | **Always `undefined`** |
| `vestingDuration` | `1` (synthetic) | `counter × period` (real) |
| `vestingMaxDuration` | `1` (synthetic) | `counter × period` (real) |
| `releaseFrequencyPeriod` | `PERIOD.SECOND * 60` (hardcoded 60s) | `form.releaseFrequencyPeriod` (user-defined) |

**Key insight**: Lock's dynamic path short-circuits to `minPrice = target - 1` and `minPercentage = 0`. Vesting computes a real `minPercentage` ratio representing "guaranteed minimum percentage of tokens to release regardless of price action."

---

### 7. **Trading Config** — subtle address access difference

| | Lock | Vesting |
|---|---|---|
| `recipient` | `tradingConfig.recipientOfLockedFunds?.address` (optional chain) | `tradingConfig.recipientOfLockedFunds` (direct) |
| `buyer` | `tradingConfig.buyer?.address` (optional chain) | `tradingConfig.buyer` (direct) |

Lock accesses `.address` with optional chaining; Vesting passes the whole object. This suggests the vesting trading config types have `address` at the top level while lock wraps it in an `AddressObject`.

---

### 8. **Initial Allocation** (vesting-only)

Vesting has a second function `convertVestingFormToInitialAllocationData` that creates a **separate lock contract** for upfront token release:
- `period: 1`, `canTopup: false`, `automaticWithdrawal: false`
- `amountPerPeriod: BN(2)` (hardcoded — ensures it's categorized as vesting, not lock)
- `cliffAmount: initialAllocationAmount - BN(2)`
- Created only when `form.initialAllocation === true`

---

### 9. **Total Amount Calculation**

| | Lock | Vesting |
|---|---|---|
| Function | `getCreationTotalAmount()` | `getVestingCreationTotalAmount()` |
| Return type | `BN` (raw) | `string` (`.toString()`) |
| Logic | Identical | Identical |

There's already a TODO in the vesting file acknowledging this duplication.

---

### Summary of Nuances

1. **Lock = "all-at-once" release**: `amountPerPeriod = total`, `cliffAmount ≈ total`, period is synthetic → effectively the entire amount is locked until `start` then immediately releasable.

2. **Vesting = "gradual" release**: `amountPerPeriod = divCeil(remaining, periods)`, real configurable period, optional cliff, optional initial allocation as a separate bundled stream.

3. **Dynamic lock** is price-triggered unlock (token unlocks when target price is reached). **Dynamic/price vesting** is price-gated gradual release (tokens release proportional to price, with a guaranteed minimum percentage).

4. **Lock is rigid**: all boolean flags hardcoded to `false` (no cancellation, no topup, no auto-withdrawal). **Vesting is flexible**: user controls `cancelableBySender`, `automaticWithdrawal`, `whoCanTransfer`, `canTopup`.

5. **The shared `create-multiple` layer is type-agnostic** — it does NOT branch on stream type. All differences are 100% in how each caller constructs the `ICreateMultipleStreamData` payload before passing it downstream.