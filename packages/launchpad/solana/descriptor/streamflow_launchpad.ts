/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/streamflow_launchpad.json`.
 */
export type StreamflowLaunchpad = {
  address: "BUYfFzeTWeRW5JrPjCutbsvzjA5ERS8EnGujJjfmnJu6";
  metadata: {
    name: "streamflowLaunchpad";
    version: "1.0.0";
    spec: "0.1.0";
    description: "A Launchpad for a pre-sale";
  };
  instructions: [
    {
      name: "claimAllocatedInstant";
      docs: ["Claim allocated funds instantly in case vesting schedule is not set"];
      discriminator: [49, 89, 180, 221, 1, 139, 121, 192];
      accounts: [
        {
          name: "launchpad";
          docs: ["[Launchpad]."];
          writable: true;
          relations: ["depositAccount"];
        },
        {
          name: "depositAccount";
          docs: ["Reward Entry that stores metadata about claimed rewards"];
          writable: true;
        },
        {
          name: "from";
          docs: ["Vault that stores Base tokens"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "launchpad";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "baseMint";
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
          name: "to";
          docs: ["Token Account to which tokens will be transferred"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "owner";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "baseMint";
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
          name: "payer";
          docs: ["Rent payer"];
          writable: true;
          signer: true;
        },
        {
          name: "owner";
        },
        {
          name: "baseMint";
          docs: ["Base Mint of the Launchpad"];
          relations: ["launchpad"];
        },
        {
          name: "systemProgram";
          docs: ["The [System] program."];
          address: "11111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          docs: ["The [Associated Token] program."];
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "tokenProgram";
          docs: ["The [Token] program."];
        },
      ];
      args: [];
    },
    {
      name: "claimAllocatedVested";
      docs: ["Claim allocated funds in a vested manner in case vesting schedule has been set"];
      discriminator: [14, 116, 137, 52, 178, 218, 187, 229];
      accounts: [
        {
          name: "launchpad";
          docs: ["[Launchpad]."];
          writable: true;
          relations: ["depositAccount"];
        },
        {
          name: "depositAccount";
          docs: ["Reward Entry that stores metadata about claimed rewards"];
          writable: true;
        },
        {
          name: "from";
          docs: ["Vault that stores Base tokens"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "launchpad";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "baseMint";
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
          name: "to";
          docs: ["Token Account to which tokens will be vested"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "owner";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "baseMint";
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
          name: "payer";
          docs: ["Rent payer"];
          writable: true;
          signer: true;
        },
        {
          name: "owner";
          relations: ["depositAccount"];
        },
        {
          name: "baseMint";
          docs: ["Base Mint of the Launchpad"];
          relations: ["launchpad"];
        },
        {
          name: "priceOracle";
          relations: ["launchpad"];
        },
        {
          name: "authority";
          relations: ["launchpad"];
        },
        {
          name: "proxyMetadata";
          writable: true;
        },
        {
          name: "proxyTokens";
          docs: ["Vault that stores Base tokens"];
          writable: true;
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
          name: "proxyProgram";
          address: "aSTRM2NKoKxNnkmLWk9sz3k74gKBk9t7bpPrTGxMszH";
        },
        {
          name: "streamflowProgram";
          address: "strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m";
        },
        {
          name: "feeOracle";
        },
        {
          name: "rent";
          docs: ["Rent account required by streamflow protocol"];
          address: "SysvarRent111111111111111111111111111111111";
        },
        {
          name: "associatedTokenProgram";
          docs: ["The [Associated Token] program."];
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "tokenProgram";
          docs: ["The [Token] program."];
        },
        {
          name: "systemProgram";
          docs: ["The [System] program."];
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "claimDeposits";
      docs: ["Claim deposited funds to pre-configured `receiver` account"];
      discriminator: [69, 159, 225, 170, 28, 44, 76, 102];
      accounts: [
        {
          name: "launchpad";
          docs: ["[Launchpad]."];
          writable: true;
        },
        {
          name: "receiver";
          docs: ["Deposits receiver token account"];
          writable: true;
          relations: ["launchpad"];
        },
        {
          name: "vault";
          docs: ["Launchpad Vault that stores deposited tokens"];
          writable: true;
          relations: ["launchpad"];
        },
        {
          name: "authority";
          docs: ["Launchpad authority"];
          writable: true;
          signer: true;
        },
        {
          name: "quoteMint";
          docs: ["Quote Mint of the Launchpad"];
          relations: ["launchpad"];
        },
        {
          name: "tokenProgram";
          docs: ["The [Token] program."];
        },
      ];
      args: [];
    },
    {
      name: "createLaunchpad";
      docs: ["Create new Launchpad for `base_mint` <-> `quote_mint` pair"];
      discriminator: [193, 189, 26, 187, 44, 137, 43, 190];
      accounts: [
        {
          name: "launchpad";
          docs: ["[Launchpad]."];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [108, 97, 117, 110, 99, 104, 112, 97, 100];
              },
              {
                kind: "account";
                path: "baseMint";
              },
              {
                kind: "arg";
                path: "ix.nonce";
              },
            ];
          };
        },
        {
          name: "vault";
          docs: ["Escrow Account that will store deposits"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "launchpad";
              },
            ];
          };
        },
        {
          name: "baseMint";
          docs: ["Base Mint of the Launchpad"];
        },
        {
          name: "quoteMint";
          docs: ["Quote Mint for deposits"];
        },
        {
          name: "priceOracle";
        },
        {
          name: "authority";
          docs: [
            "Admin wallet, responsible for creating the launchpad and paying for the transaction.",
            "Also is the authority",
          ];
          writable: true;
          signer: true;
        },
        {
          name: "receiver";
          docs: ["Deposits receiver token account"];
          writable: true;
        },
        {
          name: "systemProgram";
          docs: ["The [System] program."];
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          docs: ["The [Token] program."];
        },
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: {
              name: "createLaunchpadIx";
            };
          };
        },
      ];
    },
    {
      name: "deposit";
      docs: ["Deposit funds to receive allocation"];
      discriminator: [242, 35, 198, 137, 82, 225, 242, 182];
      accounts: [
        {
          name: "launchpad";
          docs: ["[Launchpad]."];
          writable: true;
        },
        {
          name: "depositAccount";
          docs: ["Reward Entry that stores metadata about claimed rewards"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [100, 101, 112, 111, 115, 105, 116];
              },
              {
                kind: "account";
                path: "launchpad";
              },
              {
                kind: "account";
                path: "owner";
              },
            ];
          };
        },
        {
          name: "from";
          docs: ["Token Account from which stake tokens will be transferred"];
          writable: true;
        },
        {
          name: "vault";
          docs: ["Stake Pool Vault that stores staked tokens"];
          writable: true;
          relations: ["launchpad"];
        },
        {
          name: "payer";
          docs: ["Rent payer"];
          writable: true;
          signer: true;
        },
        {
          name: "owner";
        },
        {
          name: "baseMint";
          docs: ["Base Mint of the Launchpad"];
          relations: ["launchpad"];
        },
        {
          name: "quoteMint";
          docs: ["Quote Mint of the Launchpad"];
          relations: ["launchpad"];
        },
        {
          name: "systemProgram";
          docs: ["The [System] program."];
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          docs: ["The [Token] program."];
        },
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: {
              name: "depositIx";
            };
          };
        },
      ];
    },
  ];
  accounts: [
    {
      name: "depositAccount";
      discriminator: [148, 37, 207, 116, 61, 33, 53, 179];
    },
    {
      name: "launchpad";
      discriminator: [247, 20, 16, 242, 203, 38, 169, 160];
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
      name: "invalidMemo";
      msg: "Provided memo is invalid or not provided";
    },
    {
      code: 6003;
      name: "invalidParams";
      msg: "Invalid Parameters provided";
    },
    {
      code: 6004;
      name: "invalidBaseMint";
      msg: "Invalid Base Mint";
    },
    {
      code: 6005;
      name: "invalidQuoteMint";
      msg: "Invalid Quote Mint";
    },
    {
      code: 6006;
      name: "invalidVault";
      msg: "Invalid Vault";
    },
    {
      code: 6007;
      name: "invalidLaunchpad";
      msg: "Invalid Launchpad";
    },
    {
      code: 6008;
      name: "invalidReceiver";
      msg: "Invalid Receiver provided";
    },
    {
      code: 6009;
      name: "depositingNotStarted";
      msg: "Depositing has not started yet";
    },
    {
      code: 6010;
      name: "depositingEnded";
      msg: "Depositing period has ended";
    },
    {
      code: 6011;
      name: "launchpadCancelled";
      msg: "Launchpad has been cancelled";
    },
    {
      code: 6012;
      name: "amountMoreThanIndividualCap";
      msg: "Deposit amount is more than Individual Cap";
    },
    {
      code: 6013;
      name: "amountMoreThanMaxCap";
      msg: "Deposit amount is more than Max Cap";
    },
    {
      code: 6014;
      name: "depositingNotEnded";
      msg: "Depositing period has not ended yet";
    },
    {
      code: 6015;
      name: "depositsAlreadyClaimed";
      msg: "Deposits has been already claimed";
    },
    {
      code: 6016;
      name: "vestingNotStarted";
      msg: "Vesting period has not started yet";
    },
    {
      code: 6017;
      name: "vestingAlreadyClaimed";
      msg: "Allocated amount has been claimed already";
    },
    {
      code: 6018;
      name: "instantClaimNotAllowed";
      msg: "Instant claiming not allowed";
    },
    {
      code: 6019;
      name: "vestedClaimNotAllowed";
      msg: "Vested claiming not allowed";
    },
    {
      code: 6020;
      name: "vestingCantBeClaimed";
      msg: "Vested can't be claimed after it started";
    },
  ];
  types: [
    {
      name: "createLaunchpadIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "nonce";
            type: "u8";
          },
          {
            name: "price";
            docs: ["Price in `quote_mint` decimal value for every whole `base_mint` token"];
            type: "u64";
          },
          {
            name: "individualDepositingCap";
            docs: ["Individual Depositing Cap in `quote_mint` Tokens"];
            type: "u64";
          },
          {
            name: "maxDepositingCap";
            docs: ["Max Depositing Cap in `quote_mint` Tokens"];
            type: "u64";
          },
          {
            name: "depositingStartTs";
            docs: ["When depositing should start"];
            type: "u64";
          },
          {
            name: "depositingEndTs";
            docs: ["When depositing should end"];
            type: "u64";
          },
          {
            name: "vestingStartTs";
            docs: ["When vesting contract start time should be"];
            type: "u64";
          },
          {
            name: "vestingPeriod";
            docs: ["Vesting release period in seconds"];
            type: "u64";
          },
          {
            name: "vestingEndTs";
            docs: ["When vesting contract end time should be"];
            type: "u64";
          },
          {
            name: "minPrice";
            docs: ["Min price for dynamic vesting"];
            type: "u64";
          },
          {
            name: "maxPrice";
            docs: ["Max price for dynamic vesting"];
            type: "u64";
          },
          {
            name: "minPercentage";
            docs: ["Min percentage for dynamic vesting"];
            type: "u64";
          },
          {
            name: "maxPercentage";
            docs: ["Max percentage for dynamic vesting"];
            type: "u64";
          },
          {
            name: "tickSize";
            docs: ["Size of the tick in dynamic vesting"];
            type: "u64";
          },
          {
            name: "skipInitial";
            docs: ["Whether to skip initial calculation of amount per period in dynamic vesting"];
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
          {
            name: "isMemoRequired";
            docs: ["Whether to require memo on deposit"];
            type: "bool";
          },
        ];
      };
    },
    {
      name: "depositAccount";
      type: {
        kind: "struct";
        fields: [
          {
            name: "launchpad";
            docs: ["Launchpad to which deposit belongs"];
            type: "pubkey";
          },
          {
            name: "owner";
            docs: ["Deposit owner"];
            type: "pubkey";
          },
          {
            name: "amount";
            docs: ["Amount of funds deposited in `quote_mint`"];
            type: "u64";
          },
          {
            name: "allocatedAmount";
            docs: ["Amount allocated according to amount deposited"];
            type: "u64";
          },
          {
            name: "createdTs";
            docs: ["Time when deposit was done initially"];
            type: "u64";
          },
          {
            name: "claimedTs";
            docs: ["Time when `allocated_amount` was claimed"];
            type: "u64";
          },
          {
            name: "buffer";
            docs: ["Buffer for additional fields"];
            type: {
              array: ["u8", 64];
            };
          },
        ];
      };
    },
    {
      name: "depositIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "amount";
            docs: ["Amount to deposit into the launchpad"];
            type: "u64";
          },
          {
            name: "autoCap";
            docs: ["Whether to allow automatically cap the amount in case amount exceeds `max_depositing_cap`"];
            type: "bool";
          },
        ];
      };
    },
    {
      name: "launchpad";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            docs: ["Bump Seed used to sign transactions"];
            type: "u8";
          },
          {
            name: "nonce";
            docs: ["Nonce to differentiate pools for the same mint"];
            type: "u8";
          },
          {
            name: "filler";
            docs: ["Filler to account for alignment"];
            type: {
              array: ["u8", 6];
            };
          },
          {
            name: "baseMint";
            docs: ["Mint of the Launchpad Token"];
            type: "pubkey";
          },
          {
            name: "quoteMint";
            docs: ["Mint of the Token to exchange base mint to"];
            type: "pubkey";
          },
          {
            name: "authority";
            docs: ["Current authority"];
            type: "pubkey";
          },
          {
            name: "receiver";
            docs: ["Token account that should receive deposits after launchpad deposits end"];
            type: "pubkey";
          },
          {
            name: "priceOracle";
            docs: ["Oracle account for price deriviation in vesting"];
            type: "pubkey";
          },
          {
            name: "vault";
            docs: ["Escrow Account that stores deposited tokens"];
            type: "pubkey";
          },
          {
            name: "config";
            docs: ["Configuration"];
            type: {
              defined: {
                name: "launchpadConfig";
              };
            };
          },
          {
            name: "vestingConfig";
            docs: ["Vesting Configuration"];
            type: {
              defined: {
                name: "vestingConfig";
              };
            };
          },
          {
            name: "state";
            docs: ["Current state of the Launchpad"];
            type: {
              defined: {
                name: "launchpadState";
              };
            };
          },
          {
            name: "buffer";
            docs: ["Buffer for additional fields"];
            type: {
              array: ["u8", 64];
            };
          },
        ];
      };
    },
    {
      name: "launchpadConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "price";
            docs: ["Price in `quote_mint` decimal value for every whole `base_mint` token"];
            type: "u64";
          },
          {
            name: "individualDepositingCap";
            docs: ["Individual Depositing Cap in `quote_mint` Tokens"];
            type: "u64";
          },
          {
            name: "maxDepositingCap";
            docs: ["Max Depositing Cap in `quote_mint` Tokens"];
            type: "u64";
          },
          {
            name: "depositingStartTs";
            docs: ["When depositing should start"];
            type: "u64";
          },
          {
            name: "depositingEndTs";
            docs: ["When depositing should end"];
            type: "u64";
          },
          {
            name: "isMemoRequired";
            docs: ["Whether to require memo on deposit"];
            type: "bool";
          },
        ];
      };
    },
    {
      name: "launchpadState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "totalDepositedAmount";
            docs: ["Total amount of `quote_mint` tokens deposited"];
            type: "u64";
          },
          {
            name: "totalDepositedUsers";
            docs: ["Total amount of users who deposited tokens"];
            type: "u64";
          },
          {
            name: "totalClaimedUsers";
            docs: ["Number of users who have claimed `base_mint` tokens already"];
            type: "u64";
          },
          {
            name: "createdTs";
            docs: ["Time when Launchpad was created"];
            type: "u64";
          },
          {
            name: "claimedTs";
            docs: ["Time when deposits where claimed to authority token account"];
            type: "u64";
          },
          {
            name: "cancelledTs";
            docs: ["Time when Launchpad was cancelled, makes withdrawals possible"];
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
      name: "vestingConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "startTs";
            docs: ["When vesting contract start time should be"];
            type: "u64";
          },
          {
            name: "period";
            docs: ["Vesting unlock/update period in seconds"];
            type: "u64";
          },
          {
            name: "endTs";
            docs: ["When vesting contract end time should be"];
            type: "u64";
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
  ];
};
