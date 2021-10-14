const assert = require("assert");
const BufferLayout = require("buffer-layout");
const anchor = require("@project-serum/anchor");
const common = require("@project-serum/common");
const {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  u64,
  NATIVE_MINT,
} = require("@solana/spl-token");
const {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  Connection,
  LAMPORTS_PER_SOL,
} = require("@solana/web3.js");
const { utils } = require("@project-serum/anchor");
const { token } = require("@project-serum/common");
const { decode } = require("./layout");
const { SystemProgram, Keypair } = anchor.web3;
const { BN } = anchor;

// The stream recipient main wallet
const recipient = Keypair.generate();

describe("timelock", () => {
  const provider = anchor.Provider.local(); //todo use env()
  anchor.setProvider(provider);

  const program = anchor.workspace.Timelock;
  const sender = provider.wallet;
  const metadata = Keypair.generate();
  const MINT_DECIMALS = 8;
  let escrowTokens;
  let recipientTokens;
  let nonce;
  let mint;
  let senderTokens;

  // Divide by 1000 since Unix timestamp is seconds
  const start = new BN(+new Date() / 1000 + 5);
  // +60 seconds
  const end = new BN(+new Date() / 1000 + 60);
  // In seconds
  const period = new BN(2);
  // Amount to deposit
  // const depositedAmount = new BN(1337_000_000);
  const depositedAmount = new BN(1 * LAMPORTS_PER_SOL);
  //const depositedAmount = new BN(133769 * 10 ** MINT_DECIMALS);

  it("Initialize test state", async () => {
    [mint, senderTokens] = await common.createMintAndVault(
      provider,
      new anchor.BN(100_000_000_000),
      undefined,
      MINT_DECIMALS
    );
    mint = NATIVE_MINT;
    //senderTokens = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, NATIVE_MINT, sender.publicKey);

    const oldBalance = await provider.connection.getBalance(sender.publicKey);
    senderTokens = await Token.createWrappedNativeAccount(
      provider.connection,
      TOKEN_PROGRAM_ID,
      sender.publicKey,
      sender.payer,
      10 * LAMPORTS_PER_SOL
    ); //todo check for Number overflow here.
    const senderTokensData = common.token.parseTokenAccountData(
      (await program.provider.connection.getAccountInfo(senderTokens)).data
    );
    const newBalance = await provider.connection.getBalance(sender.publicKey);
    console.log(
      "spent for creating wrapped SOL account\n",
      oldBalance - newBalance
    );

    console.log("Sender Tokens:");
    console.log(
      "account",
      senderTokens.toBase58(),
      "mint",
      senderTokensData.mint.toBase58(),
      "amount",
      senderTokensData.amount / LAMPORTS_PER_SOL,
      "owner",
      senderTokensData.owner.toBase58(),
      senderTokensData.owner.toBase58() === sender.publicKey.toBase58()
    );

    [escrowTokens, nonce] = await PublicKey.findProgramAddress(
      [metadata.publicKey.toBuffer()],
      program.programId
    );

    recipientTokens = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      recipient.publicKey
    );

    console.log("Accounts:");
    console.log("sender wallet:", sender.publicKey.toBase58());
    console.log("sender tokens:", senderTokens.toBase58());
    console.log("escrow (metadata):", metadata.publicKey.toBase58());
    console.log("escrow tokens:", escrowTokens.toBase58());
    console.log("recipient wallet:", recipient.publicKey.toBase58());
    console.log("recipient tokens:", recipientTokens.toBase58());
    console.log("mint:", mint.toBase58());
  });

  it("Create Vesting Contract w/out the cliff", async () => {
    console.log("\n\n");
    console.log("metadata:", metadata.publicKey.toBase58());
    console.log("buffer:", metadata.publicKey.toBuffer());

    const tx = await program.rpc.create(
      // Order of the parameters must match the ones in the program
      depositedAmount,
      start,
      end,
      period,
      new BN(0), //cliff
      new BN(0), //cliff amount
      {
        accounts: {
          sender: sender.publicKey,
          senderTokens,
          recipient: recipient.publicKey,
          recipientTokens,
          metadata: metadata.publicKey,
          escrowTokens,
          mint,
          rent: SYSVAR_RENT_PUBKEY,
          timelockProgram: program.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        },
        signers: [metadata],
      }
    );

    const _escrowTokens = await program.provider.connection.getAccountInfo(
      escrowTokens
    );
    const _senderTokens = await program.provider.connection.getAccountInfo(
      senderTokens
    );

    const _metadata = await program.provider.connection.getAccountInfo(
      metadata.publicKey
    );
    const _escrowTokensData = common.token.parseTokenAccountData(
      _escrowTokens.data
    );
    const _senderTokensData = common.token.parseTokenAccountData(
      _senderTokens.data
    );

    let strm_data = decode(_metadata.data);
    console.log("Raw data:\n", _metadata.data);
    console.log("Stream Data:\n", strm_data.recipient);

    console.log(
      "deposited during contract creation: ",
      depositedAmount.toNumber(),
      _escrowTokensData.amount
    );

    assert.ok(depositedAmount.toNumber() === _escrowTokensData.amount);
  });

  it("Withdraws from a contract", async () => {
    setTimeout(async () => {
      console.log("\n\n");
      console.log("recipient tokens", recipientTokens.toBase58());
      const oldEscrowAta = await program.provider.connection.getAccountInfo(
        escrowTokens
      );
      const oldEscrowAmount = common.token.parseTokenAccountData(
        oldEscrowAta.data
      ).amount;
      const oldRecipientAta = await program.provider.connection.getAccountInfo(
        recipientTokens
      );
      const oldRecipientAmount = common.token.parseTokenAccountData(
        oldRecipientAta.data
      ).amount;
      const withdrawAmount = new BN(0); //0 == MAX

      console.log(
        "metadata",
        metadata.publicKey.toBase58(),
        "escrow_ata",
        escrowTokens.toBase58()
      );
      console.log("seed", metadata.publicKey.toBuffer());
      console.log("metadata", metadata.publicKey.toBase58());
      await program.rpc.withdraw(withdrawAmount, {
        accounts: {
          recipient: recipient.publicKey,
          recipientTokens,
          metadata: metadata.publicKey,
          escrowTokens,
          mint,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [recipient],
      });

      const newEscrowAta = await program.provider.connection.getAccountInfo(
        escrowTokens
      );
      const newEscrowAmount = common.token.parseTokenAccountData(
        newEscrowAta.data
      ).amount;
      const newRecipientAta = await program.provider.connection.getAccountInfo(
        recipientTokens
      );
      const newRecipientAmount = common.token.parseTokenAccountData(
        newRecipientAta.data
      ).amount;
      const escrow = await program.provider.connection.getAccountInfo(
        metadata.publicKey
      );
      const data = decode(escrow.data);

      console.log(
        "depositedAmount",
        depositedAmount.toNumber(),
        "withdrawn",
        withdrawAmount
      );
      console.log(
        "Escrow token balance: previous: ",
        oldEscrowAmount,
        "after: ",
        newEscrowAmount
      );
      console.log(
        "Recipient token balance: previous: ",
        oldRecipientAmount,
        "after: ",
        newRecipientAmount
      );
      assert.ok(withdrawAmount.eq(new BN(oldEscrowAmount - newEscrowAmount)));
      assert.ok(
        withdrawAmount.eq(new BN(newRecipientAmount - oldRecipientAmount))
      );
      assert.ok(data.withdrawn.eq(withdrawAmount));
    }, 3100);
  });
  //
  // it("Cancels the stream", async () => {
  //     setTimeout(async () => {
  //         console.log('\n\n');
  //         const oldSenderAta = await program.provider.connection.getAccountInfo(senderTokens)
  //         const oldSenderAmount = common.token.parseTokenAccountData(oldSenderAta.data).amount;
  //         const oldEscrowAta = await program.provider.connection.getAccountInfo(escrowTokens);
  //         const oldEscrowAmount = common.token.parseTokenAccountData(oldEscrowAta.data).amount;
  //         const oldRecipientAta = await program.provider.connection.getAccountInfo(recipientTokens)
  //         const oldRecipientAmount = common.token.parseTokenAccountData(oldRecipientAta.data).amount;
  //
  //         await program.rpc.cancel({
  //             accounts: {
  //                 sender: sender.publicKey,
  //                 senderTokens,
  //                 recipient: recipient.publicKey,
  //                 recipientTokens,
  //                 metadata: metadata.publicKey,
  //                 escrowTokens,
  //                 tokenProgram: TOKEN_PROGRAM_ID,
  //                 mint,
  //             }, signers: [sender.payer]
  //         })
  //
  //         const newEscrowAta = await program.provider.connection.getAccountInfo(escrowTokens);
  //         const newEscrowAmount = common.token.parseTokenAccountData(newEscrowAta.data).amount;
  //         const newRecipientAta = await program.provider.connection.getAccountInfo(recipientTokens);
  //         const newRecipientAmount = common.token.parseTokenAccountData(newRecipientAta.data).amount;
  //         const newSenderAta = await program.provider.connection.getAccountInfo(senderTokens)
  //         const newSenderAmount = common.token.parseTokenAccountData(newSenderAta.data).amount
  //         const escrow = await program.provider.connection.getAccountInfo(metadata.publicKey);
  //
  //
  //         console.log('cancel:');
  //         console.log('deposited', depositedAmount.toNumber(), 'old sender', oldSenderAmount, 'old recipient', oldRecipientAmount, 'old escrow', oldEscrowAmount)
  //         console.log('deposited', depositedAmount.toNumber(), 'sender', newSenderAmount, 'recipient', newRecipientAmount, 'escrow', newEscrowAmount)
  //         assert.ok(newEscrowAmount === 0)
  //         assert.ok(decode(escrow.data).amount.eq(0))
  //         assert.ok(newRecipientAmount.add(newSenderAmount).eq(depositedAmount))
  //
  //     }, 8700);
  // });

  it("Transfers vesting contract recipient", async () => {
    console.log("\n\n");
    let escrow = await program.provider.connection.getAccountInfo(
      metadata.publicKey
    );
    const oldRecipient = decode(escrow.data).recipient;
    const newRecipient = Keypair.generate();
    const newRecipientTokens = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      newRecipient.publicKey
    );

    //airdrop
    const tx = await program.provider.connection.requestAirdrop(
      recipient.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    console.log(
      "balance: ",
      await program.provider.connection.getBalance(recipient.publicKey)
    );
    console.log("tx: ", tx);
    console.log("Transfer:");

    //wait for the airdrop
    setTimeout(async () => {
      console.log(
        "balance: ",
        await program.provider.connection.getBalance(recipient.publicKey)
      );
      console.log(
        "new recipient",
        newRecipient.publicKey.toBase58(),
        "new recipient ata:",
        newRecipientTokens.toBase58()
      );

      await program.rpc.transfer_recipient({
        accounts: {
          existingRecipient: recipient.publicKey,
          newRecipient: newRecipient.publicKey,
          newRecipientTokens,
          metadata: metadata.publicKey,
          escrowTokens,
          mint,
          rent: SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          system: SystemProgram.programId,
          // timelockProgram: program.programId,
        },
        signers: [recipient],
      });
      console.log("Update recipient success.");
      escrow = await program.provider.connection.getAccountInfo(
        metadata.publicKey
      );
      console.log("parsed", decode(escrow.data));
      const escrowNewRecipient = decode(escrow.data).recipient;
      console.log(
        "Transfer: old recipient:",
        oldRecipient.toBase58(),
        "new recipient: ",
        escrowNewRecipient.toBase58()
      );
      console.log(
        "Transfer: old recipient:",
        recipient.publicKey.toBase58(),
        "new recipient: ",
        newRecipient.publicKey.toBase58()
      );
      console.log(
        "old recipient tokens:",
        recipientTokens.toBase58(),
        "new recipient tokens: ",
        newRecipientTokens.toBase58(),
        "new recipient tokens",
        escrowNewRecipient.recipient_tokens.toBase58()
      );
      assert.ok(oldRecipient !== escrowNewRecipient);
      assert.ok(
        escrowNewRecipient.toBase58() === newRecipient.publicKey.toBase58()
      );
      await provider.connection.getBalance(sender.publicKey);
    }, 4000);
  });
});
