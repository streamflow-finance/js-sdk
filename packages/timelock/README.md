**Disclaimer: This code is under heavy development. Everything is provided as-is and without any warranty.**

# JavaScript SDK to interact with the `timelock` Anchor program.

You can `create`, `withdraw`, `cancel`, `topup` and `transfer` a stream (vesting contract).

# Usage (with examples)

This examples are valid for the newest SDK version. if you use older versions check types and usages inside npm package.

### Install the StreamFlow JS SDK

`$ npm i @streamflow/timelock @solana/web3.js @project-serum/anchor`

### Import SDK

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

### Create stream/vesting contract

```javascript
const createStream = async () => {
const data = {
    connection: , //
    sender:, //
    recipient: '4ih00075bKjVg000000tLdk4w42NyG3Mv0000dc0M00', // string
    mint: 'DNw99999M7e24g99999999WJirKeZ5fQc6KY999999gK', // string
    start:, // number
    depositedAmount: 6000, // number
    period:, // number
    cliff:, // number
    cliffAmount: 100, // number
    amountPerPeriod:, // number
    name: 'Transfer to Jane Doe.', // string
    canTopup: false, // boolean
    cancelableBySender: true, // boolean
    cancelableByRecipient: false, // boolean
    transferableBySender: true, // boolean
    transferableByRecipient: false, // boolean
    automaticWithdrawal: false, // boolean
    partner: null, // string | null (optional)
    cluster: Cluster.Mainnet, // Cluster (optional, default is Cluster.Mainnet)
}

const { tx, id, stream } = Stream.create( data );
}

```

### Withdraw stream/vesting contract

```javascript
const withdrawStream = async () => {
const data = {
    connection: , //
    invoker: , //
    id: 'AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA',
    amount: 100, //
    cluster: Cluster.Mainnet, // Cluster (optional, default is Cluster.Mainnet)
}

const { tx } = Stream.withdraw( data );
}
```

### Topup stream/vesting contract

```javascript
const topupStream = async () => {
const data = {
    connection: , //
 invoker,
    id: 'AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA',
    amount: 1000,
    cluster: Cluster.Mainnet, // Cluster (optional, default is Cluster.Mainnet)
}

const { tx } = Stream.topup( data );
}
```

### Transfer stream/vesting contract

```javascript
const transferStream = async () => {
const data = {
    connection: , //
    invoker,
    id: 'AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA',
    recipientId: '',
    cluster: Cluster.Mainnet, // Cluster (optional, default is Cluster.Mainnet)
}

const { tx } = Stream.transfer( data );
}
```

### Cancel stream/vesting contract

```javascript
const cancelStream = async () => {
const data = {
    connection: , //
  invoker,
    id: 'AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA',
    cluster: Cluster.Mainnet, // Cluster (optional, default is Cluster.Mainnet)
}

const { tx } = Stream.cancel( data );
}
```

### Get stream/contract by id

```javascript
const stream = Stream.getOne({
  connection,
  id,
});
```

### Get streams/contracts for specific wallet

```javascript
const streams = Stream.get({
  connection,
  wallet,
  type: StreamType.All, // Type (optional, default is StreamType.All)
  direction: StreamDirection.All, // Direction (optional, default is StreamDirection.All)
  cluster: Cluster.Mainnet, // Cluster (optional, default is Cluster.Mainnet)
});
```
