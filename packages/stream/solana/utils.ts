import { getAssociatedTokenAddress } from "@solana/spl-token";
import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import {
  BlockheightBasedTransactionConfirmationStrategy,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmRawTransaction,
} from "@solana/web3.js";
import BN from "bn.js";
import bs58 from "bs58";

import { streamLayout } from "./layout";
import { Stream, DecodedStream, Account, BatchItem, BatchItemResult } from "./types";

const decoder = new TextDecoder("utf-8");
const LE = "le"; //little endian

export const decodeStream = (buf: Buffer): DecodedStream => {
  const raw = streamLayout.decode(buf);

  return {
    magic: new BN(raw.magic, LE),
    version: new BN(raw.version, LE),
    createdAt: new BN(raw.created_at, LE),
    withdrawnAmount: new BN(raw.withdrawn_amount, LE),
    canceledAt: new BN(raw.canceled_at, LE),
    end: new BN(raw.end_time, LE),
    lastWithdrawnAt: new BN(raw.last_withdrawn_at, LE),
    sender: new PublicKey(raw.sender),
    senderTokens: new PublicKey(raw.sender_tokens),
    recipient: new PublicKey(raw.recipient),
    recipientTokens: new PublicKey(raw.recipient_tokens),
    mint: new PublicKey(raw.mint),
    escrowTokens: new PublicKey(raw.escrow_tokens),
    streamflowTreasury: new PublicKey(raw.streamflow_treasury),
    streamflowTreasuryTokens: new PublicKey(raw.streamflow_treasury_tokens),
    streamflowFeeTotal: new BN(raw.streamflow_fee_total, LE),
    streamflowFeeWithdrawn: new BN(raw.streamflow_fee_withdrawn, LE),
    streamflowFeePercent: new BN(raw.streamflow_fee_percent, LE),
    partnerFeeTotal: new BN(raw.partner_fee_total, LE),
    partnerFeeWithdrawn: new BN(raw.partner_fee_withdrawn, LE),
    partnerFeePercent: new BN(raw.partner_fee_percent, LE),
    partner: new PublicKey(raw.partner),
    partnerTokens: new PublicKey(raw.partner_tokens),
    start: new BN(raw.start_time, LE),
    depositedAmount: new BN(raw.net_amount_deposited, LE),
    period: new BN(raw.period, LE),
    amountPerPeriod: new BN(raw.amount_per_period, LE),
    cliff: new BN(raw.cliff, LE),
    cliffAmount: new BN(raw.cliff_amount, LE),
    cancelableBySender: Boolean(raw.cancelable_by_sender),
    cancelableByRecipient: Boolean(raw.cancelable_by_recipient),
    automaticWithdrawal: Boolean(raw.automatic_withdrawal),
    transferableBySender: Boolean(raw.transferable_by_sender),
    transferableByRecipient: Boolean(raw.transferable_by_recipient),
    canTopup: Boolean(raw.can_topup),
    name: decoder.decode(raw.stream_name),
    withdrawFrequency: new BN(raw.withdraw_frequency, LE),
    closed: Boolean(raw.closed),
    currentPauseStart: new BN(raw.current_pause_start, LE),
    pauseCumulative: new BN(raw.pause_cumulative, LE),
    lastRateChangeTime: new BN(raw.last_rate_change_time, LE),
    fundsUnlockedAtLastRateChange: new BN(raw.funds_unlocked_at_last_rate_change, LE),
  };
};
// DeprecationWarning: This object will be deprecated starting from the version 4.0.0. Use
// types/Contract instead
export const formatDecodedStream = (stream: DecodedStream): Stream => {
  const resp = {
    magic: stream.magic.toNumber(),
    version: stream.version.toNumber(),
    createdAt: stream.createdAt.toNumber(),
    withdrawnAmount: stream.withdrawnAmount,
    canceledAt: stream.canceledAt.toNumber(),
    end: stream.end.toNumber(),
    lastWithdrawnAt: stream.lastWithdrawnAt.toNumber(),
    sender: stream.sender.toBase58(),
    senderTokens: stream.senderTokens.toBase58(),
    recipient: stream.recipient.toBase58(),
    recipientTokens: stream.recipientTokens.toBase58(),
    mint: stream.mint.toBase58(),
    escrowTokens: stream.escrowTokens.toBase58(),
    streamflowTreasury: stream.streamflowTreasury.toBase58(),
    streamflowTreasuryTokens: stream.streamflowTreasuryTokens.toBase58(),
    streamflowFeeTotal: stream.streamflowFeeTotal,
    streamflowFeeWithdrawn: stream.streamflowFeeWithdrawn,
    streamflowFeePercent: stream.streamflowFeePercent.toNumber(),
    partnerFeeTotal: stream.partnerFeeTotal,
    partnerFeeWithdrawn: stream.partnerFeeWithdrawn,
    partnerFeePercent: stream.partnerFeePercent.toNumber(),
    partner: stream.partner.toBase58(),
    partnerTokens: stream.partnerTokens?.toBase58(),
    start: stream.start.toNumber(),
    depositedAmount: stream.depositedAmount,
    period: stream.period.toNumber(),
    amountPerPeriod: stream.amountPerPeriod,
    cliff: stream.cliff.toNumber(),
    cliffAmount: stream.cliffAmount,
    cancelableBySender: stream.cancelableBySender,
    cancelableByRecipient: stream.cancelableByRecipient,
    automaticWithdrawal: stream.automaticWithdrawal,
    transferableBySender: stream.transferableBySender,
    transferableByRecipient: stream.transferableByRecipient,
    canTopup: stream.canTopup,
    name: stream.name,
    withdrawalFrequency: stream.withdrawFrequency.toNumber(),
    closed: stream.closed,
    currentPauseStart: stream.currentPauseStart.toNumber(),
    pauseCumulative: stream.pauseCumulative,
    lastRateChangeTime: stream.lastRateChangeTime.toNumber(),
    fundsUnlockedAtLastRateChange: stream.fundsUnlockedAtLastRateChange,
    unlocked: function () {
      return new BN(0);
    }, //phantom method to preserve partial support of this object
    withdrawn: function () {
      return new BN(0);
    }, //phantom method to preserve partial support of this object
  };
  return resp;
};

