import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  unpackMint,
  Mint,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import {
  BlockhashWithExpiryBlockHeight,
  Commitment,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SignatureStatus,
  TransactionMessage,
  VersionedTransaction,
  Context,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  SendTransactionError,
} from "@solana/web3.js";
import bs58 from "bs58";

import { Account, AtaParams, ConfirmationParams, ITransactionSolanaExt, TransactionFailedError } from "./types";
import { sleep } from "../utils";

const SIMULATE_TRIES = 3;

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
  programId: PublicKey,
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
export function isSignerWallet(walletOrKeypair: Keypair | SignerWalletAdapter): walletOrKeypair is SignerWalletAdapter {
  return (<SignerWalletAdapter>walletOrKeypair).signTransaction !== undefined;
}

/**
 * Utility function to check if the transaction initiator a Keypair object, tries to mitigate version mismatch issues
 * @param walletOrKeypair {Keypair | SignerWalletAdapter} walletOrKeypair - Wallet or Keypair in question
 * @returns {boolean} - Returns true if parameter is a Keypair.
 */
export function isSignerKeypair(walletOrKeypair: Keypair | SignerWalletAdapter): walletOrKeypair is Keypair {
  return (
    walletOrKeypair instanceof Keypair ||
    walletOrKeypair.constructor === Keypair ||
    walletOrKeypair.constructor.name === Keypair.prototype.constructor.name
  );
}

/**
 * Utility function to check whether given transaction is Versioned
 * @param tx {Transaction | VersionedTransaction} - Transaction to check
 * @returns {boolean} - Returns true if transaction is Versioned.
 */
export function isTransactionVersioned(tx: Transaction | VersionedTransaction): tx is VersionedTransaction {
  return "message" in tx;
}

/**
 * Creates a Transaction with given instructions and optionally signs it.
 * @param connection - Solana client connection
 * @param ixs - Instructions to add to the Transaction
 * @param payer - PublicKey of payer
 * @param commitment - optional Commitment that will be used to fetch latest blockhash
 * @param partialSigners - optional signers that will be used to partially sign a Transaction
 * @returns Transaction and Blockhash
 */
export async function prepareTransaction(
  connection: Connection,
  ixs: TransactionInstruction[],
  payer: PublicKey | undefined | null,
  commitment?: Commitment,
  ...partialSigners: (Keypair | undefined)[]
): Promise<{
  tx: VersionedTransaction;
  hash: BlockhashWithExpiryBlockHeight;
  context: Context;
}> {
  if (!payer) {
    throw new Error("Payer public key is not provided!");
  }

  const { value: hash, context } = await connection.getLatestBlockhashAndContext(commitment);
  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: hash.blockhash,
    instructions: ixs,
  }).compileToV0Message();
  const tx = new VersionedTransaction(messageV0);
  const signers: Keypair[] = partialSigners.filter((item): item is Keypair => !!item);
  tx.sign(signers);

  return { tx, context, hash };
}

export async function signTransaction<T extends Transaction | VersionedTransaction>(
  invoker: Keypair | SignerWalletAdapter,
  tx: T,
): Promise<T> {
  let signedTx: T;
  if (isSignerWallet(invoker)) {
    signedTx = await invoker.signTransaction(tx);
  } else {
    if (isTransactionVersioned(tx)) {
      tx.sign([invoker]);
    } else {
      tx.partialSign(invoker);
    }
    signedTx = tx;
  }
  return signedTx;
}

/**
 * Signs, sends and confirms Transaction
 * @param connection - Solana client connection
 * @param invoker - Keypair used as signer
 * @param tx - Transaction instance
 * @param {ConfirmationParams} confirmationParams - Confirmation Params that will be used for execution
 * @returns Transaction signature
 */
export async function signAndExecuteTransaction(
  connection: Connection,
  invoker: Keypair | SignerWalletAdapter,
  tx: Transaction | VersionedTransaction,
  confirmationParams: ConfirmationParams,
): Promise<string> {
  const signedTx = await signTransaction(invoker, tx);

  return executeTransaction(connection, signedTx, confirmationParams);
}

