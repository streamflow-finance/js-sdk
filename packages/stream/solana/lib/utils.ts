import type { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import type { Connection, Keypair } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import {
  type ConfirmationParams,
  executeTransaction,
  isSignerKeypair,
  isSignerWallet,
  type ThrottleParams,
} from "@streamflow/common";
import BN from "bn.js";

import { streamLayout } from "../layout.js";
import { type DecodedStream, type BatchItem, type BatchItemResult, ContractError } from "../types.js";
import { SOLANA_ERROR_MAP, SOLANA_ERROR_MATCH_REGEX } from "../constants.js";

export { getBN, getNumberFromBN } from "@streamflow/common";

/**
 * Returns the key that should be used for PDA derivation.
 * For migrated streams, the aligned proxy PDA was derived from the original (old) metadata key,
 * so we need to use that instead of the current stream pubkey.
 */
export const getMetadataKey = (streamPubkey: PublicKey, oldMetadata: PublicKey): PublicKey => {
  if (PublicKey.default.equals(oldMetadata)) {
    return streamPubkey;
  }
  return oldMetadata;
};

const FEE_PRECISION = 4;
const FEE_NORMALIZER = 10 ** FEE_PRECISION;
const FEE_MULTIPLIER = new BN(10 ** 6);

const decoder = new TextDecoder("utf-8");
const LE = "le"; //little endian

/**
 * Calculate total amount of a Contract including all fees.
 * - first we convert fee floating to a BN with up to 4 decimals precision
 * - then we reverse the fee with `FEE_MULTIPLIER` to safely multiply it by depositedAmount
 *   to receive a total number and not percentage of depositedAmount
 * @param depositedAmount deposited raw tokens
 * @param totalFee sum of all fees in percentage as floating number, e.g. 0.99% should be supplied as 0.99
 * @returns total tokens amount that Contract will retrieve from the Sender
 */
export const calculateTotalAmountToDeposit = (depositedAmount: BN, totalFee: number): BN => {
  const totalFeeNormalized = new BN(totalFee * FEE_NORMALIZER);
  return depositedAmount.mul(totalFeeNormalized.add(FEE_MULTIPLIER)).div(FEE_MULTIPLIER);
};

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
    streamflowFeePercent: raw.streamflow_fee_percent,
    partnerFeeTotal: new BN(raw.partner_fee_total, LE),
    partnerFeeWithdrawn: new BN(raw.partner_fee_withdrawn, LE),
    partnerFeePercent: raw.partner_fee_percent,
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
    isPda: Boolean(raw.is_pda),
    nonce: raw.nonce,
    closed: Boolean(raw.closed),
    currentPauseStart: new BN(raw.current_pause_start, LE),
    pauseCumulative: new BN(raw.pause_cumulative, LE),
    lastRateChangeTime: new BN(raw.last_rate_change_time, LE),
    fundsUnlockedAtLastRateChange: new BN(raw.funds_unlocked_at_last_rate_change, LE),
    oldMetadata: new PublicKey(raw.old_metadata),
    payer: new PublicKey(raw.payer),
    bump: raw.bump,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw {
      recipient: batchItem.recipient,
      error,
    };
  }
}

/**
 * Used to make on chain calls to the contract and wrap raised errors if any
 * @param func function that interacts with the contract
 * @param callback callback that may be used to extract error code
 * @returns {T}
 */
export async function handleContractError<T>(
  func: () => Promise<T>,
  callback?: (err: Error) => string | null,
): Promise<T> {
  try {
    return await func();
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (callback) {
        throw new ContractError(err, callback(err));
      }
      throw new ContractError(err);
    }
    throw err;
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