/**
 * Wrapper function for Solana web3 getProgramAccounts with slightly better call interface
 * @param {Connection} connection - Solana web3 connection object.
 * @param {PublicKey} wallet - PublicKey to compare against.
 * @param {number} offset - Offset of bits of the PublicKey in the account binary.
 * @param {PublicKey} programId - Solana program ID.
 * @return {Promise<Account[]>} - Array of resulting accounts.
 */
export async function getProgramAccounts(
  connection: Connection,
  wallet: PublicKey,
  offset: number,
  programId: PublicKey
): Promise<Account[]> {
  return connection?.getProgramAccounts(programId, {
    filters: [
      {
        memcmp: {
          offset,
          bytes: wallet.toBase58(),
        },
      },
    ],
  });
}

/**
 * Utility function to check if the transaction initiator is a KeyPair or a Wallet object
 * @param {Keypair | SignerWalletAdapter} walletOrKeypair - Wallet or Keypair in question
 * @return {boolean} - Returns true if parameter is a Wallet.
 */
export function isSignerWallet(walletOrKeypair: Keypair | SignerWalletAdapter): boolean {
  return (<SignerWalletAdapter>walletOrKeypair).signTransaction !== undefined;
}

/**
 * Sign passed BatchItems with wallet request or KeyPair
 * @param {Keypair | SignerWalletAdapter} sender - Wallet or Keypair of sendin account
 * @param {BatchItem[]} items - Multiple recipient contracts split into separate items
 * @return {BatchItem[]} - Returns items with signatures.
 */
export async function signAllTransactionWithRecipients(
  sender: Keypair | SignerWalletAdapter,
  items: BatchItem[]
): Promise<BatchItem[]> {
  const isKeypair = sender instanceof Keypair;
  const isWallet = isSignerWallet(sender);

  if (isKeypair) {
    return items.map((t) => {
      t.tx.partialSign(sender);
      return { tx: t.tx, recipient: t.recipient };
    });
  } else if (isWallet) {
    const signedTxs = await sender.signAllTransactions(items.map((t) => t.tx));
    return items.map((item, index) => ({
      ...item,
      tx: signedTxs[index],
    }));
  } else {
    // If signer is not passed
    return [];
  }
}

/**
 * Sign passed BatchItems with wallet request or KeyPair
 * @param {Connection} connection - Solana web3 connection object.
 * @param {BatchItem} batchItem - Signed transaction ready to be send.
 * @return {Promise<BatchItemResult>} - Returns settled transaction item
 */
export async function sendAndConfirmStreamRawTransaction(
  connection: Connection,
  batchItem: BatchItem
): Promise<BatchItemResult> {
  try {
    const rawTx = batchItem.tx.serialize();
    const { lastValidBlockHeight, signature, recentBlockhash } = batchItem.tx;
    if (!lastValidBlockHeight || !signature || !recentBlockhash)
      throw { recipient: batchItem.recipient, error: "no recent blockhash" };

    const confirmationStrategy: BlockheightBasedTransactionConfirmationStrategy = {
      lastValidBlockHeight,
      signature: bs58.encode(signature),
      blockhash: recentBlockhash,
    };
    const completedTxSignature = await sendAndConfirmRawTransaction(
      connection,
      rawTx,
      confirmationStrategy
    );
    return { ...batchItem, signature: completedTxSignature };
  } catch (error: any) {
    throw {
      recipient: batchItem.recipient,
      error: error?.error ?? error?.message ?? error.toString(),
    };
  }
}

/**
 * Shorthand call signature for getAssociatedTokenAddress, with allowance for address to be offCurve
 * @param {PublicKey} mint - SPL token Mint address.
 * @param {PublicKey} owner - Owner of the Associated Token Address
 * @return {Promise<PublicKey>} - Associated Token Address
 */
export function ata(mint: PublicKey, owner: PublicKey): Promise<PublicKey> {
  return getAssociatedTokenAddress(mint, owner, true);
}
