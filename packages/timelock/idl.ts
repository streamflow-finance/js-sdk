export default {
  version: "0.0.0",
  name: "timelock",
  instructions: [
    {
      "name": "create",
      "accounts": [
        {
          "name": "sender",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "senderTokens",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "recipient",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "recipientTokens",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "escrowTokens",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "timelockProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "startTime",
          "type": "u64"
        },
        {
          "name": "endTime",
          "type": "u64"
        },
        {
          "name": "depositedAmount",
          "type": "u64"
        },
        {
          "name": "totalAmount",
          "type": "u64"
        },
        {
          "name": "period",
          "type": "u64"
        },
        {
          "name": "cliff",
          "type": "u64"
        },
        {
          "name": "cliffAmount",
          "type": "u64"
        },
        {
          "name": "cancelableBySender",
          "type": "bool"
        },
        {
          "name": "cancelableByRecipient",
          "type": "bool"
        },
        {
          "name": "withdrawalPublic",
          "type": "bool"
        },
        {
          "name": "transferableBySender",
          "type": "bool"
        },
        {
          "name": "transferableByRecipient",
          "type": "bool"
        },
        {
          "name": "releaseRate",
          "type": "u64"
        },
        {
          "name": "streamName",
          "type": "string"
        }
      ]
    },
    {
      "name": "withdraw",
      "accounts": [
        {
          "name": "withdrawAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "sender",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "recipient",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "recipientTokens",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowTokens",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "cancel",
      "accounts": [
        {
          "name": "cancelAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "sender",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "senderTokens",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "recipient",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "recipientTokens",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowTokens",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "transferRecipient",
      "accounts": [
        {
          "name": "existingRecipient",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "newRecipient",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newRecipientTokens",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowTokens",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "system",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "topup",
      "accounts": [
        {
          "name": "sender",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "senderTokens",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowTokens",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "metadata": {
    "address": "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
  }
};
