/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/governor.json`.
 */
export type Governor = {
  "address": "GVERNASJFxi8vjjJtwCKYQTeN51XsV1y2B1ap1GtKrKR",
  "metadata": {
    "name": "governor",
    "version": "2.4.0",
    "spec": "0.1.0",
    "description": "Governor program to allow users to vote with stake tokens"
  },
  "instructions": [
    {
      "name": "addProposal",
      "discriminator": [
        130,
        139,
        214,
        107,
        93,
        13,
        84,
        152,
      ],
      "accounts": [
        {
          "name": "stakePool",
          "docs": [
            "The stake pool associated with the governor",
          ],
          "relations": [
            "governor",
          ]
        },
        {
          "name": "governor",
          "docs": [
            "The governor to which the proposal is being added",
          ],
          "writable": true
        },
        {
          "name": "proposal",
          "docs": [
            "The new proposal account to be created",
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108,
                ]
              },
              {
                "kind": "account",
                "path": "governor"
              },
              {
                "kind": "arg",
                "path": "nonce"
              },
            ]
          }
        },
        {
          "name": "authority",
          "docs": [
            "Authority of the governor",
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u32"
        },
        {
          "name": "text",
          "type": "string"
        },
        {
          "name": "options",
          "type": {
            "vec": "string"
          }
        },
        {
          "name": "votingStartTs",
          "type": "u64"
        },
        {
          "name": "votingEndTs",
          "type": "u64"
        },
      ]
    },
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
          "name": "governor",
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
      "name": "createGovernor",
      "discriminator": [
        103,
        30,
        78,
        252,
        28,
        128,
        40,
        3,
      ],
      "accounts": [
        {
          "name": "stakePool",
          "docs": [
            "The stake pool for which the governor is being created",
          ]
        },
        {
          "name": "governor",
          "docs": [
            "The governor account to be created",
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  111,
                  118,
                  101,
                  114,
                  110,
                  111,
                  114,
                ]
              },
              {
                "kind": "account",
                "path": "stakePool"
              },
              {
                "kind": "arg",
                "path": "nonce"
              },
            ]
          }
        },
        {
          "name": "authority",
          "docs": [
            "Authority of the stake pool",
          ],
          "writable": true,
          "signer": true
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
      ]
    },
    {
      "name": "setActiveProposal",
      "discriminator": [
        41,
        14,
        222,
        18,
        33,
        232,
        43,
        82,
      ],
      "accounts": [
        {
          "name": "governor",
          "docs": [
            "The governor for which to set the active proposal",
          ],
          "writable": true,
          "relations": [
            "proposal",
          ]
        },
        {
          "name": "proposal",
          "docs": [
            "The proposal to set as active",
          ],
          "writable": true
        },
        {
          "name": "authority",
          "docs": [
            "Authority of the governor",
          ],
          "signer": true
        },
      ],
      "args": []
    },
    {
      "name": "voteOnProposal",
      "discriminator": [
        188,
        239,
        13,
        88,
        119,
        199,
        251,
        119,
      ],
      "accounts": [
        {
          "name": "stakePool",
          "docs": [
            "Original Stake Pool",
          ],
          "relations": [
            "governor",
          ]
        },
        {
          "name": "governor",
          "docs": [
            "The governor account that manages the voting process",
          ],
          "writable": true,
          "relations": [
            "proposal",
          ]
        },
        {
          "name": "proposal",
          "docs": [
            "The proposal being voted on",
          ]
        },
        {
          "name": "vote",
          "docs": [
            "The vote account that will be created to record the vote",
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                ]
              },
              {
                "kind": "account",
                "path": "proposal"
              },
              {
                "kind": "account",
                "path": "voter"
              },
            ]
          }
        },
        {
          "name": "stakeMintAccount",
          "docs": [
            "The user's stake token account that holds the stake tokens",
          ]
        },
        {
          "name": "voter",
          "docs": [
            "The user who is voting",
          ],
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
        {
          "name": "systemProgram",
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
          "name": "optionIndex",
          "type": "u8"
        },
      ]
    },
  ],
  "accounts": [
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
      "name": "proposal",
      "discriminator": [
        26,
        94,
        189,
        187,
        116,
        136,
        53,
        33,
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
  "events": [
    {
      "name": "voteEvent",
      "discriminator": [
        195,
        71,
        250,
        105,
        120,
        119,
        234,
        134,
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
      "name": "invalidStakeMint",
      "msg": "Provided Stake Mint does not equal the Pool Stake Mint"
    },
    {
      "code": 6003,
      "name": "invalidStakePool",
      "msg": "Provided Stake Pool does not equal the Entry Stake Pool"
    },
    {
      "code": 6004,
      "name": "invalidGovernor",
      "msg": "Provided Governor does not match the proposal Governor"
    },
    {
      "code": 6005,
      "name": "invalidProposalText",
      "msg": "Invalid proposal text provided"
    },
    {
      "code": 6006,
      "name": "invalidProposalOptions",
      "msg": "Invalid proposal options provided"
    },
    {
      "code": 6007,
      "name": "invalidProposalDuration",
      "msg": "Invalid proposal duration"
    },
    {
      "code": 6008,
      "name": "proposalAlreadyActive",
      "msg": "This proposal is already active"
    },
    {
      "code": 6009,
      "name": "votingNotStarted",
      "msg": "Voting not started yet"
    },
    {
      "code": 6010,
      "name": "votingEnded",
      "msg": "Voting has already ended"
    },
    {
      "code": 6011,
      "name": "invalidOptionIndex",
      "msg": "Provided option is not a valid proposal option"
    },
    {
      "code": 6012,
      "name": "insufficientStakeTokens",
      "msg": "Insufficient tokens for voting"
    },
  ],
  "types": [
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
      "name": "proposal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nonce",
            "docs": [
              "Nonce used to derive proposal address",
            ],
            "type": "u32"
          },
          {
            "name": "governor",
            "docs": [
              "Stake Pool for which Reward Pool was added",
            ],
            "type": "pubkey"
          },
          {
            "name": "text",
            "docs": [
              "Text of the proposals we reserve up to 512 bytes (ascii symbols take 1 byte)",
            ],
            "type": "string"
          },
          {
            "name": "options",
            "docs": [
              "Potential options that will be used when answering, we reserve enough space for up to 8x32 = 256 ascii symbols in total",
            ],
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "votingStartTs",
            "docs": [
              "Time when voting starts, 0 means that voting start immediately after proposal was created",
            ],
            "type": "u64"
          },
          {
            "name": "votingEndTs",
            "docs": [
              "Time when voting ends, 0 means that voting will be possible anytime",
            ],
            "type": "u64"
          },
          {
            "name": "createdTs",
            "docs": [
              "Time when proposal was created",
            ],
            "type": "u64"
          },
          {
            "name": "lastActiveTs",
            "docs": [
              "Last time when proposal was made active",
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
                64,
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
    {
      "name": "voteEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "governor",
            "type": "pubkey"
          },
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "optionIndex",
            "type": "u8"
          },
          {
            "name": "value",
            "type": "u64"
          },
        ]
      }
    },
  ]
};
