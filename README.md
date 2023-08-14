# Streamflow

Streamflow is a token vesting and streaming payments platform.

There are several ways to use **Streamflow**:

- **(easiest) [app.streamflow.finance](https://app.streamflow.finance?utm_medium=github.com&utm_source=referral&utm_campaign=js-sdk-repo)** (React application that uses JS SDK directly)
- **[JS SDK](https://github.com/streamflow-finance/js-sdk)** to interact with the protocol => [NPM package](https://www.npmjs.com/package/@streamflow/stream)
- **[Rust SDK](https://github.com/streamflow-finance/rust-sdk)** to integrate within a Solana program => [Rust Crate](https://docs.rs/streamflow-sdk/)

**Security audit passed ✅**

Protocol audits available [here](https://www.notion.so/streamflow/Streamflow-Security-Audits-3250070c0b3a4a0690385d96316d645c).  
Partner oracle audit available here [here](https://github.com/streamflow-finance/rust-sdk/blob/main/partner_oracle_audit.pdf).

## JS SDK to interact with Streamflow protocol.

This package allows you to `create`, `createMultiple`, `withdraw`, `cancel`, `topup`, `transfer`, `update` a token stream.

You can also `getOne` stream and `get` multiple streams.

## Installation

`npm i @streamflow/stream`

## Import SDK

Most common imports:

```javascript
import { BN } from "bn.js";
import { Types, GenericStreamClient, getBN, getNumberFromBN } from "@streamflow/stream";
```

_Check the SDK for other types and utility functions._

## Create GenericStreamClient instance

GenericStreamClient wraps calls to chain client implementation.

```javascript
import { GenericStreamClient, Types } from "@streamflow/stream";

const client =
  new GenericStreamClient<Types.IChain.Solana>({
    chain: Types.IChain.Solana,
    clusterUrl: "https://api.mainnet-beta.solana.com",
    cluster: Types.ICluster.Mainnet,
  });
```

You can also initialize a chain client directly.

```javascript
import {
  StreamflowSolana,
  StreamflowAptos,
  StreamflowEVM,
  Types,
} from "@streamflow/stream";

// Init Solana Client
const solanaClient = new StreamflowSolana.SolanaStreamClient(
  "https://api.mainnet-beta.solana.com"
);

// Init Aptos Client
const aptosClient = new StreamflowSolana.SolanaStreamClient(
  "https://fullnode.mainnet.aptoslabs.com/v1"
);

// Init Ethereum Client
const ethereumClient = new StreamflowEVM.EvmStreamClient(
  "YOUR_ETHEREUM_NODE_URL",
  Types.IChain.Ethereum,
  signer // will be sender in a stream and authority for all stream related transactions
);

// Init Polygon Client
const polygonClient = new StreamflowEVM.EvmStreamClient(
  "YOUR_POLYGON_NODE_URL",
  Types.IChain.Polygon,
  signer // will be sender in a stream and authority for all stream related transactions
);

// Init BNB Client
const bnbClient = new StreamflowEVM.EvmStreamClient(
  "https://bsc-dataseed1.binance.org/",
  Types.IChain.BNB,
  signer // will be sender in a stream and authority for all stream related transactions
);
```

## Create stream

```javascript
const createStreamParams: Types.ICreateStreamData = {
  recipient: "4ih00075bKjVg000000tLdk4w42NyG3Mv0000dc0M00", // Solana recipient address.
  tokenId: "DNw99999M7e24g99999999WJirKeZ5fQc6KY999999gK", // SPL Token mint.
  start: 1643363040, // Timestamp (in seconds) when the stream/token vesting starts.
  amount: getBN(100, 9), // depositing 100 tokens with 9 decimals mint.
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

// Solana example
try {
  const { ixs, tx, metadata } = await client.create(createStreamParams, {
    sender: wallet, // SignerWalletAdapter | Keypair
  });
} catch (exception) {
  // handle exception
}

// Aptos example
try {
  const { ixs, tx, metadata } = await client.create(createStreamParams, {
    senderWallet: wallet, // WalletContextState
  });
} catch (exception) {
  // handle exception
}

// EVM Example
try {
  const { ixs, tx, metadata } = await client.create(createStreamParams);
} catch (exception) {
  // handle exception
}
```

## Create multiple streams at once

```javascript
const recipients = [
  {
    recipient: "4ih00075bKjVg000000tLdk4w42NyG3Mv0000dc0M00", // Solana recipient address.
    amount: getBN(100, 9), // depositing 100 tokens with 9 decimals mint.
    name: "January Payroll", // The stream name/subject.
    cliffAmount: getBN(10, 9), // amount released on cliff for this recipient
    amountPerPeriod: getBN(1, 9), //amount released every specified period epoch
  },
];
const createStreamParams: Types.ICreateMultipleStreamData = {
  recipients: recipients, // Solana recipient address.
  tokenId: "DNw99999M7e24g99999999WJirKeZ5fQc6KY999999gK", // SPL Token mint.
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
  partner: null, //  (optional) Partner's wallet address (string | null).
};

try {
  const { txs } = await client.createMultiple(createMultiStreamsParams, {
    sender: wallet, // SignerWalletAdapter | Keypair
  });
} catch (exception) {
  // handle exception
}
```

Please note that transaction fees for the scheduled transfers are paid upfront by the stream creator (sender).

## Identifying created contracts (streams or vesting)

All Stream Clients return `Types.ICreateResult` object (`createdMultiple` returns an Array) that has the following structure

```javascript
interface ICreateResult {
  ixs: (TransactionInstruction | Types.TransactionPayload)[];
  txId: string;
  metadataId: MetadataId;
}
```

`metadataId` is the id of the created stream.

## Withdraw from stream

```javascript
const withdrawStreamParams: Types.IWithdrawData = {
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to be withdrawn from.
  amount: getBN(100, 9), // Requested amount to withdraw. If stream is completed, the whole amount will be withdrawn.
};

try {
  const { ixs, tx } = await client.withdraw(withdrawStreamParams, {
    invoker: wallet, // SignerWalletAdapter | Keypair
  });
} catch (exception) {
  // handle exception
}
```

## Topup stream

```javascript
const topupStreamParams: Types.ITopUpData = {
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to be topped up.
  amount: getBN(100, 9), // Specified amount to topup (increases deposited amount).
};

try {
  const { ixs, tx } = await client.topup(topupStreamParams, {
    invoker: wallet, // SignerWalletAdapter | Keypair
  });
} catch (exception) {
  // handle exception
}
```

## Transfer stream to another recipient

```javascript
const data: Types.ITransferData = {
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA",
  newRecipient: "99h00075bKjVg000000tLdk4w42NyG3Mv0000dc0M99", // Identifier of a stream to be transferred.
};

try {
  const { tx } = await client.transfer(data, {
    invoker: wallet, // SignerWalletAdapter | Keypair
  });
} catch (exception) {
  // handle exception
}
```

## Cancel stream

```javascript
const cancelStreamParams: Types.ICancelData = {
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA", // Identifier of a stream to be canceled.
};

try {
  const { ixs, tx } = await StreamClient.cancel(cancelStreamParams, {
    invoker: wallet, // SignerWalletAdapter | Keypair
  });
} catch (exception) {
  // handle exception
}
```

## Get one stream by its ID

```javascript
const data: Types.IGetOneData = {
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

const unlocked = stream.unlocked(tsInSeconds); // bn amount unlocked at the tsInSeconds
console.log(getNumberFromBN(unlocked, 9));
```

- Note: unlocked amount is determined based on configuration set on creation, no dynamic data is involved.

## Reading withdrawn amount and remaining funds

```javascript
const stream = await client.getOne({
  id: "AAAAyotqTZZMAAAAmsD1JAgksT8NVAAAASfrGB5RAAAA",
});
const withdrawn = stream.withdrawnAmount; // bn amount withdrawn already
console.log(getNumberFromBN(wihtdrawn, 9));
const remaining = stream.remaining(9); // amount of remaining funds
console.log(remaining);
```

## Get multiple streams for a specific wallet address

```javascript
const data: Types.IGetAllData = {
  address: "99h00075bKjVg000000tLdk4w42NyG3Mv0000dc0M99",
  type: Types.StreamType.All,
  direction: Types.StreamDirection.All,
};

try {
  const streams = client.get(data);
} catch (exception) {
  // handle exception
}
```

## Handling errors

Protocol raises custom errors on:

- validation errors
- state missmatch errors (such as canceling a stream that is complete/already canceled)

Errors are returned per blockchain specification format.

A public map of protocol errors is available [here](https://streamflow.notion.site/Streamflow-protocol-docs-0accad86d5c44e5db84fd4fb49b8ff54).

## Additional notes

Streamflow protocol program IDs

| Solana  |                                              |
| ------- | -------------------------------------------- |
| Devet   | HqDGZjaVRXJ9MGRQEw7qDc2rAr6iH1n1kAQdCZaCMfMZ |
| Mainnet | strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m  |

| EVM     | Ethereum(Goerli on Tesnet),Polygon,BNB     |
| ------- | ------------------------------------------ |
| Testnet | 0x5Db7a43D20De64E3a3BC765334a477026FD13E7d |
| Mainnet | 0x94d4646Bd307Bf91CB1893BC64d976BF9E60D9B2 |

| Aptos   |                                                                    |
| ------- | ------------------------------------------------------------------ |
| Testnet | 0xc6737de143d91b2f99a7e490d4f8348fdfa3bdd1eb8737a27d0455f8a3625688 |
| Mainnet | 0x9009d93d52576bf9ac6dc6cf10b870610bcb316342fef6eff80662fbbfce51b0 |

**All BN amounts are denominated in their smallest units.**

E.g, if the amount is 1 SOL than this amount in lamports is `1000 \* 10^9 = 1_000_000_000.`

And `new BN(1_000_000_000)` is used.

Use `getBN` and `getNumberFromBN` utility functions for conversions between `BN` and `Number` types.

`npx typedoc packages/stream/index.ts`

WAGMI.
