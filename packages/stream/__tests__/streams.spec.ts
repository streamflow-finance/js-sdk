import StreamClient from "../StreamClient";
import {
  Cluster,
  CreateMultiParams,
  CreateMultipleStreamsValues,
  LocalCluster,
  TransferCancelOptions,
} from "../types";
import * as web3 from "@solana/web3.js";
import { getBN } from "../utils";
import { requestAirdrop } from "./test_dependencies/airdrop/airdrop-request";
import { Wallet } from "@project-serum/anchor";
import { AIRDROP_TEST_TOKEN } from "../constants";
import { BN } from "bn.js";
let streamInstance: StreamClient | null = null;
let sender: Wallet;
let recipient: Wallet;
let recipients: Wallet[] = [];
let connection: web3.Connection | null = null;
import { add, addMinutes, format, getUnixTime } from "date-fns";
const CLUSTER_LOCAL = "local";

const clusterUrls: { [s: string]: () => string } = {
  [CLUSTER_LOCAL]: () => "http://localhost:8899", // http://127.0.0.1:8899",
  [Cluster.Devnet]: () => "https://api.devnet.solana.com",
  [Cluster.Mainnet]: () => "https://api.mainnet-beta.solana.com",
};
beforeAll(async () => {
  streamInstance = new StreamClient(
    clusterUrls[Cluster.Devnet](),
    Cluster.Devnet,
    {
      commitment: "confirmed",
      disableRetryOnRateLimit: true,
    }
  );
  connection = new web3.Connection(web3.clusterApiUrl(), "confirmed");

  sender = new Wallet(web3.Keypair.generate());
  recipient = new Wallet(web3.Keypair.generate());
  recipients = [...new Array(10)].map(
    () => new Wallet(web3.Keypair.generate())
  );
  await requestAirdrop(sender, connection);
}, 100000);

test("Sender wallet airdropped funds", async () => {
  expect(await connection?.getBalance(sender.publicKey)).toBeGreaterThan(0);
}, 100000);

test("Stream client connects to cluster", async () => {
  expect(streamInstance).toBeTruthy();
  const streamInstanceConnection = await streamInstance?.getConnection();
  expect(streamInstanceConnection).toBeTruthy();
});

const newCreateMultipleStreamsPayload = (
  values: CreateMultipleStreamsValues,
  sender: Wallet
) => {
  const {
    recipients,
    releaseAmount,
    startDate,
    startTime,
    releaseFrequencyCounter,
    releaseFrequencyPeriod,
    whoCanTransfer,
    whoCanCancel,
    referral,
  } = values;

  const start = getUnixTime(new Date(startDate + "T" + startTime));

  const recipientsFormatted = recipients.map(
    ({ depositedAmount, recipient, name }) => ({
      recipient,
      name,
      depositedAmount: getBN(depositedAmount, 9),
      amountPerPeriod: getBN(releaseAmount, 9),
      cliffAmount: new BN(0),
    })
  );
  const data: CreateMultiParams = {
    sender,
    recipientsData: recipientsFormatted,
    mint: AIRDROP_TEST_TOKEN,
    start,
    period: releaseFrequencyCounter * releaseFrequencyPeriod,
    cliff: start,
    cancelableBySender:
      whoCanCancel === TransferCancelOptions.Sender ||
      whoCanCancel === TransferCancelOptions.Both,
    cancelableByRecipient:
      whoCanCancel === TransferCancelOptions.Recipient ||
      whoCanCancel === TransferCancelOptions.Both,
    transferableBySender:
      whoCanTransfer === TransferCancelOptions.Sender ||
      whoCanTransfer === TransferCancelOptions.Both,
    transferableByRecipient:
      whoCanTransfer === TransferCancelOptions.Recipient ||
      whoCanTransfer === TransferCancelOptions.Both,
    automaticWithdrawal: false,
    withdrawalFrequency: 0,
    canTopup: true,
    partner: referral,
  };

  return data;
};

export const DATE_FORMAT = "yyyy-MM-dd";
export const TIME_FORMAT = "HH:mm";

export const PERIOD = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 24 * 3600,
  WEEK: 7 * 24 * 3600,
  MONTH: Math.floor(30.4167 * 24 * 3600), //30.4167 days
  YEAR: 365 * 24 * 3600, // 365 days
};

export const timePeriodOptions = [
  { value: PERIOD.SECOND, label: "second" },
  { value: PERIOD.MINUTE, label: "minute" },
  { value: PERIOD.HOUR, label: "hour" },
  { value: PERIOD.DAY, label: "day" },
  { value: PERIOD.WEEK, label: "week" },
  { value: PERIOD.MONTH, label: "month" },
  { value: PERIOD.YEAR, label: "year" },
];

test("Can create multiple stremas", async () => {
  const now = new Date();
  const recipientsPayload = recipients.map((recipient, i) => ({
    recipient: recipient.publicKey.toBase58(),
    recipientEmail: "",
    name: "Recipient " + i,
    depositedAmount: 0.0001,
  }));

  const values: CreateMultipleStreamsValues = {
    releaseAmount: 0.00001,
    tokenSymbol: "",
    startDate: format(now, DATE_FORMAT),
    startTime: format(add(now, { minutes: 5 }), TIME_FORMAT),
    releaseFrequencyCounter: 1,
    releaseFrequencyPeriod: timePeriodOptions[0].value,
    whoCanTransfer: TransferCancelOptions.Recipient,
    whoCanCancel: TransferCancelOptions.Sender,
    automaticWithdrawal: false,
    withdrawalFrequencyCounter: 1,
    withdrawalFrequencyPeriod: timePeriodOptions[1].value,
    referral: "",
    email: "",
    recipients: recipientsPayload,
  };
  const data = newCreateMultipleStreamsPayload(values, sender);
  const response = await streamInstance?.createMultiple(data);
  const errors = response?.errors;
  console.log(errors);
  return response;
}, 600000);
