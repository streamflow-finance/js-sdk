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

`npm i @streamflow/stream @solana/web3.js @project-serum/anchor`

> _Anchor is needed for the `Wallet` type. We plan on removing this dependency in upcoming releases._

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
  BN,
  getBN,
  getNumberFromBN,
} from "@streamflow/stream";
```

_Check the SDK for other types and utility functions._

## Create StreamClient instance

Before creating and manipulating streams StreamClient instance must be created.
All streams functions are methods on this instance.

```javascript
import { StreamClient } from "@streamflow/stream";

const StreamClient = new StreamClient(
  "https://api.mainnet-beta.solana.com",
  Cluster.Mainnet,
  "confirmed"
);
```

## Create stream

```javascript
const createStreamParams = {
  sender: wallet, // Wallet/Keypair signing the transaction, creating and sending the stream.
  recipient: "4ih00075bKjVg000000tLdk4w42NyG3Mv0000dc0M00", // Solana recipient address.
  mint: "DNw99999M7e24g99999999WJirKeZ5fQc6KY999999gK", // SPL Token mint.
  start: 1643363040, // Timestamp (in seconds) when the stream/token vesting starts.
  depositedAmount: getBN(100, 9), // depositing 100 tokens with 9 decimals mint.
  period: 1, // Time step (period) in seconds per which the unlocking occurs.
  cliff: 1643363160, // Vesting contract "cliff" timestamp in seconds.
  cliffAmount: new BN(10), // Amount unlocked at the "cliff" timestamp.
  amountPerPeriod: getBN(5, 9), // Release rate: how many tokens are unlocked per each period.
  name: "Transfer to Jane Doe.", // The stream name or subject.
  canTopup: false, // setting to FALSE will effectively create a vesting contract.
  cancelableBySender: true, // Whether or not sender can cancel the stream.
  cancelableByRecipient: false, // Whether or not recipient can cancel the stream.
  transferableBySender: true, // Whether or not sender can transfer the stream.
  transferableByRecipient: false, // Whether or not recipient can transfer the stream.
  automaticWithdrawal: true, // Whether or not a 3rd party (e.g. cron job, "cranker") can initiate a token withdraw/transfer.
  withdrawalFrequency: 10, // Relevant when automatic withdrawal is enabled. If greater than 0 our withdrawor will take care of withdrawals. If equal to 0 our withdrawor will skip, but everyone else can initiate withdrawals.
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
const recipients = [
  {
    recipient: "4ih00075bKjVg000000tLdk4w42NyG3Mv0000dc0M00", // Solana recipient address.
    depositedAmount: getBN(100, 9), // depositing 100 tokens with 9 decimals mint.
    name: "January Payroll", // The stream name/subject.
    cliffAmount: getBN(10, 9), // amount released on cliff for this recipient
    amountPerPeriod: getBN(1, 9) //amount released every specified period epoch
  },
];

const createMultiStreamsParams = {
  sender: wallet, // Wallet/Keypair signing the transaction, creating and sending the stream.
  recipientsData: recipients, // Array of Solana recipient address.
  mint: "DNw99999M7e24g99999999WJirKeZ5fQc6KY999999gK", // SPL Token mint.
  start: 1643363040, // Timestamp (in seconds) when the stream/token vesting starts.
  period: 1, // Time step (period) in seconds per which the unlocking occurs.
  cliff: 1643363160, // Vesting contract "cliff" timestamp in seconds.
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


Please note that transaction fees for the scheduled transfers are paid upfront by the stream creator (sender).

## Identifying created contracts (streams or vesting)

Upon creation of a stream, a solana PDA (Program Derrived Address) is created and used to store stream configuration. This account is called 'metadata' of a stream. Every stream creation method returns a Keypair used to initialize Metadata. Public key of this Keypair is the unique identifier of that stream.
```javascript
const { ixs, tx, metadata } = await StreamClient.create(createStreamParams);

console.log(metadata.publicKey.toBase58()) // stream 'id'
```

## Withdraw from stream

```javascript
const withdrawStreamParams = {
  invoker: wallet, // Wallet/Keypair signing the transaction.
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to be withdrawn from.
  amount: getBN(100, 9), // Requested amount to withdraw. If stream is completed, the whole amount will be withdrawn.
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
  amount: getBN(100, 9), // Specified amount to topup (increases deposited amount).
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

## Get one stream by its ID

```javascript
try {
  const stream = await StreamClient.getOne(
    "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA" // Identifier of a stream that is fetched.
  );
} catch (exception) {
  // handle exception
}
```

## Fetching unlocked amount

```javascript
const stream = await StreamClient.getOne(
  "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA"
);
const unlocked = stream.unlocked(tsInSeconds) // bn amount unlocked at the tsInSeconds
console.log(getNumberFromBN(unlocked, 9))
```
* Note: unlocked amount is determined based on configuration set on creation, no dynamic data is involved so client calculations are correct and no requests to Solana RPC is needed 



## Reading withdrawn amount and remaining funds

```javascript
const stream = await StreamClient.getOne(
  "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA"
);
const withdrawn = stream.withdrawnAmount // bn amount withdrawn already
console.log(getNumberFromBN(wihtdrawn, 9))
const remaining = stream.withdrawnAmount // bn amount of remaining funds
console.log(getNumberFromBN(remaining, 9))

```

## Get multiple streams for a specific wallet address

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

## Handling errors

Protocol returns custom errors on:
- validation errors
- state missmatch errors (such as canceling a stream that is complete/already canceled)

Errors are returned per solana specification in hex format such as: 0x60

To interpret these, a public map of protocol errors is available here: https://streamflow.notion.site/Streamflow-protocol-docs-0accad86d5c44e5db84fd4fb49b8ff54#5a4a1be2226f47b8a63b4aac916d1940


## Additional notes

Default import `import Stream from '@streamflow/stream'` is an import of older SDK version that uses Anchor and doesn't support raw instructions, nor multi streams creation.

Streamflow protocol docs -> https://streamflow.notion.site/Streamflow-protocol-docs-0accad86d5c44e5db84fd4fb49b8ff54

Streamflow protocol program ID (devnet): `HqDGZjaVRXJ9MGRQEw7qDc2rAr6iH1n1kAQdCZaCMfMZ`

Streamflow protocol program ID (mainnet): `strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m`

**All BN amounts are denominated in their smallest units.**

E.g, if the amount is 1 SOL than this amount in lamports is `1000 \* 10^9 = 1_000_000_000.`

And `new BN(1_000_000_000)` is used.

Use `getBN` and `getNumberFromBN` utility functions for conversions between `BN` and `Number` types.


`npx typedoc packages/stream/index.ts`

WAGMI.
