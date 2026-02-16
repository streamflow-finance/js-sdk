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
- Reward Pools Program (fixed and dynamic variants)
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
  invoker should be of type SignerWalletAdapter | Keypair
  computePrice and computeLimit are optional
 */
const extParams = { invoker, computePrice: 10_000, computeLimit: 'autoSimulate' };
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
const minDuration = new BN(86400);
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
    nonce,
}, extParams)

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

/*
  Whether to create stake mint token accounts in frozen state by default - in this case stakers won't be able to send or burn these tokens
 */
const freezeStakeMint = true;

client.createRewardPool({
    nonce,
    rewardAmount,
    rewardPeriod,
    rewardMint,
    permissionless,
    freezeStakeMint,
    stakePool: stakePoolPda,
    stakePoolMint: MINT_ADDRESS,
}, extParams)
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
await client.stake({ nonce, amount, duration, stakePool, stakePoolMint }, extParams);

// Create Reward Entry to track rewards, call instruction for every reward pool on `stake`
await client.createRewardEntry({ stakePool, rewardPoolNonce, depositNonce: nonce, rewardMint }, extParams);
```

> [!WARNING]
> For every Reward Pool a Reward entry should be created prior to claim and ideally at the same time when user stakes. Without a Reward Entry pool won't be able to properly track reward distribution.

You can also bundle multiple instructions with `prepare` calls to stake and create entries in one transaction:

```typescript
const nonce = 1; 
const stakeIxs = await client.prepareStakeInstructions({ nonce, amount, duration, stakePool, stakePoolMint }, extParams);
const rewardPoolNonce1 = 0;
const rewardPoolNonce2 = 1;
const reward1Ixs = await this.prepareCreateRewardEntryInstructions({ stakePool, rewardPoolNonce: rewardPoolNonce1, depositNonce: nonce, rewardMint }, extParams);
const reward2Ixs = await this.prepareCreateRewardEntryInstructions({ stakePool, rewardPoolNonce: rewardPoolNonce2, depositNonce: nonce, rewardMint }, extParams);

await client.execute([...stakeIxs, ...reward1Ixs, ...reward2Ixs, ], extParams);
```

> [!NOTE]
> `execute` method will bundle instructions in a transaction, estimate compute price and execute the transaction.

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

// Done separately, returns rent fee back to the user
await client.closeStakeEntry({ stakePool, nonce })
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

### Grouped actions

Client also exposes methods to group staking/unstaking with reward pool actions.

```typescript
/// Will stake into a Stake Pool and create Reward Entries for every passed pool - reward entries are used to track rewards, ideally should be created right after staking.
{
   const { txId } = await client.stakeAndCreateEntries({
      stakePool,
      stakePoolMint: mint,
      amount: new BN(1),
      duration: new BN(0),
      nonce: stakeNonce,
      rewardPools: [{
         nonce: 0,
         mint,
         rewardPoolType: "fixed",
      }]
   }, extParams);
   console.log("Stake signature: ", txId);
}

// Performs multiple actions needed to fully unstake:
// 1. Claims all unclaimed rewards from all passed pools
// 2. Unstakes from a Stake Pool and closes the stake entry
// 3. Closes Reward Entries, returning the rent fee back
{
   const { txId } = await client.unstakeAndClaim({
      stakePool,
      stakePoolMint: mint,
      nonce: stakeNonce,
      rewardPools: [{
         nonce: 0,
         mint,
         rewardPoolType: "fixed"
      }]
   }, extParams);
   console.log("Unstake signature: ", txId);
}

