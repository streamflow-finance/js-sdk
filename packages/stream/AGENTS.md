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
│   ├── api-public/             # HTTP API client for stream data (REST, not on-chain)
│   └── api/                    # 3-phase composable API (thin wrappers delegating to StreamClient)
│       ├── types.ts            # Env, ExecutionEnv, InstructionResult, createClientFromEnv()
│       ├── create.ts           # create() → buildCreateTransactionInstructions()
│       ├── withdraw.ts         # withdraw() → prepareWithdrawInstructions()
│       ├── topup.ts            # topup() → prepareTopupInstructions()
│       ├── cancel.ts           # cancel() → prepareCancelInstructions()
│       ├── transfer.ts         # transfer() → prepareTransferInstructions()
│       ├── update.ts           # update() → prepareUpdateInstructions()
│       ├── create-batch.ts     # createBatch() → buildCreateMultipleTransactionInstructions()
│       ├── build-transaction.ts # buildTransaction() (independent, wraps @streamflow/common)
│       ├── sign.ts             # sign() (independent, wraps @streamflow/common)
│       ├── execute.ts          # execute(), executeBatch(), executeBatchSequential()
│       └── index.ts            # Barrel exports
├── __tests__/solana/           # streamClient.spec.ts, contractUtils.spec.ts, api/*.spec.ts
└── tsup.config.ts              # Entries: index, solana/descriptor/streamflow_aligned_unlocks, solana/api
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
| Add composable 3-phase function | `solana/api/` | Thin wrapper around StreamClient methods |

## KEY METHODS (SolanaStreamClient)
- **Create**: `create()`, `createMultiple()`, `createMultipleSequential()`, `createUnchecked()`
- **Lifecycle**: `withdraw()`, `cancel()`, `topup()`, `transfer()`, `update()`
- **Query**: `getOne()`, `get()`, `searchStreams()`, `getClosedStreams()`
- **Fees**: `getFees()`, `getDefaultFees()`, `getTotalFee()`
- **Prepare** (all have `prepare*Instructions` variant): `prepareCreateInstructions()`, `prepareCreateLinearStreamInstructions()`, `prepareCreateAlignedUnlockInstructions()`, `prepareWithdrawInstructions()`, `prepareCancelInstructions()`, `prepareTopupInstructions()`, `prepareTransferInstructions()`, `prepareUpdateInstructions()`
- **Build** (higher-level, include ATA/WSOL): `buildCreateTransactionInstructions()`, `buildCreateMultipleTransactionInstructions()`

## 3-PHASE COMPOSABLE API (`solana/api/`)

### Pattern
All Phase 1 functions follow: `(params, invoker: { publicKey: string | PublicKey }, env: Env): Promise<InstructionResult>`
- **Phase 1**: `create(params, invoker, env)` → instructions + optional signers
- **Phase 2**: `buildTransaction(instructions, opts, env)` → unsigned VersionedTransaction
- **Phase 3**: `sign(tx, signers)` → `execute(signedTx, env)` → signature

### Method-to-StreamClient Delegation Map
Phase 1 functions are thin wrappers that delegate to StreamClient methods and transform return types:

| API Function | Wraps | Returns |
|---|---|---|
| `create()` | `client.buildCreateTransactionInstructions()` | `{ ixs, metadataId, metadata }` → `CreateInstructionResult` |
| `withdraw()` | `client.prepareWithdrawInstructions()` | `TransactionInstruction[]` → `InstructionResult` |
| `topup()` | `client.prepareTopupInstructions()` | `TransactionInstruction[]` → `InstructionResult` |
| `cancel()` | `client.prepareCancelInstructions()` | `TransactionInstruction[]` → `InstructionResult` |
| `transfer()` | `client.prepareTransferInstructions()` | `TransactionInstruction[]` → `InstructionResult` |
| `update()` | `client.prepareUpdateInstructions()` | `TransactionInstruction[]` → `InstructionResult` |
| `createBatch()` | `client.buildCreateMultipleTransactionInstructions()` | Batch → `BatchInstructionResult` |

