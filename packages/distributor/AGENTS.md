# @streamflow/distributor

Merkle tree-based token airdrop protocol. Supports standard and price-based (Aligned) airdrops. **Only package that exports as a namespace** (`StreamflowDistributorSolana`) and declares `./solana` subpath export.

Shared TypeScript/import/test/generated-code conventions: [`CODESTYLE.md`](../../CODESTYLE.md).

## STRUCTURE
```
distributor/
├── index.ts                        # Re-exports as StreamflowDistributorSolana namespace (unique pattern)
├── solana/
│   ├── index.ts                    # Re-exports clients/, utils, types, constants, fees
│   ├── clients/
│   │   ├── BaseDistributorClient.ts    # Abstract base (~700 lines)
│   │   ├── SolanaDistributorClient.ts  # Standard Merkle airdrop client
│   │   ├── SolanaAlignedDistributorClient.ts  # Price-based airdrop client
│   │   └── index.ts                    # Named re-exports of both clients
│   ├── types.ts                    # MerkleDistributor, ClaimStatus, FeeConfig, ICreateDistributorData, etc.
│   ├── utils.ts                    # getDistributorPda, getClaimantStatusPda, calculateAmountWithTransferFees
│   ├── constants.ts                # DISTRIBUTOR_PROGRAM_ID, PARTNER_ORACLE_PROGRAM_ID, FEE_CONFIG_PUBLIC_KEY
│   ├── fees.ts                     # Fee calculation helpers
│   ├── fetchAirdropFee.ts          # API-based fee fetching
│   └── descriptor/                 # Auto-generated Anchor IDLs (merkle_distributor, aligned_distributor)
└── tsup.config.ts                  # Entries: index, solana/index, 2 descriptor IDLs
```

## WHERE TO LOOK
| Task | File | Notes |
|------|------|-------|
| Add airdrop method | `solana/clients/BaseDistributorClient.ts` | Add to base, extend in subclasses |
| Add aligned-specific logic | `solana/clients/SolanaAlignedDistributorClient.ts` | Price oracle, aligned PDA |
| Add distributor type | `solana/types.ts` | |
| Modify fee logic | `solana/fees.ts`, `solana/fetchAirdropFee.ts` | |
| Add PDA helper | `solana/utils.ts` | |
| Update IDL | `solana/descriptor/` | |

## KEY METHODS (BaseDistributorClient)
- **Create**: `create()`, `prepareCreateInstructions()`
- **Claim**: `claim()`, `prepareClaimInstructions()` (3 overloads — standard, aligned, compressed)
- **Clawback**: `clawback()`, `prepareClawbackInstructions()`
- **Close**: `closeClaim()`, `prepareCloseClaimInstructions()`
- **Query**: `getClaim()`, `getClaims()`, `getDistributors()`, `searchDistributors()`
- **Fees**: `getFees()`, `getDefaultFees()`, `getFeeConfig()`

## CONVENTIONS (PACKAGE-SPECIFIC)
- **Namespace export**: `export * as StreamflowDistributorSolana from "./solana/index.js"` — consumers must use `StreamflowDistributorSolana.SolanaDistributorClient` (inconsistent with other packages)
- **Only package** with `"sideEffects": false` in package.json
- **Only package** declaring `./solana` subpath export in package.json exports map
- `prepareClaimInstructions()` has 3 overloads supporting standard claims, aligned claims with price update, and compressed claims
- `fetchAirdropFee.ts` fetches fees from Streamflow API (not on-chain)
- `decode()` is a module-level function (not a class method) — used for deserializing on-chain account data

## NOTES
- `MerkleDistributor` account type is duplicated in `aligned_distributor.ts` IDL (inherent to Anchor codegen)
- `SolanaAlignedDistributorClient` extends base with `getClaimWithPriceUpdateInstructions()` — requires live price oracle data
- `types.ts` contains `ContractErrorCode` and `AnchorErrorCode` enums for error classification
