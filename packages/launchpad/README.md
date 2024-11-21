# Streamflow Launchpad

## JS SDk to interact with the Launchpad Protocol

This package exposes several instruction needed by both Launchpad creator and depositors:
- `create new Launchpad`;
- `fund launchpad`;
- `deposit into launchpad`;
- `claim deposited tokens`;
- `claim allocated tokens`;

Each Launchpad consist of multiple configuration options:
- **Base Mint** - mint that users will be buying - Launchpad should be funded with enough tokens prior to users claiming their allocations;
- **Quote Mint** - mint that users will deposit and in which price of the **Base Mint** will be denominated - Launchpad authority will be able to claim deposited tokens after depositting period ends;
- **Price** - price of the 1 **Base Mint** in **Quote Mint** tokens;
- **Periods** - there are Depositing period and Vesting period needed to be configured;
- **Vesting Configuration** - dynamic vesting will be used, so Launchpad creator should provide various configuration options for it;

## API Reference

API Documentation available here: [docs site →](https://streamflow-finance.github.io/js-sdk/)

## Installation

Install the sdk with npm

```npm
  npm install @streamflow/launchpad
```
```yarn
  yarn install @streamflow/launchpad
```
```pnpm
  pnpm add @streamflow/launchpad
```

## Usage/Examples

### Initiate the client
```typescript
const client = new SolanaLaunchpadClient({
  clusterUrl: "https://api.mainnet-beta.solana.com",
  cluster: ICluster.Mainnet
});
```

> [!WARNING]
> All operations expect ATAs to be created at the moment of execution and don't add these instructions.
> - Claim Deposits - Receiver token account that will be used to claim deposited tokens;
> - Claim Allocation - Token account for the `Base Mint` should be created prior to Depositor claiming their allocation;


### Read operations

```typescript

await client.searchLaunchpad({ baseMint, quoteMint }) // both mint parameters are optional.

await client.getLaunchpad(id) // fetch specific Launchpad by its ID.

await client.getDepositAccount(id) // fetch specific Deposit Account by its ID.
```

### Create new Launchpad
import { getBN } from "@streamflow/common";

```typescript
const { txId: createSig, metadataId } = await client.createLaunchpad({
    baseMint, // Mint that users will be buying
    quoteMint, // Mint that users will deposit
    receiver, // [optional] Token account that should receive deposits once deposit period is ended
    priceOracle, // [optional] Price Oracle address that will be used in dynamic vesting
    nonce: 1, // Nonce value, Launchpad PDA will be derived from nonce + baseMint
    price: getBN(0.15, QUOTE_MINT_DECIMALS), // Price per 1 `baseMint` whole token denominated in `quoteMint` tokens
    individualDepositingCap: getBN(1_000, QUOTE_MINT_DECIMALS), // Max Cap per User of `quoteMint` tokens to deposit
    maxDepositingCap: getBN(1_000_000, QUOTE_MINT_DECIMALS), // Max global Cap of `quoteMint` tokens to deposit
    depositingStartTs, // Timestamp when depositing should start
    depositingEndTs, // Timestamp when depositing should end
    vestingStartTs, // Timestamp when vesting should start
    vestingEndTs, // Timestamp when vesting should end initially
    vestingPeriod, // Period in seconds of vesting and dynamic vesting unlock updates, should be at least 30
    oracleType: "test", // [optional] Type the Price Oracle, should be aligned with the provided `priceOracle`
    minPrice: 0.05, // Min Price for dynamic vesting
    maxPrice: 1, // Max Price for dynamic vesting
    minPercentage: 1, // Min Percentage for dynamic vesting - will be used if current price <= `minPrice`
    maxPercentage: 1000, // Max Percentage for dynamic vesting - will be used if current price >= `maxPrice`
    tickSize: 1, // Tick size for percentages in dynamic vesting - will be used in case minPrice < current price < maxPrice
    skipInitial: false, // Whether to skip initial unlock amount update when dynamic vesting is initiated
    isMemoRequired: false, // Whether to require special Memo instruction on deposit
    tokenProgramId: TOKEN_PROGRAM_ID // [optional] SPL Token Program to use
  },
  { invoker: authority }
);
```

### Deposit tokens

```typescript
const { txId: depositSig } = await client.deposit(
  {
    launchpad: metadataId, // Id of the Launchpad to deposit tokens into
    quoteMint, // [optional] Mint Id, if not provided it will be fetched from the Laucnhpad
    amount: getBN(100.15, QUOTE_MINT_DECIMALS), // Amount of `quoteMint` tokens to deposit,
    autoCap: true, // [opional] Whether to automatically cap deposited tokens in case user deposited more than `maxDepositingCap`
    memo: "I don't reside in a sanctioned country.", // [optional] Text for memo instruction
    owner: user1.publicKey, // [optional] Deposit owner in case it differs from the invoker
    tokenProgramId: TOKEN_PROGRAM_ID // [optional] SPL Token Program to use
  },
  { invoker: user1 }
);
```

User can deposit tokens however many times they want if both individual and max Depositing caps are respected.

> [!Warning]  
> It's not possible to withdraw deposited tokens currently.

### Fund Launchpad

```typescript
const { txId: fundLaunchpadSig } = await client.fundLaunchpad(
  {
    launchpad: metadataId, // Id of the Launchpad to fund
    baseMint, // [optional] Mint Id, if not provided it will be fetched from the Laucnhpad
    amount: getBN(6_666_666, BASE_MINT_DECIMALS), // Amount of base tokens to funds Laucnhpad by
    tokenProgramId: TOKEN_PROGRAM_ID  // [optional] SPL Token Program to use
  },
  { invoker: authority }
);
```

> [!Note]  
> Client just uses spl transfer instruction, so technically anyone can fund a Launchpad.

### Claim deposited tokens

```typescript
const { txId: claimDepositsSig } = await client.claimDeposits(
  {
    launchpad: metadataId, // Id of the Launchpad to claim deposited tokens from
    quoteMint, // [optional] Mint Id, if not provided it will be fetched from the Laucnhpad
    tokenProgramId: TOKEN_PROGRAM_ID // [optional] SPL Token Program to use
  },
  { invoker: authority }
);
```

> [!Warning]  
> Claiming of Deposited tokens is possible only after Deposit period has ended.

### Claim token allocation

```typescript
const { txId: claimAllocatedSig } = await client.claimAllocatedVested(
  {
    launchpad: metadataId, // Id of the Launchpad to claimed allocation from
    baseMint, // [optional] Mint Id, if not provided it will be fetched from the Laucnhpad
    owner: user1.publicKey, // [optional] Deposit owner in case it differs from the invoker
    tokenProgramId: TOKEN_PROGRAM_ID // [optional] SPL Token Program to use
  },
  { invoker: user1 }
);
```

> [!Note]  
> Anyone can call this action on behalf of the Deposit after Deposit period has ended.
> 
> This action will essentially create a Streamflow Dynamic vesting contract where:
> - total depostted amount will be equal to the Depositor token allocation;
> - initial vesting start and end time will be set according to the vesting configuration
>   - in case `skipInitial` was not disabled, vesting schedule may differ depending on current price of the token;


> [!Warning]  
> This action should be done prior to Vesting Start Time - as dynamic vesting will be used and dynamic vesting can not have any cliff amount.