### Env Type
```ts
type EnvBase = {
  programId: PublicKey;
  commitment?: Commitment;
  client?: SolanaStreamClient;  // reuse if provided
};
type EnvWithConnection = EnvBase & { connection: Connection };
type EnvWithRpcUrl = EnvBase & { rpcUrl: string; cluster?: ICluster }; // cluster defaults to Mainnet
type Env = EnvWithConnection | EnvWithRpcUrl;
```
- `createClientFromEnv(env)` checks for `env.client` first, falls back to constructing from `connection.rpcEndpoint` or `rpcUrl`
- Cluster defaults to `ICluster.Mainnet` when not specified
- Use `pk()` from `@streamflow/common` for `string | PublicKey` → `PublicKey` normalization

### Key Design Decisions
- **`buildCreateTransactionInstructions` not `prepareCreateInstructions`**: The `build*` variant includes ATA creation + WSOL wrapping instructions. `prepare*` returns only the raw stream instruction. The composable API returns ALL instructions needed.
- **`invoker` parameter**: Separate 2nd param `{ publicKey: string | PublicKey }` — subset type of Solana wallet extensions, also represents Keypair.
- **Phase 2/3 are independent**: `buildTransaction`, `sign`, `execute` wrap `@streamflow/common` helpers directly — no StreamClient dependency.

## CONVENTIONS (PACKAGE-SPECIFIC)
- Re-exports `ContractError`, `ICluster`, `getBN`, `getNumberFromBN` from `@streamflow/common` so consumers don't need both packages
- Has `buildCreateTransaction()` and `buildCreateMultipleTransactionInstructions()` — extra builder layer not present in other packages
- `api-public/` provides HTTP-based stream queries as alternative to on-chain deserialization
- `getClosedStreams()` silently swallows errors in production (see ANTI-PATTERNS in root AGENTS.md)

## GOTCHAS
- **`transfer()` embeds compute budget**: `prepareTransferInstructions()` defaults `computeLimit = 100001` — returned instructions include `ComputeBudgetProgram.setComputeUnitLimit`. Callers using `buildTransaction()` must not duplicate compute budget.
- **`topup()` `ITopUpStreamExt.invoker` type mismatch**: `ITopUpStreamExt` requires `invoker: SignerWalletAdapter | Keypair` (stricter than other prepare methods which accept `{ publicKey }`). Internally only `invoker.publicKey` is accessed, so `{ publicKey }` objects work at runtime with a type cast.
- **`buildCreateTransactionInstructions` vs `prepareCreateInstructions`**: `build*` adds ATA creation + WSOL wrapping on top of the raw stream instruction. Use `build*` for complete instruction sets; `prepare*` for raw protocol instructions only.
- **StreamClient constructor creates its own Connection**: Even if you provide a `Connection` via `Env`, constructing a StreamClient from `connection.rpcEndpoint` creates a second internal Connection. Pass `env.client` to reuse.
- **`prepareUpdateInstructions` throws for aligned with restricted fields**: Passing `enableAutomaticWithdrawal` or `amountPerPeriod` for aligned streams throws — this propagates naturally through wrappers.
- **`FEE_ORACLE_PUBLIC_KEY` is cluster-dependent**: Must use `FEE_ORACLE_PUBLIC_KEY[cluster]`, never hardcode `.Mainnet`. Wrapping StreamClient handles this automatically.
- **`metadatas[i]` corresponds to `instructionsBatch[i]`**: In batch create, the parallel arrays are aligned — `metadatas[i]` is the metadata pubkey for `instructionsBatch[i]`.

## NOTES
- Tests only cover creation methods (14 test cases in streamClient.spec.ts). `withdraw`, `cancel`, `transfer`, `topup`, `getOne`, `get`, `searchStreams`, `update` — all untested
- Dual protocol support: standard streams AND aligned (price-based) unlock streams cause significant branching complexity
- `contractUtils.ts` provides stream type classification: `isVesting()`, `isTokenLock()`, `isAligned()`, `buildStreamType()`
- `timelockIDL` is the default export from `solana/index.ts`
- `pk()` from `@streamflow/common` (`common/solana/lib/public-key.ts`) is the canonical `string | PublicKey` → `PublicKey` normalizer — always use it instead of writing custom helpers
