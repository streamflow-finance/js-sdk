# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-14

## OVERVIEW
Streamflow JS SDK — pnpm + Lerna monorepo publishing 5 Solana protocol SDKs (`@streamflow/*`). TypeScript, dual ESM/CJS via tsup, Anchor-based on-chain programs.

## STRUCTURE
```
js-sdk/
├── packages/common/        # Shared types, Solana tx helpers, BN utils (foundation)
├── packages/stream/         # Core vesting/stream protocol — SolanaStreamClient
├── packages/staking/        # Staking pools + reward pools — SolanaStakingClient
├── packages/distributor/    # Merkle airdrop protocol — SolanaDistributorClient
├── packages/launchpad/      # Token launchpad + dynamic vesting — SolanaLaunchpadClient
├── packages/eslint-config/  # Shared ESLint config (private, not published)
├── examples/                # 8 example apps (JS/TS × ESM/CJS × bundled/unbundled)
├── scripts/                 # Build helpers (convertBN.sh, watch-build-pack.cjs)
├── docs/                    # GitHub Pages static site
└── .github/workflows/       # CI: PR checks, publish, alpha, docs, version tests
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add new protocol method | `packages/<proto>/solana/` | Client class is the main file |
| Modify shared types/utils | `packages/common/solana/types.ts` or `common/solana/utils.ts` | Impacts ALL packages |
| Change build output | `tsup.config.base.ts` + per-package `tsup.config.ts` | `createPackageConfig()` helper |
| Fix IDL/descriptor | `packages/<proto>/solana/descriptor/*.ts` | Auto-generated from Anchor — don't hand-edit |
| Add tests | `packages/<proto>/__tests__/solana/*.spec.ts` | Vitest, `__tests__/solana/` convention |
| Update CI/CD | `.github/workflows/` | 5 workflows: PR, publish, alpha, docs, version-tests |
| Change ESLint rules | `packages/eslint-config/index.js` | Shared by all packages |
| Add example | `examples/` | Must support all 8 matrix combos |
| Modify publish flow | `lerna.json`, root `package.json` scripts | Fixed versioning across all packages |

## DEPENDENCY GRAPH
```
@streamflow/common  ←  (foundation, no workspace deps)
        ↑
   ┌────┼────────────┐
   │    │             │
stream  staking   distributor
   ↑
   │
launchpad  (only package with cross-protocol dep on stream)
```

## CONVENTIONS
Full style reference: [`CODESTYLE.md`](CODESTYLE.md) (TypeScript, imports, formatting, tests, generated code).
- **Module syntax**: `NodeNext` + `verbatimModuleSyntax` — must use `import { type X }` inline type imports
- **File extensions**: No `.ts`/`.js` extensions in imports (ESLint enforced)
- **Import order**: Builtins/externals first, then internal — blank line between groups (ESLint enforced)
- **Line width**: 120 chars (Prettier)
- **Type safety**: Strict mode + `noUncheckedIndexedAccess` (except `packages/stream` which overrides to `false`)
- **Build**: Dual ESM (`dist/esm/`) + CJS (`dist/cjs/`) via tsup, platform `neutral`, target `es2020`
- **Exports**: Dual conditional exports in each package.json (`"import"` + `"require"` with type declarations)
- **Solana externals**: All `@solana/*`, `@coral-xyz/*`, `bn.js`, `borsh`, Node builtins are external in builds
- **Force-bundled**: `p-queue`, `p-retry` are bundled (not externalized)
- **Tests**: Vitest, `*.spec.ts` in `__tests__/solana/`, zero-config (no vitest.config)
- **IDL descriptors**: Auto-generated Anchor types in `solana/descriptor/` — do NOT hand-edit
- **`prepare*` / execute pattern**: Every write op has a `prepareXInstructions()` + `execute()` pair for composability
- **Prettier ignores**: `*.md`, `pnpm-lock.yaml`

## ANTI-PATTERNS (MONOREPO-WIDE)
- **Root package.json version mismatch**: Root says `4.0.1`, all packages are `11.3.1` — cosmetic but confusing
- **Stale `.lintstagedrc`**: Targets `src/**/*.js` but no `src/` directory exists
- **Dual husky config**: `.husky/pre-commit` runs `pnpm lint --parallel` AND `.huskyrc.json` runs `lint-staged` — potential conflict
- **Export pattern inconsistency**: `@streamflow/distributor` uses namespace wrapper + `./solana` subpath; other packages don't — see per-package AGENTS.md

## COMMANDS
```bash
pnpm build              # Build all packages (topological via Lerna)
pnpm test               # Run all package tests (vitest)
pnpm lint               # ESLint across all packages
pnpm tsc:lint           # TypeScript strict type checking
pnpm validate-packages  # publint + @arethetypeswrong/cli validation
pnpm dev                # Build + watch all packages in parallel
pnpm examples           # Install + build + verify all 8 example apps
pnpm version-all        # Bump all package versions (Lerna, manual)
pnpm publish            # Validate + publish to npm (Lerna)
```

## NOTES
- 7 of 10 largest files are **auto-generated Anchor IDLs** (~13,500 lines) — maintenance-free, regenerated from on-chain programs
- `@streamflow/launchpad` is the only package with a cross-protocol dependency (`stream`)
- All BN amount conversions MUST go through `getBN()` / `getNumberFromBN()` — canonical conversion functions
- Pre-commit hook runs `pnpm lint` only — no type-check or tests on commit
- Alpha versions use `{version}-alpha.p{PR}.{sha}` format (non-standard semver)
- Node.js >=18 required; CI tests Node 18/20/22/24 matrix
