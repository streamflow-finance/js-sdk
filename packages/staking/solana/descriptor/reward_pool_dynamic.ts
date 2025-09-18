/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/reward_pool_dynamic.json`.
 */
export type RewardPoolDynamic = {
  "address": "RWRDyfZa6Rk9UYi85yjYYfGmoUqffLqjo6vZdFawEez",
  "metadata": {
    "name": "rewardPoolDynamic",
    "version": "2.4.0",
    "spec": "0.1.0",
    "description": "Reward pools with dynamic rewards distribution"
  },
  "instructions": [
    {
      "name": "changeAuthority",
      "discriminator": [
        50,
        106,
        66,
        104,
        99,
        118,
        145,
        88,
      ],
      "accounts": [
        {
          "name": "rewardPool",
          "docs": [
            "Reward Pool",
          ],
          "writable": true
        },
        {
          "name": "authority",
          "docs": [
            "Current Authority",
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "newAuthority"
        },
      ],
      "args": []
    },
    {
      "name": "claimRewards",
      "discriminator": [
        4,
        144,
        132,
        71,
        116,
        23,
        151,
        80,
      ],
      "accounts": [
        {
          "name": "stakePool",
          "docs": [
            "Original Stake Pool",
          ],
          "relations": [
            "rewardPool",
          ]
        },
        {
          "name": "rewardPool",
          "docs": [
            "Reward Pool",
          ],
          "writable": true
        },
        {
          "name": "stakeEntry",
          "docs": [
            "Stake Entry for which rewards are being claimed",
          ]
        },
        {
          "name": "rewardEntry",
          "docs": [
            "Reward Entry that stores metadata about claimed rewards",
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  119,
                  97,
                  114,
                  100,
                  45,
                  101,
                  110,
                  116,
                  114,
                  121,
                ]
              },
              {
                "kind": "account",
                "path": "rewardPool"
              },
              {
                "kind": "account",
                "path": "stakeEntry"
              },
            ]
          }
        },
        {
          "name": "vault",
          "docs": [
            "Reward Pool Vault that stores tokens",
          ],
          "writable": true,
          "relations": [
            "rewardPool",
          ]
        },
        {
          "name": "to",
          "docs": [
            "Account to send the reward tokens to.",
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
            "rewardPool",
          ]
        },
        {
          "name": "governor",
          "docs": [
            "Reward Pool governor",
          ],
          "optional": true
        },
        {
          "name": "vote",
          "docs": [
            "Vote for the active proposal",
          ],
          "optional": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
      ],
      "args": []
    },
    {
      "name": "closeEntry",
      "discriminator": [
        132,
        26,
        202,
        145,
        190,
        37,
        114,
        67,
      ],
      "accounts": [
        {
          "name": "stakePool",
          "docs": [
            "Stake Pool",
          ],
          "relations": [
            "rewardPool",
          ]
        },
        {
          "name": "rewardPool",
          "docs": [
            "Reward Pool",
          ]
        },
        {
          "name": "stakeEntry",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101,
                  45,
                  101,
                  110,
                  116,
                  114,
                  121,
                ]
              },
              {
                "kind": "account",
                "path": "stakePool"
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "stakeNonce"
              },
            ],
            "program": {
              "kind": "const",
              "value": [
                6,
                133,
                25,
                160,
                130,
                0,
                119,
                110,
                227,
                8,
                28,
                85,
                214,
                116,
                67,
                41,
                155,
                152,
                181,
                139,
                124,
                208,
                85,
                71,
                175,
                40,
                123,
                71,
                139,
                170,
                201,
                178,
              ]
            }
          }
        },
        {
          "name": "rewardEntry",
          "docs": [
            "Reward Entry that stores metadata about claimed rewards",
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  119,
                  97,
                  114,
                  100,
                  45,
                  101,
                  110,
                  116,
                  114,
                  121,
                ]
              },
              {
                "kind": "account",
                "path": "rewardPool"
              },
              {
                "kind": "account",
                "path": "stakeEntry"
              },
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "rentSponsor",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  110,
                  116,
                  45,
                  115,
                  112,
                  111,
                  110,
                  115,
                  111,
                  114,
                ]
              },
            ]
          }
        },
      ],
      "args": [
        {
          "name": "stakeNonce",
          "type": "u32"
        },
      ]
    },
    {
      "name": "createEntry",
      "discriminator": [
        248,
        207,
        142,
        242,
        66,
        162,
        150,
        16,
      ],
      "accounts": [
        {
          "name": "stakePool",
          "docs": [
            "Original Stake Pool",
          ],
          "relations": [
            "rewardPool",
            "stakeEntry",
          ]
        },
        {
          "name": "rewardPool",
          "docs": [
            "Reward Pool",
          ],
          "writable": true
        },
        {
          "name": "stakeEntry",
          "docs": [
            "Stake Entry for which rewards are being claimed",
          ]
        },
        {
          "name": "rewardEntry",
          "docs": [
            "Reward Entry that stores metadata about claimed rewards",
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  119,
                  97,
                  114,
                  100,
                  45,
                  101,
                  110,
                  116,
                  114,
                  121,
                ]
              },
              {
                "kind": "account",
                "path": "rewardPool"
              },
              {
                "kind": "account",
                "path": "stakeEntry"
              },
            ]
          }
        },
        {
          "name": "payer",
          "docs": [
            "Rent payer",
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "authority"
        },
        {
          "name": "rentSponsor",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  110,
                  116,
                  45,
                  115,
                  112,
                  111,
                  110,
                  115,
                  111,
                  114,
                ]
              },
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
      ],
      "args": []
    },
    {
      "name": "createPool",
      "discriminator": [
        233,
        146,
        209,
        142,
        207,
        104,
        64,
        188,
      ],
      "accounts": [
        {
          "name": "stakePool",
          "docs": [
            "Stake Pool to Which Reward Pool is being added",
          ]
        },
        {
          "name": "rewardPool",
          "docs": [
            "Reward Pool to add",
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  119,
                  97,
                  114,
                  100,
                  45,
                  112,
                  111,
                  111,
                  108,
                ]
              },
              {
                "kind": "account",
                "path": "stakePool"
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "arg",
                "path": "nonce"
              },
            ]
          }
        },
        {
          "name": "mint",
          "docs": [
            "Mint used for rewards",
          ]
        },
        {
          "name": "vault",
          "docs": [
            "Escrow Account that will store the tokens",
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  119,
                  97,
                  114,
                  100,
                  45,
                  118,
                  97,
                  117,
                  108,
                  116,
                ]
              },
              {
                "kind": "account",
                "path": "rewardPool"
              },
            ]
          }
        },
        {
          "name": "governor",
          "docs": [
            "Governor to be set for the RewardPool",
          ],
          "optional": true
        },
        {
          "name": "creator",
          "docs": [
            "Reward Pool creator",
          ],
          "writable": true,
          "signer": true
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
          "name": "nonce",
          "type": "u8"
        },
        {
          "name": "permissionless",
          "type": "bool"
        },
        {
          "name": "claimPeriod",
          "type": "u64"
        },
        {
          "name": "claimStartTs",
          "type": "u64"
        },
      ]
    },
    {
      "name": "fundPool",
      "discriminator": [
        36,
        57,
        233,
        176,
        181,
        20,
        87,
        159,
      ],
      "accounts": [
        {
          "name": "funder",
          "docs": [
            "Reward Pool funder",
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "from",
          "docs": [
            "Token Account from which tokens will be transferred",
          ],
          "writable": true
        },
        {
          "name": "vault",
          "docs": [
            "Reward Pool Vault that stores tokens",
          ],
          "writable": true,
          "relations": [
            "rewardPool",
          ]
        },
        {
          "name": "mint",
          "docs": [
            "Mint of reward tokens",
          ],
          "relations": [
            "rewardPool",
          ]
        },
        {
          "name": "stakePool",
          "docs": [
            "Original Stake Pool",
          ],
          "relations": [
            "rewardPool",
          ]
        },
        {
          "name": "rewardPool",
          "docs": [
            "Reward Pool",
          ],
          "writable": true
        },
        {
          "name": "streamflowTreasury",
          "writable": true,
          "address": "5SEpbdjFK5FxwTvfsGMXVQTD2v4M2c5tyRTxhdsPkgDw"
        },
        {
          "name": "streamflowTreasuryTokens",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "streamflowTreasury"
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
          "name": "config",
          "docs": [
            "Fee Configuration",
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ]
              },
            ],
            "program": {
              "kind": "account",
              "path": "feeProgram"
            }
          }
        },
        {
          "name": "feeValue",
          "docs": [
            "Fee Value for the funder account",
          ],
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  45,
                  118,
                  97,
                  108,
                  117,
                  101,
                ]
              },
              {
                "kind": "account",
                "path": "funder"
              },
            ],
            "program": {
              "kind": "account",
              "path": "feeProgram"
            }
          }
        },
        {
          "name": "feeProgram",
          "address": "FEELzfBhsWXTNJX53zZcDVfRNoFYZQ6cZA3jLiGVL16V"
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
    {
      "name": "setGovernor",
      "discriminator": [
        47,
        75,
        9,
        199,
        215,
        187,
        161,
        161,
      ],
      "accounts": [
        {
          "name": "stakePool",
          "docs": [
            "Stake Pool - to verify the governor belongs to the same stake pool",
          ],
          "relations": [
            "rewardPool",
            "governor",
          ]
        },
        {
          "name": "rewardPool",
          "docs": [
            "Reward Pool - to be updated with new governor",
          ],
          "writable": true
        },
        {
          "name": "governor",
          "docs": [
            "New Governor to be set for the RewardPool",
          ]
        },
        {
          "name": "authority",
          "docs": [
            "Current Authority - only authority can set the governor",
          ],
          "writable": true,
          "signer": true
        },
      ],
      "args": []
    },
    {
      "name": "updatePool",
      "discriminator": [
        239,
        214,
        170,
        78,
        36,
        35,
        30,
        34,
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Current Authority",
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "rewardPool",
          "docs": [
            "Reward Pool",
          ],
          "writable": true
        },
      ],
      "args": [
        {
          "name": "claimPeriod",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "permissionless",
          "type": {
            "option": "bool"
          }
        },
      ]
    },
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130,
      ]
    },
    {
      "name": "feeValue",
      "discriminator": [
        10,
        188,
        89,
        64,
        4,
        183,
        231,
        0,
      ]
    },
    {
      "name": "governor",
      "discriminator": [
        37,
        136,
        44,
        80,
        68,
        85,
        213,
        178,
      ]
    },
    {
      "name": "rewardEntry",
      "discriminator": [
        208,
        191,
        173,
        14,
        213,
        84,
        179,
        162,
      ]
    },
    {
      "name": "rewardPool",
      "discriminator": [
        134,
        121,
        197,
        211,
        133,
        154,
        82,
        32,
      ]
    },
    {
      "name": "stakeEntry",
      "discriminator": [
        187,
        127,
        9,
        35,
        155,
        68,
        86,
        40,
      ]
    },
    {
      "name": "stakePool",
      "discriminator": [
        121,
        34,
        206,
        21,
        79,
        127,
        255,
        28,
      ]
    },
    {
      "name": "vote",
      "discriminator": [
        96,
        91,
        104,
        57,
        145,
        35,
        172,
        155,
      ]
    },
  ],
  "errors": [
    {
      "code": 6000,
      "name": "arithmeticError",
      "msg": "Arithmetic Error (overflow/underflow)"
    },
    {
      "code": 6001,
      "name": "unauthorized",
      "msg": "Account is not authorized to execute this instruction"
    },
    {
      "code": 6002,
      "name": "ownerMismatch",
      "msg": "Token account owner did not match intended owner"
    },
    {
      "code": 6003,
      "name": "invalidRewardPool",
      "msg": "Provided Reward Pool is Invalid"
    },
    {
      "code": 6004,
      "name": "invalidRewardVault",
      "msg": "Incorrect vault for RewardPool"
    },
    {
      "code": 6005,
      "name": "invalidRewardEntry",
      "msg": "Provided Reward Entry is Invalid"
    },
    {
      "code": 6006,
      "name": "invalidStakeEntry",
      "msg": "Provided Stake Entry is Invalid"
    },
    {
      "code": 6007,
      "name": "invalidStakePool",
      "msg": "Provided Stake Pool does not equal the Governor Stake Pool"
    },
    {
      "code": 6008,
      "name": "invalidMint",
      "msg": "Provided Mint does not equal the Pool Mint"
    },
    {
      "code": 6009,
      "name": "stakeEntryClosed",
      "msg": "Stake Entry is closed, rewards are not claimable anymore"
    },
    {
      "code": 6010,
      "name": "stakeEntryOpened",
      "msg": "Stake Entry is still opened, closing is not possible"
    },
    {
      "code": 6011,
      "name": "invalidClaimStartTs",
      "msg": "Invalid claim start ts provided"
    },
    {
      "code": 6012,
      "name": "claimTooEarly",
      "msg": "Claiming is not possible until claim period has passed"
    },
    {
      "code": 6013,
      "name": "rewardPoolDrained",
      "msg": "Reward Pool does not have enough Rewards for Claiming"
    },
    {
      "code": 6014,
      "name": "invalidGovernor",
      "msg": "Provided governor is invalid"
    },
    {
      "code": 6015,
      "name": "invalidVote",
      "msg": "Provided vote is invalid"
    },
    {
      "code": 6016,
      "name": "voteRequired",
      "msg": "Vote is required for claiming"
    },
  ],
  "types": [
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Fee Manager authority",
            ],
            "type": "pubkey"
          },
          {
            "name": "streamflowFee",
            "docs": [
              "Default fee",
            ],
            "type": "u64"
          },
          {
            "name": "buffer1",
            "docs": [
              "Buffer for additional fields",
            ],
            "type": {
              "array": [
                "u8",
                64,
              ]
            }
          },
          {
            "name": "buffer2",
            "docs": [
              "Buffer for additional fields",
            ],
            "type": {
              "array": [
                "u8",
                64,
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
                64,
              ]
            }
          },
        ]
      }
    },
    {
      "name": "feeValue",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "streamflowFee",
            "type": "u64"
          },
          {
            "name": "buffer",
            "docs": [
              "Buffer for additional fields",
            ],
            "type": {
              "array": [
                "u8",
                64,
              ]
            }
          },
        ]
      }
    },
    {
      "name": "governor",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "docs": [
              "Bump Seed used to sign transactions",
            ],
            "type": "u8"
          },
          {
            "name": "nonce",
            "docs": [
              "Nonce to support multiple governors for the same pool",
            ],
            "type": "u8"
          },
          {
            "name": "stakePool",
            "docs": [
              "Stake Pool for which Reward Pool was added",
            ],
            "type": "pubkey"
          },
          {
            "name": "authority",
            "docs": [
              "Authority of the Governor that can add proposals and set the current one",
            ],
            "type": "pubkey"
          },
          {
            "name": "currentProposal",
            "docs": [
              "Address of the current proposal",
            ],
            "type": "pubkey"
          },
          {
            "name": "totalProposals",
            "docs": [
              "Total number of created proposals",
            ],
            "type": "u64"
          },
          {
            "name": "buffer",
            "docs": [
              "Buffer for additional fields",
            ],
            "type": {
              "array": [
                "u8",
                128,
              ]
            }
          },
        ]
      }
    },
    {
      "name": "rewardEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rewardPool",
            "docs": [
              "Reward Pool",
            ],
            "type": "pubkey"
          },
          {
            "name": "stakeEntry",
            "docs": [
              "Stake Entry for which reward entry was initialized",
            ],
            "type": "pubkey"
          },
          {
            "name": "createdTs",
            "docs": [
              "Timestamp when reward entry has been created",
            ],
            "type": "u64"
          },
          {
            "name": "rewardsState",
            "docs": [
              "State of the reward disitrbution, accounts for the last state in the reward pool",
            ],
            "type": "u128"
          },
          {
            "name": "claimedAmount",
            "docs": [
              "Sum of already claimed rewards",
            ],
            "type": "u64"
          },
          {
            "name": "lastClaimedTs",
            "docs": [
              "Timestamp when rewards have been claimed last time",
            ],
            "type": "u64"
          },
          {
            "name": "isSponsored",
            "docs": [
              "Whether the entry rent has been sponsored by the rent vault",
            ],
            "type": "bool"
          },
          {
            "name": "buffer",
            "docs": [
              "Buffer for additional fields",
            ],
            "type": {
              "array": [
                "u8",
                31,
              ]
            }
          },
        ]
      }
    },
    {
      "name": "rewardPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "docs": [
              "Bump Seed used to sign transactions",
            ],
            "type": "u8"
          },
          {
            "name": "nonce",
            "docs": [
              "Nonce to differentiate pools for the same mint",
            ],
            "type": "u8"
          },
          {
            "name": "stakePool",
            "docs": [
              "Stake Pool for which Reward Pool was added",
            ],
            "type": "pubkey"
          },
          {
            "name": "governor",
            "docs": [
              "Governor of the Stake Pool, should be passed at claiming if set",
            ],
            "type": "pubkey"
          },
          {
            "name": "mint",
            "docs": [
              "Mint of Reward Pool",
            ],
            "type": "pubkey"
          },
          {
            "name": "creator",
            "docs": [
              "Creator of the Pool",
            ],
            "type": "pubkey"
          },
          {
            "name": "authority",
            "docs": [
              "Current authority",
            ],
            "type": "pubkey"
          },
          {
            "name": "permissionless",
            "docs": [
              "Whether anyone can fund the Pool",
            ],
            "type": "bool"
          },
          {
            "name": "claimPeriod",
            "docs": [
              "Period of claims, may be used to block consecutive claims within the same period",
            ],
            "type": "u64"
          },
          {
            "name": "claimStartTs",
            "docs": [
              "Time when claiming starts, will be used as a base timestamp if claim_period is set",
            ],
            "type": "u64"
          },
          {
            "name": "vault",
            "docs": [
              "Escrow Account that stores reward tokens",
            ],
            "type": "pubkey"
          },
          {
            "name": "fundedAmount",
            "docs": [
              "Total funded amount",
            ],
            "type": "u64"
          },
          {
            "name": "claimedAmount",
            "docs": [
              "Total number of rewards claimed",
            ],
            "type": "u64"
          },
          {
            "name": "rewardsState",
            "docs": [
              "Ever increasing accumulator of the amount of rewards per effective stake.\n    Said another way, if a user deposited before any rewards were added to the\n    `vault`, then this would be the token amount per effective stake they could\n    claim.",
            ],
            "type": "u128"
          },
          {
            "name": "lastAmount",
            "docs": [
              "latest amount of tokens in the vault",
            ],
            "type": "u64"
          },
          {
            "name": "createdTs",
            "docs": [
              "Time when Reward Pool was created",
            ],
            "type": "u64"
          },
          {
            "name": "buffer",
            "docs": [
              "Buffer for additional fields",
            ],
            "type": {
              "array": [
                "u8",
                128,
              ]
            }
          },
        ]
      }
    },
    {
      "name": "stakeEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nonce",
            "docs": [
              "Nonce to differentiate stakes for the same pool",
            ],
            "type": "u32"
          },
          {
            "name": "stakePool",
            "docs": [
              "Stake Pool for which tokens were staked",
            ],
            "type": "pubkey"
          },
          {
            "name": "payer",
            "docs": [
              "Original Owner of Staked tokens",
            ],
            "type": "pubkey"
          },
          {
            "name": "authority",
            "docs": [
              "Authority of the Entry",
            ],
            "type": "pubkey"
          },
          {
            "name": "amount",
            "docs": [
              "Amount of deposited funds",
            ],
            "type": "u64"
          },
          {
            "name": "duration",
            "docs": [
              "Duration of the lockup",
            ],
            "type": "u64"
          },
          {
            "name": "effectiveAmount",
            "docs": [
              "Effective Amount staked, does not equal to deposited amount, accounts for Stake Weight",
            ],
            "type": "u128"
          },
          {
            "name": "createdTs",
            "docs": [
              "Timestamp when Deposit was made",
            ],
            "type": "u64"
          },
          {
            "name": "closedTs",
            "docs": [
              "Timestamp when entry has been closed",
            ],
            "type": "u64"
          },
          {
            "name": "priorTotalEffectiveStake",
            "docs": [
              "Total effective stake at the time of staking",
            ],
            "type": "u128"
          },
          {
            "name": "unstakeTs",
            "docs": [
              "Timestamp when unstake was requested, will be used in case `unstake_period` is set",
            ],
            "type": "u64"
          },
          {
            "name": "isSponsored",
            "docs": [
              "Whether the entry rent has been sponsored by the rent vault",
            ],
            "type": "bool"
          },
          {
            "name": "autoUnstake",
            "docs": [
              "Whether auto unstaking is enabled, copied from the stake pool for use in instructions that don't require the stake pool account",
            ],
            "type": "bool"
          },
          {
            "name": "buffer",
            "docs": [
              "Buffer for additional fields",
            ],
            "type": {
              "array": [
                "u8",
                38,
              ]
            }
          },
        ]
      }
    },
    {
      "name": "stakePool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "docs": [
              "Bump Seed used to sign transactions",
            ],
            "type": "u8"
          },
          {
            "name": "nonce",
            "docs": [
              "Nonce to differentiate pools for the same mint",
            ],
            "type": "u8"
          },
          {
            "name": "mint",
            "docs": [
              "Mint of the Stake Pool",
            ],
            "type": "pubkey"
          },
          {
            "name": "creator",
            "docs": [
              "Initial Creator",
            ],
            "type": "pubkey"
          },
          {
            "name": "authority",
            "docs": [
              "Current authority",
            ],
            "type": "pubkey"
          },
          {
            "name": "minWeight",
            "docs": [
              "The lowest weight awarded for staking, measured as a fraction of `1 / SCALE_FACTOR_BASE`.",
              "For instance:",
              "* `min_weight = 1 x SCALE_FACTOR_BASE` signifies a minimum multiplier of 1x for min staking duration",
              "* `min_weight = 2 x SCALE_FACTOR_BASE` indicates a minimum multiplier of 2x for min staking duration",
            ],
            "type": "u64"
          },
          {
            "name": "maxWeight",
            "docs": [
              "The highest weight awarded for staking, measured as a fraction of `1 / SCALE_FACTOR_BASE`.",
              "For instance:",
              "* `max_weight = 1 x SCALE_FACTOR_BASE` signifies a max multiplier of 1x for max staking duration",
              "* `max_weight = 2 x SCALE_FACTOR_BASE` indicates a max multiplier of 2x for max staking duration",
            ],
            "type": "u64"
          },
          {
            "name": "minDuration",
            "docs": [
              "Min Duration of stake in seconds",
            ],
            "type": "u64"
          },
          {
            "name": "maxDuration",
            "docs": [
              "Max Duration of stake in seconds, the more duration, the more weight the stake has",
            ],
            "type": "u64"
          },
          {
            "name": "permissionless",
            "docs": [
              "Whether anyone can add Reward Pools or just admin",
            ],
            "type": "bool"
          },
          {
            "name": "vault",
            "docs": [
              "Escrow Account that stores staked tokens",
            ],
            "type": "pubkey"
          },
          {
            "name": "stakeMint",
            "docs": [
              "Stake Mint, will be returned in exchange for stake tokens",
            ],
            "type": "pubkey"
          },
          {
            "name": "totalStake",
            "docs": [
              "Total number of Staked tokens",
            ],
            "type": "u64"
          },
          {
            "name": "totalEffectiveStake",
            "docs": [
              "Total staked tokens accounting for each stake weight, does not equal `total_stake`,",
              "represents a sum of effective stake multiplied by 10^9 for precision",
            ],
            "type": "u128"
          },
          {
            "name": "freezeStakeMint",
            "docs": [
              "Whether we should freeze stake mint token accounts",
            ],
            "type": "bool"
          },
          {
            "name": "unstakePeriod",
            "docs": [
              "Period for unstaking, if set unstake at first should be requested, and the real unstake can only happen after this period",
            ],
            "type": "u64"
          },
          {
            "name": "isTotalStakeCapped",
            "docs": [
              "Whether amount of total staked tokens is limited by `remaining_total_stake` - stored as separate flag to not deal with `Option`",
            ],
            "type": "bool"
          },
          {
            "name": "remainingTotalStake",
            "docs": [
              "Remaining total amount of staked tokens (cumulative)",
            ],
            "type": "u64"
          },
          {
            "name": "expiryTs",
            "docs": [
              "Time when stake pool expires, staking is not possible after expiration",
            ],
            "type": "u64"
          },
          {
            "name": "autoUnstake",
            "docs": [
              "Whether auto unstaking is enabled, stake entries will be unstaked after duration",
            ],
            "type": "bool"
          },
          {
            "name": "buffer",
            "docs": [
              "Buffer for additional fields",
            ],
            "type": {
              "array": [
                "u8",
                37,
              ]
            }
          },
        ]
      }
    },
    {
      "name": "vote",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "docs": [
              "Question to which vote was provided",
            ],
            "type": "pubkey"
          },
          {
            "name": "voter",
            "docs": [
              "Voter that voted on the proposal",
            ],
            "type": "pubkey"
          },
          {
            "name": "optionIndex",
            "docs": [
              "Index of the option used for voting",
            ],
            "type": "u8"
          },
          {
            "name": "weight",
            "docs": [
              "Weight of the vote, correspond to number of sTokens used",
            ],
            "type": "u64"
          },
          {
            "name": "isSponsored",
            "docs": [
              "Whether the vote rent has been sponsored by the rent vault",
            ],
            "type": "bool"
          },
          {
            "name": "buffer",
            "docs": [
              "Buffer for additional fields",
            ],
            "type": {
              "array": [
                "u8",
                63,
              ]
            }
          },
        ]
      }
    },
  ]
};
