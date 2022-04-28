import { BN, Program, Provider } from "@project-serum/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { Idl } from "@project-serum/anchor/dist/cjs/idl";
import type { TransactionSignature } from "@solana/web3.js";

import airdrop from "./idl/airdrop";
import { AIRDROP_TEST_TOKEN } from "./constants";
import { Wallet } from "@project-serum/anchor";

const PROGRAM_ID = "Ek6Jpdv5iEEDLXTVQ8UFcntms3DT2ewHtzzwH2R5MpvN";

function initProgram(connection: Connection, wallet: Wallet): Program {
  const provider = new Provider(connection, wallet, {});
  return new Program(airdrop as Idl, PROGRAM_ID, provider);
}

export async function initialize(
  connection: Connection,
  wallet: Wallet
): Promise<boolean> {
  const program = initProgram(connection, wallet);
  const mint = new PublicKey(AIRDROP_TEST_TOKEN);
  const airdropAccount = new Keypair();

  const assTokenAccount = (
    await connection?.getTokenAccountsByOwner(wallet?.publicKey as PublicKey, {
      mint: mint,
    })
  ).value[0].pubkey;

  const assAirdropTokAcc = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    airdropAccount.publicKey
  );

  const instr = Token.createAssociatedTokenAccountInstruction(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    assAirdropTokAcc,
    airdropAccount.publicKey,
    wallet.publicKey
  );

  try {
    await program.rpc.initializeAirdrop(
      new BN(1000000 * 10 ** 9),
      new BN(100 * 10 ** 9),
      {
        accounts: {
          initializer: wallet?.publicKey,
          initializerDepositTokenAccount: assTokenAccount,
          airdropAccount: airdropAccount.publicKey,
          airdropTokenAccount: assAirdropTokAcc,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [airdropAccount],
        instructions: [instr],
      }
    );
    return true;
  } catch (err: any) {
    return false;
  }
}

export async function getTestTokenAirdrop(
  connection: Connection,
  wallet: Wallet
): Promise<TransactionSignature> {
  const program = initProgram(connection, wallet);
  const mint = new PublicKey(AIRDROP_TEST_TOKEN);
  const airdropAccount = (
    await connection?.getProgramAccounts(new PublicKey(PROGRAM_ID))
  )[0];

  const assTokenAcc = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    wallet.publicKey
  );

  const pda = (await connection?.getProgramAccounts(program.programId))[0]
    .pubkey;

  const [_pda] = await PublicKey.findProgramAddress(
    [Buffer.from("streamflow-airdrop", "utf-8")],
    program.programId
  );

  const assAirdropTokAcc = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    pda
  );

  try {
    const tx = await program.rpc.getAirdrop({
      accounts: {
        taker: wallet?.publicKey,
        takerReceiveTokenAccount: assTokenAcc,
        airdropAccount: airdropAccount.pubkey,
        airdropTokenAccount: assAirdropTokAcc,
        mint,
        pdaAccount: _pda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
    });
    return tx;
  } catch (err: any) {
    throw new Error(err);
  }
}

export async function cancel(
  connection: Connection,
  wallet: Wallet
): Promise<boolean> {
  const program = initProgram(connection, wallet);
  const mint = new PublicKey(AIRDROP_TEST_TOKEN);

  const airdropAccount = (
    await connection?.getProgramAccounts(new PublicKey(PROGRAM_ID))
  )[0];

  const assTokenAcc = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    wallet.publicKey
  );

  const pda = (await connection?.getProgramAccounts(program.programId))[0]
    .pubkey;

  const [_pda] = await PublicKey.findProgramAddress(
    [Buffer.from("streamflow-airdrop", "utf-8")],
    program.programId
  );

  const assAirdropTokAcc = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    pda
  );

  // console.log("wallet", wallet?.publicKey?.toString());
  // console.log("associated STRM token", assTokenAcc.toString());
  // console.log("airdrop account", airdropAccount.pubkey.toString());
  // console.log("pda", pda.toString());
  // console.log("_pda", _pda.toString());
  // console.log("program", program.programId.toString());

  try {
    await program.rpc.cancelAirdrop({
      accounts: {
        initializer: wallet?.publicKey,
        initializerDepositTokenAccount: assTokenAcc,
        pdaAccount: _pda,
        airdropAccount: airdropAccount.pubkey,
        airdropTokenAccount: assAirdropTokAcc,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });

    return true;
  } catch (err: any) {
    return false;
  }
}
