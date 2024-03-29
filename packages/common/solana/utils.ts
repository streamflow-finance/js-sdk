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
  BlockheightBasedTransactionConfirmationStrategy,
  Commitment,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmRawTransaction,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";

import { Account, AtaParams, ITransactionSolanaExt } from "./types";

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
  tx: Transaction;
  hash: BlockhashWithExpiryBlockHeight;
}> {
  const hash = await connection.getLatestBlockhash(commitment);
  const tx = new Transaction({
    feePayer: payer,
    blockhash: hash.blockhash,
    lastValidBlockHeight: hash.lastValidBlockHeight,
  }).add(...ixs);

  for (const signer of partialSigners) {
    if (signer) {
      tx.partialSign(signer);
    }
  }

  return { tx, hash };
}

export async function signTransaction(invoker: Keypair | SignerWalletAdapter, tx: Transaction): Promise<Transaction> {
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
 * Signs, sends and confirms Transaction
 * Confirmation strategy is not 100% reliable here as in times of congestion there can be a case that tx is executed,
 * but is not in `commitment` state and so it's not considered executed by the `sendAndConfirmRawTransaction` method,
 * and it raises an expiry error even though transaction may be executed soon.
 * So we add additional 50 blocks for checks to account for such issues.
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
  hash: BlockhashWithExpiryBlockHeight,
): Promise<string> {
  const signedTx = await signTransaction(invoker, tx);
  const rawTx = signedTx.serialize();

  if (!hash.lastValidBlockHeight || !signedTx.signature || !hash.blockhash)
    throw Error("Error with transaction parameters.");

  const confirmationStrategy: BlockheightBasedTransactionConfirmationStrategy = {
    lastValidBlockHeight: hash.lastValidBlockHeight + 50,
    signature: bs58.encode(signedTx.signature),
    blockhash: hash.blockhash,
  };
  return sendAndConfirmRawTransaction(connection, rawTx, confirmationStrategy);
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
        const { programId } = await getMintAndProgram(connection, params.mint);
        programIdByMint[mintStr] = programId;
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
 * @returns Unsigned Transaction with create ATA instructions
 */
export async function generateCreateAtaBatchTx(
  connection: Connection,
  payer: PublicKey,
  paramsBatch: AtaParams[],
): Promise<{
  tx: Transaction;
  hash: BlockhashWithExpiryBlockHeight;
}> {
  paramsBatch = await enrichAtaParams(connection, paramsBatch);
  const ixs: TransactionInstruction[] = await Promise.all(
    paramsBatch.map(async ({ mint, owner, programId }) => {
      return createAssociatedTokenAccountInstruction(payer, await ata(mint, owner), owner, mint, programId);
    }),
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
  paramsBatch: AtaParams[],
): Promise<string> {
  const { tx, hash } = await generateCreateAtaBatchTx(
    connection,
    invoker.publicKey!,
    await enrichAtaParams(connection, paramsBatch),
  );
  return signAndExecuteTransaction(connection, invoker, tx, hash);
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
): Promise<{ mint: Mint; programId: PublicKey }> {
  const accountInfo = await connection.getAccountInfo(address, commitment);
  let programId = accountInfo?.owner;
  if (!programId?.equals(TOKEN_PROGRAM_ID) && !programId?.equals(TOKEN_2022_PROGRAM_ID)) {
    programId = TOKEN_PROGRAM_ID;
  }
  return {
    mint: unpackMint(address, accountInfo, programId),
    programId: programId!,
  };
}
