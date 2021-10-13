import { BN, Idl, Program, Provider, web3 } from "@project-serum/anchor";
import { Wallet } from "@project-serum/anchor/src/provider";
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionSignature,
} from "@solana/web3.js";
import idl from "./idl";
import { decode } from "./layout";

const PROGRAM_ID = idl.metadata.address; //todo: make optional.

function initProgram(connection: Connection, wallet: Wallet): Program {
  const provider = new Provider(connection, wallet, {});
  return new Program(idl as Idl, PROGRAM_ID, provider);
}

export default class Timelock {
  static async create(
      connection: Connection,
      wallet: Wallet,
      newAcc: Keypair,
      recipient: PublicKey,
      mint: PublicKey,
      depositedAmount: BN,
      start: BN,
      end: BN,
      period: BN,
      cliff: BN,
      cliffAmount: BN
  ): Promise<TransactionSignature> {
    const program = initProgram(connection, wallet);
    const metadata = newAcc;
    const [escrowTokens] = await web3.PublicKey.findProgramAddress(
        [metadata.publicKey.toBuffer()],
        program.programId
    );
    let senderTokens = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        wallet.publicKey
    );
    let signers = [metadata];
    let instructions = undefined;
    if (mint.toBase58() === NATIVE_MINT.toBase58()) {
      //this effectively means new account is created for each wSOL stream, as we can't derive it.
      instructions = [];
      const balanceNeeded = await Token.getMinBalanceRentForExemptAccount(
          connection
      );
      // Create a new account
      const newAccount = Keypair.generate(); //todo this is not an associated token account????

      signers.push(newAccount);

      senderTokens = newAccount.publicKey;
      instructions.push(
          SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: newAccount.publicKey,
            lamports: balanceNeeded,
            space: AccountLayout.span,
            programId: TOKEN_PROGRAM_ID,
          })
      );

      // Send lamports to it (these will be wrapped into native tokens by the token program)
      instructions.push(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: newAccount.publicKey,
            lamports: depositedAmount.toNumber(),
          })
      );

      // Assign the new account to the native token mint.
      // the account will be initialized with a balance equal to the native token balance.
      // (i.e. amount)
      instructions.push(
          Token.createInitAccountInstruction(
              TOKEN_PROGRAM_ID,
              NATIVE_MINT,
              newAccount.publicKey,
              wallet.publicKey
          )
      );
      //TODO: figure out a way to create wrapped SOL account as an associated token account
      //instructions.push(Token.createAssociatedTokenAccountInstruction(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint, newAccount.publicKey, wallet.publicKey, wallet.publicKey))
    }
    const recipientTokens = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        recipient
    );

    return await program.rpc.create(
        // Order of the parameters must match the ones in program
        depositedAmount,
        start,
        end,
        period,
        cliff,
        cliffAmount,
        {
          accounts: {
            sender: wallet.publicKey,
            senderTokens,
            recipient,
            recipientTokens,
            metadata: metadata.publicKey,
            escrowTokens,
            mint,
            rent: SYSVAR_RENT_PUBKEY,
            timelockProgram: program.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          },
          signers,
          instructions,
        }
    );
  }

  //TODO: docs. 0 == max
  static async withdraw(
      connection: Connection,
      wallet: Wallet,
      stream: PublicKey,
      amount: BN
  ): Promise<TransactionSignature> {
    const program = initProgram(connection, wallet);
    const escrow = await connection.getAccountInfo(stream);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info")
    }
    const data = decode(escrow.data);

    return await program.rpc.withdraw(amount, {
      accounts: {
        recipient: wallet.publicKey,
        recipientTokens: data.recipient_tokens,
        metadata: stream,
        escrowTokens: data.escrow_tokens,
        mint: data.mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });
  }

  static async cancel(
      connection: Connection,
      wallet: Wallet,
      stream: PublicKey
  ): Promise<TransactionSignature> {
    const program = initProgram(connection, wallet);
    let escrow_acc = await connection.getAccountInfo(stream);
    if (!escrow_acc?.data) {
      throw new Error("Couldn't get account info")
    }
    let data = decode(escrow_acc?.data);

    return await program.rpc.cancel({
      accounts: {
        sender: wallet.publicKey,
        senderTokens: data.sender_tokens,
        recipient: data.recipient,
        recipientTokens: data.recipient_tokens,
        metadata: stream,
        escrowTokens: data.escrow_tokens,
        tokenProgram: TOKEN_PROGRAM_ID,
        mint: data.mint,
      },
    });
  }

  static async transferRecipient(
      connection: Connection,
      wallet: Wallet,
      stream: PublicKey,
      newRecipient: PublicKey
  ): Promise<TransactionSignature> {
    const program = initProgram(connection, wallet);
    let escrow = await connection.getAccountInfo(stream);
    if (!escrow?.data) {
      throw new Error("Couldn't get account info")
    }
    let data = decode(escrow?.data);

    const mint = data.mint;
    const newRecipientTokens = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        newRecipient
    );

    return await program.rpc.transferRecipient({
      accounts: {
        existingRecipient: wallet.publicKey,
        newRecipient,
        newRecipientTokens,
        metadata: stream,
        escrowTokens: data.escrow_tokens,
        mint,
        rent: SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        system: web3.SystemProgram.programId,
      },
    });
  }
}
