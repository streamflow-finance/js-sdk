# Streamflow Staking

## JS SDK to interact with Streamflow Staking protocol.

This package allows you to 
- `create staking pools and rewards pools`;
- `claim rewards`; 
- `stake`; 
- `unstake`; 
- `fund rewards pools`;

with the Streamflow Staking protocol.

This protocol is the complex of several programs that ensure flexibility and accountability for stakers and respective incentives for them.

aforementioned programs are:
- Stake Pools Program
- Reward Pools Program
- Fee Management Program (for streamflow usage, non-required and omitted from further docs)


## API Reference
API Documentation available here: [docs site →](https://streamflow-finance.github.io/js-sdk/)

The Stake Pool Program entities:
1. Stake Pool
2. Stake Entry (PDA which stores info about current stakes, durations and rewards structure)

The Reward Pool Program entities:
1. Reward Pool (must has a back-reference to a stake pool)
2. Reward Entry (PDA stores claims information and time-bound params)

1 Stake Pool can have N Reward Pools. 

> [!NOTE]
> There is a limitation of 255 Reward Pools per a single token mint for a stake pool.


## Installation

Install the sdk with npm

```npm
  npm install @streamflow/staking
```
```yarn
  yarn install @streamflow/staking
```
```pnpm
  pnpm add @streamflow/staking
```

## Usage/Examples

#### Create a client
```typescript
const client = new SolanaStakingClient({
  clusterUrl: "https://api.mainnet-beta.solana.com",
  cluster: ICluster.Mainnet
});
```

> [!WARNING]
> All operations expect ATAs to be created at the moment of execution and don't add these instructions.
> - Stake - staker's ATAs for stake mint and stake mint (see deriveStakeMintPDA fn) 
> - Withdraw/Unstake - staker's ATAs for stake mint and stake mint (see deriveStakeMintPDA fn) 
> - Claim rewards - staker's ATAs for reward mint
> - Fund Reward Pool - signer creates Streamflow Treasury's ATA for holding fee if defined

#### Read operations
```typescript

await client.searchStakePools({ mint, creator }) // returns results of lookup, `mint` and `creator` both optional. Omit the argument to get all pools

await client.searchStakeEntries({ payer, stakePool }) // returns all stake entries. Omit the argument to get all.

await client.searchRewardPools({ stakePool, mint })

await client.searchRewardEntries({ stakeEntry, rewardPool })

```

#### Create a staking pool

```typescript
const client = new SolanaStakingClient({
  clusterUrl: "https://api.mainnet-beta.solana.com",
  cluster: ICluster.Mainnet
});
/*
  Rewards Multiplier powered by 10^9.  
  Example: if multiplier is 2_000_000_000 than stakes for maxDuration will have 2x more rewards than stakes for minDuration
*/
const multiplier = new BN(1_000_000_000);
/*
  30 days - Unix time in seconds
*/
const maxDuration = new BN(2592000);
/*
 1 day - Unix time in seconds
*/
const maxDuration = new BN(86400);
/*
 Limits signers that can create/assign reward pools to this stake pool. True - anyone can
*/
const permissionless = false;
/*
  [0;256) derive stake pool PDA account address. 
  If stake pool with the same mint and creator/authority already exists, it is required to pick a vacant nonce 
*/
const nonce = 0;

const { metadataId: stakePoolPda } = await client.createStakePool({
    maxWeight: multiplier,
    maxDuration,
    minDuration,
    mint: MINT_ADDRESS,
    permissionless,
    nonce: 
})

```

#### Create a rewardPool pool
```typescript
import { calculateRewardAmountFromRate } from "@streamflow/staking";

/*
  [0;256) derive reward pool PDA account address.  
  If reward pool with the same mint already exists, it is required to pick a vacant nonce 
*/
const nonce = 0;
/*
 Amount of rewarding tokens stakers get in return for staking exactly 1 token to the staking pool
*/
const rewardAmount = new BN(100);
/*
  Alternatively you may want to calculate the correct reward amount from desired reward rate taking into account stake pool and reward pools tokes decimals
*/
const rewardRate = 0.0025;
const stakeTokenDecimals = 9;
const rewardTokenDecimals = 6;
// For every effectively Staked 1 WHOLE token 0.0025 of Reward Token will be distributed
const rewardAmount = calculateRewardAmountFromRate(rewardRate, stakeTokenDecimals, rewardTokenDecimals);
/*
 1 day - Unix time in seconds. Period for rewarding stakers. Period starts counting from the moment of staking
*/
const rewardPeriod = new BN(86400);
const rewardMint = REWARD_MINT_ADDRESS; // rewarding token
/*
 Whether to allow anyone to fund this reward pool. If true anyone can fund, otherwise only the creator can
*/
const permissionless = true;

client.createRewardPool({
      nonce,
      rewardAmount,
      rewardPeriod,
      rewardMint,
      permissionless = false,
      stakePool: stakePoolPda,
      stakePoolMint: MINT_ADDRESS,
    })
```


#### Reward Amount configuration (in-depth)

`rewardAmount` represents a 10^9 fraction of a raw token distributed for every **effective staked raw token** - it's important to account for both reward and stake token decimals when creating staking pool because of that.

Example with only raw tokens: if `rewardAmount` is configured to be `1_000` and user staked `1_000_000_000` Raw Tokens with a weight of `2` (in the actual protocol this number will be represented as `2_000_000_000`), it means that the effective number of raw tokens staked is `2_000_000_000` and on every reward distribution user will get `2_000_000_000 * 1_000 / 10^9 = 200` Raw Tokens;

Examples with decimals:

RT - Reward Token
ST - Stake Pool Token
P - fixed `rewardAmount` precision of 9

User wants to set reward amount of `0.003` for every effective staked whole token, depending on number of decimals RT and ST have configuration may look different:

1. RT with 6 decimals, ST with 6 decimals.
    - `0.003` of RT is `3_000` raw tokens;
    - ST has 6 decimals while P is 9, therefore `9 - 6 = 3`;
    - We need to add 3 decimals to the `rewardAmount` for proper distribution making it `3_000_000`;
2. RT with 12 decimals, ST with 12 decimals.
    - `0.003` of RT is `3_000_000_000` raw tokens;
    - ST has 12 decimals while P is 9, therefore `9 - 12 = -3`;
    - We need to remove decimals from the raw token to be distributed making `rewardAmount` = `3_000_000`;
3. RT with 5 decimals, ST with 7 decimals.
    - `0.003` of RT is `300` raw tokens;
    - ST has 7 decimals while P is 9, therefore `9 - 7 = 2`;
    - We need to add 2 decimals making `rewardAmount` = `30_000`;
4. RT with 9 decimals, ST with 3 decimals.
    - `0.003` of RT is `3_000_000` raw tokens;
    - the difference between RT and ST decimals is `9 - 3 = 6`;
    - ST has 3 decimals while P is 9, therefore `9 - 3 = 6`;
    - We need to add 6 decimals making `rewardAmount` = `3_000_000_000_000`;

We recommend to use the `calculateRewardAmountFromRate` function exposed by the sdk for the correct reward amount configuration. 

**Also, some configurations where there is big difference between Stake Pool and Reward Pool token decimals may be unsupported, in this case the function will return 0, so be aware.**

#### Deposit/Stake to a stake pool
```typescript
/*
  [0;256) derive stake entry PDA account address.  
  If stake entry with the same nonce already exists, it is required to pick a vacant one
*/
const nonce = 0; 
const amount = new BN(1000); // tokens to stake
const duration = new BN(86400 * 2) // 2 days, must be in the range of stakePool's min and max durations
await client.stake({ nonce, amount, duration, stakePool, stakePoolMint });
```

#### Unstake/Withdraw to a stake pool
```typescript
/*
  Usually to achieve this the app already loaded available stakeEntries.   
  Stake Entry holds used `nonce`, so `nonce` below could be taken from the stake entry
*/

/*
  [0;256) derived stake entry PDA account address.  
  If stake entry with the same nonce already exists, it is required to pick a vacant one
 */ 
const nonce = 0; // 
await client.unstake({ stakePool, stakePoolMint, nonce });
```

#### Claim a reward
Since each stake entry can produce multiple rewards (single claim per each reward pool linked to the staking pool) this operation 
can be triggered for every reward pool separately.

```typescript
await client.claimRewards({
  rewardPoolNonce,
  depositNonce,
  stakePool,
  rewardMint,
});
```

> [!Note]
> All operations have accompanying APIs for manual transaction building. Consult with API docs to find respective calls.  
> For instance, prepareClaimRewardsInstructions.  
> These APIs allow to aggregate multiple operations in a single transaction according to the app needs.  

## Appendix

Streamflow Staking protocol program IDs

| Solana  |                                              |
| ------- | -------------------------------------------- |
| Staking Pools Mainnet   | STAKEvGqQTtzJZH6BWDcbpzXXn2BBerPAgQ3EGLN2GH  |
| Reward Pools Mainnet   | RWRDdfRbi3339VgKxTAXg4cjyniF7cbhNbMxZWiSKmj  |
| ----   | ---  |
| Staking Pools Devnet   | STAKEvGqQTtzJZH6BWDcbpzXXn2BBerPAgQ3EGLN2GH  |
| Reward Pools Devnet   | RWRDdfRbi3339VgKxTAXg4cjyniF7cbhNbMxZWiSKmj  |

### IDLs
For further details you can consult with IDLs of protocols available at:
`@streamflow/staking/dist/esm/solana/descriptor`
