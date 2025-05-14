/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/merkle_distributor.json`.
 */
export type MerkleDistributor = {
  "address": "MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N",
  "metadata": {
    "name": "merkleDistributor",
    "version": "1.5.0",
    "spec": "0.1.0",
    "description": "A Solana program for distributing tokens according to a Merkle root.",
    "repository": "https://github.com/streamflow-finance/distributor"
  },
  "instructions": [
    {
      "name": "exposeClaim",
      "discriminator": [
        103,
        233,
        83,
        69,
        115,
        199,
        128,
        249,
      ],
      "accounts": [
        {
          "name": "distributor",
          "docs": [
            "The [MerkleDistributor].",
          ]
        },
        {
          "name": "claimStatus",
          "docs": [
            "Claim Status PDA",
          ],
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  67,
                  108,
                  97,
                  105,
                  109,
                  83,
                  116,
                  97,
                  116,
                  117,
                  115,
                ]
              },
              {
                "kind": "account",
                "path": "claimant"
              },
              {
                "kind": "account",
                "path": "distributor"
              },
            ]
          }
        },
        {
          "name": "compressedClaimStatus",
          "docs": [
            "Compress Claim Status PDA",
          ],
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  67,
                  108,
                  97,
                  105,
                  109,
                  83,
                  116,
                  97,
                  116,
                  117,
                  115,
                ]
              },
              {
                "kind": "account",
                "path": "claimant"
              },
              {
                "kind": "account",
                "path": "distributor"
              },
            ]
          }
        },
        {
          "name": "claimant",
          "docs": [
            "Who is claiming the tokens.",
          ],
          "signer": true
        },
      ],
      "args": []
    },
    {
      "name": "claimLocked",
      "discriminator": [
        34,
        206,
        181,
        23,
        11,
        207,
        147,
        90,
      ],
      "accounts": [
        {
          "name": "distributor",
          "docs": [
            "The [MerkleDistributor].",
          ],
          "writable": true
        },
        {
          "name": "claimStatus",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  67,
                  108,
                  97,
                  105,
                  109,
                  83,
                  116,
                  97,
                  116,
                  117,
                  115,
                ]
              },
              {
                "kind": "account",
                "path": "claimant"
              },
              {
                "kind": "account",
                "path": "distributor"
              },
            ]
          }
        },
        {
          "name": "from",
          "docs": [
            "Distributor ATA containing the tokens to distribute.",
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "distributor"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "distributor.mint",
                "account": "merkleDistributor"
              },
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ]
            }
          }
        },
        {
          "name": "to",
          "docs": [
            "Account to send the claimed tokens to.",
            "Claimant must sign the transaction and can only claim on behalf of themself",
          ],
          "writable": true
        },
        {
          "name": "claimant",
          "docs": [
            "Who is claiming the tokens.",
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "mint",
          "docs": [
            "The mint to claim.",
          ],
          "relations": [
            "distributor",
          ]
        },
        {
          "name": "tokenProgram",
          "docs": [
            "SPL [Token] program.",
          ]
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ]
              },
            ]
          }
        },
        {
          "name": "program"
        },
      ],
      "args": []
    },
    {
      "name": "clawback",
      "discriminator": [
        111,
        92,
        142,
        79,
        33,
        234,
        82,
        27,
      ],
      "accounts": [
        {
          "name": "distributor",
          "docs": [
            "The [MerkleDistributor].",
          ],
          "writable": true
        },
        {
          "name": "from",
          "docs": [
            "Distributor ATA containing the tokens to distribute.",
          ],
          "writable": true
        },
        {
          "name": "to",
          "docs": [
            "The Clawback token account.",
          ],
          "writable": true
        },
        {
          "name": "admin",
          "docs": [
            "Only Admin can trigger the clawback of funds",
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "systemProgram",
          "docs": [
            "The [System] program.",
          ],
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "docs": [
            "SPL [Token] program.",
          ]
        },
      ],
      "args": []
    },
    {
      "name": "closeClaim",
      "discriminator": [
        42,
        177,
        165,
        35,
        213,
        179,
        211,
        19,
      ],
      "accounts": [
        {
          "name": "distributor",
          "docs": [
            "The [MerkleDistributor].",
          ],
          "writable": true
        },
        {
          "name": "adminOrClaimant",
          "docs": [
            "Admin signer",
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "claimant",
          "writable": true
        },
        {
          "name": "claimStatus",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  67,
                  108,
                  97,
                  105,
                  109,
                  83,
                  116,
                  97,
                  116,
                  117,
                  115,
                ]
              },
              {
                "kind": "account",
                "path": "claimant"
              },
              {
                "kind": "account",
                "path": "distributor"
              },
            ]
          }
        },
        {
          "name": "systemProgram",
          "docs": [
            "The [System] program.",
          ],
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ]
              },
            ]
          }
        },
        {
          "name": "program"
        },
      ],
      "args": [
        {
          "name": "amountUnlocked",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "amountLocked",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "proof",
          "type": {
            "option": {
              "vec": {
                "array": [
                  "u8",
                  32,
                ]
              }
            }
          }
        },
      ]
    },
    {
      "name": "compressClaim",
      "discriminator": [
        219,
        45,
        247,
        134,
        71,
        119,
        125,
        89,
      ],
      "accounts": [
        {
          "name": "distributor",
          "docs": [
            "The [MerkleDistributor].",
          ],
          "writable": true
        },
        {
          "name": "claimStatus",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  67,
                  108,
                  97,
                  105,
                  109,
                  83,
                  116,
                  97,
                  116,
                  117,
                  115,
                ]
              },
              {
                "kind": "account",
                "path": "claimant"
              },
              {
                "kind": "account",
                "path": "distributor"
              },
            ]
          }
        },
        {
          "name": "signer",
          "docs": [
            "Signer account",
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "claimant"
        },
        {
          "name": "systemProgram",
          "docs": [
            "The [System] program.",
          ],
          "address": "11111111111111111111111111111111"
        },
      ],
      "args": []
    },
    {
      "name": "newClaim",
      "discriminator": [
        78,
        177,
        98,
        123,
        210,
        21,
        187,
        83,
      ],
      "accounts": [
        {
          "name": "distributor",
          "docs": [
            "The [MerkleDistributor].",
          ],
          "writable": true
        },
        {
          "name": "claimStatus",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  67,
                  108,
                  97,
                  105,
                  109,
                  83,
                  116,
                  97,
                  116,
                  117,
                  115,
                ]
              },
              {
                "kind": "account",
                "path": "claimant"
              },
              {
                "kind": "account",
                "path": "distributor"
              },
            ]
          }
        },
        {
          "name": "from",
          "docs": [
            "Distributor ATA containing the tokens to distribute.",
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "distributor"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "distributor.mint",
                "account": "merkleDistributor"
              },
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ]
            }
          }
        },
        {
          "name": "to",
          "docs": [
            "Account to send the claimed tokens to.",
          ],
          "writable": true
        },
        {
          "name": "claimant",
          "docs": [
            "Who is claiming the tokens.",
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "mint",
          "docs": [
            "The mint to claim.",
          ],
          "relations": [
            "distributor",
          ]
        },
        {
          "name": "tokenProgram",
          "docs": [
            "SPL [Token] program.",
          ]
        },
        {
          "name": "systemProgram",
          "docs": [
            "The [System] program.",
          ],
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ]
              },
            ]
          }
        },
        {
          "name": "program"
        },
      ],
      "args": [
        {
          "name": "amountUnlocked",
          "type": "u64"
        },
        {
          "name": "amountLocked",
          "type": "u64"
        },
        {
          "name": "proof",
          "type": {
            "vec": {
              "array": [
                "u8",
                32,
              ]
            }
          }
        },
      ]
    },
    {
      "name": "newDistributor",
      "docs": [
        "READ THE FOLLOWING:",
        "",
        "This instruction is susceptible to frontrunning that could result in loss of funds if not handled properly.",
        "",
        "An attack could look like:",
        "- A legitimate user opens a new distributor.",
        "- Someone observes the call to this instruction.",
        "- They replace the clawback_receiver, admin, or time parameters with their own.",
        "",
        "One situation that could happen here is the attacker replaces the admin and clawback_receiver with their own",
        "and sets the clawback_start_ts with the minimal time allowed. After clawback_start_ts has elapsed,",
        "the attacker can steal all funds from the distributor to their own clawback_receiver account.",
        "",
        "HOW TO AVOID:",
        "- When you call into this instruction, ensure your transaction succeeds.",
        "- To be extra safe, after your transaction succeeds, read back the state of the created MerkleDistributor account and",
        "assert the parameters are what you expect, most importantly the clawback_receiver and admin.",
        "- If your transaction fails, double check the value on-chain matches what you expect.",
      ],
      "discriminator": [
        32,
        139,
        112,
        171,
        0,
        2,
        225,
        155,
      ],
      "accounts": [
        {
          "name": "distributor",
          "docs": [
            "[MerkleDistributor].",
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  77,
                  101,
                  114,
                  107,
                  108,
                  101,
                  68,
                  105,
                  115,
                  116,
                  114,
                  105,
                  98,
                  117,
                  116,
                  111,
                  114,
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "arg",
                "path": "version"
              },
            ]
          }
        },
        {
          "name": "clawbackReceiver",
          "docs": [
            "Clawback receiver token account",
          ],
          "writable": true
        },
        {
          "name": "mint",
          "docs": [
            "The mint to distribute.",
          ]
        },
        {
          "name": "tokenVault",
          "docs": [
            "Token vault",
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "distributor"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              },
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ]
            }
          }
        },
        {
          "name": "admin",
          "docs": [
            "Admin wallet, responsible for creating the distributor and paying for the transaction.",
            "Also has the authority to set the clawback receiver and change itself.",
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "The [System] program.",
          ],
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "docs": [
            "The [Associated Token] program.",
          ],
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram",
          "docs": [
            "The [Token] program.",
          ]
        },
      ],
      "args": [
        {
          "name": "version",
          "type": "u64"
        },
        {
          "name": "root",
          "type": {
            "array": [
              "u8",
              32,
            ]
          }
        },
        {
          "name": "maxTotalClaim",
          "type": "u64"
        },
        {
          "name": "maxNumNodes",
          "type": "u64"
        },
        {
          "name": "unlockPeriod",
          "type": "u64"
        },
        {
          "name": "startVestingTs",
          "type": "u64"
        },
        {
          "name": "endVestingTs",
          "type": "u64"
        },
        {
          "name": "clawbackStartTs",
          "type": "u64"
        },
        {
          "name": "claimsClosableByAdmin",
          "type": "bool"
        },
        {
          "name": "canUpdateDuration",
          "type": {
            "option": "bool"
          }
        },
        {
          "name": "totalAmountUnlocked",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "totalAmountLocked",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "claimsClosableByClaimant",
          "type": {
            "option": "bool"
          }
        },
        {
          "name": "claimsLimit",
          "type": {
            "option": "u16"
          }
        },
      ]
    },
    {
      "name": "refundClaim",
      "discriminator": [
        157,
        23,
        164,
        146,
        176,
        53,
        147,
        143,
      ],
      "accounts": [
        {
          "name": "distributor",
          "docs": [
            "The [MerkleDistributor].",
          ],
          "writable": true
        },
        {
          "name": "claimStatus",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  67,
                  108,
                  97,
                  105,
                  109,
                  83,
                  116,
                  97,
                  116,
                  117,
                  115,
                ]
              },
              {
                "kind": "account",
                "path": "claimant"
              },
              {
                "kind": "account",
                "path": "distributor"
              },
            ]
          }
        },
        {
          "name": "signer",
          "docs": [
            "Signer account",
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "claimant"
        },
        {
          "name": "streamflowTreasury",
          "writable": true,
          "address": "5SEpbdjFK5FxwTvfsGMXVQTD2v4M2c5tyRTxhdsPkgDw"
        },
        {
          "name": "systemProgram",
          "docs": [
            "The [System] program.",
          ],
          "address": "11111111111111111111111111111111"
        },
      ],
      "args": []
    },
    {
      "name": "setAdmin",
      "discriminator": [
        251,
        163,
        0,
        52,
        91,
        194,
        187,
        92,
      ],
      "accounts": [
        {
          "name": "distributor",
          "docs": [
            "The [MerkleDistributor].",
          ],
          "writable": true
        },
        {
          "name": "admin",
          "docs": [
            "Admin signer",
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "newAdmin",
          "docs": [
            "New admin account",
          ],
          "writable": true
        },
      ],
      "args": []
    },
    {
      "name": "setClawbackReceiver",
      "discriminator": [
        153,
        217,
        34,
        20,
        19,
        29,
        229,
        75,
      ],
      "accounts": [
        {
          "name": "distributor",
          "docs": [
            "The [MerkleDistributor].",
          ],
          "writable": true
        },
        {
          "name": "newClawbackAccount",
          "docs": [
            "New clawback account",
          ]
        },
        {
          "name": "admin",
          "docs": [
            "Admin signer",
          ],
          "writable": true,
          "signer": true
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
          "name": "distributor",
          "docs": [
            "The [MerkleDistributor].",
          ],
          "writable": true
        },
        {
          "name": "admin",
          "docs": [
            "Only Admin can trigger the clawback of funds",
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "The [System] program.",
          ],
          "address": "11111111111111111111111111111111"
        },
      ],
      "args": [
        {
          "name": "endTs",
          "type": {
            "option": "u64"
          }
        },
      ]
    },
  ],
  "accounts": [
    {
      "name": "claimStatus",
      "discriminator": [
        22,
        183,
        249,
        157,
        247,
        95,
        150,
        96,
      ]
    },
    {
      "name": "compressedClaimStatus",
      "discriminator": [
        53,
        68,
        161,
        131,
        212,
        106,
        98,
        48,
      ]
    },
    {
      "name": "merkleDistributor",
      "discriminator": [
        77,
        119,
        139,
        70,
        84,
        247,
        12,
        26,
      ]
    },
  ],
  "events": [
    {
      "name": "claimClosedEvent",
      "discriminator": [
        139,
        166,
        215,
        195,
        184,
        233,
        26,
        217,
      ]
    },
    {
      "name": "claimedEvent",
      "discriminator": [
        144,
        172,
        209,
        86,
        144,
        87,
        84,
        115,
      ]
    },
    {
      "name": "newClaimEvent",
      "discriminator": [
        244,
        3,
        231,
        151,
        60,
        101,
        55,
        55,
      ]
    },
  ],
  "errors": [
    {
      "code": 6000,
      "name": "insufficientUnlockedTokens",
      "msg": "Insufficient unlocked tokens"
    },
    {
      "code": 6001,
      "name": "invalidProof",
      "msg": "Invalid Merkle proof"
    },
    {
      "code": 6002,
      "name": "exceededMaxClaim",
      "msg": "Exceeded maximum claim amount"
    },
    {
      "code": 6003,
      "name": "maxNodesExceeded",
      "msg": "Exceeded maximum node count"
    },
    {
      "code": 6004,
      "name": "unauthorized",
      "msg": "Account is not authorized to execute this instruction"
    },
    {
      "code": 6005,
      "name": "ownerMismatch",
      "msg": "Token account owner did not match intended owner"
    },
    {
      "code": 6006,
      "name": "clawbackBeforeStart",
      "msg": "Attempted clawback before start"
    },
    {
      "code": 6007,
      "name": "clawbackAlreadyClaimed",
      "msg": "Clawback already claimed"
    },
    {
      "code": 6008,
      "name": "sameClawbackReceiver",
      "msg": "New and old Clawback receivers are identical"
    },
    {
      "code": 6009,
      "name": "clawbackReceiverIsTokenVault",
      "msg": "Clawback receiver can not be the Token Vault"
    },
    {
      "code": 6010,
      "name": "sameAdmin",
      "msg": "New and old admin are identical"
    },
    {
      "code": 6011,
      "name": "claimExpired",
      "msg": "Claim window expired"
    },
    {
      "code": 6012,
      "name": "arithmeticError",
      "msg": "Arithmetic Error (overflow/underflow)"
    },
    {
      "code": 6013,
      "name": "startTimestampAfterEnd",
      "msg": "Start Timestamp cannot be after end Timestamp"
    },
    {
      "code": 6014,
      "name": "timestampsNotInFuture",
      "msg": "Timestamps cannot be in the past"
    },
    {
      "code": 6015,
      "name": "invalidMint",
      "msg": "Invalid Mint"
    },
    {
      "code": 6016,
      "name": "claimIsClosed",
      "msg": "Claim is closed"
    },
    {
      "code": 6017,
      "name": "claimsAreNotClosable",
      "msg": "Claims are not closable"
    },
    {
      "code": 6018,
      "name": "invalidUnlockPeriod",
      "msg": "Invalid unlock period"
    },
    {
      "code": 6019,
      "name": "durationUpdateNotAllowed",
      "msg": "Duration update is not allowed"
    },
    {
      "code": 6020,
      "name": "noVestingAmount",
      "msg": "Vesting amounts are not set"
    },
    {
      "code": 6021,
      "name": "vestingAlreadyFinished",
      "msg": "Vesting already finished"
    },
    {
      "code": 6022,
      "name": "invalidAmounts",
      "msg": "Provided amounts are invalid"
    },
    {
      "code": 6023,
      "name": "claimsLimitReached",
      "msg": "Claims limit has been reached"
    },
  ],
  "types": [
    {
      "name": "claimClosedEvent",
      "docs": [
        "Emitted when a new claim is created.",
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "claimant",
            "docs": [
              "User that claimed.",
            ],
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "docs": [
              "Timestamp.",
            ],
            "type": "u64"
          },
        ]
      }
    },
    {
      "name": "claimStatus",
      "docs": [
        "Holds whether or not a claimant has claimed tokens.",
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "claimant",
            "docs": [
              "Authority that claimed the tokens.",
            ],
            "type": "pubkey"
          },
          {
            "name": "lockedAmount",
            "docs": [
              "Locked amount",
            ],
            "type": "u64"
          },
          {
            "name": "lockedAmountWithdrawn",
            "docs": [
              "Locked amount withdrawn",
            ],
            "type": "u64"
          },
          {
            "name": "unlockedAmount",
            "docs": [
              "Unlocked amount",
            ],
            "type": "u64"
          },
          {
            "name": "lastClaimTs",
            "docs": [
              "Last claim time",
            ],
            "type": "u64"
          },
          {
            "name": "lastAmountPerUnlock",
            "docs": [
              "Track amount per unlock, can be useful for non-linear vesting",
            ],
            "type": "u64"
          },
          {
            "name": "closed",
            "docs": [
              "Whether claim is closed",
            ],
            "type": "bool"
          },
          {
            "name": "distributor",
            "docs": [
              "Distributor account for which ClaimStatus was created, useful to filter by in get_program_accounts",
            ],
            "type": "pubkey"
          },
          {
            "name": "claimsCount",
            "docs": [
              "Number of time amount has been claimed",
            ],
            "type": "u16"
          },
          {
            "name": "closedTs",
            "docs": [
              "Time when claim has been closed",
            ],
            "type": "u64"
          },
          {
            "name": "buffer2",
            "docs": [
              "Buffer for additional fields",
            ],
            "type": {
              "array": [
                "u8",
                22,
              ]
            }
          },
        ]
      }
    },
    {
      "name": "claimedEvent",
      "docs": [
        "Emitted when tokens are claimed.",
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "claimant",
            "docs": [
              "User that claimed.",
            ],
            "type": "pubkey"
          },
          {
            "name": "amount",
            "docs": [
              "Amount of tokens to distribute.",
            ],
            "type": "u64"
          },
        ]
      }
    },
    {
      "name": "compressedClaimStatus",
      "docs": [
        "Holds whether or not a claimant has claimed tokens.",
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "state",
            "type": {
              "defined": {
                "name": "state"
              }
            }
          },
        ]
      }
    },
    {
      "name": "merkleDistributor",
      "docs": [
        "State for the account which distributes tokens.",
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "docs": [
              "Bump seed.",
            ],
            "type": "u8"
          },
          {
            "name": "version",
            "docs": [
              "Version of the airdrop",
            ],
            "type": "u64"
          },
          {
            "name": "root",
            "docs": [
              "The 256-bit merkle root.",
            ],
            "type": {
              "array": [
                "u8",
                32,
              ]
            }
          },
          {
            "name": "mint",
            "docs": [
              "[Mint] of the token to be distributed.",
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenVault",
            "docs": [
              "Token Address of the vault",
            ],
            "type": "pubkey"
          },
          {
            "name": "maxTotalClaim",
            "docs": [
              "Maximum number of tokens that can ever be claimed from this [MerkleDistributor].",
            ],
            "type": "u64"
          },
          {
            "name": "maxNumNodes",
            "docs": [
              "Maximum number of nodes in [MerkleDistributor].",
            ],
            "type": "u64"
          },
          {
            "name": "unlockPeriod",
            "docs": [
              "Time step (period) in seconds per which the unlock occurs",
            ],
            "type": "u64"
          },
          {
            "name": "totalAmountClaimed",
            "docs": [
              "Total amount of tokens that have been claimed.",
            ],
            "type": "u64"
          },
          {
            "name": "numNodesClaimed",
            "docs": [
              "Number of nodes that have been claimed.",
            ],
            "type": "u64"
          },
          {
            "name": "startTs",
            "docs": [
              "Lockup time start (Unix Timestamp)",
            ],
            "type": "u64"
          },
          {
            "name": "endTs",
            "docs": [
              "Lockup time end (Unix Timestamp)",
            ],
            "type": "u64"
          },
          {
            "name": "clawbackStartTs",
            "docs": [
              "Clawback start (Unix Timestamp)",
            ],
            "type": "u64"
          },
          {
            "name": "clawbackReceiver",
            "docs": [
              "Clawback receiver",
            ],
            "type": "pubkey"
          },
          {
            "name": "admin",
            "docs": [
              "Admin wallet",
            ],
            "type": "pubkey"
          },
          {
            "name": "clawedBack",
            "docs": [
              "Whether or not the distributor has been clawed back",
            ],
            "type": "bool"
          },
          {
            "name": "claimsClosableByAdmin",
            "docs": [
              "Whether claims are closable by the admin or not",
            ],
            "type": "bool"
          },
          {
            "name": "canUpdateDuration",
            "docs": [
              "Whether admin can update vesting duration",
            ],
            "type": "bool"
          },
          {
            "name": "totalAmountUnlocked",
            "docs": [
              "Total amount of funds unlocked (cliff/instant)",
            ],
            "type": "u64"
          },
          {
            "name": "totalAmountLocked",
            "docs": [
              "Total amount of funds locked (vested)",
            ],
            "type": "u64"
          },
          {
            "name": "lastDurationUpdateTs",
            "docs": [
              "Timestamp when update was last called",
            ],
            "type": "u64"
          },
          {
            "name": "totalClaimablePreUpdate",
            "docs": [
              "Total amount of locked amount claimable as of last duration update, ever increasing total, accumulates with each update",
            ],
            "type": "u64"
          },
          {
            "name": "clawedBackTs",
            "docs": [
              "Timestamp when funds were clawed back",
            ],
            "type": "u64"
          },
          {
            "name": "claimsClosableByClaimant",
            "docs": [
              "Whether claims are closable by claimant or not",
            ],
            "type": "bool"
          },
          {
            "name": "claimsLimit",
            "docs": [
              "Limit number of claims",
            ],
            "type": "u16"
          },
          {
            "name": "buffer2",
            "docs": [
              "Buffer for additional fields",
            ],
            "type": {
              "array": [
                "u8",
                20,
              ]
            }
          },
          {
            "name": "buffer3",
            "docs": [
              "Buffer for additional fields",
            ],
            "type": {
              "array": [
                "u8",
                32,
              ]
            }
          },
        ]
      }
    },
    {
      "name": "newClaimEvent",
      "docs": [
        "Emitted when a new claim is created.",
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "claimant",
            "docs": [
              "User that claimed.",
            ],
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "docs": [
              "Timestamp.",
            ],
            "type": "u64"
          },
        ]
      }
    },
    {
      "name": "state",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "claimed"
          },
          {
            "name": "closed"
          },
        ]
      }
    },
  ]
};