// Useful when user can't claim rewards, but wants to unstake and close all created entries.
{
   const { txId } = await client.unstakeAndClose({
      stakePool,
      stakePoolMint: mint,
      nonce: stakeNonce,
      rewardPools: [{
         nonce: 0,
         mint,
         rewardPoolType: "fixed"
      }]
   }, extParams);
   console.log("Unstake signature: ", txId);
}
```

> [!Note]
> Transactions can become quite large if you have many rewards pools, that can make it impossible to do all actions in 1 transaction - in this case please stick with `prepare` methods to build custom instructions and execute them with `execute`.

### Auto-Unstake

Stake pools can be configured with `autoUnstake: true` (via `createPoolV2`) to automatically unstake entries once their lock duration expires. 
- When auto-unstake is enabled, a worker will unstake on the user's behalf after the lock period ends; 
- if the stake entry has an associated reward entry from a fixed reward pool, the worker will also claim rewards during the auto-unstake process.

This feature works well with `maxTotalStakeCumulative` — together they allow stake pool creators to have a predictable amount of tokens needed in the reward pool. Without auto-unstake, rewards continue to accumulate past unlock time, which can drain a reward pool unexpectedly.

```typescript
const { metadataId: stakePoolPda } = await client.createStakePool({
    maxWeight: multiplier,
    maxDuration,
    minDuration,
    mint: MINT_ADDRESS,
    permissionless: false,
    nonce: 0,
    autoUnstake: true,
    maxTotalStakeCumulative: new BN(1_000_000_000), // cap total stake
}, extParams);
```

### Fund Delegate

Fund Delegate allows configuring automated periodic top-ups of a dynamic reward pool. The delegate account holds tokens that a worker uses to fund the reward pool on a schedule. Users transfer tokens to the delegate's token account, and the worker funds the pool according to the configured schedule (start time, period, and expiry).

```typescript
const rewardPool = /* dynamic reward pool address */;

// Create a fund delegate with a schedule
const { tokenAccount } = await client.createFundDelegate({
    rewardPool,
    startTs: new BN(Math.floor(Date.now() / 1000)),  // start now
    period: new BN(86400),                             // fund every 24 hours
    expiryTs: new BN(Math.floor(Date.now() / 1000) + 86400 * 30), // expire in 30 days
}, extParams);
```

After creating the delegate, transfer reward tokens to the `tokenAccount`, which is an ATA for the fund delegate PDA address. The worker will periodically fund the reward pool from these tokens according to the schedule.

### Set Token Metadata

SolanaStakingClient also exposes original IDL of all programs, so you can use some additional instructions, that are not wrapped by the client. Currently there is no method to update Token Metadata of the Staking Mint that stakers get in return for their stake, but you can call the instructions from the original IDL like so:

```typescript
// Stake Mint Token Program matches token program of the original token, program exposes separate methods depending on the program.
import { signAndExecuteTransaction, prepareTransaction } from "@streamflow/common";

const program = client.programs.stakePoolProgram;

// for SPL
let ix = await program.methods.setTokenMetadataSpl("sToken", "sTST", "https://arweave.net/VVrrcRaOYombRAzWrcDLiV5hVmQUfvp1nS8nfttQvBE").accounts({
   stakePool: metadataId
}).accountsPartial({
   authority: keypair.publicKey
}).instruction();
// for Token22
ix = await program.methods.setTokenMetadataT22("sToken", "sTST", "https://arweave.net/VVrrcRaOYombRAzWrcDLiV5hVmQUfvp1nS8nfttQvBE").accounts({
   stakePool: metadataId
}).accountsPartial({
   authority: keypair.publicKey
}).instruction();

const { signature } = await client.execute([ix], {invoker: keypair});
console.log(signature);
 ```

## Appendix

Streamflow Staking protocol program IDs

| Solana  |                                              |
| ------- | -------------------------------------------- |
| Staking Pools Mainnet   | STAKEvGqQTtzJZH6BWDcbpzXXn2BBerPAgQ3EGLN2GH  |
| Reward Pools (fixed) Mainnet   | RWRDdfRbi3339VgKxTAXg4cjyniF7cbhNbMxZWiSKmj  |
| Reward Pools (dynamic) Mainnet   | RWRDyfZa6Rk9UYi85yjYYfGmoUqffLqjo6vZdFawEez  |
| ----   | ---  |
| Staking Pools Devnet   | STAKEvGqQTtzJZH6BWDcbpzXXn2BBerPAgQ3EGLN2GH  |
| Reward Pools (fixed) Devnet   | RWRDdfRbi3339VgKxTAXg4cjyniF7cbhNbMxZWiSKmj  |
| Reward Pools (dynamic) Devnet   | RWRDyfZa6Rk9UYi85yjYYfGmoUqffLqjo6vZdFawEez  |

### IDLs
For further details you can consult with IDLs of protocols available at:
`@streamflow/staking/dist/esm/solana/descriptor`
