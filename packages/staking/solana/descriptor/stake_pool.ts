/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/stake_pool.json`.
 */
export type StakePool = {
  address: "STAKEvGqQTtzJZH6BWDcbpzXXn2BBerPAgQ3EGLN2GH";
  metadata: {
    name: "stakePool";
    version: "1.0.0";
    spec: "0.1.0";
    description: "Program to manage Stake Pools and stake/unstake tokens";
  };
  instructions: [
    {
      name: "changeAuthority";
      discriminator: [50, 106, 66, 104, 99, 118, 145, 88];
      accounts: [
        {
          name: "stakePool";
          docs: ["Stake Pool"];
          writable: true;
        },
        {
          name: "authority";
          docs: ["Current Authority"];
          writable: true;
          signer: true;
        },
        {
          name: "newAuthority";
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
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [115, 116, 97, 107, 101, 45, 112, 111, 111, 108];
              },
              {
                kind: "account";
                path: "mint";
              },
              {
                kind: "account";
                path: "creator";
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
          docs: ["Mint used for staking"];
        },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [115, 116, 97, 107, 101, 45, 118, 97, 117, 108, 116];
              },
              {
                kind: "account";
                path: "stakePool";
              },
            ];
          };
        },
        {
          name: "stakeMint";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [115, 116, 97, 107, 101, 45, 109, 105, 110, 116];
              },
              {
                kind: "account";
                path: "stakePool";
              },
            ];
          };
        },
        {
          name: "creator";
          docs: ["Stake Pool creator"];
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
          name: "maxWeight";
          type: "u64";
        },
        {
          name: "minDuration";
          type: "u64";
        },
        {
          name: "maxDuration";
          type: "u64";
        },
        {
          name: "permissionless";
          type: "bool";
        },
      ];
    },
    {
      name: "stake";
      discriminator: [206, 176, 202, 18, 200, 209, 179, 108];
      accounts: [
        {
          name: "stakePool";
          docs: ["Stake Pool"];
          writable: true;
        },
        {
          name: "stakeEntry";
          docs: ["Entry that will store Stake Metadata"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [115, 116, 97, 107, 101, 45, 101, 110, 116, 114, 121];
              },
              {
                kind: "account";
                path: "stakePool";
              },
              {
                kind: "account";
                path: "authority";
              },
              {
                kind: "arg";
                path: "nonce";
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
          relations: ["stakePool"];
        },
        {
          name: "to";
          docs: ["Token Account to transfer Stake Mint tokens to"];
          writable: true;
        },
        {
          name: "payer";
          docs: ["Owner of the Token Account from which tokens will be staked"];
          writable: true;
          signer: true;
        },
        {
          name: "authority";
        },
        {
          name: "mint";
          docs: ["Original mint of staked tokens"];
          writable: true;
          relations: ["stakePool"];
        },
        {
          name: "stakeMint";
          docs: ["Mint of stake tokens that will be minted in return for staking"];
          writable: true;
          relations: ["stakePool"];
        },
        {
          name: "tokenProgram";
        },
        {
          name: "rent";
          address: "SysvarRent111111111111111111111111111111111";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "nonce";
          type: "u32";
        },
        {
          name: "amount";
          type: "u64";
        },
        {
          name: "duration";
          type: "u64";
        },
      ];
    },
    {
      name: "unstake";
      discriminator: [90, 95, 107, 42, 205, 124, 50, 225];
      accounts: [
        {
          name: "stakePool";
          writable: true;
          relations: ["stakeEntry"];
        },
        {
          name: "stakeEntry";
          docs: ["Entry that stores Stake Metadata"];
          writable: true;
        },
        {
          name: "from";
          docs: ["Stake Mint Token account"];
          writable: true;
        },
        {
          name: "vault";
          docs: ["Escrow Account that stores Staked tokens"];
          writable: true;
          relations: ["stakePool"];
        },
        {
          name: "to";
          docs: ["Token account to withdraw Staked tokens to"];
          writable: true;
        },
        {
          name: "authority";
          docs: ["Stake Entry Authority"];
          writable: true;
          signer: true;
        },
        {
          name: "mint";
          docs: ["Original mint of staked tokens"];
          writable: true;
          relations: ["stakePool"];
        },
        {
          name: "stakeMint";
          docs: ["Stake Mint used to exchanged Staked tokens to"];
          writable: true;
          relations: ["stakePool"];
        },
        {
          name: "tokenProgram";
        },
      ];
      args: [];
    },
  ];
  accounts: [
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
      name: "invalidDuration";
      msg: "Minimum duration must be less than the maximum";
    },
    {
      code: 6001;
      name: "invalidWeight";
      msg: "Weight should be more than minimum";
    },
    {
      code: 6002;
      name: "durationTooShort";
      msg: "Duration of staking can't be less than minimum duration of the pool";
    },
    {
      code: 6003;
      name: "invalidStakeAmount";
      msg: "Stake amount should be more than 0";
    },
    {
      code: 6004;
      name: "arithmeticError";
      msg: "Arithmetic Error (overflow/underflow)";
    },
    {
      code: 6005;
      name: "unauthorized";
      msg: "Account is not authorized to execute this instruction";
    },
    {
      code: 6006;
      name: "ownerMismatch";
      msg: "Token account owner did not match intended owner";
    },
    {
      code: 6007;
      name: "invalidMint";
      msg: "Provided Mint does not equal the Pool Mint";
    },
    {
      code: 6008;
      name: "invalidStakeVault";
      msg: "Provided Stake Vault does not equal the Pool Vault";
    },
    {
      code: 6009;
      name: "invalidStakeMint";
      msg: "Provided Stake Mint does not equal the Pool Stake Mint";
    },
    {
      code: 6010;
      name: "invalidStakePool";
      msg: "Provided Stake Pool does not equal the Entry Stake Pool";
    },
    {
      code: 6011;
      name: "invalidPoolMint";
      msg: "Provided Mint does not equal the Pool Mint";
    },
    {
      code: 6012;
      name: "closedStake";
      msg: "Stake Entry is already closed and can't be used";
    },
    {
      code: 6013;
      name: "lockedStake";
      msg: "Stake is locked, unstake is not possible";
    },
    {
      code: 6014;
      name: "unsupportedTokenExtensions";
      msg: "Mint has unsupported Token Extensions";
    },
  ];
  types: [
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
