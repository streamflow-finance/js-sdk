# @streamflow/common

Foundation package — shared types, Solana transaction lifecycle, BN utilities. **ALL other packages depend on this.** Changes here cascade downstream.

Shared TypeScript/import/test/generated-code conventions: [`CODESTYLE.md`](../../CODESTYLE.md).

## STRUCTURE
```
common/
├── index.ts                # Barrel: re-exports solana/ + lib/
├── lib/
│   ├── utils.ts            # BN helpers, handleContractError(), sleep()
│   ├── assertions.ts       # invariant(), assertHasPublicKey()
│   ├── env.ts              # isDev boolean
│   └── fetch-token-price.ts
├── solana/
│   ├── index.ts            # Barrel: re-exports types, utils, instructions, filters, RPC
│   ├── types.ts            # ICluster, ContractError, ITransactionExt, ITransactionResult, ComputePriceEstimate, etc.
│   ├── utils.ts            # TX lifecycle: prepareTransaction(), signAndExecuteTransaction(), ATA helpers, buildSendThrottler()
│   ├── instructions.ts     # prepareWrappedAccount()
│   ├── account-filters.ts  # getFilters() — memcmp filter builder
│   ├── descriptor/         # Partner Oracle IDL
│   ├── rpc/                # Subpath export "./rpc" — priority fee + consume limit estimation
│   │   ├── consume-limit-estimate/
│   │   └── priority-fee-estimate/  # general.ts (deprecated), percentile.ts (preferred)
│   └── lib/
│       ├── estimate.ts          # createAndEstimateTransaction() — used by all protocol clients
│       ├── public-key.ts        # pk() helper
│       ├── unwrap-auto-simulate-ext.ts
│       └── deserialize-raw-transaction.ts
└── tsup.config.ts          # Entries: index, solana/index, solana/rpc/index
```

## WHERE TO LOOK
| Task | File |
|------|------|
| Add shared type/interface | `solana/types.ts` |
| Add Solana tx helper | `solana/utils.ts` |
| Add pure utility function | `lib/utils.ts` |
| Add compute/fee estimation | `solana/lib/estimate.ts` |
| Add RPC helper | `solana/rpc/` |  
| Change Partner Oracle IDL | `solana/descriptor/partner_oracle.ts` |

## KEY EXPORTS
- **Types**: `ICluster`, `ContractError`, `ITransactionExt`, `ITransactionResult`, `IPrepareResult`, `IInteractExt`, `ConfirmationParams`, `ThrottleParams`, `ComputePriceEstimate`, `ComputeLimitEstimate`
- **BN**: `getBN(value, decimals)`, `getNumberFromBN(value, decimals)`
- **PublicKey**: `pk(key)` — canonical `string | PublicKey` → `PublicKey` normalizer (`solana/lib/public-key.ts`). Use this everywhere instead of writing custom helpers.
- **TX pipeline**: `prepareTransaction`, `signAndExecuteTransaction`, `executeTransaction`, `executeMultipleTransactions`, `simulateTransaction`
- **ATA**: `ata()`, `ataBatchExist()`, `checkOrCreateAtaBatch()`, `createAtaBatch()`, `enrichAtaParams()`
- **Compute**: `createAndEstimateTransaction()`, `prepareBaseInstructions()`
- **Throttle**: `buildSendThrottler()` (PQueue-based)

## CONVENTIONS (PACKAGE-SPECIFIC)
- Has `./rpc` subpath export in package.json (unique among packages)
- `solana/rpc/priority-fee-estimate/general.ts` exports are **deprecated** — use `percentile.ts` instead
- `isDev` from `lib/env.ts` controls error behavior (throw in dev, console.warn in prod)

## NOTES
- `solana/utils.ts` is the largest hand-written file here (646 lines) — complete TX building/signing/sending/confirming pipeline
- No tests exist for this package (`"test": "vitest run --passWithNoTests"` passes with no tests)
