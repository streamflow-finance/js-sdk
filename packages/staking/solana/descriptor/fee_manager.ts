/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/fee_manager.json`.
 */
export type FeeManager = {
  address: "FEELzfBhsWXTNJX53zZcDVfRNoFYZQ6cZA3jLiGVL16V";
  metadata: {
    name: "feeManager";
    version: "1.0.0";
    spec: "0.1.0";
    description: "Stores Fees and other admin configuration for the Staking protocol";
  };
  instructions: [
    {
      name: "changeAuthority";
      discriminator: [50, 106, 66, 104, 99, 118, 145, 88];
      accounts: [
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "authority";
          docs: ["authority"];
          signer: true;
        },
        {
          name: "newAuthority";
        },
      ];
      args: [];
    },
    {
      name: "initialize";
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "authority";
          docs: ["authority"];
          writable: true;
          signer: true;
          address: "ACYtYsL4KYtJzD53wqyifqad2D8224kamcngYPgSy3t";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "removeFee";
      discriminator: [190, 227, 105, 10, 30, 161, 81, 212];
      accounts: [
        {
          name: "feeValue";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [102, 101, 101, 45, 118, 97, 108, 117, 101];
              },
              {
                kind: "account";
                path: "target";
              },
            ];
          };
        },
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "authority";
          docs: ["authority"];
          writable: true;
          signer: true;
        },
        {
          name: "target";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "updateConfig";
      discriminator: [29, 158, 252, 191, 10, 83, 219, 99];
      accounts: [
        {
          name: "config";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "authority";
          docs: ["authority"];
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "streamflowFee";
          type: {
            option: "u64";
          };
        },
      ];
    },
    {
      name: "writeFee";
      discriminator: [80, 12, 148, 143, 16, 120, 24, 48];
      accounts: [
        {
          name: "feeValue";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [102, 101, 101, 45, 118, 97, 108, 117, 101];
              },
              {
                kind: "account";
                path: "target";
              },
            ];
          };
        },
        {
          name: "config";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [99, 111, 110, 102, 105, 103];
              },
            ];
          };
        },
        {
          name: "authority";
          docs: ["authority"];
          writable: true;
          signer: true;
        },
        {
          name: "target";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "streamflowFee";
          type: "u64";
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
  ];
  errors: [
    {
      code: 6000;
      name: "unauthorized";
      msg: "Account is not authorized to execute this instruction";
    },
    {
      code: 6001;
      name: "invalidFee";
      msg: "Provided fee is not valid";
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
  ];
};
