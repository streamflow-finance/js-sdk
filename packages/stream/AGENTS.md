# @streamflow/stream

Core vesting/stream protocol SDK. `SolanaStreamClient` is the main class — 2049 lines, ~40 public methods. **The #1 refactoring candidate in the monorepo.**

Shared TypeScript/import/test/generated-code conventions: [`CODESTYLE.md`](../../CODESTYLE.md).

## STRUCTURE
```
stream/
├── index.ts                    # Re-exports solana/index.ts (1 line)
├── solana/
│   ├── StreamClient.ts         # SolanaStreamClient — ALL stream CRUD + queries
│   ├── types.ts                # ICreateStreamData, Contract, StreamType, StreamDirection, etc.
│   ├── instructions.ts         # Low-level instruction builders
│   ├── contractUtils.ts        # isVesting(), isTokenLock(), isAligned(), calculateUnlockedAmount()
│   ├── constants.ts            # Program IDs, byte offsets, error maps
│   ├── lib/
│   │   ├── utils.ts            # Re-exports common BN helpers; decodeStream(), calculateTotalAmountToDeposit()
│   │   └── derive-accounts.ts  # deriveContractPDA, deriveEscrowPDA, deriveStreamMetadataPDA, etc.
│   ├── descriptor/             # Auto-generated Anchor IDLs (streamflow.ts, streamflow_aligned_unlocks.ts)
│   └── api-public/             # HTTP API client for stream data (REST, not on-chain)
├── __tests__/solana/           # streamClient.spec.ts, contractUtils.spec.ts
└── tsup.config.ts              # Entries: index, solana/descriptor/streamflow_aligned_unlocks
```

## WHERE TO LOOK
| Task | File | Notes |
|------|------|-------|
| Add stream CRUD method | `solana/StreamClient.ts` | |
| Add stream type | `solana/types.ts` | |
| Add stream classification | `solana/contractUtils.ts` | |
| Add PDA derivation | `solana/lib/derive-accounts.ts` | |
| Modify on-chain instruction | `solana/instructions.ts` | Low-level instruction building |
| Query streams via HTTP | `solana/api-public/` | REST client, not Solana RPC |
| Update IDL | `solana/descriptor/` | |

## KEY METHODS (SolanaStreamClient)
- **Create**: `create()`, `createMultiple()`, `createMultipleSequential()`, `createUnchecked()`
- **Lifecycle**: `withdraw()`, `cancel()`, `topup()`, `transfer()`, `update()`
- **Query**: `getOne()`, `get()`, `searchStreams()`, `getClosedStreams()`
- **Fees**: `getFees()`, `getDefaultFees()`, `getTotalFee()`
- **Prepare** (all have `prepare*Instructions` variant): `prepareCreateInstructions()`, `prepareCreateLinearStreamInstructions()`, `prepareCreateAlignedUnlockInstructions()`, `prepareWithdrawInstructions()`, `prepareCancelInstructions()`, `prepareTopupInstructions()`, `prepareTransferInstructions()`, `prepareUpdateInstructions()`

## CONVENTIONS (PACKAGE-SPECIFIC)
- Re-exports `ContractError`, `ICluster`, `getBN`, `getNumberFromBN` from `@streamflow/common` so consumers don't need both packages
- Has `buildCreateTransaction()` and `buildCreateMultipleTransactionInstructions()` — extra builder layer not present in other packages
- `api-public/` provides HTTP-based stream queries as alternative to on-chain deserialization
- `getClosedStreams()` silently swallows errors in production (see ANTI-PATTERNS in root AGENTS.md)

## NOTES
- Tests only cover creation methods (14 test cases in streamClient.spec.ts). `withdraw`, `cancel`, `transfer`, `topup`, `getOne`, `get`, `searchStreams`, `update` — all untested
- Dual protocol support: standard streams AND aligned (price-based) unlock streams cause significant branching complexity
- `contractUtils.ts` provides stream type classification: `isVesting()`, `isTokenLock()`, `isAligned()`, `buildStreamType()`
- `timelockIDL` is the default export from `solana/index.ts`
