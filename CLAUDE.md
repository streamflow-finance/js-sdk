# Streamflow JS SDK — Claude Code Instructions

@AGENTS.md

@CODESTYLE.md

## Claude Code Specific

- Use `pnpm` for all package operations (not npm, not yarn)
- Before considering work done: `pnpm lint && pnpm tsc:lint`
- Run `pnpm test` to verify changes (Vitest, zero-config)
- Conventional commit format (`feat:`, `fix:`, `chore:`, etc.)
- All Solana BN conversions must use `getBN()` / `getNumberFromBN()` from `@streamflow/common`
- Do not hand-edit files in `packages/*/solana/descriptor/` — they are auto-generated Anchor IDLs
