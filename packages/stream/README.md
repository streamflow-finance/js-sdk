Docs: https://streamflow.finance/js-sdk/

# Streamflow

Streamflow is a token distribution platform powered by a streaming payments' protocol.

There are several ways to use **Streamflow**:

- **(easiest) [app.streamflow.finance](https://app.streamflow.finance?utm_medium=github.com&utm_source=referral&utm_campaign=js-sdk-repo)** (React application that uses JS SDK directly)
- **[JS SDK](https://github.com/streamflow-finance/js-sdk)** to interact with the protocol => [NPM package](https://www.npmjs.com/package/@streamflow/stream)
- **[Rust SDK](https://github.com/streamflow-finance/rust-sdk)** to integrate within a Solana program => [Rust Crate](https://docs.rs/streamflow-sdk/)

**Security audit passed ✅**

Protocol audit available [here](https://github.com/streamflow-finance/rust-sdk/blob/main/protocol_audit.pdf).
Partner oracle audit available here [here](https://github.com/streamflow-finance/rust-sdk/blob/main/partner_oracle_audit.pdf).

## JS SDK to interact with Streamflow protocol.

This package allows you to `create`, `createMultiple`, `withdraw`, `cancel`, `topup` and `transfer` SPL token stream.

You can also `getOne` stream and `get` multiple streams.

---

## Installation

`npm i -s @streamflow/stream`

or

`yarn add @streamflow/stream`


## Import SDK

Most common imports:

```javascript
import {
    GenericStreamClient,
    StreamflowSolana,
    StreamflowAptos,
    Types,
    getBN,
    getNumberFromBN,
} from "@streamflow/stream";
```

_Check the SDK for other types and utility functions._

## Create StreamClient instance

Before creating and manipulating streams chain specific or generic StreamClient instance must be created.
All streams functions are methods on this instance.

### Solana
```javascript
import { StreamflowSolana, Types } from "@streamflow/stream";

const streamClient = new StreamflowSolana.SolanaStreamClient(
    "https://api.mainnet-beta.solana.com", // RPC cluster URL
    Types.ICluster.Mainnet, // (optional) (default: Mainnet) Solana cluster
    "confirmed", // (optional) (default: confirmed) Transaction commitment
);
```
### Aptos
```javascript
import { StreamflowAptos, Types } from "@streamflow/stream";

const StreamClient = new StreamflowAptos.AptosStreamClient(
    "https://fullnode.mainnet.aptoslabs.com/v1", // RPC cluster URL
    Types.ICluster.Mainnet, // (optional) (default: Mainnet) Aptos cluster
    "10000", // (optional) (default: "10000") maxGas for transactions
);
```
### Generic Stream Client
Provides isomorphic interface to work with streams agnostic of chain.
```javascript
import { GenericStreamClient, Types } from "@streamflow/stream";

const StreamClient = new StreamClient({
    chain: Types.IChain.Aptos, // Blockchain
    clusterUrl: "https://fullnode.mainnet.aptoslabs.com/v1", // RPC cluster URL
    cluster: Types.ICluster.Mainnet, // (optional) (default: Mainnet)
    // ...rest chain specific params e.g. commitment for Solana
});
```

All the examples below will contain generic method options descriptions and chain specific params.


> NOTE: All timestamp parameters are in seconds.
## Create stream

```javascript
const createStreamParams = {
    tokenId: "DNw99999M7e24g99999999WJirKeZ5fQc6KY999999gK", // SPL token mint or Aptos Coin type
    recipient: "4ih00075bKjVg000000tLdk4w42NyG3Mv0000dc0M00", // Recipient address (base58 string for Solana)
    amount: getBN(1_000_000, 9), // Deposited amount of tokens (using smallest denomination).
    amountPerPeriod: getBN(1_000, 9), // Release rate: how many tokens are unlocked per each period.
    cliff: 1643363160, // Vesting contract "cliff" timestamp in seconds.
    cliffAmount: getBN(100_000, 9),// Amount (smallest denomination) unlocked at the "cliff" timestamp.
    name: "Transfer to Jane Doe.", // The stream name or subject.
    period: 1, // Time step (period) in seconds per which the unlocking occurs.
    start: 1643363040, // Timestamp (in seconds) when the stream/token vesting starts.
    canTopup: false, // setting to FALSE will effectively create a vesting contract.
    cancelableBySender: true, // Wether or not sender can cancel the stream.
    cancelableByRecipient: false, // Wether or not recipient can cancel the stream.
    transferableBySender: true, // Wether or not sender can transfer the stream.
    transferableByRecipient: false, // Wether or not recipient can transfer the stream.
    automaticWithdrawal: true, // [optional] Wether or not a 3rd party (e.g. cron job, "cranker") can initiate a token withdraw/transfer.
    withdrawalFrequency: 10, // [optional] Relevant when automatic withdrawal is enabled. If greater than 0 our withdrawor will take care of withdrawals. If equal to 0 our withdrawor will skip, but everyone else can initiate withdrawals.
    canPause: false, // [optional] [WIP] Wether stream is Pausable
    canUpdateRate: fakse, // [optional] [WIP] Wether stream rate can be updated
};

const solanaParams = {
    sender: wallet, // SignerWalletAdapter or Keypair of Sender account
    partner: "4ih00075bKjVg000000tLdk4w42NyG3Mv0000dc0M00", // [optional] Partner Solana address
    isNative: // [optional] [WILL CREATE A wSOL STREAM] Wether Stream or Vesting should be paid with Solana native token or not
};

const aptosParams = {
    senderWallet: wallet, // AptosWalletAdapter Wallet of sender
};

try {
    const { ixs, tx, metadata } = await solanaStreamClient.create(createStreamParams, solanaParams);
} catch (exception) {
    // handle exception
}
```

## Create multiple streams at once

```javascript
const recipients = [
    {
        recipient: "4ih00075bKjVg000000tLdk4w42NyG3Mv0000dc0M00", // Recipient address (base58 string for Solana)
        amount: getBN(1_000_000, 9), // Deposited amount of tokens (using smallest denomination).
        name: "Transfer to Jane Doe.", // The stream name or subject.
        cliffAmount: getBN(100_000, 9),// Amount (smallest denomination) unlocked at the "cliff" timestamp.
        amountPerPeriod: getBN(1_000, 9), // Release rate: how many tokens are unlocked per each period.
    },
    // ... Other Recipient options
];

const createMultiStreamsParams = {
    tokenId: "DNw99999M7e24g99999999WJirKeZ5fQc6KY999999gK", // SPL token mint or Aptos Coin type
    cliff: 1643363160, // Vesting contract "cliff" timestamp in seconds.
    period: 1, // Time step (period) in seconds per which the unlocking occurs.
    start: 1643363040, // Timestamp (in seconds) when the stream/token vesting starts.
    canTopup: false, // setting to FALSE will effectively create a vesting contract.
    cancelableBySender: true, // Wether or not sender can cancel the stream.
    cancelableByRecipient: false, // Wether or not recipient can cancel the stream.
    transferableBySender: true, // Wether or not sender can transfer the stream.
    transferableByRecipient: false, // Wether or not recipient can transfer the stream.
    automaticWithdrawal: true, // [optional] Wether or not a 3rd party (e.g. cron job, "cranker") can initiate a token withdraw/transfer.
    withdrawalFrequency: 10, // [optional] Relevant when automatic withdrawal is enabled. If greater than 0 our withdrawor will take care of withdrawals. If equal to 0 our withdrawor will skip, but everyone else can initiate withdrawals.
    canPause: false, // [optional] [WIP] Wether stream is Pausable
    canUpdateRate: false, // [optional] [WIP] Wether stream rate can be updated
};

const solanaParams = {
    sender: wallet, // SignerWalletAdapter or Keypair of Sender account
    partner: "4ih00075bKjVg000000tLdk4w42NyG3Mv0000dc0M00", // [optional] Partner Solana address
    isNative: // [optional] [WILL CREATE A wSOL STREAM] Wether Stream or Vesting should be paid with Solana native token or not
};

const aptosParams = {
    senderWallet: wallet, // AptosWalletAdapter Wallet of sender
};

try {
    const { txs } = await StreamClient.createMultiple(createMultiStreamsParams, solanaParams);
} catch (exception) {
    // handle exception
}
```

## Withdraw from stream

```javascript
const withdrawStreamParams = {
    id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to be withdrawn from.
    amount: getBN(100000000000, 9), // Requested amount to withdraw. If stream is completed, the whole amount will be withdrawn.
};

const solanaParams = {
    invoker: wallet, // Wallet/Keypair signing the transaction.
};

const aptosParams = {
    senderWallet: wallet, // AptosWalletAdapter Wallet of sender
    tokenId: "0x1::aptos_coin::AptosCoin", // Aptos Coin type
};


try {
    const { ixs, tx } = await StreamClient.withdraw(withdrawStreamParams, solanaParams);
} catch (exception) {
    // handle exception
}
```

## Topup stream

```javascript
const topupStreamParams = {
    invoker: wallet, // Wallet/Keypair signing the transaction.
    id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to be topped up.
    amount: getBN(100000000000, 9), // Specified amount to topup (increases deposited amount).
};

const solanaParams = {
    invoker: wallet, // Wallet/Keypair signing the transaction.
    isNative: // [ONLY FOR wSOL STREAMS] [optional] Wether topup is with Native Solanas
};

const aptosParams = {
    senderWallet: wallet, // AptosWalletAdapter Wallet of sender
    tokenId: "0x1::aptos_coin::AptosCoin", // Aptos Coin type
};

try {
    const { ixs, tx } = await StreamClient.topup(topupStreamParams, solanaParams);
} catch (exception) {
    // handle exception
}
```

## Transfer stream to another recipient

```javascript
const data = {
    id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA",// Identifier of a stream to be transferred.
    recipientId: "99h00075bKjVg000000tLdk4w42NyG3Mv0000dc0M99", // New Recipient address
};

const solanaParams = {
    invoker: wallet, // Wallet/Keypair signing the transaction.
};

const aptosParams = {
    senderWallet: wallet, // AptosWalletAdapter Wallet of sender
    tokenId: "0x1::aptos_coin::AptosCoin", // Aptos Coin type
};


try {
    const { tx } = await StreamClient.transfer(data, solanaParams);
} catch (exception) {
    // handle exception
}
```

## Cancel stream

```javascript
const cancelStreamParams = {
    id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to be canceled.
};

const solanaParams = {
    invoker: wallet, // Wallet/Keypair signing the transaction.
};

const aptosParams = {
    senderWallet: wallet, // AptosWalletAdapter Wallet of sender
    tokenId: "0x1::aptos_coin::AptosCoin", // Aptos Coin type
};

try {
    const { ixs, tx } = await StreamClient.cancel(cancelStreamParams, solanaParams);
} catch (exception) {
    // handle exception
}
```

## Get one stream by its ID

```javascript
try {
    const stream = await StreamClient.getOne({
        id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA" // Identifier of a stream that is fetched.
    });
} catch (exception) {
    // handle exception
}
```

## Get multiple streams for a specific wallet address
**NOTE: ONLY SUPPORTED FOR SOLANA CLIENT**

```javascript
try {
    const streams = StreamClient.get({
        wallet: wallet, // Wallet signing the transaction.
        type: StreamType.All, // (optional) Type, default is StreamType.All
        direction: StreamDirection.All, // (optional) Direction, default is StreamDirection.All)
    });
} catch (exception) {
    // handle exception
}
```

## Additional notes

Streamflow protocol Solana program ID (devnet): `HqDGZjaVRXJ9MGRQEw7qDc2rAr6iH1n1kAQdCZaCMfMZ`

Streamflow protocol Solana program ID (mainnet): `strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m`

Streamflow protocol Aptos program ID (testnet): `0xc6737de143d91b2f99a7e490d4f8348fdfa3bdd1eb8737a27d0455f8a3625688`

Streamflow protocol Aptos program ID (mainnet): `0x9009d93d52576bf9ac6dc6cf10b870610bcb316342fef6eff80662fbbfce51b0`


**All BN amounts are denominated in their smallest units.**

E.g, if the amount is 1 SOL than this amount in lamports is `1000 \* 10^9 = 1_000_000_000.`

And `new BN(1_000_000_000)` is used.

Use `getBN` and `getNumberFromBN` utility functions for conversions between `BN` and `Number` types.

**Streamflow Community** (free and open source version, with a limited feature set) is available [here](https://github.com/streamflow-finance/js-sdk/tree/community).

`npx typedoc packages/stream/index.ts`

WAGMI.
