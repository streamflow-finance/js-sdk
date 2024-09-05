import { Buffer } from "buffer";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { createHash } from "node:crypto";

import * as Layout from "./layout.js";
import { IUpdateData } from "../common/types.js";
import { toBuffer } from "./utils.js";

const hasher = () => createHash("sha256");
const sha256 = {
  digest: (data: string): Uint8Array => new Uint8Array(hasher().update(data).digest()),
};

interface CreateStreamData {
  start: BigNumber;
  depositedAmount: BigNumber;
  period: BigNumber;
  amountPerPeriod: BigNumber;
  cliff: BigNumber;
  cliffAmount: BigNumber;
  cancelableBySender: boolean;
  cancelableByRecipient: boolean;
  automaticWithdrawal: boolean;
  transferableBySender: boolean;
  transferableByRecipient: boolean;
  canTopup: boolean;
  canUpdateRate: boolean;
  canPause: boolean;
  name: string;
  withdrawFrequency: BigNumber;
}

interface CreateStreamAccounts {
  sender: PublicKey;
  senderTokens: PublicKey;
  recipient: PublicKey;
  recipientTokens: PublicKey;
  metadata: PublicKey;
  escrowTokens: PublicKey;
  streamflowTreasury: PublicKey;
  streamflowTreasuryTokens: PublicKey;
  partner: PublicKey;
  partnerTokens: PublicKey;
  mint: PublicKey;
  feeOracle: PublicKey;
  rent: PublicKey;
  timelockProgram: PublicKey;
  tokenProgram: PublicKey;
  associatedTokenProgram: PublicKey;
  withdrawor: PublicKey;
  systemProgram: PublicKey;
}

