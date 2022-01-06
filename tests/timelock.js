const assert = require("assert");
const anchor = require("@project-serum/anchor");
const common = require("@project-serum/common");
const {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
} = require("@solana/spl-token");
const {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL,
} = require("@solana/web3.js");
const { decode } = require("./layout");
const { SystemProgram, Keypair } = anchor.web3;
const { BN } = anchor;
const u64_MAX = new BN(2).pow(new BN(64)).subn(1);

// The stream recipient main wallet
const recipient = Keypair.generate();

const STREAMFLOW_TREASURY = new PublicKey(
  "Ht5G1RhkcKnpLVLMhqJc5aqZ4wYUEbxbtZwGCVbgU7DL"
);

describe("timelock", () => {
  //need explanation? rly?
  beforeEach((done) => setTimeout(done, 1500));

  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Timelock;
  const sender = provider.wallet;

  const metadata = Keypair.generate();
  const streamNotTopupable = Keypair.generate();
  const MINT_DECIMALS = 8;
  let escrowTokens;
  let recipientTokens;
  let streamflowTreasuryTokens;
  let mint;
  let token;
  let senderTokens;
  let vault;
  let createParams;
  let createAccounts;

  // Divide by 1000 to convert milliseconds to Unix timestamp (seconds)
  let start = new BN(+new Date() / 1000 + 5); //add several seconds to make sure this time is not in the past at the time of program invocation.
  // +60 seconds
  let end = new BN(+new Date() / 1000 + 60);
  // In seconds
  const period = new BN(1);
  // Amount to deposit
  // const depositedAmount = new BN(1337_000_000);
  const depositedAmount = new BN(10000);

  it("Initialize test state", async () => {
    [mint, vault] = await common.createMintAndVault(
      provider,
      new anchor.BN(100_000_000_000),
      undefined,
      MINT_DECIMALS
    );

    const token = new Token(
      provider.connection,
      mint,
      TOKEN_PROGRAM_ID,
      provider.wallet.payer
    );

    senderTokens = await token.createAssociatedTokenAccount(sender.publicKey);

    await token.transfer(
      vault,
      senderTokens,
      sender.publicKey,
      [sender],
      100_000
    );

    [escrowTokens] = await PublicKey.findProgramAddress(
      [Buffer("strm"), metadata.publicKey.toBuffer()],
      program.programId
    );

    recipientTokens = await ata(mint, recipient.publicKey);

    streamflowTreasuryTokens = await ata(mint, STREAMFLOW_TREASURY);

    // airdrop to receiver, we'll need it later for transfer recipient fees
    let tx = await program.provider.connection.requestAirdrop(
      recipient.publicKey,
      LAMPORTS_PER_SOL
    );

    createParams = {
      startTime: start,
      netDepositedAmount: depositedAmount,
      period: period,
      amountPerPeriod: new BN(4), // amount_per_period
      cliff: start, // cliff
      cliffAmount: new BN(1), // cliff amount
      cancelableBySender: true, // cancelable_by_sender,
      cancelableByRecipient: false, // cancelable_by_recipient,
      automaticWithdrawal: false, // automatic_withdrawal,
      transferableBySender: true, // transferable by sender,
      transferableByRecipient: true, // transferable by recipient,
      canTopup: true, // can_topup - TODO: TEST FALSE
      streamName: "Test", // stream name - use TextEncoder and Decoder for string (stream_name) manipulation?
    };

    createAccounts = {
      sender: sender.publicKey,
      senderTokens,
      recipient: recipient.publicKey,
      metadata: metadata.publicKey,
      recipientTokens,
      escrowTokens,
      mint,
      rent: SYSVAR_RENT_PUBKEY,
      timelockProgram: program.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      streamflowTreasury: STREAMFLOW_TREASURY,
      streamflowTreasuryTokens: streamflowTreasuryTokens,
      partner: STREAMFLOW_TREASURY,
      partnerTokens: streamflowTreasuryTokens,
      feeOracle: STREAMFLOW_TREASURY,
    };

    // console.log("Initialization ready.");
    // console.log("Accounts:");
    // console.log("sender wallet:", sender.publicKey.toBase58());
    // console.log("sender tokens:", senderTokens.toBase58());
    // console.log("escrow (metadata):", metadata.publicKey.toBase58());
    // console.log("escrow tokens:", escrowTokens.toBase58());
    // console.log("recipient wallet:", recipient.publicKey.toBase58());
    // console.log("recipient tokens:", recipientTokens.toBase58());
    // console.log("mint:", mint.toBase58());
  });

  it("Creates a stream", async () => {
    console.log("*** CREATE ***");
    const senderTokensAmountBefore = await getTokenAmount(senderTokens);
    await createStream(createParams, createAccounts, [metadata]);

    const contract = await getMetadata(metadata.publicKey);
    const escrowTokensAmount = await getTokenAmount(escrowTokens);
    const senderTokensAmountAfter = await getTokenAmount(senderTokens);

    const { net_deposited_amount, streamflow_fee_total, partner_fee_total } =
      contract;

    const depositedAmountNum = depositedAmount.toNumber();
    console.table({ depositedAmountNum, escrowTokensAmount });

    assert.ok(
      escrowTokensAmount ===
        net_deposited_amount
          .add(streamflow_fee_total)
          .add(partner_fee_total)
          .toNumber()
    );
    assert.ok(
      depositedAmount.toNumber() === contract.net_deposited_amount.toNumber()
    );
    assert.ok(
      senderTokensAmountBefore === senderTokensAmountAfter + escrowTokensAmount
    );
  });

  it("Top-ups the original stream", async () => {
    console.log("*** TOP UP ***");
    timePassed();
    const escrowAmountBefore = await getTokenAmount(escrowTokens);
    const topupAmount = new BN(10000);

    let contract = await getMetadata(metadata.publicKey);
    const netDepositedAmountBefore = contract.net_deposited_amount;

    await program.rpc.topup(topupAmount, {
      accounts: {
        sender: sender.publicKey,
        senderTokens,
        metadata: metadata.publicKey,
        escrowTokens,
        streamflowTreasury: STREAMFLOW_TREASURY,
        streamflowTreasuryTokens: streamflowTreasuryTokens,
        partner: STREAMFLOW_TREASURY,
        partnerTokens: streamflowTreasuryTokens,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [sender.payer],
    });

    contract = await getMetadata(metadata.publicKey);

    let escrowAmountAfter = await getTokenAmount(escrowTokens);
    const grossAmount = contract.net_deposited_amount
      .add(contract.streamflow_fee_total)
      .add(contract.partner_fee_total);

    console.table({
      topup: topupAmount.toNumber(),
      escrowAmountBefore,
      escrowAmountAfter,
      netDepositedAmountBefore: netDepositedAmountBefore.toNumber(),
      netDepositedAmountAfter: contract.net_deposited_amount.toNumber(),
      gross: grossAmount.toNumber(),
    });
    assert.ok(
      contract.net_deposited_amount.eq(
        netDepositedAmountBefore.add(topupAmount)
      )
    );
    assert.ok(escrowAmountAfter === grossAmount.toNumber());
  });

  it("Withdraws specific amount of available tokens (10) from a contract", async () => {
    console.log("*** WITHDRAW ***");
    timePassed();

    let contract = await getMetadata(metadata.publicKey);
    const netDepositedAmountBefore = contract.net_deposited_amount;
    const escrowAmountBefore = await getTokenAmount(escrowTokens);
    const recipientAmountBefore = await getTokenAmount(recipientTokens);
    const withdrawAmount = new BN(9);
    //const withdrawAmount = new BN(2).pow(new BN(64)).subn(1); //MAXXXX

    await program.rpc.withdraw(withdrawAmount, {
      accounts: {
        authority: recipient.publicKey,
        recipient: recipient.publicKey,
        recipientTokens,
        metadata: metadata.publicKey,
        escrowTokens,
        streamflowTreasury: STREAMFLOW_TREASURY,
        streamflowTreasuryTokens: streamflowTreasuryTokens,
        partner: STREAMFLOW_TREASURY,
        partnerTokens: streamflowTreasuryTokens,
        feeOracle: STREAMFLOW_TREASURY,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [recipient],
    });
    contract = await getMetadata(metadata.publicKey);
    const recipientAmountAfter = await getTokenAmount(recipientTokens);
    const escrowAmountAfter = await getTokenAmount(escrowTokens);
    //todo: strm & partner treasury before & after
    console.table({
      withdrawing: withdrawAmount,
      escrowAmountBefore,
      escrowAmountAfter,
      recipientAmountBefore,
      recipientAmountAfter,
      netDepositedAmountBefore: netDepositedAmountBefore.toNumber(),
      netDepositedAmountAfter: contract.net_deposited_amount.toNumber(),
      "withdrawn (in contract)": contract.withdrawn_amount.toNumber(),
    });

    assert.ok(
      withdrawAmount.eq(new BN(escrowAmountBefore - escrowAmountAfter))
    );

    assert.ok(
      withdrawAmount.eq(new BN(recipientAmountAfter - recipientAmountBefore))
    );
    assert.ok(contract.withdrawn_amount.eq(withdrawAmount));
  });

  it("Transfers vesting contract recipient", async () => {
    console.log("*** TRANSFER ***");
    timePassed();

    let contract = await getMetadata(metadata.publicKey);
    const recipientBefore = contract.recipient.toBase58();
    const recipientTokensBefore = contract.recipient_tokens.toBase58();
    let newRecipient = Keypair.generate();
    let newRecipientTokens = await ata(mint, newRecipient.publicKey);

    await program.rpc.transferRecipient({
      accounts: {
        authority: recipient.publicKey, // Authorized wallet
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
    contract = await getMetadata(metadata.publicKey);
    let recipientAfter = contract.recipient.toBase58();
    let recipientTokensAfter = contract.recipient_tokens.toBase58();
    console.table({
      recipientBefore,
      recipientTokensBefore,
      recipientAfter,
      newRecipient: newRecipient.publicKey.toBase58(),
      recipientTokensAfter: recipientTokensAfter.toString(),
      newRecipientTokens: newRecipientTokens.toString(),
    });

    assert.ok(recipientAfter !== recipientBefore);
    assert.ok(recipientAfter === newRecipient.publicKey.toBase58());
    assert.ok(recipientTokensAfter === newRecipientTokens.toBase58());
  });
  // it("Cancels the stream", async () => {
  //   setTimeout(async () => {
  //     const oldBalance = await provider.connection.getBalance(sender.publicKey);
  //     console.log("\nCancel:\n");
  //     const oldSenderAta = await program.provider.connection.getAccountInfo(
  //       senderTokens
  //     );
  //     const oldSenderAmount = common.token.parseTokenAccountData(
  //       oldSenderAta.data
  //     ).amount;
  //     const oldEscrowAta = await program.provider.connection.getAccountInfo(
  //       escrowTokens
  //     );
  //     const escrowAmountBefore = common.token.parseTokenAccountData(
  //       oldEscrowAta.data
  //     ).amount;
  //     const oldRecipientAta = await program.provider.connection.getAccountInfo(
  //       recipientTokens
  //     );
  //     const recipientAmountBefore = common.token.parseTokenAccountData(
  //       oldRecipientAta.data
  //     ).amount;
  //
  //     await program.rpc.cancel({
  //       accounts: {
  //         authority: sender.publicKey,
  //         sender: sender.publicKey,
  //         senderTokens,
  //         recipient: recipient.publicKey,
  //         recipientTokens,
  //         metadata: metadata.publicKey,
  //         escrowTokens,
  //         streamflowTreasury: STREAMFLOW_TREASURY,
  //         streamflowTreasuryTokens: streamflowTreasuryTokens,
  //         partner: STREAMFLOW_TREASURY,
  //         partnerTokens: streamflowTreasuryTokens,
  //         mint,
  //         tokenProgram: TOKEN_PROGRAM_ID,
  //         systemProgram: SystemProgram.programId,
  //       },
  //       signers: [sender.payer],
  //     });
  //     const _metadata = await program.provider.connection.getAccountInfo(
  //       metadata.publicKey
  //     );
  //     let strm_data = decode(_metadata.data);
  //     console.log("Stream Data:\n", strm_data);
  //
  //     let escrowAmountAfter = 0; // It will stay 0 if closed
  //     const newEscrowAta = await program.provider.connection.getAccountInfo(
  //       escrowTokens
  //     );
  //     if (newEscrowAta) {
  //       escrowAmountAfter = common.token.parseTokenAccountData(
  //         newEscrowAta.data
  //       ).amount;
  //     }
  //     const newRecipientAta = await program.provider.connection.getAccountInfo(
  //       recipientTokens
  //     );
  //     const recipientAmountAfter = common.token.parseTokenAccountData(
  //       newRecipientAta.data
  //     ).amount;
  //     const newSenderAta = await program.provider.connection.getAccountInfo(
  //       senderTokens
  //     );
  //     const newSenderAmount = common.token.parseTokenAccountData(
  //       newSenderAta.data
  //     ).amount;
  //
  //     console.log("cancel:");
  //     console.log(
  //       "old sender",
  //       oldSenderAmount,
  //       "old recipient",
  //       recipientAmountBefore,
  //       "old escrow",
  //       escrowAmountBefore
  //     );
  //     console.log(
  //       "new sender",
  //       newSenderAmount,
  //       "new recipient",
  //       recipientAmountAfter,
  //       "new escrow:",
  //       escrowAmountAfter,
  //       "deposited amount",
  //       depositedAmount.toNumber()
  //     );
  //     const newBalance = await provider.connection.getBalance(sender.publicKey);
  //     console.log("Returned:", newBalance - oldBalance);
  //     assert.ok(escrowAmountAfter === 0);
  //     // assert.ok(decode(escrow.data).amount.eq(0));
  //     assert.ok(
  //       recipientAmountAfter + newSenderAmount - oldSenderAmount ===
  //         escrowAmountBefore
  //     );
  //   }, 15500);
  // });
  //
  //
  // it.skip("Creates recurring", async () => {
  //   console.log("\nRecurring");
  //
  //   const metadata = Keypair.generate();
  //   [escrowTokens, nonce] = await PublicKey.findProgramAddress(
  //     [Buffer.from("strm"), metadata.publicKey.toBuffer()],
  //     program.programId
  //   );
  //
  //   const streamflowTreasuryTokens = await ata(
  //     mint,
  //     STREAMFLOW_TREASURY.publicKey
  //   );
  //
  //   const tx = await program.rpc.create(
  //     start,
  //     depositedAmount,
  //     period,
  //     new BN(0), // release rate (when > 0 - recurring payment)
  //     new BN(0), //cliff
  //     new BN(0), //cliff amount
  //     true, // cancelable_by_sender,
  //     false, // cancelable_by_recipient,
  //     false, //automatic_withdrawal,
  //     false, //transferable by sender,
  //     true, //transferable by recipient,
  //     false,
  //     "Stream NewStream NewStream New", // stream name
  //     {
  //       accounts: {
  //         sender: sender.publicKey,
  //         senderTokens,
  //         recipient: recipient.publicKey,
  //         metadata: metadata.publicKey,
  //         recipientTokens,
  //         escrowTokens,
  //         mint,
  //         rent: SYSVAR_RENT_PUBKEY,
  //         timelockProgram: program.programId,
  //         tokenProgram: TOKEN_PROGRAM_ID,
  //         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //         systemProgram: SystemProgram.programId,
  //         streamflowTreasury: STREAMFLOW_TREASURY,
  //         streamflowTreasuryTokens: streamflowTreasuryTokens,
  //         partner: STREAMFLOW_TREASURY,
  //         partnerTokens: streamflowTreasuryTokens,
  //         feeOracle: streamflowTreasuryTokens,
  //       },
  //       signers: [metadata],
  //     }
  //   );
  //
  //   const _escrowTokens = await program.provider.connection.getAccountInfo(
  //     escrowTokens
  //   );
  //   const _senderTokens = await program.provider.connection.getAccountInfo(
  //     senderTokens
  //   );
  //
  //   const _metadata = await program.provider.connection.getAccountInfo(
  //     metadata.publicKey
  //   );
  //   const _escrowTokensData = common.token.parseTokenAccountData(
  //     _escrowTokens.data
  //   );
  //   const _senderTokensData = common.token.parseTokenAccountData(
  //     _senderTokens.data
  //   );
  //
  //   let strm_data = decode(_metadata.data);
  //
  //   console.log("Stream Data:\n", strm_data);
  //
  //   assert.ok(depositedAmount.toNumber() === _escrowTokensData.amount);
  //   assert.ok(strm_data.period.eq(new BN(10)));
  //   console.log("Release rate:", strm_data.release_rate.toNumber());
  //   assert.ok(strm_data.release_rate.eq(new BN(100)));
  // }).timeout(6000);

  async function createStream(params, accounts, signers) {
    const tx = await program.rpc.create(
      // Order of the parameters must match the ones in the program
      params.startTime,
      params.netDepositedAmount,
      params.period,
      params.amountPerPeriod, // amount_per_period
      params.cliff, // cliff
      params.cliffAmount, // cliff amount
      params.cancelableBySender, // cancelable_by_sender,
      params.cancelableByRecipient, // cancelable_by_recipient,
      params.automaticWithdrawal, // automatic_withdrawal,
      params.transferableBySender, // transferable by sender,
      params.transferableByRecipient, // transferable by recipient,
      params.canTopup, // can_topup - TODO: TEST FALSE
      params.streamName, // stream name
      {
        accounts: accounts,
        signers: signers,
        // instructions: [createTransferIX], //before program.rpc.create
      }
    );
  }

  function timePassed() {
    console.log(
      "Seconds after stream start: ",
      +new Date() / 1000 - start.toNumber()
    );
  }

  async function getTokenAmount(tokenAccount) {
    return common.token.parseTokenAccountData(
      (await program.provider.connection.getAccountInfo(tokenAccount)).data
    ).amount;
  }

  async function getMetadata(metadataAccount) {
    return decode(
      (await program.provider.connection.getAccountInfo(metadataAccount))?.data
    );
  }
});

async function ata(mint, account) {
  return await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    account
  );
}
