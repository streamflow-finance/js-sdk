import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import {
  BlockheightBasedTransactionConfirmationStrategy,
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
  Transaction,
  sendAndConfirmRawTransaction,
  BlockhashWithExpiryBlockHeight,
} from "@solana/web3.js";
import BN from "bn.js";
import bs58 from "bs58";

import { streamLayout } from "./layout";
import { AtaParams, DecodedStream, Account, BatchItem, BatchItemResult } from "./types";
import { SOLANA_ERROR_MAP, SOLANA_ERROR_MATCH_REGEX } from "./constants";

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
 * Utility function to check if the transaction initiator is a Wallet object
 * @param {Keypair | SignerWalletAdapter} walletOrKeypair - Wallet or Keypair in question
 * @return {boolean} - Returns true if parameter is a Wallet.
 */
export function isSignerWallet(
  walletOrKeypair: Keypair | SignerWalletAdapter
): walletOrKeypair is SignerWalletAdapter {
  return (<SignerWalletAdapter>walletOrKeypair).signTransaction !== undefined;
}

/**
 * Utility function to check if the transaction initiator a Keypair object, tries to mitigate version mismatch issues
 * @param walletOrKeypair {Keypair | SignerWalletAdapter} walletOrKeypair - Wallet or Keypair in question
 * @returns {boolean} - Returns true if parameter is a Keypair.
 */
export function isSignerKeypair(
  walletOrKeypair: Keypair | SignerWalletAdapter
): walletOrKeypair is Keypair {
  return (
    walletOrKeypair instanceof Keypair ||
    walletOrKeypair.constructor === Keypair ||
    walletOrKeypair.constructor.name === Keypair.prototype.constructor.name
  );
}

export async function signTransaction(
  invoker: Keypair | SignerWalletAdapter,
  tx: Transaction
): Promise<Transaction> {
  let signedTx: Transaction;
  if (isSignerWallet(invoker)) {
    signedTx = await invoker.signTransaction(tx);
  } else {
    tx.partialSign(invoker);
    signedTx = tx;
  }
  return signedTx;
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
  const isKeypair = isSignerKeypair(sender);
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
 * Signs, sends and confirms Transaction
 * @param connection - Solana client connection
 * @param invoker - Keypair used as signer
 * @param tx - Transaction instance
 * @param hash - blockhash information, the same hash should be used in the Transaction
 * @returns Transaction signature
 */
export async function signAndExecuteTransaction(
  connection: Connection,
  invoker: Keypair | SignerWalletAdapter,
  tx: Transaction,
  hash: BlockhashWithExpiryBlockHeight
): Promise<string> {
  const signedTx = await signTransaction(invoker, tx);
  const rawTx = signedTx.serialize();

  if (!hash.lastValidBlockHeight || !signedTx.signature || !hash.blockhash)
    throw Error("Error with transaction parameters.");

  const confirmationStrategy: BlockheightBasedTransactionConfirmationStrategy = {
    lastValidBlockHeight: hash.lastValidBlockHeight,
    signature: bs58.encode(signedTx.signature),
    blockhash: hash.blockhash,
  };
  const signature = await sendAndConfirmRawTransaction(connection, rawTx, confirmationStrategy);
  return signature;
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

/**
 * Function that checks whether ATA exists for each provided owner
 * @param connection - Solana client connection
 * @param paramsBatch - Array of Params for an each ATA account: {mint, owner}
 * @returns Array of boolean where each members corresponds to owners member
 */
export async function ataBatchExist(
  connection: Connection,
  paramsBatch: AtaParams[]
): Promise<boolean[]> {
  const tokenAccounts = await Promise.all(
    paramsBatch.map(async ({ mint, owner }) => {
      const pubkey = await ata(mint, owner);
      return pubkey;
    })
  );
  const response = await connection.getMultipleAccountsInfo(tokenAccounts);
  return response.map((accInfo) => !!accInfo);
}

/**
 * Generates a Transaction to create ATA for an array of owners
 * @param connection - Solana client connection
 * @param payer - Transaction invoker, should be a signer
 * @param coparamsBatchnfigs - Array of Params for an each ATA account: {mint, owner}
 * @returns Unsigned Transaction with create ATA instructions
 */
export async function generateCreateAtaBatchTx(
  connection: Connection,
  payer: PublicKey,
  paramsBatch: AtaParams[]
): Promise<{
  tx: Transaction;
  hash: BlockhashWithExpiryBlockHeight;
}> {
  const ixs: TransactionInstruction[] = await Promise.all(
    paramsBatch.map(async ({ mint, owner }) => {
      return createAssociatedTokenAccountInstruction(payer, await ata(mint, owner), owner, mint);
    })
  );
  const hash = await connection.getLatestBlockhash();
  const tx = new Transaction({
    feePayer: payer,
    blockhash: hash.blockhash,
    lastValidBlockHeight: hash.lastValidBlockHeight,
  }).add(...ixs);
  return { tx, hash };
}

/**
 * Creates ATA for an array of owners
 * @param connection - Solana client connection
 * @param invoker - Transaction invoker and payer
 * @param paramsBatch - Array of Params for an each ATA account: {mint, owner}
 * @returns Transaction signature
 */
export async function createAtaBatch(
  connection: Connection,
  invoker: Keypair | SignerWalletAdapter,
  paramsBatch: AtaParams[]
): Promise<string> {
  const { tx, hash } = await generateCreateAtaBatchTx(connection, invoker.publicKey!, paramsBatch);
  const signature = await signAndExecuteTransaction(connection, invoker, tx, hash);
  return signature;
}

export function extractSolanaErrorCode(errorText: string): string | null {
  const match = SOLANA_ERROR_MATCH_REGEX.exec(errorText);

  if (!match) {
    return null;
  }

  const errorCode = Number(match[1]);
  return SOLANA_ERROR_MAP[errorCode] || null;
}
