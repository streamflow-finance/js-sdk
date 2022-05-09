export default {
  version: "0.1.0",
  name: "airdrop",
  instructions: [
    {
      name: "initializeAirdrop",
      accounts: [
        {
          name: "initializer",
          isMut: false,
          isSigner: true,
        },
        {
          name: "initializerDepositTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "airdropAccount",
          isMut: true,
          isSigner: true,
        },
        {
          name: "airdropTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
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
          name: "airdropAmount",
          type: "u64",
        },
        {
          name: "withdrawAmount",
          type: "u64",
        },
      ],
    },
    {
      name: "getAirdrop",
      accounts: [
        {
          name: "taker",
          isMut: false,
          isSigner: true,
        },
        {
          name: "takerReceiveTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "airdropAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "airdropTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "pdaAccount",
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
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "cancelAirdrop",
      accounts: [
        {
          name: "initializer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "initializerDepositTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "pdaAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "airdropAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "airdropTokenAccount",
          isMut: true,
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
  ],
  accounts: [
    {
      name: "AirdropAccount",
      type: {
        kind: "struct",
        fields: [
          {
            name: "initializerKey",
            type: "publicKey",
          },
          {
            name: "initializerDepositTokenAccount",
            type: "publicKey",
          },
          {
            name: "airdropTokenAccount",
            type: "publicKey",
          },
          {
            name: "withdrawAmount",
            type: "u64",
          },
        ],
      },
    },
  ],
};
