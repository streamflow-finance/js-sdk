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
    // const senderTokens = senderWrappedSOL != null ? senderWrappedSOL : (await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mint, wallet.publicKey));

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
      //console.log("instructions", instructions);
    }
    // console.log('wrappedSOL', senderWrappedSOL.toBase58(), 'senderTokens', senderTokens.toBase58())
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
    //
    // const _escrowTokens = await connection.getAccountInfo(escrowTokens);
    // const _senderTokens = await connection.getAccountInfo(senderTokens);
    //
    // const _metadata = await connection.getAccountInfo(metadata.publicKey);
    // const _escrowTokensData = common.token.parseTokenAccountData(
    //   _escrowTokens?.data
    // );
    // const _senderTokensData = common.token.parseTokenAccountData(
    //   _senderTokens?.data
    // );
    //
    // let strm_data = decode(_metadata?.data);
    // console.log("Stream Data:\n", strm_data.recipient);
    //
    // console.log(
    //   "deposited during contract creation: ",
    //   depositedAmount.toNumber(),
    //   _escrowTokensData.amount
    // );
    //
    // return metadata.publicKey;
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
    const data = decode(escrow?.data);
    // // console.log('recipient tokens', recipientTokens.toBase58())
    // const oldEscrowAta = await connection.getAccountInfo(data.escrow_tokens);
    // const oldEscrowAmount = common.token.parseTokenAccountData(
    //   oldEscrowAta?.data
    // ).amount;
    // const oldRecipientAta = await connection.getAccountInfo(
    //   data.recipient_tokens
    // );
    // const oldRecipientAmount = common.token.parseTokenAccountData(
    //   oldRecipientAta?.data
    // ).amount;
    // // // const withdrawAmount = new BN(0); //0 == MAX
    // console.log(
    //   "recipient",
    //   recipient.toBase58(),
    //   "stream",
    //   stream.toBase58(),
    //   "data",
    //   data,
    //   "amount",
    //   amount
    // );
    // console.log('metadata', metadata.publicKey.toBase58(), 'escrow_ata', escrowTokens.toBase58())
    // console.log('seed', metadata.publicKey.toBuffer())
    // console.log('metadata', metadata.publicKey.toBase58())
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
    //
    // const newEscrowAta = await connection.getAccountInfo(data.escrow_tokens);
    // const newEscrowAmount = common.token.parseTokenAccountData(
    //   newEscrowAta.data
    // ).amount;
    // const newRecipientAta = await connection.getAccountInfo(
    //   data.recipient_tokens
    // );
    // const newRecipientAmount = common.token.parseTokenAccountData(
    //   newRecipientAta.data
    // ).amount;
    // const escrow_new = await connection.getAccountInfo(stream);
    // const data_new = decode(escrow_new.data);
    // console.log(
    //   "depositedAmount",
    //   data.deposited_amount,
    //   "withdrawn",
    //   data.withdrawn
    // );
    // console.log(
    //   "Escrow token balance: previous: ",
    //   oldEscrowAmount,
    //   "after: ",
    //   newEscrowAmount
    // );
    // console.log(
    //   "Recipient token balance: previous: ",
    //   oldRecipientAmount,
    //   "after: ",
    //   newRecipientAmount
    // );
    //
    // console.log(amount.eq(new BN(oldEscrowAmount - newEscrowAmount)));
    // console.log(amount.eq(new BN(newRecipientAmount - oldRecipientAmount)));
    // console.log(data.withdrawn.eq(amount));
  }

  static async cancel(
    connection: Connection,
    wallet: Wallet,
    stream: PublicKey
  ): Promise<TransactionSignature> {
    const program = initProgram(connection, wallet);
    let escrow_acc = await connection.getAccountInfo(stream);
    let data = decode(escrow_acc?.data);
    // const oldSenderAta = await Connection.getAccountInfo(senderTokens)
    // const oldSenderAmount = common.token.parseTokenAccountData(oldSenderAta.data).amount;
    // const oldEscrowAta = await Connection.getAccountInfo(escrowTokens);
    // const oldEscrowAmount = common.token.parseTokenAccountData(oldEscrowAta.data).amount;
    // const oldRecipientAta = await Connection.getAccountInfo(recipientTokens)
    // const oldRecipientAmount = common.token.parseTokenAccountData(oldRecipientAta.data).amount;

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

    // const newEscrowAta = await Connection.getAccountInfo(escrowTokens);
    // const newEscrowAmount = common.token.parseTokenAccountData(newEscrowAta.data).amount;
    // const newRecipientAta = await Connection.getAccountInfo(recipientTokens);
    // const newRecipientAmount = common.token.parseTokenAccountData(newRecipientAta.data).amount;
    // const newSenderAta = await Connection.getAccountInfo(senderTokens)
    // const newSenderAmount = common.token.parseTokenAccountData(newSenderAta.data).amount
    // const escrow = await Connection.getAccountInfo(metadata.publicKey);

    // console.log("cancelled");
    // console.log('deposited', depositedAmount.toNumber(), 'old sender', oldSenderAmount, 'old recipient', oldRecipientAmount, 'old escrow', oldEscrowAmount)
    // console.log('deposited', depositedAmount.toNumber(), 'sender', newSenderAmount, 'recipient', newRecipientAmount, 'escrow', newEscrowAmount)
  }

  static async transferRecipient(
    connection: Connection,
    wallet: Wallet,
    stream: PublicKey,
    newRecipient: PublicKey
  ): Promise<TransactionSignature> {
    const program = initProgram(connection, wallet);
    let escrow = await connection.getAccountInfo(stream);
    let data = decode(escrow?.data);

    const mint = data.mint;
    const oldRecipient = data.recipient;
    const oldRecipientTokens = data.recipient_tokens;
    // const newRecipient = Keypair.generate();
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

    // console.log("Update recipient success.");
    // escrow = await connection.getAccountInfo(stream);
    // data = decode(escrow.data);
    // const escrowNewRecipient = data.recipient;
    // console.log(
    //   "Transfer: old recipient:",
    //   oldRecipient.toBase58(),
    //   "new recipient: ",
    //   escrowNewRecipient.toBase58()
    // );
    // console.log(
    //   "Transfer: old recipient:",
    //   wallet.publicKey.toBase58(),
    //   "new recipient: ",
    //   newRecipient.toBase58()
    // );
    // console.log(
    //   "old recipient tokens:",
    //   oldRecipientTokens.toBase58(),
    //   "new recipient tokens: ",
    //   newRecipientTokens.toBase58(),
    //   "new recipient tokens",
    //   data.recipient_tokens.toBase58()
    // );
  }
}
