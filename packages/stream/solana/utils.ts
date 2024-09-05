import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  ConfirmationParams,
  executeTransaction,
  isSignerKeypair,
  isSignerWallet,
  ThrottleParams,
} from "@streamflow/common/solana";
import BigNumber from "bignumber.js";

import { streamLayout } from "./layout.js";
import { DecodedStream, BatchItem, BatchItemResult } from "./types.js";
import { SOLANA_ERROR_MAP, SOLANA_ERROR_MATCH_REGEX } from "./constants.js";

const decoder = new TextDecoder("utf-8");

const toUInt64String = (uintArr: Uint8Array): string =>
  new DataView(uintArr.buffer, uintArr.byteOffset, uintArr.byteLength).getBigUint64(0, true).toString();

const toUInt8 = (uintArr: Uint8Array): number =>
  new DataView(uintArr.buffer, uintArr.byteOffset, uintArr.byteLength).getUint8(0);

export const toBuffer = (bigNumber: BigNumber): Buffer => {
  const dv = new DataView(new ArrayBuffer(8), 0);
  dv.setBigUint64(0, BigInt(bigNumber.integerValue().toString()), true);
  return Buffer.from(dv.buffer);
};

export const decodeStream = (buf: Buffer): DecodedStream => {
  const raw = streamLayout.decode(buf);

  return {
    magic: BigNumber(toUInt64String(raw.magic)),
    version: BigNumber(toUInt8(raw.version)),
    createdAt: BigNumber(toUInt64String(raw.created_at)),
    withdrawnAmount: BigNumber(toUInt64String(raw.withdrawn_amount)),
    canceledAt: BigNumber(toUInt64String(raw.canceled_at)),
    end: BigNumber(toUInt64String(raw.end_time)),
    lastWithdrawnAt: BigNumber(toUInt64String(raw.last_withdrawn_at)),
    sender: new PublicKey(raw.sender),
    senderTokens: new PublicKey(raw.sender_tokens),
    recipient: new PublicKey(raw.recipient),
    recipientTokens: new PublicKey(raw.recipient_tokens),
    mint: new PublicKey(raw.mint),
    escrowTokens: new PublicKey(raw.escrow_tokens),
    streamflowTreasury: new PublicKey(raw.streamflow_treasury),
    streamflowTreasuryTokens: new PublicKey(raw.streamflow_treasury_tokens),
    streamflowFeeTotal: BigNumber(toUInt64String(raw.streamflow_fee_total)),
    streamflowFeeWithdrawn: BigNumber(toUInt64String(raw.streamflow_fee_withdrawn)),
    streamflowFeePercent: BigNumber(raw.streamflow_fee_percent),
    partnerFeeTotal: BigNumber(toUInt64String(raw.partner_fee_total)),
    partnerFeeWithdrawn: BigNumber(toUInt64String(raw.partner_fee_withdrawn)),
    partnerFeePercent: BigNumber(raw.partner_fee_percent),
    partner: new PublicKey(raw.partner),
    partnerTokens: new PublicKey(raw.partner_tokens),
    start: BigNumber(toUInt64String(raw.start_time)),
    depositedAmount: BigNumber(toUInt64String(raw.net_amount_deposited)),
    period: BigNumber(toUInt64String(raw.period)),
    amountPerPeriod: BigNumber(toUInt64String(raw.amount_per_period)),
    cliff: BigNumber(toUInt64String(raw.cliff)),
    cliffAmount: BigNumber(toUInt64String(raw.cliff_amount)),
    cancelableBySender: Boolean(raw.cancelable_by_sender),
    cancelableByRecipient: Boolean(raw.cancelable_by_recipient),
    automaticWithdrawal: Boolean(raw.automatic_withdrawal),
    transferableBySender: Boolean(raw.transferable_by_sender),
    transferableByRecipient: Boolean(raw.transferable_by_recipient),
    canTopup: Boolean(raw.can_topup),
    name: decoder.decode(raw.stream_name),
    withdrawFrequency: BigNumber(toUInt64String(raw.withdraw_frequency)),
    closed: Boolean(raw.closed),
    currentPauseStart: BigNumber(toUInt64String(raw.current_pause_start)),
    pauseCumulative: BigNumber(toUInt64String(raw.pause_cumulative)),
    lastRateChangeTime: BigNumber(toUInt64String(raw.last_rate_change_time)),
    fundsUnlockedAtLastRateChange: BigNumber(toUInt64String(raw.funds_unlocked_at_last_rate_change)),
  };
};

/**
 * Sign passed BatchItems with wallet request or KeyPair
 * @param {Keypair | SignerWalletAdapter} sender - Wallet or Keypair of sendin account
 * @param {BatchItem[]} items - Multiple recipient contracts split into separate items
 * @return {BatchItem[]} - Returns items with signatures.
 */
export async function signAllTransactionWithRecipients(
  sender: Keypair | SignerWalletAdapter,
  items: BatchItem[],
): Promise<BatchItem[]> {
  const isKeypair = isSignerKeypair(sender);
  const isWallet = isSignerWallet(sender);

  if (isKeypair) {
    return items.map((t) => {
      t.tx.sign([sender]);
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
 * @param confirmationParams - Confirmation Params that will be used for execution
 * @param throttleParams - rate or throttler instance to throttle TX sending - to not spam the blockchain too much
 * @return {Promise<BatchItemResult>} - Returns settled transaction item
 */
export async function sendAndConfirmStreamRawTransaction(
  connection: Connection,
  batchItem: BatchItem,
  confirmationParams: ConfirmationParams,
  throttleParams: ThrottleParams,
): Promise<BatchItemResult> {
  try {
    const completedTxSignature = await executeTransaction(connection, batchItem.tx, confirmationParams, throttleParams);
    return { ...batchItem, signature: completedTxSignature };
  } catch (error: any) {
    throw {
      recipient: batchItem.recipient,
      error,
    };
  }
}

export function extractSolanaErrorCode(errorText: string, logs?: string[]): string | null {
  let match = SOLANA_ERROR_MATCH_REGEX.exec(errorText);

  if (!match && logs) {
    for (const logLine of logs) {
      match = SOLANA_ERROR_MATCH_REGEX.exec(logLine);
      if (match !== null) {
        break;
      }
    }
  }

  if (!match) {
    return null;
  }

  const errorCode = Number(match[1]);
  return SOLANA_ERROR_MAP[errorCode] || null;
}