/**
 * Sends and confirms Transaction
 * Uses custom confirmation logic that:
 * - simulates tx before sending separately
 * - sends transaction without preFlight checks but with some valuable flags https://twitter.com/jordaaash/status/1774892862049800524?s=46&t=bhZ10V0r7IX5Lk5kKzxfGw
 * - rebroadcasts a tx every 500 ms
 * - after broadcasting check whether tx has executed once
 * - catch errors for every actionable item, throw only the ones that signal that tx has failed
 * - otherwise there is a chance of marking a landed tx as failed if it was broadcasted at least once
 * @param connection - Solana client connection
 * @param tx - Transaction instance
 * @param {ConfirmationParams} confirmationParams - Confirmation Params that will be used for execution
 * @returns Transaction signature
 */
export async function executeTransaction(
  connection: Connection,
  tx: Transaction | VersionedTransaction,
  confirmationParams: ConfirmationParams,
): Promise<string> {
  if (tx.signatures.length === 0) {
    throw Error("Error with transaction parameters.");
  }
  await simulateTransaction(connection, tx);

  return sendAndConfirmTransaction(connection, tx, confirmationParams);
}

/**
 * Sends and confirm transaction in a loop, constantly re-broadcsting the tx until Blockheight expires.
 * - we add additional 30 bocks to account for validators in an PRC pool divergence
 * @param connection - Solana client connection
 * @param tx - Transaction instance
 * @param hash - blockhash information, the same hash should be used in the Transaction
 * @param context - context at which blockhash has been retrieve
 * @param commitment - optional commitment that will be used for simulation and confirmation
 */
export async function sendAndConfirmTransaction(
  connection: Connection,
  tx: Transaction | VersionedTransaction,
  { hash, context, commitment }: ConfirmationParams,
): Promise<string> {
  const isVersioned = isTransactionVersioned(tx);

  let signature: string;
  if (isVersioned) {
    signature = bs58.encode(tx.signatures[0]);
  } else {
    signature = bs58.encode(tx.signature!);
  }

  let blockheight = await connection.getBlockHeight(commitment);
  let transactionSent = false;
  const rawTransaction = tx.serialize();
  while (blockheight < hash.lastValidBlockHeight + 15) {
    try {
      if (blockheight < hash.lastValidBlockHeight || !transactionSent) {
        await connection.sendRawTransaction(rawTransaction, {
          maxRetries: 0,
          minContextSlot: context.slot,
          preflightCommitment: commitment,
          skipPreflight: true,
        });
        transactionSent = true;
      }
    } catch (e) {
      if (
        transactionSent ||
        (e instanceof SendTransactionError && e.message.includes("Minimum context slot has not been reached"))
      ) {
        await sleep(500);
        continue;
      }
      throw e;
    }
    await sleep(500);
    try {
      const value = await confirmAndEnsureTransaction(connection, signature);
      if (value) {
        return signature;
      }
    } catch (e) {
      if (e instanceof TransactionFailedError) {
        throw e;
      }
      await sleep(500);
    }
    try {
      blockheight = await connection.getBlockHeight(commitment);
    } catch (_e) {
      await sleep(500);
    }
  }
  throw new Error(`Transaction ${signature} expired.`);
}

export async function simulateTransaction(
  connection: Connection,
  tx: Transaction | VersionedTransaction,
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
  let res: RpcResponseAndContext<SimulatedTransactionResponse>;
  for (let i = 0; i < SIMULATE_TRIES; i++) {
    if (isTransactionVersioned(tx)) {
      res = await connection.simulateTransaction(tx);
    } else {
      res = await connection.simulateTransaction(tx);
    }
    if (res.value.err) {
      const errMessage = JSON.stringify(res.value.err);
      if (!errMessage.includes("BlockhashNotFound") || i === SIMULATE_TRIES - 1) {
        throw new SendTransactionError("failed to simulate transaction: " + errMessage, res.value.logs || undefined);
      }
      continue;
    }
    return res;
  }
  throw new SendTransactionError("failed to simulate transaction");
}

