/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/partner_oracle.json`.
 */
export type PartnerOracle = {
  "address": "pardpVtPjC8nLj1Dwncew62mUzfChdCX1EaoZe8oCAa",
  "metadata": {
    "name": "partnerOracle",
    "version": "1.0.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "airdropClearExpiredFees",
      "discriminator": [
        203,
        5,
        237,
        235,
        32,
        38,
        150,
        235,
      ],
      "accounts": [
        {
          "name": "config",
          "docs": [
            "Account that stores the config",
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  105,
                  114,
                  100,
                  114,
                  111,
                  112,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ]
              },
            ]
          }
        },
      ],
      "args": []
    },
    {
      "name": "airdropGetFees",
      "discriminator": [
        185,
        20,
        28,
        207,
        70,
        243,
        32,
        62,
      ],
      "accounts": [
        {
          "name": "config",
          "docs": [
            "Account that stores the config",
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  105,
                  114,
                  100,
                  114,
                  111,
                  112,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ]
              },
            ]
          }
        },
      ],
      "args": [
        {
          "name": "pubkey",
          "type": "pubkey"
        },
      ],
      "returns": {
        "defined": {
          "name": "airdropFees"
        }
      }
    },
    {
      "name": "airdropInitializeConfig",
      "discriminator": [
        2,
        110,
        102,
        10,
        34,
        83,
        164,
        55,
      ],
      "accounts": [
        {
          "name": "payer",
          "docs": [
            "Account that will cover tx fees, can be anybody since the instruction is safe",
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  105,
                  114,
                  100,
                  114,
                  111,
                  112,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
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
      "name": "airdropRemoveFees",
      "discriminator": [
        119,
        246,
        202,
        91,
        59,
        94,
        252,
        239,
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Fee Authority",
          ],
          "writable": true,
          "signer": true,
          "address": "CgdggophaMCFRP8gA1QjrZHsHaNQgByhBU7zoF5TpXF7"
        },
        {
          "name": "config",
          "docs": [
            "Account that stores the config",
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  105,
                  114,
                  100,
                  114,
                  111,
                  112,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ]
              },
            ]
          }
        },
      ],
      "args": [
        {
          "name": "pubkey",
          "type": "pubkey"
        },
      ]
    },
    {
      "name": "airdropWriteDefaultFees",
      "discriminator": [
        37,
        104,
        254,
        202,
        136,
        124,
        245,
        94,
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Fee Authority",
          ],
          "writable": true,
          "signer": true,
          "address": "CgdggophaMCFRP8gA1QjrZHsHaNQgByhBU7zoF5TpXF7"
        },
        {
          "name": "config",
          "docs": [
            "Account that stores the config",
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  105,
                  114,
                  100,
                  114,
                  111,
                  112,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ]
              },
            ]
          }
        },
      ],
      "args": [
        {
          "name": "creationFee",
          "type": "u32"
        },
        {
          "name": "priceOracleFee",
          "type": "u32"
        },
        {
          "name": "claimMinFee",
          "type": "u32"
        },
        {
          "name": "claimMaxFee",
          "type": "u32"
        },
        {
          "name": "allocationFactor",
          "type": "f64"
        },
        {
          "name": "clawbackTokenFeePercent",
          "type": "f64"
        },
      ]
    },
    {
      "name": "airdropWriteFees",
      "discriminator": [
        71,
        165,
        178,
        215,
        19,
        70,
        146,
        71,
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Fee Authority",
          ],
          "writable": true,
          "signer": true,
          "address": "CgdggophaMCFRP8gA1QjrZHsHaNQgByhBU7zoF5TpXF7"
        },
        {
          "name": "config",
          "docs": [
            "Account that stores the config",
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  105,
                  114,
                  100,
                  114,
                  111,
                  112,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ]
              },
            ]
          }
        },
      ],
      "args": [
        {
          "name": "pubkey",
          "type": "pubkey"
        },
        {
          "name": "creationFee",
          "type": "u32"
        },
        {
          "name": "priceOracleFee",
          "type": "u32"
        },
        {
          "name": "claimMinFee",
          "type": "u32"
        },
        {
          "name": "claimMaxFee",
          "type": "u32"
        },
        {
          "name": "allocationFactor",
          "type": "f64"
        },
        {
          "name": "clawbackTokenFeePercent",
          "type": "f64"
        },
        {
          "name": "expiryTs",
          "type": "u64"
        },
      ]
    },
    {
      "name": "vestingGetFees",
      "discriminator": [
        239,
        230,
        28,
        173,
        134,
        247,
        57,
        176,
      ],
      "accounts": [
        {
          "name": "partners",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  109,
                  95,
                  102,
                  101,
                  101,
                  115,
                ]
              },
            ]
          }
        },
      ],
      "args": [
        {
          "name": "pubkey",
          "type": "pubkey"
        },
      ],
      "returns": {
        "defined": {
          "name": "vestingFees"
        }
      }
    },
    {
      "name": "vestingInitializePartners",
      "discriminator": [
        205,
        170,
        148,
        219,
        143,
        38,
        77,
        196,
      ],
      "accounts": [
        {
          "name": "payer",
          "docs": [
            "Account that will cover tx fees, can be anybody since the instruction is safe",
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "partners",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  109,
                  95,
                  102,
                  101,
                  101,
                  115,
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
      "name": "vestingRemoveFees",
      "discriminator": [
        233,
        176,
        222,
        64,
        79,
        14,
        48,
        168,
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Account that will cover tx fees, should be equal to creator if not is not expired",
          ],
          "writable": true,
          "signer": true,
          "address": "CgdggophaMCFRP8gA1QjrZHsHaNQgByhBU7zoF5TpXF7"
        },
        {
          "name": "partners",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  109,
                  95,
                  102,
                  101,
                  101,
                  115,
                ]
              },
            ]
          }
        },
      ],
      "args": [
        {
          "name": "pubkey",
          "type": "pubkey"
        },
      ]
    },
    {
      "name": "vestingWriteDefaultFees",
      "discriminator": [
        96,
        198,
        97,
        81,
        162,
        50,
        51,
        10,
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Account that will cover tx fees, should be equal to creator if not is not expired",
          ],
          "writable": true,
          "signer": true,
          "address": "CgdggophaMCFRP8gA1QjrZHsHaNQgByhBU7zoF5TpXF7"
        },
        {
          "name": "partners",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  109,
                  95,
                  102,
                  101,
                  101,
                  115,
                ]
              },
            ]
          }
        },
      ],
      "args": [
        {
          "name": "creationFee",
          "type": "u32"
        },
        {
          "name": "autoClaimFee",
          "type": "u32"
        },
        {
          "name": "tokenFeePercent",
          "type": "f32"
        },
      ]
    },
    {
      "name": "vestingWriteFees",
      "discriminator": [
        251,
        24,
        6,
        241,
        182,
        56,
        93,
        100,
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "Account that will cover tx fees, should be equal to creator if not is not expired",
          ],
          "writable": true,
          "signer": true,
          "address": "CgdggophaMCFRP8gA1QjrZHsHaNQgByhBU7zoF5TpXF7"
        },
        {
          "name": "partners",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  109,
                  95,
                  102,
                  101,
                  101,
                  115,
                ]
              },
            ]
          }
        },
      ],
      "args": [
        {
          "name": "pubkey",
          "type": "pubkey"
        },
        {
          "name": "creationFee",
          "type": "u32"
        },
        {
          "name": "autoClaimFee",
          "type": "u32"
        },
        {
          "name": "tokenFeePercent",
          "type": "f32"
        },
      ]
    },
  ],
  "accounts": [
    {
      "name": "airdropConfig",
      "discriminator": [
        194,
        149,
        223,
        142,
        42,
        98,
        128,
        16,
      ]
    },
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Account is not authorized to execute this instruction"
    },
    {
      "code": 6001,
      "name": "arithmeticError",
      "msg": "Arithmetic Error (overflow/underflow)"
    },
    {
      "code": 6100,
      "name": "invalidExpiry",
      "msg": "Provided expiry ts is invalid"
    },
    {
      "code": 6101,
      "name": "noExpiredFees",
      "msg": "No expired fees found, transaction won't change the config"
    },
    {
      "code": 6200,
      "name": "invalidVestingFee",
      "msg": "Received invalid Vesting Fee configuration"
    },
    {
      "code": 6300,
      "name": "invalidAirdropFee",
      "msg": "Received invalid Airdrop Fee configuration"
    },
    {
      "code": 6301,
      "name": "airdropConfigFull",
      "msg": "Airdrop config is full, can not write fees"
    },
  ],
  "types": [
    {
      "name": "airdropConfig",
      "serialization": "bytemuck",
      "repr": {
        "kind": "c"
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u32"
          },
          {
            "name": "usdMultiplier",
            "docs": [
              "Multiplier to apply when calculating ALL fees",
            ],
            "type": "f32"
          },
          {
            "name": "solanaPrice",
            "docs": [
              "Last solana price used",
            ],
            "type": "u64"
          },
          {
            "name": "creationFee",
            "docs": [
              "Creation SOL fee",
            ],
            "type": "u32"
          },
          {
            "name": "priceOracleFee",
            "docs": [
              "Fee for custom price oracle used in dynamic airdrops",
            ],
            "type": "u32"
          },
          {
            "name": "claimMinFee",
            "docs": [
              "Dynamic claim fee in SOL, min",
            ],
            "type": "u32"
          },
          {
            "name": "claimMaxFee",
            "docs": [
              "Dynamic claim fee in SOL, max",
            ],
            "type": "u32"
          },
          {
            "name": "allocationFactor",
            "docs": [
              "Factor to multiple claimable SOL by when calculating fee",
            ],
            "type": "f64"
          },
          {
            "name": "clawbackTokenFeePercent",
            "docs": [
              "Toke % fee on clawback",
            ],
            "type": "f64"
          },
          {
            "name": "buffer",
            "type": {
              "array": [
                "u8",
                144,
              ]
            }
          },
          {
            "name": "partners",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "airdropPartner"
                  }
                },
                100,
              ]
            }
          },
        ]
      }
    },
    {
      "name": "airdropFees",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pubkey",
            "docs": [
              "Account for which the fees were configured",
            ],
            "type": "pubkey"
          },
          {
            "name": "creationFee",
            "docs": [
              "Creation SOL fee",
            ],
            "type": "u32"
          },
          {
            "name": "priceOracleFee",
            "docs": [
              "Fee for custom price oracle used in dynamic airdrops",
            ],
            "type": "u32"
          },
          {
            "name": "claimMinFee",
            "docs": [
              "Dynamic claim fee in SOL, min",
            ],
            "type": "u32"
          },
          {
            "name": "claimMaxFee",
            "docs": [
              "Dynamic claim fee in SOL, max",
            ],
            "type": "u32"
          },
          {
            "name": "allocationFactor",
            "docs": [
              "Factor to multiple claimable SOL by when calculating fee",
            ],
            "type": "f64"
          },
          {
            "name": "clawbackTokenFeePercent",
            "docs": [
              "Token % fee on clawback",
            ],
            "type": "f64"
          },
        ]
      }
    },
    {
      "name": "airdropPartner",
      "serialization": "bytemuck",
      "repr": {
        "kind": "c"
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pubkey",
            "docs": [
              "Pubkey of the partner",
            ],
            "type": "pubkey"
          },
          {
            "name": "creationFee",
            "docs": [
              "Creation SOL fee",
            ],
            "type": "u32"
          },
          {
            "name": "priceOracleFee",
            "docs": [
              "Fee for custom price oracle used in dynamic airdrops",
            ],
            "type": "u32"
          },
          {
            "name": "claimMinFee",
            "docs": [
              "Dynamic claim fee in SOL, min",
            ],
            "type": "u32"
          },
          {
            "name": "claimMaxFee",
            "docs": [
              "Dynamic claim fee in SOL, max",
            ],
            "type": "u32"
          },
          {
            "name": "allocationFactor",
            "docs": [
              "Factor to multiple claimable SOL by when calculating fee",
            ],
            "type": "f64"
          },
          {
            "name": "clawbackTokenFeePercent",
            "docs": [
              "Toke % fee on clawback",
            ],
            "type": "f64"
          },
          {
            "name": "expiryTs",
            "docs": [
              "Time when fee configuration expires",
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
                16,
              ]
            }
          },
        ]
      }
    },
    {
      "name": "vestingFees",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pubkey",
            "type": "pubkey"
          },
          {
            "name": "creationFee",
            "type": "u32"
          },
          {
            "name": "autoClaimFee",
            "type": "u32"
          },
          {
            "name": "tokenFeePercent",
            "type": "f32"
          },
        ]
      }
    },
  ]
};
