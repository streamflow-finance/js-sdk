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