/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/streamflow_aligned_unlocks.json`.
 */
export type StreamflowAlignedUnlocks = {
  address: "aSTRM2NKoKxNnkmLWk9sz3k74gKBk9t7bpPrTGxMszH";
  metadata: {
    name: "streamflowAlignedUnlocks";
    version: "1.1.0";
    spec: "0.1.0";
    description: "Proxy to update unlock amount within Streamflow vesting protocol according to Token performance and other metrics";
  };
  instructions: [
    {
      name: "cancel";
      discriminator: [232, 219, 223, 41, 219, 236, 220, 190];
      accounts: [
        {
          name: "sender";
          writable: true;
          signer: true;
        },
        {
          name: "senderTokens";
          docs: ["Associated token account address of `sender`."];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "sender";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              },
            ];
            program: {
              kind: "const";
              value: [
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
              ];
            };
          };
        },
        {
          name: "recipient";
          writable: true;
        },
        {
          name: "recipientTokens";
          docs: ["CHECK; Associated token account address of `recipient`."];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "recipient";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              },
            ];
            program: {
              kind: "const";
              value: [
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
              ];
            };
          };
        },
        {
          name: "proxyMetadata";
          docs: ["Proxy Contract"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 116, 114, 97, 99, 116];
              },
              {
                kind: "account";
                path: "streamMetadata";
              },
            ];
          };
        },
        {
          name: "proxyTokens";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "proxyMetadata";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              },
            ];
            program: {
              kind: "const";
              value: [
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
              ];
            };
          };
        },
        {
          name: "streamMetadata";
          writable: true;
        },
        {
          name: "escrowTokens";
          writable: true;
        },
        {
          name: "streamflowTreasury";
          writable: true;
        },
        {
          name: "streamflowTreasuryTokens";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "streamflowTreasury";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              },
            ];
            program: {
              kind: "const";
              value: [
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
              ];
            };
          };
        },
        {
          name: "partner";
          writable: true;
        },
        {
          name: "partnerTokens";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "partner";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              },
            ];
            program: {
              kind: "const";
              value: [
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
              ];
            };
          };
        },
        {
          name: "mint";
          docs: ["The SPL token mint account."];
          writable: true;
        },
        {
          name: "streamflowProgram";
          address: "strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m";
        },
        {
          name: "tokenProgram";
          docs: ["The SPL program needed in case an associated account", "for the new recipient is being created."];
        },
      ];
      args: [];
    },
    {
      name: "changeOracle";
      discriminator: [177, 227, 230, 103, 13, 72, 141, 248];
      accounts: [
        {
          name: "sender";
          writable: true;
          signer: true;
        },
        {
          name: "proxyMetadata";
          docs: ["Proxy Contract"];
          writable: true;
        },
        {
          name: "newPriceOracle";
        },
      ];
      args: [
        {
          name: "params";
          type: {
            defined: {
              name: "changeOracleParams";
            };
          };
        },
      ];
    },
    {
      name: "create";
      discriminator: [24, 30, 200, 40, 5, 28, 7, 119];
      accounts: [
        {
          name: "payer";
          docs: ["Rent payer"];
          writable: true;
          signer: true;
        },
        {
          name: "sender";
          writable: true;
          signer: true;
        },
        {
          name: "senderTokens";
          docs: ["Associated token account address of `payer`."];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "sender";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              },
            ];
            program: {
              kind: "const";
              value: [
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
              ];
            };
          };
        },
        {
          name: "recipient";
          writable: true;
        },
        {
          name: "recipientTokens";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "recipient";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              },
            ];
            program: {
              kind: "const";
              value: [
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
              ];
            };
          };
        },
        {
          name: "proxyMetadata";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 116, 114, 97, 99, 116];
              },
              {
                kind: "account";
                path: "streamMetadata";
              },
            ];
          };
        },
        {
          name: "proxyTokens";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "proxyMetadata";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              },
            ];
            program: {
              kind: "const";
              value: [
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
              ];
            };
          };
        },
        {
          name: "streamMetadata";
          writable: true;
          signer: true;
        },
        {
          name: "escrowTokens";
          writable: true;
        },
        {
          name: "withdrawor";
          writable: true;
        },
        {
          name: "partner";
        },
        {
          name: "mint";
        },
        {
          name: "feeOracle";
        },
        {
          name: "priceOracle";
        },
        {
          name: "rent";
          address: "SysvarRent111111111111111111111111111111111";
        },
        {
          name: "streamflowProgram";
          address: "strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m";
        },
        {
          name: "tokenProgram";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: {
              name: "createParams";
            };
          };
        },
      ];
    },
    {
      name: "createTestOracle";
      discriminator: [183, 110, 4, 11, 131, 220, 84, 12];
      accounts: [
        {
          name: "creator";
          writable: true;
          signer: true;
        },
        {
          name: "mint";
        },
        {
          name: "testOracle";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [116, 101, 115, 116, 45, 111, 114, 97, 99, 108, 101];
              },
              {
                kind: "account";
                path: "mint";
              },
              {
                kind: "account";
                path: "creator";
              },
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "params";
          type: {
            defined: {
              name: "createTestOracleParams";
            };
          };
        },
      ];
    },
    {
      name: "setTestOracleAuthority";
      discriminator: [26, 66, 233, 99, 38, 118, 181, 247];
      accounts: [
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "testOracle";
          writable: true;
        },
        {
          name: "newAuthority";
        },
      ];
      args: [];
    },
    {
      name: "updateAmount";
      discriminator: [212, 178, 69, 133, 251, 180, 212, 71];
      accounts: [
        {
          name: "authority";
          docs: ["Wallet authorised to call this method"];
          writable: true;
          signer: true;
        },
        {
          name: "proxyMetadata";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 116, 114, 97, 99, 116];
              },
              {
                kind: "account";
                path: "streamMetadata";
              },
            ];
          };
        },
        {
          name: "streamMetadata";
          writable: true;
        },
        {
          name: "withdrawor";
          writable: true;
        },
        {
          name: "priceOracle";
          relations: ["proxyMetadata"];
        },
        {
          name: "streamflowProgram";
          address: "strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "updateTestOracle";
      discriminator: [158, 147, 215, 74, 34, 123, 80, 76];
      accounts: [
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "testOracle";
          writable: true;
        },
      ];
      args: [
        {
          name: "params";
          type: {
            defined: {
              name: "updateTestOracleParams";
            };
          };
        },
      ];
    },
  ];
  accounts: [
    {
      name: "contract";
      discriminator: [172, 138, 115, 242, 121, 67, 183, 26];
    },
    {
      name: "testOracle";
      discriminator: [198, 49, 63, 134, 232, 251, 168, 28];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "unauthorized";
      msg: "Authority does not have permission for this action";
    },
    {
      code: 6001;
      name: "arithmeticError";
      msg: "Arithmetic error";
    },
    {
      code: 6002;
      name: "unsupportedTokenExtensions";
      msg: "Mint has unsupported Token Extensions";
    },
    {
      code: 6003;
      name: "periodTooShort";
      msg: "Provided period is too short, should be equal or more than 30 seconds";
    },
    {
      code: 6004;
      name: "invalidTickSize";
      msg: "Provided percentage tick size is invalid";
    },
    {
      code: 6005;
      name: "invalidPercentageBoundaries";
      msg: "Provided percentage bounds are invalid";
    },
    {
      code: 6006;
      name: "invalidPriceBoundaries";
      msg: "Provided price bounds are invalid";
    },
    {
      code: 6007;
      name: "unsupportedOracle";
      msg: "Unsupported price oracle";
    },
    {
      code: 6008;
      name: "invalidOracleAccount";
      msg: "Invalid oracle account";
    },
    {
      code: 6009;
      name: "invalidOraclePrice";
      msg: "Invalid oracle price";
    },
    {
      code: 6010;
      name: "invalidStreamMetadata";
      msg: "Invalid Stream Metadata";
    },
    {
      code: 6011;
      name: "amountAlreadyUpdated";
      msg: "Release amount has already been updated in this period";
    },
    {
      code: 6012;
      name: "allFundsUnlocked";
      msg: "All funds are already unlocked";
    },
  ];
  types: [
    {
      name: "changeOracleParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "oracleType";
            type: {
              defined: {
                name: "oracleType";
              };
            };
          },
        ];
      };
    },
    {
      name: "contract";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            docs: ["Bump Seed used to sign transactions"];
            type: "u8";
          },
          {
            name: "sender";
            docs: ["Original Contract sender"];
            type: "pubkey";
          },
          {
            name: "senderTokens";
            docs: ["Original Contract sender tokens address"];
            type: "pubkey";
          },
          {
            name: "stream";
            docs: ["Vesting Stream address"];
            type: "pubkey";
          },
          {
            name: "priceOracleType";
            docs: ["Type of the Oracle used to derive Token Price"];
            type: {
              defined: {
                name: "oracleType";
              };
            };
          },
          {
            name: "priceOracle";
            docs: ["Address of the Price Oracle"];
            type: "pubkey";
          },
          {
            name: "minPrice";
            docs: ["Min price boundary"];
            type: "u64";
          },
          {
            name: "maxPrice";
            docs: ["Max price boundary"];
            type: "u64";
          },
          {
            name: "minPercentage";
            docs: ["Min percentage boundary, can be 0 that equals 1 Raw Token"];
            type: "u64";
          },
          {
            name: "maxPercentage";
            docs: ["Max percentage boundary"];
            type: "u64";
          },
          {
            name: "tickSize";
            docs: ["Ticket size for percentage boundaries"];
            type: "u64";
          },
          {
            name: "startTime";
            docs: [
              "unlock_start from Stream contract for our worker to be able to fetch it in one call with the proxy contract",
            ];
            type: "u64";
          },
          {
            name: "endTime";
            docs: [
              "Copy end_time from Stream contract for our worker to be able to fetch it in one call with the proxy contract",
            ];
            type: "u64";
          },
          {
            name: "period";
            docs: [
              "Copy period from Stream contract for our worker to be able to fetch it in one call with the proxy contract",
            ];
            type: "u64";
          },
          {
            name: "lastAmountUpdateTime";
            docs: [
              "Copy last_rate_change_time from Stream contract for our worker to be able to fetch it in one call with the proxy contract",
            ];
            type: "u64";
          },
          {
            name: "lastPrice";
            docs: ["Price used on last amount calculation"];
            type: "u64";
          },
          {
            name: "streamCanceledTime";
            docs: ["Timestamp when stream was cancelled"];
            type: "u64";
          },
          {
            name: "initialAmountPerPeriod";
            docs: ["Amount per period to use as base for calculations"];
            type: "u64";
          },
          {
            name: "initialPrice";
            docs: ["Initial token price at the time of Contract creation"];
            type: "u64";
          },
          {
            name: "buffer";
            docs: ["Buffer for additional fields"];
            type: {
              array: ["u8", 32];
            };
          },
        ];
      };
    },
    {
      name: "createParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "startTime";
            docs: ["Timestamp when the tokens start vesting"];
            type: "u64";
          },
          {
            name: "netAmountDeposited";
            docs: ["Deposited amount of tokens"];
            type: "u64";
          },
          {
            name: "period";
            docs: ["Time step (period) in seconds per which the vesting/release occurs"];
            type: "u64";
          },
          {
            name: "amountPerPeriod";
            docs: ["Base Amount released per period. Combined with `period`, we get a release rate."];
            type: "u64";
          },
          {
            name: "cliff";
            docs: ['Vesting contract "cliff" timestamp'];
            type: "u64";
          },
          {
            name: "cliffAmount";
            docs: ['Amount unlocked at the "cliff" timestamp'];
            type: "u64";
          },
          {
            name: "cancelableBySender";
            docs: ["Whether a stream can be canceled by a sender"];
            type: "bool";
          },
          {
            name: "cancelableByRecipient";
            docs: ["Whether a stream can be canceled by a recipient"];
            type: "bool";
          },
          {
            name: "transferableBySender";
            docs: ["Whether the sender can transfer the stream"];
            type: "bool";
          },
          {
            name: "transferableByRecipient";
            docs: ["Whether the recipient can transfer the stream"];
            type: "bool";
          },
          {
            name: "canTopup";
            docs: ["Whether topup is enabled"];
            type: "bool";
          },
          {
            name: "streamName";
            docs: ["The name of this stream"];
            type: {
              array: ["u8", 64];
            };
          },
          {
            name: "minPrice";
            type: "u64";
          },
          {
            name: "maxPrice";
            type: "u64";
          },
          {
            name: "minPercentage";
            type: "u64";
          },
          {
            name: "maxPercentage";
            type: "u64";
          },
          {
            name: "tickSize";
            type: "u64";
          },
          {
            name: "skipInitial";
            docs: ["Whether to skip initial calculation of amount per period"];
            type: "bool";
          },
          {
            name: "oracleType";
            docs: ["Type of Oracle to use to derive Token Price"];
            type: {
              defined: {
                name: "oracleType";
              };
            };
          },
        ];
      };
    },
    {
      name: "createTestOracleParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "price";
            type: "u64";
          },
          {
            name: "expo";
            type: "i32";
          },
          {
            name: "conf";
            type: "u64";
          },
          {
            name: "publishTime";
            type: "i64";
          },
        ];
      };
    },
    {
      name: "oracleType";
      type: {
        kind: "enum";
        variants: [
          {
            name: "none";
          },
          {
            name: "test";
          },
          {
            name: "pyth";
          },
          {
            name: "switchboard";
          },
        ];
      };
    },
    {
      name: "testOracle";
      type: {
        kind: "struct";
        fields: [
          {
            name: "price";
            type: "u64";
          },
          {
            name: "expo";
            type: "i32";
          },
          {
            name: "conf";
            type: "u64";
          },
          {
            name: "publishTime";
            type: "i64";
          },
          {
            name: "creator";
            type: "pubkey";
          },
          {
            name: "authority";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "updateTestOracleParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "price";
            type: "u64";
          },
          {
            name: "expo";
            type: "i32";
          },
          {
            name: "conf";
            type: "u64";
          },
          {
            name: "publishTime";
            type: "i64";
          },
        ];
      };
    },
  ];
};
