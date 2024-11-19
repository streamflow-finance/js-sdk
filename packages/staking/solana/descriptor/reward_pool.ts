/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/reward_pool.json`.
 */
export type RewardPool = {
  address: "RWRDdfRbi3339VgKxTAXg4cjyniF7cbhNbMxZWiSKmj";
  metadata: {
    name: "rewardPool";
    version: "1.0.0";
    spec: "0.1.0";
    description: "Program to manage Reward Pools for Stake Pools and claim rewards from them";
  };
  instructions: [
    {
      name: "changeAuthority";
      discriminator: [50, 106, 66, 104, 99, 118, 145, 88];
      accounts: [
        {
          name: "authority";
          docs: ["Current Authority"];
          writable: true;
          signer: true;
          relations: ["rewardPool"];
        },
        {
          name: "newAuthority";
        },
        {
          name: "rewardPool";
          docs: ["Stake Pool"];
          writable: true;
        },
      ];
      args: [];
    },
    {
      name: "claimRewards";
      discriminator: [4, 144, 132, 71, 116, 23, 151, 80];
      accounts: [
        {
          name: "rewardPool";
          docs: ["Reward Pool"];
          writable: true;
        },
        {
          name: "stakeEntry";
          docs: ["Stake Entry for which rewards are being claimed"];
        },
        {
          name: "rewardEntry";
          docs: ["Reward Entry that stores metadata about claimed rewards"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [114, 101, 119, 97, 114, 100, 45, 101, 110, 116, 114, 121];
              },
              {
                kind: "account";
                path: "rewardPool";
              },
              {
                kind: "account";
                path: "stakeEntry";
              },
            ];
          };
        },
        {
          name: "vault";
          docs: ["Reward Pool Vault that stores tokens"];
          writable: true;
          relations: ["rewardPool"];
        },
        {
          name: "to";
          docs: ["Account to send the reward tokens to."];
          writable: true;
        },
        {
          name: "claimant";
          docs: ["Who is claiming the tokens."];
          writable: true;
          signer: true;
        },
        {
          name: "mint";
          docs: ["The mint to claim."];
          relations: ["rewardPool"];
        },
        {
          name: "tokenProgram";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "closeEntry";
      discriminator: [132, 26, 202, 145, 190, 37, 114, 67];
      accounts: [
        {
          name: "rewardPool";
          docs: ["Reward Pool"];
        },
        {
          name: "stakeEntry";
          docs: ["Stake Entry for which rewards are being claimed"];
        },
        {
          name: "rewardEntry";
          docs: ["Reward Entry that stores metadata about claimed rewards"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [114, 101, 119, 97, 114, 100, 45, 101, 110, 116, 114, 121];
              },
              {
                kind: "account";
                path: "rewardPool";
              },
              {
                kind: "account";
                path: "stakeEntry";
              },
            ];
          };
        },
        {
          name: "authority";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "createEntry";
      discriminator: [248, 207, 142, 242, 66, 162, 150, 16];
      accounts: [
        {
          name: "stakePool";
          docs: ["Original Stake Pool"];
          relations: ["rewardPool", "stakeEntry"];
        },
        {
          name: "rewardPool";
          docs: ["Reward Pool"];
        },
        {
          name: "stakeEntry";
          docs: ["Stake Entry for which rewards are being claimed"];
        },
        {
          name: "rewardEntry";
          docs: ["Reward Entry that stores metadata about claimed rewards"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [114, 101, 119, 97, 114, 100, 45, 101, 110, 116, 114, 121];
              },
              {
                kind: "account";
                path: "rewardPool";
              },
              {
                kind: "account";
                path: "stakeEntry";
              },
            ];
          };
        },
        {
          name: "payer";
          docs: ["Rent payer"];
          writable: true;
          signer: true;
        },
        {
          name: "authority";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "createPool";
      discriminator: [233, 146, 209, 142, 207, 104, 64, 188];
      accounts: [
        {
          name: "stakePool";
          docs: ["Stake Pool to Which Reward Pool is being added"];
        },
        {
          name: "rewardPool";
          docs: ["Reward Pool to add"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [114, 101, 119, 97, 114, 100, 45, 112, 111, 111, 108];
              },
              {
                kind: "account";
                path: "stakePool";
              },
              {
                kind: "account";
                path: "mint";
              },
              {
                kind: "arg";
                path: "nonce";
              },
            ];
          };
        },
        {
          name: "mint";
          docs: ["Mint used for rewards"];
        },
        {
          name: "vault";
          docs: ["Escrow Account that will store the tokens"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [114, 101, 119, 97, 114, 100, 45, 118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "rewardPool";
              },
            ];
          };
        },
        {
          name: "creator";
          docs: ["Reward Pool creator"];
          writable: true;
          signer: true;
        },
        {
          name: "tokenProgram";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "nonce";
          type: "u8";
        },
        {
          name: "rewardAmount";
          type: "u64";
        },
        {
          name: "rewardPeriod";
          type: "u64";
        },
        {
          name: "permissionless";
          type: "bool";
        },
        {
          name: "lastClaimPeriodOpt";
          type: {
            option: "u64";
          };
        },
      ];
    },
    {
      name: "fundPool";
      discriminator: [36, 57, 233, 176, 181, 20, 87, 159];
      accounts: [
        {
          name: "funder";
          docs: ["Reward Pool funder"];
          writable: true;
          signer: true;
        },
        {
          name: "from";
          docs: ["Token Account from which tokens will be transferred"];
          writable: true;
        },
        {
          name: "vault";
          docs: ["Reward Pool Vault that stores tokens"];
          writable: true;
          relations: ["rewardPool"];
        },
        {
          name: "mint";
          docs: ["Mint of reward tokens"];
          relations: ["rewardPool"];
        },
        {
          name: "rewardPool";
          docs: ["Stake Pool"];
          writable: true;
        },
        {
          name: "streamflowTreasury";
          writable: true;
          address: "5SEpbdjFK5FxwTvfsGMXVQTD2v4M2c5tyRTxhdsPkgDw";
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
          name: "config";
          docs: ["Fee Configuration"];
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
            program: {
              kind: "account";
              path: "feeProgram";
            };
          };
        },
        {
          name: "feeValue";
          docs: ["Fee Value for the funder account"];
          optional: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [102, 101, 101, 45, 118, 97, 108, 117, 101];
              },
              {
                kind: "account";
                path: "funder";
              },
            ];
            program: {
              kind: "account";
              path: "feeProgram";
            };
          };
        },
        {
          name: "feeProgram";
          address: "FEELzfBhsWXTNJX53zZcDVfRNoFYZQ6cZA3jLiGVL16V";
        },
        {
          name: "tokenProgram";
        },
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
      ];
    },
    {
      name: "updatePool";
      discriminator: [239, 214, 170, 78, 36, 35, 30, 34];
      accounts: [
        {
          name: "authority";
          docs: ["Current Authority"];
          writable: true;
          signer: true;
          relations: ["rewardPool"];
        },
        {
          name: "stakePool";
          docs: ["Stake Pool to Which Reward Pool belongs"];
          relations: ["rewardPool"];
        },
        {
          name: "rewardPool";
          docs: ["Reward Pool"];
          writable: true;
        },
      ];
      args: [
        {
          name: "rewardAmount";
          type: {
            option: "u64";
          };
        },
        {
          name: "rewardPeriod";
          type: {
            option: "u64";
          };
        },
      ];
    },
  ];
  accounts: [
    {
      name: "config";
      discriminator: [155, 12, 170, 224, 30, 250, 204, 130];
    },
    {
      name: "feeValue";
      discriminator: [10, 188, 89, 64, 4, 183, 231, 0];
    },
    {
      name: "rewardEntry";
      discriminator: [208, 191, 173, 14, 213, 84, 179, 162];
    },
    {
      name: "rewardPool";
      discriminator: [134, 121, 197, 211, 133, 154, 82, 32];
    },
    {
      name: "stakeEntry";
      discriminator: [187, 127, 9, 35, 155, 68, 86, 40];
    },
    {
      name: "stakePool";
      discriminator: [121, 34, 206, 21, 79, 127, 255, 28];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "arithmeticError";
      msg: "Arithmetic Error (overflow/underflow)";
    },
    {
      code: 6001;
      name: "invalidRewardAmount";
      msg: "Reward amount should be more than 0";
    },
    {
      code: 6002;
      name: "invalidRewardPeriod";
      msg: "Reward period should be more than 0";
    },
    {
      code: 6003;
      name: "unauthorized";
      msg: "Account is not authorized to execute this instruction";
    },
    {
      code: 6004;
      name: "ownerMismatch";
      msg: "Token account owner did not match intended owner";
    },
    {
      code: 6005;
      name: "invalidRewardVault";
      msg: "Provided Reward Vault is Invalid";
    },
    {
      code: 6006;
      name: "invalidRewardEntry";
      msg: "Provided Reward Entry is Invalid";
    },
    {
      code: 6007;
      name: "invalidStakeEntry";
      msg: "Provided Stake Entry is Invalid";
    },
    {
      code: 6008;
      name: "invalidRewardPool";
      msg: "Provided Reward Pool is Invalid";
    },
    {
      code: 6009;
      name: "invalidMint";
      msg: "Invalid Mint";
    },
    {
      code: 6010;
      name: "stakeEntryClosed";
      msg: "Stake Entry is closed, rewards are not claimable anymore";
    },
    {
      code: 6011;
      name: "stakeEntryOpened";
      msg: "Stake Entry is still opened, closing is not possible";
    },
    {
      code: 6012;
      name: "rewardPoolDrained";
      msg: "Reward Pool does not have enough Rewards for Claiming";
    },
    {
      code: 6013;
      name: "updateTooSoon";
      msg: "Repeated update can not happen sooner than the stake pool max duration";
    },
    {
      code: 6014;
      name: "invalidLastClaimPeriod";
      msg: "Invalid last claim period provided";
    },
  ];
  types: [
    {
      name: "config";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            docs: ["Fee Manager authority"];
            type: "pubkey";
          },
          {
            name: "streamflowFee";
            docs: ["Default fee"];
            type: "u64";
          },
          {
            name: "buffer1";
            docs: ["Buffer for additional fields"];
            type: {
              array: ["u8", 64];
            };
          },
          {
            name: "buffer2";
            docs: ["Buffer for additional fields"];
            type: {
              array: ["u8", 64];
            };
          },
          {
            name: "buffer3";
            docs: ["Buffer for additional fields"];
            type: {
              array: ["u8", 64];
            };
          },
        ];
      };
    },
    {
      name: "feeValue";
      type: {
        kind: "struct";
        fields: [
          {
            name: "streamflowFee";
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
      name: "rewardEntry";
      type: {
        kind: "struct";
        fields: [
          {
            name: "rewardPool";
            docs: ["Reward Pool"];
            type: "pubkey";
          },
          {
            name: "stakeEntry";
            docs: ["Stake Entry for which reward entry was initialized"];
            type: "pubkey";
          },
          {
            name: "createdTs";
            docs: ["Timestamp when reward entry has been created"];
            type: "u64";
          },
          {
            name: "accountedAmount";
            docs: ["Sum of accounted amounts, used to correctly issue rewards in case of precision loss"];
            type: "u128";
          },
          {
            name: "claimedAmount";
            docs: ["Sum of already claimed rewards"];
            type: "u64";
          },
          {
            name: "lastAccountedTs";
            docs: ["Timestamp when rewards have been claimed last time"];
            type: "u64";
          },
          {
            name: "lastRewardAmount";
            docs: ["Reward amount used on last claim or entry creation"];
            type: "u64";
          },
          {
            name: "lastRewardPeriod";
            docs: ["Reward Period used on last claim or entry creation"];
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
      name: "rewardPool";
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
            name: "stakePool";
            docs: ["Stake Pool for which Reward Pool was added"];
            type: "pubkey";
          },
          {
            name: "mint";
            docs: ["Mint of Reward Pool"];
            type: "pubkey";
          },
          {
            name: "creator";
            docs: ["Creator of the Pool"];
            type: "pubkey";
          },
          {
            name: "authority";
            docs: ["Current authority"];
            type: "pubkey";
          },
          {
            name: "rewardAmount";
            docs: [
              "Amount of rewards that will be distributed per effective stake",
              "",
              "Should be a fraction of a raw token amount which is 1 / 10^9,",
              "i.e. `reward_amount` of `1_000_000_000` equals one raw token per effective stake",
            ];
            type: "u64";
          },
          {
            name: "rewardPeriod";
            docs: ["Period of Rewards distribution in seconds"];
            type: "u64";
          },
          {
            name: "permissionless";
            docs: ["Whether anyone can fund the Pool"];
            type: "bool";
          },
          {
            name: "lastRewardAmount";
            docs: ["`reward_amount` used before the last update"];
            type: "u64";
          },
          {
            name: "lastRewardPeriod";
            docs: ["`reward_period` used before the last update"];
            type: "u64";
          },
          {
            name: "lastAmountUpdateTs";
            docs: ["Time when `reward_amount` was updated the last time"];
            type: "u64";
          },
          {
            name: "lastPeriodUpdateTs";
            docs: ["Time when `reward_period` was updated the last time"];
            type: "u64";
          },
          {
            name: "vault";
            docs: ["Escrow Account that stores reward tokens"];
            type: "pubkey";
          },
          {
            name: "fundedAmount";
            docs: ["Total funded amount"];
            type: "u64";
          },
          {
            name: "claimedAmount";
            docs: ["Total number of rewards claimed"];
            type: "u64";
          },
          {
            name: "createdTs";
            docs: ["Time when Reward Pool was created"];
            type: "u64";
          },
          {
            name: "lastClaimPeriod";
            docs: ["For how much seconds after unstake user should be able to claim rewards"];
            type: "u64";
          },
          {
            name: "buffer";
            docs: ["Buffer for additional fields"];
            type: {
              array: ["u8", 48];
            };
          },
        ];
      };
    },
    {
      name: "stakeEntry";
      type: {
        kind: "struct";
        fields: [
          {
            name: "nonce";
            docs: ["Nonce to differentiate stakes for the same pool"];
            type: "u32";
          },
          {
            name: "stakePool";
            docs: ["Stake Pool for which tokens were staked"];
            type: "pubkey";
          },
          {
            name: "payer";
            docs: ["Original Owner of Staked tokens"];
            type: "pubkey";
          },
          {
            name: "authority";
            docs: ["Authority of the Entry"];
            type: "pubkey";
          },
          {
            name: "amount";
            docs: ["Amount of deposited funds"];
            type: "u64";
          },
          {
            name: "duration";
            docs: ["Duration of the lockup"];
            type: "u64";
          },
          {
            name: "effectiveAmount";
            docs: ["Effective Amount staked, does not equal to deposited amount, accounts for Stake Weight"];
            type: "u128";
          },
          {
            name: "createdTs";
            docs: ["Timestamp when Deposit was made"];
            type: "u64";
          },
          {
            name: "closedTs";
            docs: ["Flag whether entry has been already unstaked"];
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
      name: "stakePool";
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
            name: "mint";
            docs: ["Mint of the Stake Pool"];
            type: "pubkey";
          },
          {
            name: "creator";
            docs: ["Initial Creator"];
            type: "pubkey";
          },
          {
            name: "authority";
            docs: ["Current authority"];
            type: "pubkey";
          },
          {
            name: "minWeight";
            docs: [
              "The lowest weight awarded for staking, measured as a fraction of `1 / SCALE_FACTOR_BASE`.",
              "For instance:",
              "* `min_weight = 1 x SCALE_FACTOR_BASE` signifies a minimum multiplier of 1x for min staking duration",
              "* `min_weight = 2 x SCALE_FACTOR_BASE` indicates a minimum multiplier of 2x for min staking duration",
            ];
            type: "u64";
          },
          {
            name: "maxWeight";
            docs: [
              "The highest weight awarded for staking, measured as a fraction of `1 / SCALE_FACTOR_BASE`.",
              "For instance:",
              "* `max_weight = 1 x SCALE_FACTOR_BASE` signifies a max multiplier of 1x for max staking duration",
              "* `max_weight = 2 x SCALE_FACTOR_BASE` indicates a max multiplier of 2x for max staking duration",
            ];
            type: "u64";
          },
          {
            name: "minDuration";
            docs: ["Min Duration of stake in seconds"];
            type: "u64";
          },
          {
            name: "maxDuration";
            docs: ["Max Duration of stake in seconds, the more duration, the more weight the stake has"];
            type: "u64";
          },
          {
            name: "permissionless";
            docs: ["Whether anyone can add Reward Pools or just admin"];
            type: "bool";
          },
          {
            name: "vault";
            docs: ["Escrow Account that stores staked tokens"];
            type: "pubkey";
          },
          {
            name: "stakeMint";
            docs: ["Stake Mint, will be returned in exchange for stake tokens"];
            type: "pubkey";
          },
          {
            name: "totalStake";
            docs: ["Total number of Staked tokens"];
            type: "u64";
          },
          {
            name: "totalEffectiveStake";
            docs: [
              "Total staked tokens accounting for each stake weight, does not equal `total_stake`,",
              "represents a sum of effective stake multiplied by 10^9 for precision",
            ];
            type: "u128";
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
  ];
};
