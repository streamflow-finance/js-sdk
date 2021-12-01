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

/* Test IDL
const idl = require("../packages/timelock/dist/idl");
function initProgram(connection, wallet, timelockProgramId) {
  var provider = new anchor.Provider(connection, wallet, {});
  return new anchor.Program(idl.default, timelockProgramId, provider);
}
*/

// The stream recipient main wallet
const recipient = Keypair.generate();

describe("timelock", () => {
  const provider = anchor.Provider.env();
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
  let start = new BN(+new Date() / 1000 + 4);
  // +60 seconds
  let end = new BN(+new Date() / 1000 + 60);
  // In seconds
  const period = new BN(1);
  // Amount to deposit
  // const depositedAmount = new BN(1337_000_000);
  const depositedAmount = new BN(1 * LAMPORTS_PER_SOL);

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
      start,
      end,
      depositedAmount,
      depositedAmount,
      period,
      new BN(0), //cliff
      new BN(0), //cliff amount 
      true, // cancelable_by_sender,
      false, // cancelable_by_recipient,
      false, //nwithdrawal_public,
      false, //transferable,
      new BN(0), // release rate (when > 0 - recurring payment)
      "Stream NewStream NewStream New", // stream name
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
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
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
    console.log("Stream Data:\n", strm_data);
    

    console.log(
      "deposited during contract creation: ",
      depositedAmount.toNumber(),
      "saved in deposit data",
      strm_data.deposited_amount,
      "Escrow tokens balance",
      _escrowTokensData.amount
    );

    let bytesStreamName = new TextEncoder().encode(strm_data.stream_name);
    bytesStreamName = bytesStreamName.slice(4).filter(x => x !== 0);
    let stream_name =  new TextDecoder().decode(bytesStreamName);
    console.log("Stream name: ", stream_name);
    console.log("Bytes literal: ", (new TextEncoder().encode('Stream NewStream NewStream New')).length);
    console.log("Bytes solana string: ", (new TextEncoder().encode(strm_data.stream_name)).length);
    assert.ok(stream_name === "Stream NewStream NewStream New");
    assert.ok(depositedAmount.toNumber() === _escrowTokensData.amount);
    assert.ok(depositedAmount.toNumber() === strm_data.deposited_amount.toNumber());
  }).timeout(4000);

  it("Tops up stream", async () => {
      console.log("Top up:\n");
      const oldEscrowAta = await program.provider.connection.getAccountInfo(
        escrowTokens
      );
      const oldEscrowAmount = common.token.parseTokenAccountData(
        oldEscrowAta.data
      ).amount;
      const topupAmount = new BN(1 * LAMPORTS_PER_SOL); //1e9 or 10Tokens with 8 decimals

      const old_metadata = await program.provider.connection.getAccountInfo(
        metadata.publicKey
      );
      let old_strm_data = decode(old_metadata.data);

      console.log("Stream Data:\n", old_strm_data);

      console.log(
        "Old escrow amount",
        oldEscrowAmount
      );
      // console.log("\nseed", metadata.publicKey.toBuffer());
      // console.log("metadata", metadata.publicKey.toBase58());
      await program.rpc.topup(topupAmount, {
        accounts: {
          sender: sender.publicKey,
          senderTokens,
          metadata: metadata.publicKey,
          escrowTokens,
          mint,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [sender.payer],
      });
      const _metadata = await program.provider.connection.getAccountInfo(
        metadata.publicKey
      );
      let metadata_data = decode(_metadata.data);

      let newEscrowAmount = null;
      const newEscrowAta = await program.provider.connection.getAccountInfo(
        escrowTokens
      );

      if (newEscrowAta) {
        newEscrowAmount = common.token.parseTokenAccountData(
          newEscrowAta.data
        ).amount;
      }
      console.log(
        "depositedAmount",
        metadata_data.deposited_amount.toNumber(),
      );
      console.log(
        "Escrow token balance: previous: ",
        oldEscrowAmount,
        "after: ",
        newEscrowAmount
      );
      console.log(
        "Deposited amount",
        metadata_data.deposited_amount.toNumber(),
        "Old deposited amount",
        old_strm_data.deposited_amount.toNumber(),
      )
      // New state on token acc
      assert.ok(
        topupAmount.eq(new BN(newEscrowAmount - oldEscrowAmount))
      );
      /*
      // New state in data acc
      assert.ok(
        metadata_data.deposited_amount.eq(topupAmount + old_strm_data.deposited_amount)
      );
      */
  }).timeout(6000);

  it("Withdraws from a contract", async () => { // With set time out it didn't catch errors???
      console.log("Withdraw:\n");
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
          withdrawAuthority: recipient.publicKey,
          sender: sender.publicKey,
          recipient: recipient.publicKey,
          recipientTokens,
          metadata: metadata.publicKey,
          escrowTokens,
          mint,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [recipient],
      });
      const _metadata = await program.provider.connection.getAccountInfo(
        metadata.publicKey
      );
      let strm_data = decode(_metadata.data);
      console.log("Stream Data:\n", strm_data);

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

      let newEscrowAmount = null;
      const newEscrowAta = await program.provider.connection.getAccountInfo(
        escrowTokens
      );

      if (newEscrowAta) {
        newEscrowAmount = common.token.parseTokenAccountData(
          newEscrowAta.data
        ).amount;
      }
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
      assert.ok(
        withdrawAmount.eq(new BN(oldEscrowAmount - newEscrowAmount))
      );
      assert.ok(
        withdrawAmount.eq(new BN(newRecipientAmount - oldRecipientAmount))
      );
      assert.ok(data.withdrawn_amount.eq(withdrawAmount));
  }).timeout(6000);
 
  it("Transfers vesting contract recipient", async () => {
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
      "\nTransfer:\n"
      // "SOL balance: ",
      // await program.provider.connection.getBalance(recipient.publicKey)
    );

    console.log("old recipient", oldRecipient.toBase58());
    console.log(
      "new recipient",
      newRecipient.publicKey.toBase58(),
      "new recipient ata:",
      newRecipientTokens.toBase58()
    );

    console.log("Program RPC:", JSON.stringify(program.rpc));
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
  }).timeout(10000);

  
  it("Cancels the stream", async () => {
    const oldBalance = await provider.connection.getBalance(sender.publicKey);
      console.log("\nCancel:\n");
      const oldSenderAta = await program.provider.connection.getAccountInfo(
        senderTokens
      );
      const oldSenderAmount = common.token.parseTokenAccountData(
        oldSenderAta.data
      ).amount;
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

      await program.rpc.cancel({
        accounts: {
          cancelAuthority: sender.publicKey,
          sender: sender.publicKey,
          senderTokens,
          recipient: recipient.publicKey,
          recipientTokens,
          metadata: metadata.publicKey,
          escrowTokens,
          mint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
        signers: [sender.payer],
      });
      const _metadata = await program.provider.connection.getAccountInfo(
        metadata.publicKey
      );
      let strm_data = decode(_metadata.data);
      console.log("Stream Data:\n", strm_data);

      let newEscrowAmount = 0; // It will stay 0 if closed
      const newEscrowAta = await program.provider.connection.getAccountInfo(
        escrowTokens
      );
      if (newEscrowAta) {
        newEscrowAmount = common.token.parseTokenAccountData(
          newEscrowAta.data
        ).amount;
      }
      const newRecipientAta = await program.provider.connection.getAccountInfo(
        recipientTokens
      );
      const newRecipientAmount = common.token.parseTokenAccountData(
        newRecipientAta.data
      ).amount;
      const newSenderAta = await program.provider.connection.getAccountInfo(
        senderTokens
      );
      const newSenderAmount = common.token.parseTokenAccountData(
        newSenderAta.data
      ).amount;


      console.log("cancel:");
      console.log(
        "old sender",
        oldSenderAmount,
        "old recipient",
        oldRecipientAmount,
        "old escrow",
        oldEscrowAmount
      );
      console.log(
        "new sender",
        newSenderAmount,
        "new recipient",
        newRecipientAmount,
        "new escrow:",
        newEscrowAmount,
        "deposited amount",
        depositedAmount.toNumber()
      );
      const newBalance = await provider.connection.getBalance(sender.publicKey);
      console.log("Returned:", newBalance - oldBalance);
      assert.ok(newEscrowAmount === 0);
      // assert.ok(decode(escrow.data).amount.eq(0));
      assert.ok((newRecipientAmount + newSenderAmount - oldSenderAmount) === oldEscrowAmount);
  }).timeout(8000);

  it("Creates recurring", async () => {
    console.log("\nRecurring");

    const metadata = Keypair.generate();
    [escrowTokens, nonce] = await PublicKey.findProgramAddress(
      [metadata.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.rpc.create(
      // Order of the parameters must match the ones in the program
      start,
      end,
      depositedAmount,
      depositedAmount,
      new BN(10), // period
      new BN(0), //cliff
      new BN(0), //cliff amount
      true, // cancelable_by_sender,
      false, // cancelable_by_recipient,
      false, //nwithdrawal_public,
      false, //transferable,
      new BN(100), // release rate
      "Stream", // stream name
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
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
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

    console.log("Stream Data:\n", strm_data);
    
    assert.ok(depositedAmount.toNumber() === _escrowTokensData.amount);
    assert.ok(strm_data.period.eq(new BN(10)));
    assert.ok(strm_data.release_rate.eq(new BN(100)));

    // assert.ok(strm_data.period === new BN(10));

  }).timeout(6000);


});
