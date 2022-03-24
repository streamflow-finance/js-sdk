**Important: Security audit is underway.**

Docs: https://streamflow.finance/js-sdk/

# Streamflow

Streamflow is a token distribution platform powered by a streaming payments' protocol.

Streamflow program ID (devnet) => `HqDGZjaVRXJ9MGRQEw7qDc2rAr6iH1n1kAQdCZaCMfMZ`
<br>
Streamflow program ID (mainnet) => `strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m`

There are several ways to use Streamflow protocol:

- **(preferred) Application with UI** => [app.streamflow.finance](https://app.streamflow.finance)
- **JS SDK** (this repo) => [NPM package](https://www.npmjs.com/package/@streamflow/stream/v/2.0.0)
- **Rust SDK** for integration within Solana programs => [here](https://github.com/streamflow-finance/rust-sdk)

[**Streamflow Community** (free and open source, with limited features) is available here.](https://github.com/streamflow-finance/js-sdk/tree/community)

## JS SDK to interact with Streamflow protocol.

This package allows you to `create`, `createMultiple`, `withdraw`, `cancel`, `topup` and `transfer` SPL token stream.

You can also `getOne` stream and `get` multiple streams.

### Install the Streamflow JS SDK

`npm i @streamflow/stream @solana/web3.js @project-serum/anchor`

> _Anchor is needed for the `Wallet` type. We plan on removing this dependency in upcoming releases._

`bn.js` library is used for handling big numbers.

## Import SDK

Most common imports:

```javascript
import {
  StreamClient, 
  Stream,
  CreateParams,
  CreateMultiParams,
  WithdrawParams,
  TransferParams,
  TopupParams,
  CancelParams,
  GetAllParams,
  StreamDirection,
  StreamType,
  Cluster,
  TxResponse,
  CreateResponse,
} from "@streamflow/stream";
```

_Check the SDK for other types and utility functions._

## Create StreamClient instance

Before creating and manipulating streams StreamClient instance must be created. 
All streams functions are methods on this instance.
```
import {StreamClient} from '@streamflow/stream';

const StreamClient = new StreamClient("https://streamflow.rpcpool.com/8527ad85d20c2f0e6c37b026cab0", Cluster.Mainnet, "confirmed");
```

## Create stream

```javascript
const createStreamParams = {
  sender: wallet, // Wallet/Keypair signing the transaction, creating and sending the stream.
  recipient: "4ih00075bKjVg000000tLdk4w42NyG3Mv0000dc0M00", // Solana recipient address.
  mint: "DNw99999M7e24g99999999WJirKeZ5fQc6KY999999gK", // SPL Token mint.
  start: 1643363040, // Timestamp (in seconds) when the stream/token vesting starts.
  depositedAmount: new BN(1000000000000), // Deposited amount of tokens (in the smallest units).
  period: 1, // Time step (period) in seconds per which the unlocking occurs.
  cliff: 1643363160, // Vesting contract "cliff" timestamp in seconds.
  cliffAmount: new BN(100000000000), // Amount unlocked at the "cliff" timestamp.
  amountPerPeriod: new BN(5000000000), // Release rate: how many tokens are unlocked per each period.
  name: "Transfer to Jane Doe.", // The stream name/subject.
  canTopup: false, // setting to FALSE will effectively create a vesting contract.
  cancelableBySender: true, // Whether or not sender can cancel the stream.
  cancelableByRecipient: false, // Whether or not recipient can cancel the stream.
  transferableBySender: true, // Whether or not sender can transfer the stream.
  transferableByRecipient: false, // Whether or not recipient can transfer the stream.
  automaticWithdrawal: false, // Whether or not a 3rd party can initiate withdraw in the name of recipient (currently not used, set it to FALSE).
  partner: null, //  (optional) Partner's wallet address (string | null).
};

try {
  const { ixs, tx, metadata } = await StreamClient.create(createStreamParams);
} catch (exception) {
  // handle exception
}
```

## Create multiple streams at once

```javascript
const recipientsData = [
  { 
    recipient: "4ih00075bKjVg000000tLdk4w42NyG3Mv0000dc0M00", // Solana recipient address.
    depositedAmount:"new BN(1000000000000)", // Deposited amount of tokens (in the smallest units).
    name: "January Payroll", // The stream name/subject.
  }
];

const createMultiStreamsParams = {
  sender: wallet, // Wallet/Keypair signing the transaction, creating and sending the stream.
  recipientsData, // Array of Solana recipient address.
  mint: "DNw99999M7e24g99999999WJirKeZ5fQc6KY999999gK", // SPL Token mint.
  start: 1643363040, // Timestamp (in seconds) when the stream/token vesting starts.
  period: 1, // Time step (period) in seconds per which the unlocking occurs.
  cliff: 1643363160, // Vesting contract "cliff" timestamp in seconds.
  cliffAmount: new BN(100000000000), // Amount unlocked at the "cliff" timestamp.
  amountPerPeriod: new BN(5000000000), // Release rate: how many tokens are unlocked per each period.
  canTopup: true, // setting to FALSE will effectively create a vesting contract.
  cancelableBySender: true, // Whether or not sender can cancel the stream.
  cancelableByRecipient: false, // Whether or not recipient can cancel the stream.
  transferableBySender: true, // Whether or not sender can transfer the stream.
  transferableByRecipient: false, // Whether or not recipient can transfer the stream.
  automaticWithdrawal: false, // Whether or not a 3rd party can initiate withdraw in the name of recipient (currently not used, set it to FALSE).
  partner: null, //  (optional) Partner's wallet address (string | null).
};

try {
  const { txs } = await StreamClient.createMultiple(createMultiStreamsParams);
} catch (exception) {
  // handle exception
}
```

## Withdraw from stream

```javascript
const withdrawStreamParams = {
  invoker: wallet, // Wallet/Keypair signing the transaction.
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to be withdrawn from.
  amount: new BN(100000000000), // Requested amount to withdraw. If stream is completed, the whole amount will be withdrawn.
};

try {
  const { ixs, tx } = await StreamClient.withdraw(withdrawStreamParams);
} catch (exception) {
  // handle exception
}
```

## Topup stream

```javascript
const topupStreamParams = {
  invoker: wallet, // Wallet/Keypair signing the transaction.
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to be topped up.
  amount: new BN(100000000000), // Specified amount to topup (increases deposited amount).
};

try {
  const { ixs, tx } = await StreamClient.topup(topupStreamParams);
} catch (exception) {
  // handle exception
}
```

## Transfer stream to another recipient

```javascript
const data = {
  invoker: wallet, // Wallet/Keypair signing the transaction.
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA",
  recipientId: "99h00075bKjVg000000tLdk4w42NyG3Mv0000dc0M99", // Identifier of a stream to be transferred.
};

try {
  const { tx } = await StreamClient.transfer(data);
} catch (exception) {
  // handle exception
}
```

## Cancel stream

```javascript
const cancelStreamParams = {
  invoker: wallet, // Wallet/Keypair signing the transaction.
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to be canceled.
};

try {
  const { ixs, tx } = await StreamClient.cancel(cancelStreamParams);
} catch (exception) {
  // handle exception
}
```

## Get stream by ID

```javascript
try {
  const stream = await StreamClient.getOne("AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA"); // Identifier of a stream that is fetched.
} catch (exception) {
  // handle exception
}
```

## Get streams for a specific wallet address

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

### Additional notes

#### Default import `import Stream from '@streamflow/stream'` is an import of older SDK version that uses Anchor and doesn't support raw instructions, nor multi streams creation.

#### All BN amounts are denominated in their smallest units.

E.g, if the amount is 1 SOL than this amount in lamports is 1000 \* 10^9 = 1_000_000_000.
And `new BN(1_000_000_000)` is used.

Use `getBN` and `getNumberFromBN` utility functions for conversions between `BN` and `Number` types.

WAGMI.
