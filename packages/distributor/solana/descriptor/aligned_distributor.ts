/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/aligned_distributor.json`.
 */
export type AlignedDistributor = {
  address: "aMERKpFAWoChCi5oZwPvgsSCoGpZKBiU7fi76bdZjt2";
  metadata: {
    name: "alignedDistributor";
    version: "1.3.0";
    spec: "0.1.0";
    description: "Proxy for merkle distributor that updates Vesting duration according to token market performance.";
  };
  instructions: [
    {
      name: "changeOracle";
      discriminator: [177, 227, 230, 103, 13, 72, 141, 248];
      accounts: [
        {
          name: "alignedDistributor";
          docs: ["The [MerkleDistributor]."];
          writable: true;
        },
        {
          name: "admin";
          docs: ["Admin signer"];
          writable: true;
          signer: true;
        },
        {
          name: "newPriceOracle";
        },
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: {
              name: "changeOracleParams";
            };
          };
        },
      ];
    },
    {
      name: "clawback";
      discriminator: [111, 92, 142, 79, 33, 234, 82, 27];
      accounts: [
        {
          name: "alignedDistributor";
          docs: ["The [AlignedDistributor]."];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [97, 108, 105, 103, 110, 101, 100, 45, 100, 105, 115, 116, 114, 105, 98, 117, 116, 111, 114];
              },
              {
                kind: "account";
                path: "distributor";
              },
            ];
          };
        },
        {
          name: "distributor";
          docs: ["The [MerkleDistributor]."];
          writable: true;
        },
        {
          name: "from";
          docs: ["Distributor ATA containing the tokens to distribute."];
          writable: true;
        },
        {
          name: "to";
          docs: ["The Clawback token account."];
          writable: true;
        },
        {
          name: "admin";
          docs: ["Only Admin can trigger the clawback of funds"];
          writable: true;
          signer: true;
        },
        {
          name: "mint";
        },
        {
          name: "distributorProgram";
          address: "MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N";
        },
        {
          name: "systemProgram";
          docs: ["The [System] program."];
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
          docs: ["SPL [Token] program."];
        },
      ];
      args: [];
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
          name: "ix";
          type: {
            defined: {
              name: "createTestOracleParams";
            };
          };
        },
      ];
    },
    {
      name: "newDistributor";
      discriminator: [32, 139, 112, 171, 0, 2, 225, 155];
      accounts: [
        {
          name: "alignedDistributor";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [97, 108, 105, 103, 110, 101, 100, 45, 100, 105, 115, 116, 114, 105, 98, 117, 116, 111, 114];
              },
              {
                kind: "account";
                path: "distributor";
              },
            ];
          };
        },
        {
          name: "priceOracle";
        },
        {
          name: "withdrawor";
          writable: true;
          address: "wdrwhnCv4pzW8beKsbPa4S2UDZrXenjg16KJdKSpb5u";
        },
        {
          name: "clawbackReceiver";
          docs: ["Clawback receiver token account"];
          writable: true;
        },
        {
          name: "mint";
          docs: ["The mint to distribute."];
        },
        {
          name: "distributor";
          writable: true;
        },
        {
          name: "tokenVault";
          writable: true;
        },
        {
          name: "admin";
          docs: [
            "Original Admin wallet, responsible for creating the distributor and paying for the transaction.",
            "Also has the authority to set the clawback receiver and change itself.",
          ];
          writable: true;
          signer: true;
        },
        {
          name: "distributorProgram";
          docs: ["MerkleDistributor program"];
          address: "MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N";
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
      args: [
        {
          name: "ix";
          type: {
            defined: {
              name: "newDistributorIx";
            };
          };
        },
      ];
    },
    {
      name: "setAdmin";
      discriminator: [251, 163, 0, 52, 91, 194, 187, 92];
      accounts: [
        {
          name: "alignedDistributor";
          docs: ["The [MerkleDistributor]."];
          writable: true;
        },
        {
          name: "admin";
          docs: ["Admin signer"];
          writable: true;
          signer: true;
        },
        {
          name: "newAdmin";
          docs: ["New admin account"];
          writable: true;
        },
      ];
      args: [];
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
      name: "updateDuration";
      discriminator: [69, 126, 172, 250, 164, 14, 10, 161];
      accounts: [
        {
          name: "authority";
          docs: ["Wallet authorised to call this method"];
          writable: true;
          signer: true;
        },
        {
          name: "alignedDistributor";
          docs: ["The account holding the proxy parameters."];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [97, 108, 105, 103, 110, 101, 100, 45, 100, 105, 115, 116, 114, 105, 98, 117, 116, 111, 114];
              },
              {
                kind: "account";
                path: "distributor";
              },
            ];
          };
        },
        {
          name: "distributor";
          docs: ["The account holding the vesting parameters."];
          writable: true;
        },
        {
          name: "priceOracle";
          relations: ["alignedDistributor"];
        },
        {
          name: "distributorProgram";
          docs: ["MerkleDistributor program"];
          address: "MErKy6nZVoVAkryxAejJz2juifQ4ArgLgHmaJCQkU7N";
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
          name: "ix";
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
      name: "alignedDistributor";
      discriminator: [128, 76, 80, 203, 248, 175, 3, 43];
    },
    {
      name: "merkleDistributor";
      discriminator: [77, 119, 139, 70, 84, 247, 12, 26];
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
      msg: "Account is not authorized to execute this instruction";
    },
    {
      code: 6001;
      name: "arithmeticError";
      msg: "Arithmetic error";
    },
    {
      code: 6002;
      name: "noLockedAmount";
      msg: "Provided Distributor has no locked amount";
    },
    {
      code: 6003;
      name: "invalidUpdatePeriod";
      msg: "Provided is invalid, should be equal or more than 30 seconds and unlock_period";
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
      name: "durationAlreadyUpdated";
      msg: "Duration has been already updated in this period";
    },
    {
      code: 6011;
      name: "vestingAlreadyFinished";
      msg: "Vesting already finished";
    },
    {
      code: 6012;
      name: "sameAdmin";
      msg: "New and old admin are identical";
    },
    {
      code: 6013;
      name: "invalidMint";
      msg: "Invalid Mint";
    },
  ];
  types: [
    {
      name: "alignedDistributor";
      docs: ["State for the account which distributes tokens."];
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            docs: ["Bump seed."];
            type: "u8";
          },
          {
            name: "distributor";
            docs: ["[Mint] of the token to be distributed."];
            type: "pubkey";
          },
          {
            name: "admin";
            docs: ["Admin wallet"];
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
            name: "updatePeriod";
            docs: ["Period of updates, can be different from unlock period if needed"];
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
            name: "startTs";
            docs: ["Copy start ts from the Distributor to be used in the worker"];
            type: "u64";
          },
          {
            name: "endTs";
            docs: ["Copy end ts from the Distributor to be used in the worker"];
            type: "u64";
          },
          {
            name: "lastDurationUpdateTs";
            docs: [
              "Copy last_duration_update_ts from Distributor for our worker to be able to fetch it in one call with the proxy",
            ];
            type: "u64";
          },
          {
            name: "lastPrice";
            docs: ["Price used on last amount calculation"];
            type: "u64";
          },
          {
            name: "initialDuration";
            docs: ["Initial Airdrop Vesting duration"];
            type: "u64";
          },
          {
            name: "initialPrice";
            docs: ["Initial token price at the time of Contract creation"];
            type: "u64";
          },
          {
            name: "distributorClawedBack";
            docs: ["Whether distributor was clawed backed"];
            type: "bool";
          },
          {
            name: "buffer1";
            docs: ["Buffer for additional fields"];
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "buffer2";
            docs: ["Buffer for additional fields"];
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "buffer3";
            docs: ["Buffer for additional fields"];
            type: {
              array: ["u8", 32];
            };
          },
        ];
      };
    },
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
      name: "merkleDistributor";
      docs: ["State for the account which distributes tokens."];
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            docs: ["Bump seed."];
            type: "u8";
          },
          {
            name: "version";
            docs: ["Version of the airdrop"];
            type: "u64";
          },
          {
            name: "root";
            docs: ["The 256-bit merkle root."];
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "mint";
            docs: ["[Mint] of the token to be distributed."];
            type: "pubkey";
          },
          {
            name: "tokenVault";
            docs: ["Token Address of the vault"];
            type: "pubkey";
          },
          {
            name: "maxTotalClaim";
            docs: ["Maximum number of tokens that can ever be claimed from this [MerkleDistributor]."];
            type: "u64";
          },
          {
            name: "maxNumNodes";
            docs: ["Maximum number of nodes in [MerkleDistributor]."];
            type: "u64";
          },
          {
            name: "unlockPeriod";
            docs: ["Time step (period) in seconds per which the unlock occurs"];
            type: "u64";
          },
          {
            name: "totalAmountClaimed";
            docs: ["Total amount of tokens that have been claimed."];
            type: "u64";
          },
          {
            name: "numNodesClaimed";
            docs: ["Number of nodes that have been claimed."];
            type: "u64";
          },
          {
            name: "startTs";
            docs: ["Lockup time start (Unix Timestamp)"];
            type: "u64";
          },
          {
            name: "endTs";
            docs: ["Lockup time end (Unix Timestamp)"];
            type: "u64";
          },
          {
            name: "clawbackStartTs";
            docs: ["Clawback start (Unix Timestamp)"];
            type: "u64";
          },
          {
            name: "clawbackReceiver";
            docs: ["Clawback receiver"];
            type: "pubkey";
          },
          {
            name: "admin";
            docs: ["Admin wallet"];
            type: "pubkey";
          },
          {
            name: "clawedBack";
            docs: ["Whether or not the distributor has been clawed back"];
            type: "bool";
          },
          {
            name: "claimsClosableByAdmin";
            docs: ["Whether claims are closable by the admin or not"];
            type: "bool";
          },
          {
            name: "canUpdateDuration";
            docs: ["Whether admin can update vesting duration"];
            type: "bool";
          },
          {
            name: "totalAmountUnlocked";
            docs: ["Total amount of funds unlocked (cliff/instant)"];
            type: "u64";
          },
          {
            name: "totalAmountLocked";
            docs: ["Total amount of funds locked (vested)"];
            type: "u64";
          },
          {
            name: "lastDurationUpdateTs";
            docs: ["Timestamp when update was last called"];
            type: "u64";
          },
          {
            name: "totalClaimablePreUpdate";
            docs: [
              "Total amount of locked amount claimable as of last duration update, ever increasing total, accumulates with each update",
            ];
            type: "u64";
          },
          {
            name: "clawedBackTs";
            docs: ["Timestamp when funds were clawed back"];
            type: "u64";
          },
          {
            name: "claimsClosableByClaimant";
            docs: ["Whether claims are closable by claimant or not"];
            type: "bool";
          },
          {
            name: "claimsLimit";
            docs: ["Limit number of claims"];
            type: "u16";
          },
          {
            name: "buffer2";
            docs: ["Buffer for additional fields"];
            type: {
              array: ["u8", 20];
            };
          },
          {
            name: "buffer3";
            docs: ["Buffer for additional fields"];
            type: {
              array: ["u8", 32];
            };
          },
        ];
      };
    },
    {
      name: "newDistributorIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "version";
            type: "u64";
          },
          {
            name: "root";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "maxTotalClaim";
            type: "u64";
          },
          {
            name: "maxNumNodes";
            type: "u64";
          },
          {
            name: "unlockPeriod";
            type: "u64";
          },
          {
            name: "startVestingTs";
            type: "u64";
          },
          {
            name: "endVestingTs";
            type: "u64";
          },
          {
            name: "clawbackStartTs";
            type: "u64";
          },
          {
            name: "claimsClosable";
            type: "bool";
          },
          {
            name: "totalAmountUnlocked";
            type: "u64";
          },
          {
            name: "totalAmountLocked";
            type: "u64";
          },
          {
            name: "updatePeriod";
            type: "u64";
          },
          {
            name: "oracleType";
            type: {
              defined: {
                name: "oracleType";
              };
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
            type: "bool";
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
