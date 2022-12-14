export default {
  version: "0.1.0",
  name: "timelock",
  instructions: [
    {
      name: "create",
      accounts: [
        {
          name: "sender",
          isMut: true,
          isSigner: true,
        },
        {
          name: "senderTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "recipient",
          isMut: true,
          isSigner: false,
        },
        {
          name: "metadata",
          isMut: true,
          isSigner: true,
        },
        {
          name: "escrowTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "recipientTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "streamflowTreasury",
          isMut: true,
          isSigner: false,
        },
        {
          name: "streamflowTreasuryTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "withdrawor",
          isMut: true,
          isSigner: false,
        },
        {
          name: "partner",
          isMut: true,
          isSigner: false,
        },
        {
          name: "partnerTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "feeOracle",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "timelockProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "startTime",
          type: "u64",
        },
        {
          name: "netAmountDeposited",
          type: "u64",
        },
        {
          name: "period",
          type: "u64",
        },
        {
          name: "amountPerPeriod",
          type: "u64",
        },
        {
          name: "cliff",
          type: "u64",
        },
        {
          name: "cliffAmount",
          type: "u64",
        },
        {
          name: "cancelableBySender",
          type: "bool",
        },
        {
          name: "cancelableByRecipient",
          type: "bool",
        },
        {
          name: "automaticWithdrawal",
          type: "bool",
        },
        {
          name: "transferableBySender",
          type: "bool",
        },
        {
          name: "transferableByRecipient",
          type: "bool",
        },
        {
          name: "canTopup",
          type: "bool",
        },
        {
          name: "streamName",
          type: {
            array: ["u8", 64],
          },
        },
        {
          name: "withdrawFrequency",
          type: "u64",
        },
      ],
    },
    {
      name: "withdraw",
      accounts: [
        {
          name: "authority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "recipient",
          isMut: true,
          isSigner: false,
        },
        {
          name: "recipientTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "metadata",
          isMut: true,
          isSigner: false,
        },
        {
          name: "escrowTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "streamflowTreasury",
          isMut: true,
          isSigner: false,
        },
        {
          name: "streamflowTreasuryTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "partner",
          isMut: true,
          isSigner: false,
        },
        {
          name: "partnerTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "cancel",
      accounts: [
        {
          name: "authority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "sender",
          isMut: true,
          isSigner: false,
        },
        {
          name: "senderTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "recipient",
          isMut: true,
          isSigner: false,
        },
        {
          name: "recipientTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "metadata",
          isMut: true,
          isSigner: false,
        },
        {
          name: "escrowTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "streamflowTreasury",
          isMut: true,
          isSigner: false,
        },
        {
          name: "streamflowTreasuryTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "partner",
          isMut: true,
          isSigner: false,
        },
        {
          name: "partnerTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "transferRecipient",
      accounts: [
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "newRecipient",
          isMut: true,
          isSigner: false,
        },
        {
          name: "newRecipientTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "metadata",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "topup",
      accounts: [
        {
          name: "sender",
          isMut: true,
          isSigner: true,
        },
        {
          name: "senderTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "metadata",
          isMut: true,
          isSigner: false,
        },
        {
          name: "escrowTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "streamflowTreasury",
          isMut: true,
          isSigner: false,
        },
        {
          name: "streamflowTreasuryTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "withdrawor",
          isMut: true,
          isSigner: false,
        },
        {
          name: "partner",
          isMut: true,
          isSigner: false,
        },
        {
          name: "partnerTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
  ],
};
