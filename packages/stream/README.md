**Important: Security audit is underway.**

# JavaScript SDK to interact with Streamflow protocol.

You can `create`, `withdraw`, `cancel`, `topup` and `transfer` a stream.

You can also `getOne` stream and `get` multiple streams.

# Usage (with examples)

Devnet Program ID: `HqDGZjaVRXJ9MGRQEw7qDc2rAr6iH1n1kAQdCZaCMfMZ`.

Mainnet Program ID: `strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m`.

## Install the Streamflow JS SDK

`$ npm i @streamflow/stream @solana/web3.js @project-serum/anchor`

Anchor is needed for now for the `Wallet` type.
<br>
_We plan to remove this dependency in the upcoming releases._

`bn.js` library is used for handling big numbers.

```javascript
import { Connection } from "@solana/web3.js";
import { Wallet } from "@project-serum/anchor/src/provider";
import BN from "bn.js";
```

## Import SDK

Most used imports:

```javascript
import Stream, {
  Stream,
  CreateStreamParams,
  WithdrawStreamParams,
  TransferStreamParams,
  TopupStreamParams,
  CancelStreamParams,
  GetStreamParams,
  GetStreamsParams,
  StreamDirection,
  StreamType,
  Cluster,
  TransactionResponse,
  CreateStreamResponse,
} from "@streamflow/timelock";
```

Please check the SDK for other types and utility functions.

## Create stream

```javascript
const data = {
  connection: connection, // Connection to the cluster.
  sender: wallet, // Wallet signing the transaction.
  recipient: "4ih00075bKjVg000000tLdk4w42NyG3Mv0000dc0M00", // Solana recipient address.
  mint: "DNw99999M7e24g99999999WJirKeZ5fQc6KY999999gK", // SPL Token mint.
  start: 1643363040, // Timestamp (in seconds) when the stream/token vesting starts.
  depositedAmount: new BN(1000000000000), // Deposited amount of tokens (in the smallest units).
  period: 1, // Time step (period) in seconds per which the unlocking occurs.
  cliff: 1643363160, // Vesting contract "cliff" timestamp in seconds.
  cliffAmount: new BN(100000000000), // Amount unlocked at the "cliff" timestamp.
  amountPerPeriod: new BN(5000000000), // Release rate: how many tokens are unlocked per each period.
  name: "Transfer to Jane Doe.", // The stream name/subject.
  canTopup: false, // FALSE for vesting contracts, TRUE for streams.
  cancelableBySender: true, // Whether or not sender can cancel the stream.
  cancelableByRecipient: false, // Whether or not recipient can cancel the stream.
  transferableBySender: true, // Whether or not sender can transfer the stream.
  transferableByRecipient: false, // Whether or not recipient can transfer the stream.
  automaticWithdrawal: false, // Whether or not a 3rd party can initiate withdraw in the name of recipient (currently not used, set it to FALSE).
  partner: null, //  (optional) Partner's wallet address (string | null).
  cluster: Cluster.Mainnet, // (optional) Cluster (default is Cluster.Mainnet).
};

try {
  const { tx, id } = await Stream.create(data);
} catch (exception) {
  // handle exception
}
```

## Withdraw from stream

```javascript
const data = {
  connection: connection, // Connection to the cluster.
  invoker: wallet, // Wallet signing the transaction.
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to be withdrawn from.
  amount: new BN(100000000000), // Requested amount to withdraw. If stream is completed, the whole amount will be withdrawn.
  cluster: Cluster.Mainnet, // Cluster (optional, default is Cluster.Mainnet).
};

try {
  const { tx } = await Stream.withdraw(data);
} catch (exception) {
  // handle exception
}
```

## Topup stream

```javascript
const data = {
  connection: connection, // Connection to the cluster.
  invoker: wallet, // Wallet signing the transaction.
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to be topped up.
  amount: new BN(100000000000), // Specified amount to topup (increases deposited amount).
  cluster: Cluster.Mainnet, // Cluster (optional, default is Cluster.Mainnet).
};

try {
  const { tx } = await Stream.topup(data);
} catch (exception) {
  // handle exception
}
```

## Transfer stream to another recipient

```javascript
const data = {
  connection: connection, // Connection to the cluster.
  invoker: wallet, // Wallet signing the transaction.
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA",
  recipientId: "99h00075bKjVg000000tLdk4w42NyG3Mv0000dc0M99", // Identifier of a stream to be transferred.
  cluster: Cluster.Mainnet, // Cluster (optional, default is Cluster.Mainnet).
};

try {
  const { tx } = await Stream.transfer(data);
} catch (exception) {
  // handle exception
}
```

## Cancel stream

```javascript
const data = {
  connection: connection, // Connection to the cluster.
  invoker: wallet, // Wallet signing the transaction.
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to be canceled.
  cluster: Cluster.Mainnet, // Cluster (optional, default is Cluster.Mainnet).
};

try {
  const { tx } = await Stream.cancel(data);
} catch (exception) {
  // handle exception
}
```

## Get stream by ID

```javascript
try {
  const stream = await Stream.getOne({
    connection: connection, // Connection to the cluster.
    id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream that is fetched.
  });
} catch (exception) {
  // handle exception
}
```

## Get streams for a specific wallet address

```javascript
try {
  const streams = Stream.get({
    connection: connection, // Connection to the cluster.
    wallet: wallet, // Wallet signing the transaction.
    type: StreamType.All, // Type (optional, default is StreamType.All)
    direction: StreamDirection.All, // Direction (optional, default is StreamDirection.All)
    cluster: Cluster.Mainnet, // Cluster (optional, default is Cluster.Mainnet).
  });
} catch (exception) {
  // handle exception
}
```

### Additional notes

#### All BN amounts are denominated in their smallest units.

E.g., if the amount is 1000 SOL than this amount in lamports is 1000 \* 10^9 = 1000000000000. An then `new BN(1000000000000)` is used.

Please use `getBN` and `getNumberFromBN` utility functions for conversions between `BN'` and `Number`.

## Disclaimer

Addresses used in the examples are random.
