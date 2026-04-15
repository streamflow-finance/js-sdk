# @streamflow/launchpad

Token launchpad with dynamic vesting. Users deposit quote tokens, then claim allocated base tokens via vesting streams. **Only package with a cross-protocol dependency** on `@streamflow/stream`.

Shared TypeScript/import/test/generated-code conventions: [`CODESTYLE.md`](../../CODESTYLE.md).

## STRUCTURE
```
launchpad/
├── index.ts                    # Named export: SolanaLaunchpadClient; wildcard re-exports types, derive-accounts
├── solana/
│   ├── client.ts               # SolanaLaunchpadClient (~468 lines, simplest client)
│   ├── types.ts                # Launchpad, DepositAccount, ICreateLaunchpad, etc.
│   ├── constants.ts            # PROGRAM_ID, byte offsets
│   ├── descriptor/             # Auto-generated Anchor IDL (streamflow_launchpad)
│   └── lib/
│       └── derive-accounts.ts  # deriveLaunchpadPDA, deriveDepositPDA
└── tsup.config.ts              # Entries: index, descriptor
```

## WHERE TO LOOK
| Task | File | Notes |
|------|------|-------|
| Add launchpad method | `solana/client.ts` | |
| Add launchpad type | `solana/types.ts` | |
| Add PDA derivation | `solana/lib/derive-accounts.ts` | |
| Update IDL | `solana/descriptor/` | |

## KEY METHODS (SolanaLaunchpadClient)
- **Create**: `createLaunchpad()`, `prepareCreateLaunchpadInstructions()`
- **Fund**: `fundLaunchpad()`, `prepareFundLaunchpadInstructions()`
- **Deposit**: `deposit()`, `prepareDepositInstructions()`
- **Claim**: `claimDeposits()`, `prepareClaimDepositsInstructions()`
- **Vested claim**: `claimAllocatedVested()`, `prepareClaimAllocatedVestedInstructions()` — creates a vesting stream under the hood
- **Query**: `getLaunchpad()`, `searchLaunchpads()`, `getDepositAccount()`
- **Execute**: `execute()` — generic instruction execution with error translation

## WHY IT DEPENDS ON @streamflow/stream
`claimAllocatedVested()` creates a Streamflow vesting stream on-chain. This requires:
- `deriveContractPDA`, `deriveEscrowPDA` from stream's PDA helpers
- `ALIGNED_UNLOCKS_PROGRAM_ID`, `FEE_ORACLE_PUBLIC_KEY`, `WITHDRAWOR_PUBLIC_KEY`, `PROGRAM_ID` from stream's constants
- `OracleType` from stream's types

## CONVENTIONS (PACKAGE-SPECIFIC)
- Simplest client in the monorepo (~468 lines)
- `program` property exposes Anchor Program instance directly (like staking, unlike stream)
- Index re-exports `constants` as a namespace (matches staking pattern)
- Has `vestingId` and `dynamicVestingId` properties — references to on-chain program IDs for the vesting layer
- `prepareDepositInstructions()` uses manual `keys` array construction instead of Anchor's account resolution (non-standard)

## NOTES
- No tests exist for this package
- `claimAllocatedVested()` generates a new `Keypair` for the stream account — the keypair is returned in the result so caller can track it
