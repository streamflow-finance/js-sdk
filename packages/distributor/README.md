## JS SDK to interact with Streamflow Airdrop.

This package allows you to `create`, `claim`, `clawback` a Token Distributor.

Token Distributor essentially that allows you to Airdrop tokens to multiple (thousands or even millions) of recipients with constant fees for the Sender. Recipient will pay gas fees when claiming tokens.

You can also use `getClaims` and `getDistributors` to fetch active claims and distributors respectively.

---

## Installation

`npm i -s @streamflow/common @streamflow/distributor`

or

`yarn add @streamflow/common @streamflow/distributor`

## Documentation
API Documentation available here: [docs site →](https://streamflow-finance.github.io/js-sdk/)

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

const solanaParams = {
    invoker: wallet, // SignerWalletAdapter or Keypair of Sender account
    isNative: // [optional] [WILL CREATE A wSOL Airdrop] Needed only if you need to Airdrop Solana native token
};

const res = await client.create(
  {
    mint: "Gssm3vfi8s65R31SBdmQRq6cKeYojGgup7whkw4VCiQj", // mint
    version: now, // version of the Airdrop, version will be used to generate unique address of the Distributor Account
    root: [
      54, 218, 49, 68, 131, 214, 250, 113, 37, 143, 167, 73, 17, 54, 233, 26, 141, 93, 28, 186, 137, 211, 251, 205,
      240, 192, 134, 208, 108, 246, 0, 191,
    ], // Merkle root
    maxNumNodes: 4, // Number of recipients
    maxTotalClaim: new BN("4000000000"), // Total amount to distribute
    unlockPeriod: 1, // Unlock period in seconds
    startVestingTs: 0, // Timestamp when Airdrop starts
    endVestingTs: now + 3600 * 24 * 7, // Timestamp when Airdrop ends
    clawbackStartTs: now + 5, // Timestamp after which Airdrop can be clawed back to the Sender address
    claimsClosableByAdmin: false, // Whether individual Claims can be closed by the Sender
    claimsClosableByClaimant: false, // Whether the Recipient can close their own Claim
    claimsLimit: null, // The number of times a Recipient can Claim the Airdrop - 0 or null for no limit on claims
  },
  solanaParams,
);
```

## Claim an Airdrop

```javascript
const solanaParams = {
    invoker: recipient, // SignerWalletAdapter or Keypair of Recipient account
};

const claimRes = await client.claim(
  {
    id: res.metadataId, // address of the Distributor Account
    proof: [
      [
        36, 11, 128, 61, 125, 228, 9, 50, 112, 51, 54, 201, 213, 81, 228, 216, 62, 191, 68, 63, 59, 125, 163, 77, 44,
        88, 170, 65, 139, 25, 147, 145,
      ],
      [
        53, 101, 204, 14, 202, 64, 98, 238, 49, 6, 119, 208, 98, 195, 150, 81, 191, 55, 46, 103, 91, 245, 121, 195,
        43, 104, 75, 183, 12, 38, 37, 153,
      ],
    ], // Merkle Proof used to verify claim
    amountUnlocked: new BN("0"), // Total amount unlocked for a Recipient
    amountLocked: new BN("1000000000"), // Total amount locked for a Recipient
  },
  solanaParams,
);
```

## Close a Claim

```javascript
const solanaParams = {
    invoker: recipient, // SignerWalletAdapter or Keypair of Recipient account
};

// By Admin
const closeRes = await client.closeClaim(
  {
    id: res.metadataId, // address of the Distributor Account
    claimant: "s3pWmY359mDrNRnDBZ3v5TrrqqxvxiW2t4U2WZyxRoA" // address of the Recipient/Claimant
  },
  solanaParams,
);

// By Claimant
const closeRes = await client.closeClaim(
  {
    id: res.metadataId, // address of the Distributor Account
    proof: [
      [
        36, 11, 128, 61, 125, 228, 9, 50, 112, 51, 54, 201, 213, 81, 228, 216, 62, 191, 68, 63, 59, 125, 163, 77, 44,
        88, 170, 65, 139, 25, 147, 145,
      ],
      [
        53, 101, 204, 14, 202, 64, 98, 238, 49, 6, 119, 208, 98, 195, 150, 81, 191, 55, 46, 103, 91, 245, 121, 195,
        43, 104, 75, 183, 12, 38, 37, 153,
      ],
    ], // Merkle Proof used to verify claim
    amountUnlocked: new BN("0"), // Total amount unlocked for a Recipient
    amountLocked: new BN("1000000000"), // Total amount locked for a Recipient
    claimant: "s3pWmY359mDrNRnDBZ3v5TrrqqxvxiW2t4U2WZyxRoA" // address of the Recipient/Claimant
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
// All parameters are optional, so in theory you just fetch all Distributors
const params = {
    mint: "BZLbGTNCSFfoth2GYDtwr7e4imWzpR5jqcUuGEwr646K", 
    admin: "s3pWmY359mDrNRnDBZ3v5TrrqqxvxiW2t4U2WZyxRoA"
};
// Return an Array of objects {publicKey: PublicKey, account: Distributor}
const disributors = await client.searchDistributors(params);
```

## Handling errors

`GenericStreamClient` wraps all errors when making on-chain calls with `ContractError` error class:
- this class inherits original traceback
- error may optionally contain `contractErrorCode` property that can be further mapped to a specific **Contract** error
- for `createMultiple` method errors are wrapped individually for every recipient address
- please check documentation for enums `AnchorErrorCode` and `ContractErrorCode` at `solana/types.ts` to see short description for each error

## Additional notes

Streamflow Distributor protocol program IDs

| Solana  |                                              |
| ------- | -------------------------------------------- |
| Devet   | MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N |
| Mainnet |   |
