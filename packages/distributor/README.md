## JS SDK to interact with Streamflow Airdrop.

This package allows you to `create`, `claim`, `clawback` a Token Distributor.

Token Distributor essentially that allows you to Airdrop tokens to multiple (thousands or even millions) of recipients with constant fees for the Sender. Recipient will pay gas fees when claiming tokens.

You can also use `getClaims` and `getDistributors` to fetch active claims and distributors respectively.

## Table of Contents

- [Installation](#installation)
- [Documentation](#documentation)
- [Import SDK](#import-sdk)
- [Create DistributorClient instance](#create-distributorclient-instance)
  - [Solana](#solana)
- [Create an Airdrop (Distributor account)](#create-an-airdrop-distributor-account)
- [Claim an Airdrop](#claim-an-airdrop)
- [Close a Claim](#close-a-claim)
- [Clawback an Airdrop](#clawback-an-airdrop)
- [Search Airdrops](#search-airdrops)
- [Additional notes](#additional-notes)

---

## Installation

`npm i -s @streamflow/common @streamflow/distributor`

or

`yarn add @streamflow/common @streamflow/distributor`

## Documentation
More Documentation available here: [docs site →](https://streamflow-finance.github.io/js-sdk/)

Public API documentation: [API docs →](https://api-public.streamflow.finance/v2/docs#/)

Automated Airdrop Creation: [notion doc →](https://streamflow.notion.site/Automated-Airdrop-Creation-45b84bfd2dda4d7196be5dd02eed29c8)

## Import SDK

Most common imports:

```javascript
import { ICluster } from "@streamflow/common";
import { SolanaDistributorClient } from "@streamflow/distributor/solana";
```

_Check the SDK for other types and utility functions._

## Create DistributorClient instance

### Solana

```javascript
const client = new SolanaDistributorClient({
  clusterUrl: "https://api.mainnet-beta.solana.com",
  cluster: ICluster.Mainnet,
});
```

## Create an Airdrop (Distributor account)

```javascript
const now = Math.floor(Date.now() / 1000);

const createData = {
    mint: "Gssm3vfi8s65R31SBdmQRq6cKeYojGgup7whkw4VCiQj", // mint
    name: "My Airdrop", // airdrop name
    file: csvFile, // CSV file, File | Blob
}

/* The CSV file should have the following format (headers can be omitted)
  pubkey,amount_unlocked,amount_locked,category
  1111111QLbz7JHiBTspS962RLKV8GndWFwiEaqKM,0,1,Staker
  1111111ogCyDbaRMvkdsHB3qfdyFYaG1WtRUAfdh,0,1,Staker
  11111112D1oxKts8YPdTJRG5FzxTNpMtWmq8hkVx3,0,1,Staker
  11111112cMQwSC9qirWGjZM6gLGwW69X22mqwLLGP,0,1,Staker

  Where:
  - amount_unlocked - amount of tokens unlocked right at the start of vesting (cliff);
  - amount_locked - amount to be distributed;
  - category - set to `Staker` as constant, it’s not used right now;

  Amounts are in raw format - you need to account for decimal places -> 1.5 tokens with 6 decimals will be 1500000
*/ 

const solanaParams = {
    invoker: wallet, // SignerWalletAdapter or Keypair of Sender account
    isNative: // [optional] [WILL CREATE A wSOL Airdrop] Needed only if you need to Airdrop Solana native token
};

const distributorParams = {
    mint: "Gssm3vfi8s65R31SBdmQRq6cKeYojGgup7whkw4VCiQj", // mint
    unlockPeriod: 1, // Unlock period in seconds
    startVestingTs: 0, // Timestamp when Airdrop starts, 0 for immediately upon creation
    endVestingTs: now + 3600 * 24 * 7, // Timestamp when Airdrop ends
    clawbackStartTs: now + 5, // Timestamp after which Airdrop can be clawed back to the Sender address
    claimsClosableByAdmin: false, // Whether individual Claims can be closed by the Sender
    claimsClosableByClaimant: false, // Whether the Recipient can close their own Claim
    claimsLimit: null, // The number of times a Recipient can Claim the Airdrop - 0 or null for no limit on claims
};

/* You can use our public API for generating a merkleTree or use your own implementation
  The public API is accessed with an auth token passed in in the x-api-key header of the request
  The tokens are provided manually by Streamflow by reaching out to us with the 
  wallet address that will create the Airdrop
*/
const { data: merkleResponse } = await httpClient.post(
  "https://api-public.streamflow.finance/v2/api/airdrops/",
  createData,
  headers: { 
    "Content-Type": "multipart/form-data",
    "x-api-key": "<your-auth-token>"
    }
)

// You can prepare the instructions for more granular control of execution
const { ixs } = await client.prepareCreateInstructions(
  {
    ...merkleResponse,
    root: merkleResponse.merkleRoot,
    maxNumNodes: new BN(merkleResponse.maxNumNodes).toString(),
    maxTotalClaim: new BN(merkleResponse.maxTotalClaim),
    ...distributorData,
  },
  solanaParams,
);

// Or you can call the create function which will trigger the transaction execution for you
const res = await client.create(
  {
    ...merkleResponse,
    root: merkleResponse.merkleRoot,
    maxNumNodes: new BN(merkleResponse.maxNumNodes).toString(),
    maxTotalClaim: new BN(merkleResponse.maxTotalClaim),
    ...distributorData,
  },
  solanaParams,
);
```

## Claim an Airdrop

```javascript
const solanaParams = {
    invoker: recipient, // SignerWalletAdapter or Keypair of Recipient account
};

const claimantAddress = "s3pWmY359mDrNRnDBZ3v5TrrqqxvxiW2t4U2WZyxRoA" // Wallet that will perform the claim
const ditributorAddress = res.metadataId; // address of the distributor account

// Use our public api or your own solution
const claimantData = await httpClient.get(
  `https://api-public.streamflow.finance/v2/api/airdrops/${distributorAddress}/claimants/${claimantAddress}`,
  headers: { "x-api-key": "<your-auth-token>" }
)

const claimantParams = {
    id: claimantData.distributorAddress,
    proof: claimantData.proof, // Merkle Proof used to verify claim
    amountUnlocked: new BN(claimantData.amountUnlocked), // Total amount unlocked for a Recipient
    amountLocked: new BN(claimantData.amountLocked), // Total amount locked for a Recipient
},

// Prepare the claim instructions
const { ixs } = client.prepareClaimInstructions(
    claimantParams,
    solanaParams,
),

// Or use the SDK to trigger the transaction
const claimRes = await client.claim(
    claimantParams,
    solanaParams,
);
```

## Close a Claim

```javascript
const solanaParams = {
    invoker: recipient, // SignerWalletAdapter or Keypair of Recipient account
};

// By Admin of the Airdrop, no need for proof in this case
const closeRes = await client.closeClaim(
  {
    id: res.metadataId, // address of the Distributor Account
    claimant: "s3pWmY359mDrNRnDBZ3v5TrrqqxvxiW2t4U2WZyxRoA" // address of the Recipient/Claimant
  },
  solanaParams,
);



// By Claimant
const claimantAddress = "s3pWmY359mDrNRnDBZ3v5TrrqqxvxiW2t4U2WZyxRoA" // Wallet that will perform the claim
const ditributorAddress = res.metadataId; // address of the distributor account

// Use our public api or your own solution
const claimantData = await httpClient.get(
  `https://api-public.streamflow.finance/v2/api/airdrops/${distributorAddress}/claimants/${claimantAddress}`,
  headers: { "x-api-key": "<your-auth-token>" }
)

const closeRes = await client.closeClaim(
  {
    id: claimantData.distributorAddress,
    proof: claimantData.proof, // Merkle Proof used to verify claim
    amountUnlocked: new BN(claimantData.amountUnlocked), // Total amount unlocked for a Recipient
    amountLocked: new BN(claimantData.amountLocked), // Total amount locked for a Recipient
    claimant: claimantAddress // address of the Recipient/Claimant
  },
  solanaParams,
);
```


## Clawback an Airdrop

Returns all funds to the original Sender. 
- only Sender can clawback funds before Airdrop has ended;
- anyone can clawback funds a day after Airdrop has ended - funds will still go to the original Sender;

```javascript
const solanaParams = {
    invoker: sender, // SignerWalletAdapter or Keypair of Invoker account
};
const clawbackRes = await client.clawback({ id: res.metadataId }, solanaParams);
```

## Search Airdrops

As all the data is stored on-chain you can also search Airdrops with `searchDistributors` method:

```javascript
// All parameters are optional, so in theory you can just fetch all Distributors
const params = {
    mint: "BZLbGTNCSFfoth2GYDtwr7e4imWzpR5jqcUuGEwr646K", 
    admin: "s3pWmY359mDrNRnDBZ3v5TrrqqxvxiW2t4U2WZyxRoA"
};
// Return an Array of objects {publicKey: PublicKey, account: Distributor}
const disributors = await client.searchDistributors(params);
```

## Additional notes

Streamflow Distributor protocol program IDs

| Solana  |                                              |
| ------- | -------------------------------------------- |
| Devet   | MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N |
| Mainnet |   |
