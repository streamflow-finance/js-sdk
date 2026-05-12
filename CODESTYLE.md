# Code style (Streamflow JS SDK)

Canonical conventions for TypeScript, imports, formatting, and shared SDK patterns.  
Project layout, commands, and package-specific notes stay in [`AGENTS.md`](AGENTS.md) and `packages/*/AGENTS.md`.

**Per-package `AGENTS.md`:** Link here for shared rules; keep only **package-specific** structure, “where to look,” and API notes — do not copy the bullets above into each package.

---

## TypeScript

- **Module resolution**: `NodeNext` (package `"type": "module"` where applicable).
- **`verbatimModuleSyntax`**: use explicit type-only imports where needed; prefer **inline type imports** (`import { type Foo } from "…"`) to match ESLint.
- **Strictness**: `strict` mode; **`noUncheckedIndexedAccess`** is enabled monorepo-wide **except** `@streamflow/stream`, which sets it to `false` (historical / pragmatic exception).
- **Target / syntax**: builds target **ES2020**; avoid syntax below that unless tooling explicitly allows it.

---

## Imports

- **Order** (ESLint `import/order`): **`builtin` + `external` first**, then **`internal`**, with a **blank line between** those groups.
- **Extensions**: do **not** add `.ts` / `.js` / `.tsx` / `.jsx` in import paths (`import/extensions`: never for packages).
- **Type imports**: `@typescript-eslint/consistent-type-imports` — prefer `import type` or inline `import { type X }` over value imports used only as types.
- After imports: `import/newline-after-import` is enforced; avoid multiple blank lines (`no-multiple-empty-lines`, max 1).

---

## Formatting

- **Line length**: **120 characters** (Prettier).
- **Prettier ignore** (repo convention): `*.md`, `pnpm-lock.yaml` — do not fight formatter on those via ad-hoc edits.

---

## Protocol client API patterns

Repeated across `@streamflow/stream`, `@streamflow/staking`, `@streamflow/distributor`, `@streamflow/launchpad`:

- **Writes**: pair **`prepare*Instructions()`** (or `prepare*…`) with **`execute()`** (or an equivalent execution path) so callers can compose transactions.
- **Naming**: main entry types are typically **`Solana*Client`**; on-chain helpers often use **`derive*PDA`** / **`derive*…`** in `lib/derive-accounts.ts` (or package-specific utils).
- **Low-level instructions**: keep raw Anchor instruction builders in **`instructions.ts`** or next to the client, depending on the package.

---

## Numbers and token amounts

- **All** BN / decimal token amount conversions should go through **`getBN()`** and **`getNumberFromBN()`** from `@streamflow/common` — do not duplicate ad-hoc scaling math.

---

## Generated code (do not hand-edit)

- **`packages/*/solana/descriptor/*.ts`** (and similar Anchor-generated IDLs): **regenerate from programs**; do not manually patch generated files except through the normal codegen pipeline.
- Partner or oracle descriptors under `packages/common` follow the same rule.

---

## Tests

- **Runner**: Vitest; **no** per-package `vitest.config` in the convention described by AGENTS (zero-config discovery).
- **Layout**: **`packages/<pkg>/__tests__/solana/*.spec.ts`**.
- **Files**: `*.spec.ts` naming; test files may relax `@typescript-eslint/no-explicit-any` (see `packages/eslint-config` overrides).

---

## Build / publish ergonomics (style-adjacent)

- **Dual package shape**: ESM under `dist/esm/`, CJS under `dist/cjs/`, conditional **`"import"` / `"require"`** exports in `package.json` with types.
- **Bundling**: Solana stack (`@solana/*`, `@coral-xyz/*`, `bn.js`, `borsh`, Node builtins) stays **external** in tsup; small helpers like **`p-queue`** / **`p-retry`** are **bundled** per root AGENTS notes.

---

## ESLint reference

Authoritative automated rules live in **`packages/eslint-config/index.js`** (Airbnb TypeScript + import plugins). When this document and ESLint disagree, **fix the doc** or **change the config** — do not leave them in conflict.

---

## Intentional inconsistencies (not bugs)

Some packages differ on **public export shape** (e.g. namespace vs named exports, `./solana` subpath). That affects **API surface**, not day-to-day formatting — see per-package AGENTS and root **ANTI-PATTERNS** in `AGENTS.md`.