export const createStreamInstruction = (
  data: CreateStreamData,
  programId: PublicKey,
  accounts: CreateStreamAccounts,
): TransactionInstruction => {
  const keys = [
    { pubkey: accounts.sender, isSigner: true, isWritable: true },
    { pubkey: accounts.senderTokens, isSigner: false, isWritable: true },
    { pubkey: accounts.recipient, isSigner: false, isWritable: true },
    { pubkey: accounts.metadata, isSigner: true, isWritable: true },
    { pubkey: accounts.escrowTokens, isSigner: false, isWritable: true },
    { pubkey: accounts.recipientTokens, isSigner: false, isWritable: true },
    {
      pubkey: accounts.streamflowTreasury,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: accounts.streamflowTreasuryTokens,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: accounts.withdrawor, isSigner: false, isWritable: true },
    { pubkey: accounts.partner, isSigner: false, isWritable: true },
    { pubkey: accounts.partnerTokens, isSigner: false, isWritable: true },
    { pubkey: accounts.mint, isSigner: false, isWritable: false },
    { pubkey: accounts.feeOracle, isSigner: false, isWritable: false },
    { pubkey: accounts.rent, isSigner: false, isWritable: false },
    { pubkey: accounts.timelockProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ];

  let bufferData = Buffer.alloc(Layout.createStreamLayout.span);

  const encodedUIntArray = new TextEncoder().encode(data.name);
  const streamNameBuffer = Buffer.alloc(64).fill(encodedUIntArray, 0, encodedUIntArray.byteLength);

  const decodedData = {
    start_time: toBuffer(data.start),
    net_amount_deposited: toBuffer(data.depositedAmount),
    period: toBuffer(data.period),
    amount_per_period: toBuffer(data.amountPerPeriod),
    cliff: toBuffer(data.cliff),
    cliff_amount: toBuffer(data.cliffAmount),
    cancelable_by_sender: Number(data.cancelableBySender),
    cancelable_by_recipient: Number(data.cancelableByRecipient),
    automatic_withdrawal: Number(data.automaticWithdrawal),
    transferable_by_sender: Number(data.transferableBySender),
    transferable_by_recipient: Number(data.transferableByRecipient),
    can_topup: Number(data.canTopup),
    _pausable_discriminator: 1,
    can_update_rate: Number(data.canUpdateRate),
    _can_update_rate_discriminator: 1,
    pausable: Number(data.canPause),
    stream_name: streamNameBuffer,
    withdraw_frequency: toBuffer(data.withdrawFrequency),
  };
  const encodeLength = Layout.createStreamLayout.encode(decodedData, bufferData);
  bufferData = bufferData.slice(0, encodeLength);
  bufferData = Buffer.concat([Buffer.from(sha256.digest("global:create")).slice(0, 8), bufferData, Buffer.alloc(10)]);

  return new TransactionInstruction({
    keys,
    programId,
    data: bufferData,
  });
};

interface CreateUncheckedStreamData {
  start: BigNumber;
  depositedAmount: BigNumber;
  period: BigNumber;
  amountPerPeriod: BigNumber;
  cliff: BigNumber;
  cliffAmount: BigNumber;
  cancelableBySender: boolean;
  cancelableByRecipient: boolean;
  automaticWithdrawal: boolean;
  transferableBySender: boolean;
  transferableByRecipient: boolean;
  canTopup: boolean;
  canUpdateRate: boolean;
  canPause: boolean;
  name: string;
  withdrawFrequency: BigNumber;
  recipient: PublicKey;
  partner: PublicKey;
}

interface CreateUncheckedStreamAccounts {
  payer?: PublicKey;
  sender: PublicKey;
  senderTokens: PublicKey;
  metadata: PublicKey;
  escrowTokens: PublicKey;
  mint: PublicKey;
  feeOracle: PublicKey;
  rent: PublicKey;
  timelockProgram: PublicKey;
  tokenProgram: PublicKey;
  withdrawor: PublicKey;
  systemProgram: PublicKey;
}

export const createUncheckedStreamInstruction = (
  data: CreateUncheckedStreamData,
  programId: PublicKey,
  accounts: CreateUncheckedStreamAccounts,
): TransactionInstruction => {
  const keys = [
    { pubkey: accounts.sender, isSigner: true, isWritable: true },
    { pubkey: accounts.senderTokens, isSigner: false, isWritable: true },
    { pubkey: accounts.metadata, isSigner: false, isWritable: true },
    { pubkey: accounts.escrowTokens, isSigner: false, isWritable: true },
    { pubkey: accounts.withdrawor, isSigner: false, isWritable: true },
    { pubkey: accounts.mint, isSigner: false, isWritable: false },
    { pubkey: accounts.feeOracle, isSigner: false, isWritable: false },
    { pubkey: accounts.rent, isSigner: false, isWritable: false },
    { pubkey: accounts.timelockProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ];

  if (accounts.payer) {
    keys.unshift({
      pubkey: accounts.payer,
      isSigner: true,
      isWritable: true,
    });
  }

  let bufferData = Buffer.alloc(Layout.createUncheckedStreamLayout.span);

  const encodedUIntArray = new TextEncoder().encode(data.name);
  const streamNameBuffer = Buffer.alloc(64).fill(encodedUIntArray, 0, encodedUIntArray.byteLength);

  const decodedData = {
    start_time: toBuffer(data.start),
    net_amount_deposited: toBuffer(data.depositedAmount),
    period: toBuffer(data.period),
    amount_per_period: toBuffer(data.amountPerPeriod),
    cliff: toBuffer(data.cliff),
    cliff_amount: toBuffer(data.cliffAmount),
    cancelable_by_sender: Number(data.cancelableBySender),
    cancelable_by_recipient: Number(data.cancelableByRecipient),
    automatic_withdrawal: Number(data.automaticWithdrawal),
    transferable_by_sender: Number(data.transferableBySender),
    transferable_by_recipient: Number(data.transferableByRecipient),
    can_topup: Number(data.canTopup),
    stream_name: streamNameBuffer,
    withdraw_frequency: toBuffer(data.withdrawFrequency),
    recipient: data.recipient.toBuffer(),
    partner: data.partner.toBuffer(),
    pausable: Number(data.canPause),
    can_update_rate: Number(data.canUpdateRate),
  };
  const encodeLength = Layout.createUncheckedStreamLayout.encode(decodedData, bufferData);
  bufferData = bufferData.slice(0, encodeLength);
  const digest = accounts.payer
    ? sha256.digest("global:create_unchecked_with_payer")
    : sha256.digest("global:create_unchecked");
  bufferData = Buffer.concat([Buffer.from(digest).slice(0, 8), bufferData, Buffer.alloc(10)]);

  return new TransactionInstruction({
    keys,
    programId,
    data: bufferData,
  });
};

interface WithdrawAccounts {
  authority: PublicKey;
  recipient: PublicKey;
  recipientTokens: PublicKey;
  metadata: PublicKey;
  escrowTokens: PublicKey;
  streamflowTreasury: PublicKey;
  streamflowTreasuryTokens: PublicKey;
  partner: PublicKey;
  partnerTokens: PublicKey;
  mint: PublicKey;
  tokenProgram: PublicKey;
}

export const withdrawStreamInstruction = (
  amount: BigNumber,
  programId: PublicKey,
  {
    authority,
    recipient,
    recipientTokens,
    metadata,
    escrowTokens,
    streamflowTreasury,
    streamflowTreasuryTokens,
    partner,
    partnerTokens,
    mint,
    tokenProgram,
  }: WithdrawAccounts,
): TransactionInstruction => {
  const keys = [
    { pubkey: authority, isSigner: true, isWritable: true },
    { pubkey: recipient, isSigner: false, isWritable: true },
    { pubkey: recipientTokens, isSigner: false, isWritable: true },
    { pubkey: metadata, isSigner: false, isWritable: true },
    { pubkey: escrowTokens, isSigner: false, isWritable: true },
    {
      pubkey: streamflowTreasury,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: streamflowTreasuryTokens, isSigner: false, isWritable: true },
    { pubkey: partner, isSigner: false, isWritable: true },
    { pubkey: partnerTokens, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: true },
    { pubkey: tokenProgram, isSigner: false, isWritable: false },
  ];

  let data = Buffer.alloc(Layout.withdrawStreamLayout.span);
  const decodedData = { amount: toBuffer(amount) };
  const encodeLength = Layout.withdrawStreamLayout.encode(decodedData, data);
  data = data.slice(0, encodeLength);
  data = Buffer.concat([Buffer.from(sha256.digest("global:withdraw")).slice(0, 8), data, Buffer.alloc(10)]);

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
};

interface UpdateAccounts {
  authority: PublicKey;
  metadata: PublicKey;
  withdrawor: PublicKey;
  systemProgram: PublicKey;
}
export const updateStreamInstruction = (
  params: IUpdateData,
  programId: PublicKey,
  { authority, metadata, withdrawor, systemProgram }: UpdateAccounts,
): TransactionInstruction => {
  const keys = [
    { pubkey: authority, isSigner: true, isWritable: true },
    { pubkey: metadata, isSigner: false, isWritable: true },
    { pubkey: withdrawor, isSigner: false, isWritable: true },
    { pubkey: systemProgram, isSigner: false, isWritable: false },
  ];

  let data = Buffer.alloc(100);
  const decodedData = {
    enable_automatic_withdrawal: Number(params.enableAutomaticWithdrawal),
    withdraw_frequency: params.withdrawFrequency ? toBuffer(params.withdrawFrequency) : undefined,
    amount_per_period: params.amountPerPeriod ? toBuffer(params.amountPerPeriod) : undefined,
  };
  const encodeLength = Layout.encodeUpdateStream(decodedData, data);
  data = data.slice(0, encodeLength);
  data = Buffer.concat([Buffer.from(sha256.digest("global:update")).slice(0, 8), data, Buffer.alloc(20)]);
  return new TransactionInstruction({
    keys: keys,
    programId: programId,
    data: data,
  });
};

interface CancelAccounts {
  authority: PublicKey;
  sender: PublicKey;
  senderTokens: PublicKey;
  recipient: PublicKey;
  recipientTokens: PublicKey;
  metadata: PublicKey;
  escrowTokens: PublicKey;
  streamflowTreasury: PublicKey;
  streamflowTreasuryTokens: PublicKey;
  partner: PublicKey;
  partnerTokens: PublicKey;
  mint: PublicKey;
  tokenProgram: PublicKey;
}

export const cancelStreamInstruction = (
  programId: PublicKey,
  {
    authority,
    sender,
    senderTokens,
    recipient,
    recipientTokens,
    metadata,
    escrowTokens,
    streamflowTreasury,
    streamflowTreasuryTokens,
    partner,
    partnerTokens,
    mint,
    tokenProgram,
  }: CancelAccounts,
): TransactionInstruction => {
  const keys = [
    { pubkey: authority, isSigner: true, isWritable: false },
    { pubkey: sender, isSigner: false, isWritable: true },
    { pubkey: senderTokens, isSigner: false, isWritable: true },
    { pubkey: recipient, isSigner: false, isWritable: true },
    { pubkey: recipientTokens, isSigner: false, isWritable: true },
    { pubkey: metadata, isSigner: false, isWritable: true },
    { pubkey: escrowTokens, isSigner: false, isWritable: true },
    {
      pubkey: streamflowTreasury,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: streamflowTreasuryTokens, isSigner: false, isWritable: true },
    { pubkey: partner, isSigner: false, isWritable: true },
    { pubkey: partnerTokens, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: true },
    { pubkey: tokenProgram, isSigner: false, isWritable: false },
  ];

  const data = Buffer.concat([Buffer.from(sha256.digest("global:cancel")).slice(0, 8), Buffer.alloc(10)]);

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
};

interface TransferAccounts {
  authority: PublicKey;
  newRecipient: PublicKey;
  newRecipientTokens: PublicKey;
  metadata: PublicKey;
  mint: PublicKey;
  rent: PublicKey;
  tokenProgram: PublicKey;
  associatedTokenProgram: PublicKey;
  systemProgram: PublicKey;
}

export const transferStreamInstruction = (
  programId: PublicKey,
  {
    authority,
    newRecipient,
    newRecipientTokens,
    metadata,
    mint,
    rent,
    tokenProgram,
    associatedTokenProgram,
    systemProgram,
  }: TransferAccounts,
): TransactionInstruction => {
  const keys = [
    { pubkey: authority, isSigner: true, isWritable: true },
    { pubkey: newRecipient, isSigner: false, isWritable: true },
    { pubkey: newRecipientTokens, isSigner: false, isWritable: true },
    { pubkey: metadata, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: rent, isSigner: false, isWritable: false },
    { pubkey: tokenProgram, isSigner: false, isWritable: false },
    { pubkey: associatedTokenProgram, isSigner: false, isWritable: false },
    { pubkey: systemProgram, isSigner: false, isWritable: false },
  ];

  const data = Buffer.concat([Buffer.from(sha256.digest("global:transfer_recipient")).slice(0, 8), Buffer.alloc(10)]);

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
};

interface TopupAccounts {
  sender: PublicKey;
  senderTokens: PublicKey;
  metadata: PublicKey;
  escrowTokens: PublicKey;
  streamflowTreasury: PublicKey;
  streamflowTreasuryTokens: PublicKey;
  partner: PublicKey;
  partnerTokens: PublicKey;
  mint: PublicKey;
  tokenProgram: PublicKey;
  withdrawor: PublicKey;
  systemProgram: PublicKey;
}

export const topupStreamInstruction = (
  amount: BigNumber,
  programId: PublicKey,
  {
    sender,
    senderTokens,
    metadata,
    escrowTokens,
    streamflowTreasury,
    streamflowTreasuryTokens,
    partner,
    partnerTokens,
    mint,
    tokenProgram,
    withdrawor,
    systemProgram,
  }: TopupAccounts,
): TransactionInstruction => {
  const keys = [
    { pubkey: sender, isSigner: true, isWritable: true },
    { pubkey: senderTokens, isSigner: false, isWritable: true },
    { pubkey: metadata, isSigner: false, isWritable: true },
    { pubkey: escrowTokens, isSigner: false, isWritable: true },
    {
      pubkey: streamflowTreasury,
      isSigner: false,
      isWritable: true,
    },
    { pubkey: streamflowTreasuryTokens, isSigner: false, isWritable: true },
    { pubkey: withdrawor, isSigner: false, isWritable: true },
    { pubkey: partner, isSigner: false, isWritable: true },
    { pubkey: partnerTokens, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: tokenProgram, isSigner: false, isWritable: false },
    { pubkey: systemProgram, isSigner: false, isWritable: false },
  ];

  let data = Buffer.alloc(Layout.topupStreamLayout.span);
  const decodedData = { amount: toBuffer(amount) };

  const encodeLength = Layout.topupStreamLayout.encode(decodedData, data);
  data = data.slice(0, encodeLength);
  data = Buffer.concat([Buffer.from(sha256.digest("global:topup")).slice(0, 8), data, Buffer.alloc(10)]);

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
};
