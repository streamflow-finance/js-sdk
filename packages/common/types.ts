import { type TransactionInstruction } from "@solana/web3.js";

export interface ITransactionResult {
  ixs: TransactionInstruction[];
  txId: string;
}

// Utility types
export enum ICluster {
  Mainnet = "mainnet",
  Devnet = "devnet",
  Testnet = "testnet",
  Local = "local",
}

export enum IChain {
  Solana = "Solana",
  Aptos = "Aptos",
  Ethereum = "Ethereum",
  BNB = "BNB",
  Polygon = "Polygon",
  Sui = "Sui",
}

/**
 * Error wrapper for calls made to the contract on chain
 */
export class ContractError extends Error {
  public contractErrorCode: string | null;

  public description: string | null;

  /**
   * Constructs the Error Wrapper
   * @param error Original error raised probably by the chain SDK
   * @param code extracted code from the error if managed to parse it
   */
  constructor(error: Error, code?: string | null, description?: string | null) {
    super(error.message); // Call the base class constructor with the error message
    this.contractErrorCode = code ?? null;
    this.description = description ?? null;
    // Copy properties from the original error
    Object.setPrototypeOf(this, ContractError.prototype);
    this.name = "ContractError"; // Set the name property
    this.stack = error.stack;
  }
}