/**
 * Confirms and validates transaction success once
 * @param connection - Solana client connection
 * @param signature - Transaction signature
 * @param ignoreError - return status even if tx failed
 * @returns Transaction Status
 */
export async function confirmAndEnsureTransaction(
  connection: Connection,
  signature: string,
  ignoreError?: boolean,
): Promise<SignatureStatus | null> {
  const response = await connection.getSignatureStatus(signature);
  if (!response) {
    return null;
  }
  const { value } = response;
  if (!value) {
    return null;
  }
  if (!ignoreError && value.err) {
    // That's how solana-web3js does it, `err` here is an object that won't really be handled
    throw new TransactionFailedError(`Raw transaction ${signature} failed (${JSON.stringify({ err: value.err })})`);
  }
  switch (connection.commitment) {
    case "confirmed":
    case "single":
    case "singleGossip": {
      if (value.confirmationStatus === "processed") {
        return null;
      }
      break;
    }
    case "finalized":
    case "max":
    case "root": {
      if (value.confirmationStatus === "processed" || value.confirmationStatus === "confirmed") {
        return null;
      }
      break;
    }
    // exhaust enums to ensure full coverage
    case "processed":
    case "recent":
  }
  return value;
}

/**
 * Shorthand call signature for getAssociatedTokenAddress, with allowance for address to be offCurve
 * @param {PublicKey} mint - SPL token Mint address.
 * @param {PublicKey} owner - Owner of the Associated Token Address
 * @param {PublicKey} programId - Program ID of the mint
 * @return {Promise<PublicKey>} - Associated Token Address
 */
export function ata(mint: PublicKey, owner: PublicKey, programId?: PublicKey): Promise<PublicKey> {
  return getAssociatedTokenAddress(mint, owner, true, programId);
}

/**
 * Function that checks whether ATA exists for each provided owner
 * @param connection - Solana client connection
 * @param paramsBatch - Array of Params for each ATA account: {mint, owner}
 * @returns Array of boolean where each member corresponds to an owner
 */
export async function ataBatchExist(connection: Connection, paramsBatch: AtaParams[]): Promise<boolean[]> {
  const tokenAccounts = await Promise.all(
    paramsBatch.map(async ({ mint, owner, programId }) => {
      return ata(mint, owner, programId);
    }),
  );
  const response = await connection.getMultipleAccountsInfo(tokenAccounts);
  return response.map((accInfo) => !!accInfo);
}

export async function enrichAtaParams(connection: Connection, paramsBatch: AtaParams[]): Promise<AtaParams[]> {
  const programIdByMint: { [key: string]: PublicKey } = {};
  return Promise.all(
    paramsBatch.map(async (params) => {
      if (params.programId) {
        return params;
      }
      const mintStr = params.mint.toString();
      if (!(mintStr in programIdByMint)) {
        const { tokenProgramId } = await getMintAndProgram(connection, params.mint);
        programIdByMint[mintStr] = tokenProgramId;
      }
      params.programId = programIdByMint[mintStr];
      return params;
    }),
  );
}

/**
 * Generates a Transaction to create ATA for an array of owners
 * @param connection - Solana client connection
 * @param payer - Transaction invoker, should be a signer
 * @param paramsBatch - Array of Params for an each ATA account: {mint, owner}
 * @param commitment - optional commitment that will be used to fetch Blockhash
 * @returns Unsigned Transaction with create ATA instructions
 */
