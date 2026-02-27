/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/streamflow.json`.
 */
export type Streamflow = {
  "address": "strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m",
  "metadata": {
    "name": "streamflow",
    "version": "0.4.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "cancel",
      "discriminator": [
        232,
        219,
        223,
        41,
        219,
        236,
        220,
        190,
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "sender",
          "writable": true
        },
        {
          "name": "senderTokens",
          "writable": true
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "recipientTokens",
          "writable": true
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "escrowTokens",
          "writable": true
        },
        {
          "name": "streamflowTreasury",
          "writable": true
        },
        {
          "name": "streamflowTreasuryTokens",
          "writable": true
        },
        {
          "name": "partner",
          "writable": true
        },
        {
          "name": "partnerTokens",
          "writable": true
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
      ],
      "args": []
    },
    {
      "name": "claimFee",
      "discriminator": [
        169,
        32,
        79,
        137,
        136,
        232,
        70,
        137,
      ],
      "accounts": [
        {
          "name": "streamflowTreasury",
          "writable": true
        },
        {
          "name": "metadata",
          "writable": true
        },
      ],
      "args": []
    },
    {
      "name": "create",
      "discriminator": [
        24,
        30,
        200,
        40,
        5,
        28,
        7,
        119,
      ],
      "accounts": [
        {
          "name": "sender",
          "writable": true,
          "signer": true
        },
        {
          "name": "senderTokens",
          "writable": true
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "metadata",
          "docs": [
            "- create: should be an ephemeral signer;",
            "- create_v2: a PDA, deriviation path is:",
            "```ignore",
            "Pubkey::find_program_address(",
            "&[b\"strm-met\", mint.as_ref(), sender.as_ref(), nonce.to_be_bytes().as_ref()],",
            "pid",
            ")",
            "```",
          ],
          "writable": true
        },
        {
          "name": "escrowTokens",
          "writable": true
        },
        {
          "name": "recipientTokens",
          "writable": true
        },
        {
          "name": "streamflowTreasury",
          "writable": true
        },
        {
          "name": "streamflowTreasuryTokens",
          "writable": true
        },
        {
          "name": "withdrawor",
          "writable": true
        },
        {
          "name": "partner",
          "writable": true
        },
        {
          "name": "partnerTokens",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "feeOracle"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "timelockProgram"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
      ],
      "args": [
        {
          "name": "startTime",
          "type": "u64"
        },
        {
          "name": "netAmountDeposited",
          "type": "u64"
        },
        {
          "name": "period",
          "type": "u64"
        },
        {
          "name": "amountPerPeriod",
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
          "name": "automaticWithdrawal",
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
          "name": "canTopup",
          "type": "bool"
        },
        {
          "name": "streamName",
          "type": {
            "array": [
              "u8",
              64,
            ]
          }
        },
        {
          "name": "withdrawFrequency",
          "type": "u64"
        },
        {
          "name": "pausable",
          "type": {
            "option": "bool"
          }
        },
        {
          "name": "canUpdateRate",
          "type": {
            "option": "bool"
          }
        },
      ]
    },
    {
      "name": "createUnchecked",
      "discriminator": [
        174,
        205,
        227,
        30,
        140,
        186,
        80,
        195,
      ],
      "accounts": [
        {
          "name": "sender",
          "writable": true,
          "signer": true
        },
        {
          "name": "senderTokens",
          "writable": true
        },
        {
          "name": "metadata",
          "docs": [
            "- create: be an initialized account with 1104 bytes reserved that has pid assigned to it, i.e.;",
            "```ignore",
            "let cluster_rent = Rent::get()?;",
            "let stream_metadata_rent = cluster_rent.minimum_balance(METADATA_LEN);",
            "create_account(",
            "CpiContext::new(",
            "ctx.accounts.system_program.to_account_info(),",
            "CreateAccount {",
            "from: ctx.accounts.payer.to_account_info(),",
            "to: ctx.accounts.stream_metadata.to_account_info(),",
            "},",
            "),",
            "stream_metadata_rent,",
            "METADATA_LEN as u64,",
            "ctx.accounts.streamflow_program.to_account_info().key,",
            ")?;",
            "```",
            "- create_v2: a PDA that will be created, derivation path is:",
            "```ignore",
            "Pubkey::find_program_address(",
            "&[b\"strm-met\", mint.as_ref(), sender.as_ref(), nonce.to_be_bytes().as_ref()],",
            "pid",
            ")",
            "```",
          ],
          "writable": true
        },
        {
          "name": "escrowTokens",
          "writable": true
        },
        {
          "name": "withdrawor",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "feeOracle"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "timelockProgram"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
      ],
      "args": [
        {
          "name": "startTime",
          "type": "u64"
        },
        {
          "name": "netAmountDeposited",
          "type": "u64"
        },
        {
          "name": "period",
          "type": "u64"
        },
        {
          "name": "amountPerPeriod",
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
          "name": "automaticWithdrawal",
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
          "name": "canTopup",
          "type": "bool"
        },
        {
          "name": "streamName",
          "type": {
            "array": [
              "u8",
              64,
            ]
          }
        },
        {
          "name": "withdrawFrequency",
          "type": "u64"
        },
        {
          "name": "recipient",
          "type": "pubkey"
        },
        {
          "name": "partner",
          "type": "pubkey"
        },
        {
          "name": "pausable",
          "type": "bool"
        },
        {
          "name": "canUpdateRate",
          "type": "bool"
        },
      ]
    },
    {
      "name": "createUncheckedV2",
      "discriminator": [
        224,
        111,
        138,
        71,
        113,
        197,
        168,
        104,
      ],
      "accounts": [
        {
          "name": "sender",
          "writable": true,
          "signer": true
        },
        {
          "name": "senderTokens",
          "writable": true
        },
        {
          "name": "metadata",
          "docs": [
            "- create: be an initialized account with 1104 bytes reserved that has pid assigned to it, i.e.;",
            "```ignore",
            "let cluster_rent = Rent::get()?;",
            "let stream_metadata_rent = cluster_rent.minimum_balance(METADATA_LEN);",
            "create_account(",
            "CpiContext::new(",
            "ctx.accounts.system_program.to_account_info(),",
            "CreateAccount {",
            "from: ctx.accounts.payer.to_account_info(),",
            "to: ctx.accounts.stream_metadata.to_account_info(),",
            "},",
            "),",
            "stream_metadata_rent,",
            "METADATA_LEN as u64,",
            "ctx.accounts.streamflow_program.to_account_info().key,",
            ")?;",
            "```",
            "- create_v2: a PDA that will be created, derivation path is:",
            "```ignore",
            "Pubkey::find_program_address(",
            "&[b\"strm-met\", mint.as_ref(), sender.as_ref(), nonce.to_be_bytes().as_ref()],",
            "pid",
            ")",
            "```",
          ],
          "writable": true
        },
        {
          "name": "escrowTokens",
          "writable": true
        },
        {
          "name": "withdrawor",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "feeOracle"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "timelockProgram"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
      ],
      "args": [
        {
          "name": "startTime",
          "type": "u64"
        },
        {
          "name": "netAmountDeposited",
          "type": "u64"
        },
        {
          "name": "period",
          "type": "u64"
        },
        {
          "name": "amountPerPeriod",
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
          "name": "automaticWithdrawal",
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
          "name": "canTopup",
          "type": "bool"
        },
        {
          "name": "streamName",
          "type": {
            "array": [
              "u8",
              64,
            ]
          }
        },
        {
          "name": "withdrawFrequency",
          "type": "u64"
        },
        {
          "name": "recipient",
          "type": "pubkey"
        },
        {
          "name": "partner",
          "type": "pubkey"
        },
        {
          "name": "pausable",
          "type": "bool"
        },
        {
          "name": "canUpdateRate",
          "type": "bool"
        },
        {
          "name": "nonce",
          "type": "u32"
        },
      ]
    },
    {
      "name": "createUncheckedWithPayer",
      "discriminator": [
        0,
        123,
        85,
        155,
        20,
        111,
        159,
        22,
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "sender",
          "writable": true,
          "signer": true
        },
        {
          "name": "senderTokens",
          "writable": true
        },
        {
          "name": "metadata",
          "docs": [
            "- create: be an initialized account with 1104 bytes reserved that has pid assigned to it, i.e.;",
            "```ignore",
            "let cluster_rent = Rent::get()?;",
            "let stream_metadata_rent = cluster_rent.minimum_balance(METADATA_LEN);",
            "create_account(",
            "CpiContext::new(",
            "ctx.accounts.system_program.to_account_info(),",
            "CreateAccount {",
            "from: ctx.accounts.payer.to_account_info(),",
            "to: ctx.accounts.stream_metadata.to_account_info(),",
            "},",
            "),",
            "stream_metadata_rent,",
            "METADATA_LEN as u64,",
            "ctx.accounts.streamflow_program.to_account_info().key,",
            ")?;",
            "```",
            "- create_v2: a PDA account that will be created, derivation path is:",
            "```ignore",
            "Pubkey::find_program_address(",
            "&[b\"strm-met\", mint.as_ref(), payer.as_ref(), nonce.to_be_bytes().as_ref()],",
            "pid",
            ")",
            "```",
          ],
          "writable": true
        },
        {
          "name": "escrowTokens",
          "writable": true
        },
        {
          "name": "withdrawor",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "feeOracle"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "timelockProgram"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
      ],
      "args": [
        {
          "name": "startTime",
          "type": "u64"
        },
        {
          "name": "netAmountDeposited",
          "type": "u64"
        },
        {
          "name": "period",
          "type": "u64"
        },
        {
          "name": "amountPerPeriod",
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
          "name": "automaticWithdrawal",
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
          "name": "canTopup",
          "type": "bool"
        },
        {
          "name": "streamName",
          "type": {
            "array": [
              "u8",
              64,
            ]
          }
        },
        {
          "name": "withdrawFrequency",
          "type": "u64"
        },
        {
          "name": "recipient",
          "type": "pubkey"
        },
        {
          "name": "partner",
          "type": "pubkey"
        },
        {
          "name": "pausable",
          "type": "bool"
        },
        {
          "name": "canUpdateRate",
          "type": "bool"
        },
      ]
    },
    {
      "name": "createUncheckedWithPayerV2",
      "discriminator": [
        1,
        244,
        255,
        246,
        255,
        170,
        153,
        94,
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "sender",
          "writable": true,
          "signer": true
        },
        {
          "name": "senderTokens",
          "writable": true
        },
        {
          "name": "metadata",
          "docs": [
            "- create: be an initialized account with 1104 bytes reserved that has pid assigned to it, i.e.;",
            "```ignore",
            "let cluster_rent = Rent::get()?;",
            "let stream_metadata_rent = cluster_rent.minimum_balance(METADATA_LEN);",
            "create_account(",
            "CpiContext::new(",
            "ctx.accounts.system_program.to_account_info(),",
            "CreateAccount {",
            "from: ctx.accounts.payer.to_account_info(),",
            "to: ctx.accounts.stream_metadata.to_account_info(),",
            "},",
            "),",
            "stream_metadata_rent,",
            "METADATA_LEN as u64,",
            "ctx.accounts.streamflow_program.to_account_info().key,",
            ")?;",
            "```",
            "- create_v2: a PDA account that will be created, derivation path is:",
            "```ignore",
            "Pubkey::find_program_address(",
            "&[b\"strm-met\", mint.as_ref(), payer.as_ref(), nonce.to_be_bytes().as_ref()],",
            "pid",
            ")",
            "```",
          ],
          "writable": true
        },
        {
          "name": "escrowTokens",
          "writable": true
        },
        {
          "name": "withdrawor",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "feeOracle"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "timelockProgram"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
      ],
      "args": [
        {
          "name": "startTime",
          "type": "u64"
        },
        {
          "name": "netAmountDeposited",
          "type": "u64"
        },
        {
          "name": "period",
          "type": "u64"
        },
        {
          "name": "amountPerPeriod",
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
          "name": "automaticWithdrawal",
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
          "name": "canTopup",
          "type": "bool"
        },
        {
          "name": "streamName",
          "type": {
            "array": [
              "u8",
              64,
            ]
          }
        },
        {
          "name": "withdrawFrequency",
          "type": "u64"
        },
        {
          "name": "recipient",
          "type": "pubkey"
        },
        {
          "name": "partner",
          "type": "pubkey"
        },
        {
          "name": "pausable",
          "type": "bool"
        },
        {
          "name": "canUpdateRate",
          "type": "bool"
        },
        {
          "name": "nonce",
          "type": "u32"
        },
      ]
    },
    {
      "name": "createV2",
      "discriminator": [
        214,
        144,
        76,
        236,
        95,
        139,
        49,
        180,
      ],
      "accounts": [
        {
          "name": "sender",
          "writable": true,
          "signer": true
        },
        {
          "name": "senderTokens",
          "writable": true
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "metadata",
          "docs": [
            "- create: should be an ephemeral signer;",
            "- create_v2: a PDA, deriviation path is:",
            "```ignore",
            "Pubkey::find_program_address(",
            "&[b\"strm-met\", mint.as_ref(), sender.as_ref(), nonce.to_be_bytes().as_ref()],",
            "pid",
            ")",
            "```",
          ],
          "writable": true
        },
        {
          "name": "escrowTokens",
          "writable": true
        },
        {
          "name": "recipientTokens",
          "writable": true
        },
        {
          "name": "streamflowTreasury",
          "writable": true
        },
        {
          "name": "streamflowTreasuryTokens",
          "writable": true
        },
        {
          "name": "withdrawor",
          "writable": true
        },
        {
          "name": "partner",
          "writable": true
        },
        {
          "name": "partnerTokens",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "feeOracle"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "timelockProgram"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
      ],
      "args": [
        {
          "name": "startTime",
          "type": "u64"
        },
        {
          "name": "netAmountDeposited",
          "type": "u64"
        },
        {
          "name": "period",
          "type": "u64"
        },
        {
          "name": "amountPerPeriod",
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
          "name": "automaticWithdrawal",
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
          "name": "canTopup",
          "type": "bool"
        },
        {
          "name": "streamName",
          "type": {
            "array": [
              "u8",
              64,
            ]
          }
        },
        {
          "name": "withdrawFrequency",
          "type": "u64"
        },
        {
          "name": "pausable",
          "type": "bool"
        },
        {
          "name": "canUpdateRate",
          "type": "bool"
        },
        {
          "name": "nonce",
          "type": "u32"
        },
      ]
    },
    {
      "name": "pause",
      "discriminator": [
        211,
        22,
        221,
        251,
        74,
        121,
        193,
        47,
      ],
      "accounts": [
        {
          "name": "sender",
          "signer": true
        },
        {
          "name": "metadata",
          "writable": true
        },
      ],
      "args": []
    },
    {
      "name": "topup",
      "discriminator": [
        126,
        42,
        49,
        78,
        225,
        151,
        99,
        77,
      ],
      "accounts": [
        {
          "name": "sender",
          "writable": true,
          "signer": true
        },
        {
          "name": "senderTokens",
          "writable": true
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "escrowTokens",
          "writable": true
        },
        {
          "name": "streamflowTreasury",
          "writable": true
        },
        {
          "name": "streamflowTreasuryTokens",
          "writable": true
        },
        {
          "name": "withdrawor",
          "writable": true
        },
        {
          "name": "partner",
          "writable": true
        },
        {
          "name": "partnerTokens",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
      ]
    },
    {
      "name": "transferRecipient",
      "discriminator": [
        235,
        246,
        224,
        64,
        105,
        166,
        20,
        138,
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "newRecipient",
          "writable": true
        },
        {
          "name": "newRecipientTokens",
          "writable": true
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
      ],
      "args": []
    },
    {
      "name": "transferSender",
      "discriminator": [
        164,
        145,
        241,
        243,
        109,
        58,
        215,
        239,
      ],
      "accounts": [
        {
          "name": "sender",
          "signer": true
        },
        {
          "name": "newSender",
          "signer": true
        },
        {
          "name": "newSenderTokens"
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram"
        },
      ],
      "args": []
    },
    {
      "name": "unpause",
      "discriminator": [
        169,
        144,
        4,
        38,
        10,
        141,
        188,
        255,
      ],
      "accounts": [
        {
          "name": "sender",
          "signer": true
        },
        {
          "name": "metadata",
          "writable": true
        },
      ],
      "args": []
    },
    {
      "name": "update",
      "discriminator": [
        219,
        200,
        88,
        176,
        158,
        63,
        253,
        127,
      ],
      "accounts": [
        {
          "name": "sender",
          "writable": true,
          "signer": true
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "withdrawor",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
      ],
      "args": [
        {
          "name": "enableAutomaticWithdrawal",
          "type": {
            "option": "bool"
          }
        },
        {
          "name": "withdrawFrequency",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "amountPerPeriod",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "transferableBySender",
          "type": {
            "option": "bool"
          }
        },
        {
          "name": "transferableByRecipient",
          "type": {
            "option": "bool"
          }
        },
        {
          "name": "cancelableBySender",
          "type": {
            "option": "bool"
          }
        },
      ]
    },
    {
      "name": "withdraw",
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34,
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "recipientTokens",
          "writable": true
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "escrowTokens",
          "writable": true
        },
        {
          "name": "streamflowTreasury",
          "writable": true
        },
        {
          "name": "streamflowTreasuryTokens",
          "writable": true
        },
        {
          "name": "partner",
          "writable": true
        },
        {
          "name": "partnerTokens",
          "writable": true
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
      ]
    },
  ]
};

