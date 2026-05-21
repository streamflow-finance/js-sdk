# @streamflow/staking

Staking pools + reward pools protocol SDK. `SolanaStakingClient` manages 5 Anchor programs (stakePool, rewardPool, rewardPoolDynamic, feeManager, governor).

Shared TypeScript/import/test/generated-code conventions: [`CODESTYLE.md`](../../CODESTYLE.md).

## STRUCTURE
```
staking/
├── index.ts                    # Named export: SolanaStakingClient; wildcard re-exports types, derive-accounts, rewards, fee-amounts, stake-weight
├── solana/
│   ├── client.ts               # SolanaStakingClient (~934 lines, ~38 methods)
│   ├── types.ts                # StakePool, StakeEntry, RewardPool, RewardEntry, FeeValue, etc.
│   ├── constants.ts            # Program IDs, byte offsets
│   ├── descriptor/             # Auto-generated Anchor IDLs (stake_pool, reward_pool, reward_pool_dynamic, fee_manager, governor)
│   └── lib/
│       ├── derive-accounts.ts  # deriveStakePoolPDA, deriveStakeEntryPDA, deriveRewardPoolPDA, etc.
│       ├── rewards.ts          # RewardEntryAccumulator, calcRewards(), calculateRewardAmountFromRate()
│       ├── fee-amounts.ts      # getStakeWeightAmounts, getFeeAmounts
│       └── stake-weight.ts     # Stake weight calculations
├── __tests__/solana/           # rewards.spec.ts
└── tsup.config.ts              # Entries: index, 3 descriptor IDLs
```

## WHERE TO LOOK
| Task | File | Notes |
|------|------|-------|
| Add stake/reward method | `solana/client.ts` | |
| Add staking type | `solana/types.ts` | |
| Add PDA derivation | `solana/lib/derive-accounts.ts` | |
| Modify reward calculation | `solana/lib/rewards.ts` | RewardEntryAccumulator class, calcRewards() |
| Modify fee logic | `solana/lib/fee-amounts.ts` | |
| Update IDL | `solana/descriptor/` | |

## KEY METHODS (SolanaStakingClient)
- **Stake Pool**: `createStakePool()`, `getStakePool()`, `searchStakePools()`
- **Staking**: `stake()`, `stakeAndCreateEntries()` (atomic stake + reward entry creation)
- **Unstaking**: `unstake()`, `unstakeAndClaim()`, `unstakeAndClose()`, `closeStakeEntry()`
- **Reward Pool**: `createRewardPool()`, `fundPool()`, `claimRewards()`, `clawback()`, `createRewardEntry()`, `closeRewardEntry()`, `updateRewardPool()`
- **Fund Delegate**: `createFundDelegate()` (automated periodic top-ups for dynamic reward pools)
- **Query**: `searchStakeEntries()`, `searchRewardPools()`, `searchRewardEntries()`
- **Fees**: `getFee()`, `getDefaultFeeValue()`, `getFeeValueIfExists()`
- **Internal**: `execute()` (generic instruction execution with Anchor error translation), `decode()`, `getDiscriminator()`

## CONVENTIONS (PACKAGE-SPECIFIC)
- `programs` property exposes all 5 Anchor program instances: `stakePoolProgram`, `rewardPoolProgram`, `rewardPoolDynamicProgram`, `feeManagerProgram`, `governor`
- Dual reward pool variants: fixed (`rewardPoolProgram`) vs dynamic (`rewardPoolDynamicProgram`) — runtime branching via `getRewardProgram(type)`
- `execute()` is the central error handler — translates Anchor errors using `translateError()` across multiple program IDLs
- **TODO in client.ts:904**: Error translation only checks `stakePoolProgram` IDL; errors from other programs won't be translated

## NOTES
- Tests only cover reward calculations (`rewards.spec.ts`). Client methods are untested.
- `lib/rewards.ts` exports `RewardEntryAccumulator` class and `calculateRewardAmountFromRate()` — used by external consumers
- Index re-exports `constants` as a namespace (not flat), unlike types which are flat re-exported
