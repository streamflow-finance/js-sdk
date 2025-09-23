## JS SDK to interact with the Streamflow protocol.

This package allows you to `create`, `createMultiple`, `withdraw`, `cancel`, `topup`, `transfer`, `update` a token stream.

You can also `getOne` stream and `get` multiple streams.

## Table of Contents

- [Installation](#installation)
- [Documentation](#documentation)
- [Import SDK](#import-sdk)
- [Create StreamClient instance](#create-streamclient-instance)
  - [Chain-specific clients](#chain-specific-clients)
  - [Generic Stream Client](#generic-stream-client)
- [Chain-specific Parameters](#chain-specific-parameters)
- [Create a Vesting Stream](#create-a-vesting-stream)
  - [Streamflow App Vesting criteria](#streamflow-app-vesting-criteria)
  - [Example for creating a Vesting Stream](#example-for-creating-a-vesting-stream)
- [Create a Token Lock](#create-a-token-lock)
  - [Streamflow app token lock criteria](#streamflow-app-token-lock-criteria)
  - [Example for creating a token lock](#example-for-creating-a-token-lock)
- [General Stream creation](#general-stream-creation)
- [Create multiple streams at once](#create-multiple-streams-at-once)
- [Identifying created Streams](#identifying-created-streams)
- [Withdraw from stream](#withdraw-from-stream)
- [Automatic withdrawal](#automatic-withdrawal)
- [Topup stream](#topup-stream)
- [Transfer stream to another recipient](#transfer-stream-to-another-recipient)
- [Cancel stream](#cancel-stream)
- [Update a stream](#update-a-stream)
- [Get one stream by its ID](#get-one-stream-by-its-id)
- [Fetching unlocked amount](#fetching-unlocked-amount)
- [Reading withdrawn amount and remaining funds](#reading-withdrawn-amount-and-remaining-funds)
- [Get multiple streams for a specific wallet address](#get-multiple-streams-for-a-specific-wallet-address)
- [Search Solana Streams](#search-solana-streams)
- [Handling errors](#handling-errors)
- [Additional notes](#additional-notes)

---

## Installation

`npm i -s @streamflow/stream`

or

`yarn add @streamflow/stream`

## Documentation
API Documentation available here: [docs site →](https://streamflow-finance.github.io/js-sdk/)

## Import SDK

Most common imports:

```javascript
import { BN } from "bn.js";
import { GenericStreamClient, getBN, getNumberFromBN } from "@streamflow/stream";
```

_Check the SDK for other types and utility functions._

## Create StreamClient instance

Before creating and manipulating streams, a chain-specific or generic StreamClient instance must be created. All stream functions are methods on this instance.

### Chain-specific clients

```javascript
// Solana
import { StreamflowSolana } from "@streamflow/stream";
const solanaClient = new StreamflowSolana.SolanaStreamClient(
  "https://api.mainnet-beta.solana.com"
);

// Aptos
import { StreamflowAptos } from "@streamflow/stream";
const aptosClient = new StreamflowAptos.AptosStreamClient(
  "https://fullnode.mainnet.aptoslabs.com/v1"
);

// Sui
import { StreamflowSui } from "@streamflow/stream";
const suiClient = new StreamflowSui.SuiStreamClient(
  "https://fullnode.testnet.sui.io:443"
);
```

### Generic Stream Client

GenericStreamClient provides an isomorphic interface to work with streams agnostic of chain.

```javascript
import { GenericStreamClient } from "@streamflow/stream";

const client = new GenericStreamClient<Types.IChain.Solana>({
  chain: IChain.Solana, // Blockchain
  clusterUrl: "https://api.mainnet-beta.solana.com", // RPC cluster URL
  cluster: ICluster.Mainnet, // (optional) (default: Mainnet)
  // ...rest chain specific params e.g. commitment for Solana
});
```

## Chain-specific Parameters

Each method requires chain-specific parameters. Here are the common patterns:
These are defined in:
- [Solana Types](./solana/types.ts) 
- [Aptos Types](./aptos/types.ts) 
- [Sui Types](./sui/types.ts) 

```javascript
// Solana parameters for Create 
const solanaCreateParams = {
  sender: wallet, // SignerWalletAdapter or Keypair of Sender account, can be only PublicKey if you are not using the client to initiate the signing and execution of the transaction
  isNative: false // [optional] Whether Stream should be paid with Solana native token (wSOL)
};

// Solana parameters for Withdraw, TopUp, Update, Cancel etc.
const solanaInteractParams = {
  invoker: wallet, // SignerWalletAdapter or Keypair signing the transaction, can be only PublicKey if you are not using the client to initiate the signing and execution of the transaction
  isNative: false // [optional] Whether Stream should be paid with Solana native token (wSOL)
};

// Aptos parameters
const aptosParams = {
  senderWallet: wallet, // AptosWalletAdapter Wallet of sender
  tokenId: "0x1::aptos_coin::AptosCoin" // Aptos Coin type
};

// Sui parameters
const suiParams = {
  senderWallet: wallet, // WalletContextState | Keypair
  tokenId: "0x2::sui::SUI" // Sui token type
};
```


> NOTE: All timestamp parameters are in seconds.

## Create a Vesting Stream

Vesting Streams are a type of Stream used to linearly unlock a given amount of tokens over a period of time. You can specify the amount, cliff, start time and releasePeriod along with other configuration that controls who can transfer or cancel the contract. For a Stream to be considered Vesting in the Streamflow App it has to match the criteria from the `isVesting` helper function (or `buildStreamType` returns `StreamType.Vesting`). The stream must not allow top-ups, the cliff amount must not be too close to the total amount and it must not be a Dynamic token lock.

For more details creating a Stream with arbitrary configuration see [General Stream creation](#general-stream-creation).
For creating multiple Streams at once see [Create Multiple Streams](#create-multiple-streams-at-once).

### Streamflow App Vesting criteria

The categorization criteria and other helper functions are defined in [contractUtils.ts](./common/contractUtils.ts)

```javascript
  return (
    !streamData.canTopup &&
    !isCliffCloseToDepositedAmount(streamData) &&
    !isDynamicLock(streamData.minPrice, streamData.maxPrice, streamData.minPercentage, streamData.maxPercentage)
  );
```

### Example for creating a Vesting Stream
The following code will create a Vesting Stream that unlocks 20% of the locked tokens at the start with the remaining 80% unlocked daily over a period of 2 weeks.

```javascript
const tokenDecimals = 9; 
const totalAmount = getBN(1000, tokenDecimals);
const cliffAmount = getBN(200, tokenDecimals); // optional

const day = 60 * 60 * 24; // in seconds
const twoWeeks = day * 14;

const remainingAmount = totalAmount.sub(cliffAmount);
const amountPerPeriod = remainingAmount.divn(twoWeeks); 

const createVestingParams: Types.ICreateStreamData = {
  recipient: "4ih00075bKjVg000000tLdk4w42NyG3Mv0000dc0M00", // Recipient address.
  tokenId: "DNw99999M7e24g99999999WJirKeZ5fQc6KY999999gK", // Token mint address.
  start: 1643363040, // In this case start time will be the time of unlock
  amount: totalAmount,
  period: day, // 1 day for daily unlocks
  cliff: 1643363040, // Cliff should match start
  cliffAmount: cliffAmount, // Amount unlocked at the "cliff" timestamp.
  amountPerPeriod: amountPerPeriod,
  name: "Transfer to Jane Doe.", // The stream name or subject.
  canTopup: false,  
};

// Using the client to trigger the transaction signing and execution
try {
  const { ixs, tx, metadata } = await client.create(createVestingParams, solanaCreateParams);
} catch (exception) {
  // handle exception
}

// Creating the transaction yourself
// note: in this case you do not have to pass a Signer or Keypair in solanaCreateParams, you can pass only the PublicKey
const { ixs } = await client.prepareCreateStreamInstructions(createVestingParams, solanaCreateParams)
```

## Create a Token Lock

A token lock is a Stream that has specific configuration making the unlock happen (almost) instantenously at a certain point in time. For a Stream to be considered a Token Lock in the Streamflow App it must match the criteria defined in the `isTokenLock` function (or for the `buildStreamType` type function to return `StreamType.Lock`). The Stream must not allow top-ups or auto-withdrawal and it can not be transferable by the sender or cancelable by either the sneder or the recipient. The `cliffAmount` must be equal to or greater than `depositedAmount.subn(1)`. Dynamic (price-based) locks conform to a different criteria.

### Streamflow app token lock criteria

The categorization criteria and other helper functions are defined in [contractUtils.ts](./common/contractUtils.ts)

```javascript
return (
  !streamData.canTopup &&
  !streamData.automaticWithdrawal &&
  !streamData.cancelableBySender &&
  !streamData.cancelableByRecipient &&
  !streamData.transferableBySender &&
  (isCliffCloseToDepositedAmount(streamData) ||
    isDynamicLock(streamData.minPrice, streamData.maxPrice, streamData.minPercentage, streamData.maxPercentage))
);

const isCliffCloseToDepositedAmount = (streamData: { depositedAmount: BN; cliffAmount: BN }): boolean => {
return streamData.cliffAmount.gte(streamData.depositedAmount.sub(new BN(1)));
```

### Example for creating a token lock
```javascript
const tokenDecimals = 9; 
const totalAmount = getBN(1000, tokenDecimals);
const cliffAmount = totalAmount.subn(1);

const createTokenLockParams: Types.ICreateStreamData = {
  recipient: "4ih00075bKjVg000000tLdk4w42NyG3Mv0000dc0M00", // Recipient address.
  tokenId: "DNw99999M7e24g99999999WJirKeZ5fQc6KY999999gK", // Token mint address.
  start: 1643363040, // In this case start time will be the time of unlock
  amount: totalAmount,
  period: 1, // 1 second
  cliff: 1643363040, // Cliff should match start
  cliffAmount: cliffAmount, // Amount unlocked at the "cliff" timestamp.
  amountPerPeriod: new BN(1), // Remaining "1" which is smallest token denominator will be unlocked in 1 second
  name: "Transfer to Jane Doe.", // The stream name or subject.
  // The settings below are only necessary if you wish the Stream to be labelled as a Token Lock on the Streamflow App (or if you use the smae criteria for categorization of Streams)
  canTopup: false, 
  cancelableBySender: false, 
  cancelableByRecipient: false, 
  transferableBySender: false, 
  transferableByRecipient: false, 
};

// Using the client to trigger the transaction signing and execution
try {
  const { ixs, tx, metadata } = await client.create(createTokenLockParams, solanaCreateParams);
} catch (exception) {
  // handle exception
}

// Creating the transaction yourself
// note: in this case you do not have to pass a Signer or Keypair in solanaCreateParams, you can pass only the PublicKey
const { ixs } = await client.prepareCreateStreamInstructions(createTokenLockParams, solanaCreateParams)
```


## General Stream creation

This covers arbitrary configuration for creating a Stream - depending on the configuration it may fall into different categories in the Streamflow App if the Streamflow protocol is used. For more details on automatic withdrawal see [Automatic Withdrawal](#automatic-withdrawal).

```javascript
const createStreamParams: Types.ICreateStreamData = {
  recipient: "4ih00075bKjVg000000tLdk4w42NyG3Mv0000dc0M00", // Recipient address.
  tokenId: "DNw99999M7e24g99999999WJirKeZ5fQc6KY999999gK", // Token mint address.
  start: 1643363040, // Timestamp (in seconds) when the stream/token vesting starts.
  amount: getBN(100, 9), // depositing 100 tokens with 9 decimals mint.
  period: 1, // Time step (period) in seconds per which the unlocking occurs.
  cliff: 1643363160, // Vesting contract "cliff" timestamp in seconds.
  cliffAmount: new BN(10), // Amount unlocked at the "cliff" timestamp.
  amountPerPeriod: getBN(5, 9), // Release rate: how many tokens are unlocked per each period.
  name: "Transfer to Jane Doe.", // The stream name or subject.
  canTopup: false, // Whether additional tokens can be deposited after creation, setting to FALSE will effectively create a vesting contract.
  canUpdateRate: false, // settings to TRUE allows sender to update amountPerPeriod
  cancelableBySender: true, // Whether or not sender can cancel the stream.
  cancelableByRecipient: false, // Whether or not recipient can cancel the stream.
  transferableBySender: true, // Whether or not sender can transfer the stream.
  transferableByRecipient: false, // Whether or not recipient can transfer the stream.
  automaticWithdrawal: true, // Whether or not a 3rd party (e.g. cron job, "cranker") can initiate a token withdraw/transfer.
  withdrawalFrequency: 10, // Relevant when automatic withdrawal is enabled. If greater than 0 our withdrawor will take care of withdrawals. If equal to 0 our withdrawor will skip, but everyone else can initiate withdrawals.
  partner: undefined, //  (optional) Partner's wallet address (string | undefined).
};

// Use appropriate chain-specific parameters (see Chain-specific Parameters section above)
try {
  const { ixs, tx, metadata } = await client.create(createStreamParams, solanaCreateParams);
} catch (exception) {
  // handle exception
}
```

## Create multiple streams at once

```javascript
const recipients = [
  {
    recipient: "4ih00075bKjVg000000tLdk4w42NyG3Mv0000dc0M00", // Recipient address.
    amount: getBN(100, 9), // depositing 100 tokens with 9 decimals mint.
    name: "January Payroll", // The stream name/subject.
    cliffAmount: getBN(10, 9), // amount released on cliff for this recipient
    amountPerPeriod: getBN(1, 9), //amount released every specified period epoch
  },
];
const createMultiStreamsParams: ICreateMultipleStreamData = {
  recipients: recipients, // Array of recipient objects.
  tokenId: "DNw99999M7e24g99999999WJirKeZ5fQc6KY999999gK", // Token mint address.
  start: 1643363040, // Timestamp (in seconds) when the stream/token vesting starts.
  period: 1, // Time step (period) in seconds per which the unlocking occurs.
  cliff: 1643363160, // Vesting contract "cliff" timestamp in seconds.
  canTopup: false, // setting to FALSE will effectively create a vesting contract.
  cancelableBySender: true, // Whether or not sender can cancel the stream.
  cancelableByRecipient: false, // Whether or not recipient can cancel the stream.
  transferableBySender: true, // Whether or not sender can transfer the stream.
  transferableByRecipient: false, // Whether or not recipient can transfer the stream.
  automaticWithdrawal: true, // Whether or not a 3rd party (e.g. cron job, "cranker") can initiate a token withdraw/transfer.
  withdrawalFrequency: 10, // Relevant when automatic withdrawal is enabled. If greater than 0 our withdrawor will take care of withdrawals. If equal to 0 our withdrawor will skip, but everyone else can initiate withdrawals.
  partner: undefined, //  (optional) Partner's wallet address (string | undefined).
};

try {
  const { txs } = await client.createMultiple(createMultiStreamsParams, solanaCreateParams);
} catch (exception) {
  // handle exception
}
```

Please note that transaction fees for the scheduled transfers are paid upfront by the stream creator (sender).

## Identifying created Streams

All Stream Clients return `ICreateResult` object (`createMultiple` returns an Array) that has the following structure

```javascript
interface ICreateResult {
  ixs: (TransactionInstruction | TransactionPayload)[];
  txId: string;
  metadataId: MetadataId;
}
```

`metadataId` is the id of the created stream.

## Withdraw from stream

To fetch the unlocked amount from a Stream see [Fetching unlocked amount](#fetching-unlocked-amount)

```javascript
const withdrawStreamParams: Types.IWithdrawData = {
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier (address) of a stream to be withdrawn from.
  amount: getBN(100, 9), // Requested amount to withdraw. If stream is completed, the whole amount will be withdrawn.
};

try {
  const { ixs, tx } = await client.withdraw(withdrawStreamParams, solanaInteractParams);
} catch (exception) {
  // handle exception
}
```

## Automatic withdrawal

This configuration controls whether automatic withdrawal are enabled for a Stream. `automaticWithdrawal` enables or disables this functionality. If set to `true` it will be possible for 3rd parties to withdraw the Stream on the recipient's behalf. This is also controlled by `withdrawalFrequency`. Setting `withdrawalFrequency` to `>0` will cause our own withdrawor to automatically withdraw funds to the recipient's wallet with the specifed frequency. Passing `0` will make our withdrawor ignore the Stream for auto-withdrawing, but it will be possible for others to initiate the witdrawal process.

## Topup stream

```javascript
const topupStreamParams: ITopUpData = {
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier (address) of a stream to be topped up.
  amount: getBN(100, 9), // Specified amount to topup (increases deposited amount).
};

// Use appropriate chain-specific parameters (see Chain-specific Parameters section above)
// Note: For Solana, you can add isNative: true for wSOL streams
try {
  const { ixs, tx } = await client.topup(topupStreamParams, solanaInteractParams);
} catch (exception) {
  // handle exception
}
```

## Transfer stream to another recipient

```javascript
const data: ITransferData = {
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier (address) of the stream to be transferred
  newRecipient: "99h00075bKjVg000000tLdk4w42NyG3Mv0000dc0M99", // Identifier (address) of a stream to be transferred.
};

// Use appropriate chain-specific parameters (see Chain-specific Parameters section above)
try {
  const { tx } = await client.transfer(data, solanaInteractParams);
} catch (exception) {
  // handle exception
}
```

## Cancel stream

```javascript
const cancelStreamParams: ICancelData = {
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to be canceled.
};

// Use appropriate chain-specific parameters (see Chain-specific Parameters section above)
try {
  const { ixs, tx } = await client.cancel(cancelStreamParams, solanaInteractParams);
} catch (exception) {
  // handle exception
}
```

## Update a stream

```javascript
const updateStreamParams: IUpdateData = {
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to update.
  enableAutomaticWithdrawal: true,  // [optional], allows to enable AW if it wasn't, disable is not possible
  withdrawFrequency: 60,  // [optional], allows to update withdrawal frequency, may result in additional AW fees
  amountPerPeriod: getBN(10, 9),  // [optional], allows to update release amount effective on next unlock
}

// Use appropriate chain-specific parameters (see Chain-specific Parameters section above)
try {
  const { ixs, tx } = await client.update(updateStreamParams, solanaInteractParams);
} catch (exception) {
  // handle exception
}
```

## Get one stream by its ID

```javascript
const data: IGetOneData = {
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream
};

try {
  const stream = await client.getOne(data);
} catch (exception) {
  // handle exception
}
```

## Fetching unlocked amount

```javascript
const stream = await client.getOne({
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA",
});

const unlocked = stream.unlocked(tsInSeconds); // BN amount unlocked at the tsInSeconds
console.log(getNumberFromBN(unlocked, 9)); 
```

- Note: unlocked amount is determined based on configuration set on creation, no dynamic data is involved.

## Reading withdrawn amount and remaining funds

```javascript
const stream = await client.getOne({
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA",
});
const withdrawn = stream.withdrawnAmount; // bn amount withdrawn already
console.log(getNumberFromBN(withdrawn, 9));
const remaining = stream.remaining(9); // amount of remaining funds
console.log(remaining);
```

## Get multiple streams for a specific wallet address

```javascript
const data: IGetAllData = {
  address: "99h00075bKjVg000000tLdk4w42NyG3Mv0000dc0M99",
  type: StreamType.All, // StreamType.Vesting, StreamType.Lock, StreamType.Payment
  direction: StreamDirection.All, // StreamDirection.Outgoing, StreamDirection.Incoming
};

try {
  const streams = client.get(data);
} catch (exception) {
  // handle exception
}
```

## Search Solana Streams

Solana RPC is pretty rich in what data it can allow to filter by, so we expose a separate `searchStreams` method on `SolanaStreamClient`:

```javascript
// All parameters are optional, so in theory you can just fetch all Streams
const params = {
  mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  sender: "AKp8CxGbhsrsEsCFUtx7e3MWyW7SWi1uuSqv6N4BEohJ",
  recipient: "9mqcpDjCHCPmttJp2t477oJ71NdAvJeSus8BcCrrvwy5",
}
// nativeStreamClient is exposed on a GenericStreamClient, you can also use SolanaStreamClient directly
// Return an Array of objects {publicKey: PublicKey, account: Stream}
const streams = await client.nativeStreamClient.searchStreams(params);
```

## Handling errors

`GenericStreamClient` wraps all errors when making on-chain calls with `ContractError` error class:
- this class inherits original traceback
- error may optionally contain `contractErrorCode` property that can be further mapped to a specific **Contract** error
- for `createMultiple` method errors are wrapped individually for every recipient address
- please check documentation for common enums `ContractErrorCode` and `SolanaContractErrorCode` to see short description for each error

A public map of protocol errors is available [here](https://streamflow.notion.site/Streamflow-protocol-docs-0accad86d5c44e5db84fd4fb49b8ff54).

## Additional notes

Streamflow protocol program IDs

| Solana  |                                              |
| ------- | -------------------------------------------- |
| Devet   | HqDGZjaVRXJ9MGRQEw7qDc2rAr6iH1n1kAQdCZaCMfMZ |
| Mainnet | strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m  |

| Aptos   |                                                                    |
| ------- | ------------------------------------------------------------------ |
| Testnet | 0xc6737de143d91b2f99a7e490d4f8348fdfa3bdd1eb8737a27d0455f8a3625688 |
| Mainnet | 0x9009d93d52576bf9ac6dc6cf10b870610bcb316342fef6eff80662fbbfce51b0 |

| Sui     |                                                                    |
| ------- | ------------------------------------------------------------------ |
| Testnet | 0xf1916c119a6c917d4b36f96ffc0443930745789f3126a716e05a62223c48993a |
| Mainnet | 0xa283fd6b45f1103176e7ae27e870c89df7c8783b15345e2b13faa81ec25c4fa6 |

**All BN amounts are denominated in their smallest units.**

E.g, if the amount is 1 SOL than this amount in lamports is `1000 \* 10^9 = 1_000_000_000.`

And `new BN(1_000_000_000)` is used.

Use `getBN` and `getNumberFromBN` utility functions for conversions between `BN` and `Number` types.

`getBN(1, 9)` is equal to `new BN(1_000_000_000)` 

`getNumberFromBN(new BN(1_000_000_000), 9)` will return 1