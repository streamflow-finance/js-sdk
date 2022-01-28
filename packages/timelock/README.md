**Disclaimer: This code is under heavy development. Everything is provided as-is and without any warranty.**

# JavaScript SDK to interact with the `timelock` Anchor program.

You can `create`, `withdraw`, `cancel`, `topup` and `transfer` a stream (vesting contract).

# Usage (with examples)

This examples are valid for the newest SDK version. if you use older versions check types and usages inside npm package.

## Install the StreamFlow JS SDK

`$ npm i @streamflow/timelock @solana/web3.js @project-serum/anchor`

Anchor is needed for now for Wallet type: `import { Wallet } from "@project-serum/anchor/src/provider";`\
We plan to remove this dependency in the upcoming period.

For Connection type use:
`import { Connection } from "@solana/web3.js";`

## Import SDK

```javascript
import Stream, {
  Stream,
  CreateStreamData,
  CreateStreamParams,
  WithdrawStreamData,
  WithdrawStreamParams,
  TransferStreamData,
  TransferStreamParams,
  TopupStreamData,
  TopupStreamParams,
  CancelStreamData,
  CancelStreamParams,
  GetStreamParams,
  GetStreamsParams,
  StreamDirection,
  StreamType,
  Cluster,
  LocalCluster,
  ClusterExtended,
  TransactionResponse,
  CreateStreamResponse,
} from "@streamflow/timelock";
```

## Create stream/vesting contract

```javascript
const createStream = async () => {
  const data = {
    connection: connection, // Connection to the cluster.
    sender: wallet, // Wallet signing the transaction.
    recipient: "4ih00075bKjVg000000tLdk4w42NyG3Mv0000dc0M00", // Solana recipient address.
    mint: "DNw99999M7e24g99999999WJirKeZ5fQc6KY999999gK", // SPL Token mint.
    start: 1643363040, // Timestamp (in seconds) when the stream/token vesting starts.
    depositedAmount: 1000000000000, // Deposited amount of tokens (in the smallest units).
    period: 1, // Time step (period) in seconds per which the unlocking occurs.
    cliff: 1643363160, // Vesting contract "cliff" timestamp in seconds.
    cliffAmount: 100000000000, // Amount unlocked at the "cliff" timestamp.
    amountPerPeriod: 5000000000, // Release rate: how many tokens are unlocked per each period.
    name: "Transfer to Jane Doe.", // The stream name/subject.
    canTopup: false, // TRUE for vesting contracts, FALSE for streams.
    cancelableBySender: true, // Whether or not sender can cancel the stream.
    cancelableByRecipient: false, // Whether or not recipient can cancel the stream.
    transferableBySender: true, // Whether or not sender can transfer the stream.
    transferableByRecipient: false, // Whether or not recipient can transfer the stream.
    automaticWithdrawal: false, // Whether or not a 3rd party can initiate withdraw in the name of recipient (currently not used, set it to FALSE).
    partner: null, //  Partner's wallet address (optional, string | null).
    cluster: Cluster.Mainnet, // Cluster (optional, default is Cluster.Mainnet).
  };

  const { tx, id, stream } = Stream.create(data);
};
```

## Withdraw stream/vesting contract

```javascript
const withdrawStream = async () => {
  const data = {
    connection: connection, // Connection to the cluster.
    invoker: wallet, // Wallet signing the transaction.
    id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to be withdrawn from.
    amount: 100000000000, // Requested amount to withdraw. If stream is completed, the whole amount will be withdrawn.
    cluster: Cluster.Mainnet, // Cluster (optional, default is Cluster.Mainnet).
  };

  const { tx } = Stream.withdraw(data);
};
```

## Topup stream/vesting contract

```javascript
const topupStream = async () => {
  const data = {
    connection: connection, // Connection to the cluster.
    invoker: wallet, // Wallet signing the transaction.
    id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to be topped up.
    amount: 100000000000, // Specified amount to topup (increases deposited amount).
    cluster: Cluster.Mainnet, // Cluster (optional, default is Cluster.Mainnet).
  };

  const { tx } = Stream.topup(data);
};
```

## Transfer stream/vesting contract

```javascript
const transferStream = async () => {
  const data = {
    connection: connection, // Connection to the cluster.
    invoker: wallet, // Wallet signing the transaction.
    id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA",
    recipientId: "99h00075bKjVg000000tLdk4w42NyG3Mv0000dc0M99", // Identifier of a stream to be transferred.
    cluster: Cluster.Mainnet, // Cluster (optional, default is Cluster.Mainnet).
  };

  const { tx } = Stream.transfer(data);
};
```

## Cancel stream/vesting contract

```javascript
const cancelStream = async () => {
  const data = {
    connection: connection, // Connection to the cluster.
    invoker: wallet, // Wallet signing the transaction.
    id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to be canceled.
    cluster: Cluster.Mainnet, // Cluster (optional, default is Cluster.Mainnet)
  };

  const { tx } = Stream.cancel(data);
};
```

### Get stream/contract by id

```javascript
const stream = Stream.getOne({
  connection: connection, // Connection to the cluster.
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream that is fetched.
});
```

## Get streams/contracts for specific wallet

```javascript
const streams = Stream.get({
  connection: connection, // Connection to the cluster.
  wallet: wallet, // Wallet signing the transaction.
  type: StreamType.All, // Type (optional, default is StreamType.All)
  direction: StreamDirection.All, // Direction (optional, default is StreamDirection.All)
  cluster: Cluster.Mainnet, // Cluster (optional, default is Cluster.Mainnet)
});
```

### Additional notes

#### All amounts are sent/retrieved in the smallest units.

E.g., if the amount is 1000SOL than this amount in lamports is 1000 \* 10^9 = 1000000000000.

#### Date values are sent/retrieved in seconds (be sure to not expect ms).