export async function generateCreateAtaBatchTx(
  connection: Connection,
  payer: PublicKey,
  paramsBatch: AtaParams[],
  commitment?: Commitment,
): Promise<{
  tx: VersionedTransaction;
  hash: BlockhashWithExpiryBlockHeight;
  context: Context;
}> {
  paramsBatch = await enrichAtaParams(connection, paramsBatch);
  const ixs: TransactionInstruction[] = await Promise.all(
    paramsBatch.map(async ({ mint, owner, programId }) => {
      return createAssociatedTokenAccountInstruction(payer, await ata(mint, owner), owner, mint, programId);
    }),
  );
  const { value: hash, context } = await connection.getLatestBlockhashAndContext({ commitment });
  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: hash.blockhash,
    instructions: ixs,
  }).compileToV0Message();
  const tx = new VersionedTransaction(messageV0);
  return { tx, hash, context };
}

/**
 * Creates ATA for an array of owners
 * @param connection - Solana client connection
 * @param invoker - Transaction invoker and payer
 * @param paramsBatch - Array of Params for an each ATA account: {mint, owner}
 * @param commitment - optional commitment that will be used to fetch Blockhash
 * @returns Transaction signature
 */
export async function createAtaBatch(
  connection: Connection,
  invoker: Keypair | SignerWalletAdapter,
  paramsBatch: AtaParams[],
  commitment?: Commitment,
): Promise<string> {
  const { tx, hash, context } = await generateCreateAtaBatchTx(
    connection,
    invoker.publicKey!,
    await enrichAtaParams(connection, paramsBatch),
    commitment,
  );
  return signAndExecuteTransaction(connection, invoker, tx, { hash, context, commitment });
}

/**
 * Utility function that checks whether associated token accounts exist and return instructions to populate them if not
 * @param connection - Solana client connection
 * @param owners - Array of ATA owners
 * @param mint - Mint for which ATA will be checked
 * @param invoker - Transaction invoker and payer
 * @param programId - Program ID of the Mint
 * @returns Array of Transaction Instructions that should be added to a transaction
 */
export async function checkOrCreateAtaBatch(
  connection: Connection,
  owners: PublicKey[],
  mint: PublicKey,
  invoker: SignerWalletAdapter | Keypair,
  programId?: PublicKey,
): Promise<TransactionInstruction[]> {
  const ixs: TransactionInstruction[] = [];
  if (!programId) {
    programId = (await getMintAndProgram(connection, mint)).tokenProgramId;
  }
  // TODO: optimize fetching and maps/arrays
  const atas: PublicKey[] = [];
  for (const owner of owners) {
    atas.push(await ata(mint, owner, programId));
  }
  const response = await connection.getMultipleAccountsInfo(atas);
  for (let i = 0; i < response.length; i++) {
    if (!response[i]) {
      ixs.push(createAssociatedTokenAccountInstruction(invoker.publicKey!, atas[i], owners[i], mint, programId));
    }
  }
  return ixs;
}

/**
 * Create Base instructions for Solana
 * - sets compute price if `computePrice` is provided
 * - sets compute limit if `computeLimit` is provided
 */
export function prepareBaseInstructions(
  connection: Connection,
  { computePrice, computeLimit }: ITransactionSolanaExt,
): TransactionInstruction[] {
  const ixs: TransactionInstruction[] = [];

  if (computePrice) {
    ixs.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: computePrice }));
  }
  if (computeLimit) {
    ixs.push(ComputeBudgetProgram.setComputeUnitLimit({ units: computeLimit }));
  }

  return ixs;
}

/**
 * Retrieve information about a mint and its program ID, support all Token Programs.
 *
 * @param connection Connection to use
 * @param address    Mint account
 * @param commitment Desired level of commitment for querying the state
 *
 * @return Mint information
 */
export async function getMintAndProgram(
  connection: Connection,
  address: PublicKey,
  commitment?: Commitment,
): Promise<{ mint: Mint; tokenProgramId: PublicKey }> {
  const accountInfo = await connection.getAccountInfo(address, commitment);
  let programId = accountInfo?.owner;
  if (!programId?.equals(TOKEN_PROGRAM_ID) && !programId?.equals(TOKEN_2022_PROGRAM_ID)) {
    programId = TOKEN_PROGRAM_ID;
  }
  return {
    mint: unpackMint(address, accountInfo, programId),
    tokenProgramId: programId!,
  };
}
