export default [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "ContractCreated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_stream_id",
        type: "address",
      },
    ],
    name: "cancel",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_new_fees",
        type: "uint256",
      },
    ],
    name: "changeStreamflowFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address payable",
        name: "_new_treasury",
        type: "address",
      },
    ],
    name: "changeTreasury",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_new_fee",
        type: "uint256",
      },
    ],
    name: "changeTxFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address payable",
        name: "_new_withdawor",
        type: "address",
      },
    ],
    name: "changeWithdrawor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "config",
    outputs: [
      {
        internalType: "address",
        name: "admin",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "streamflow_fees",
        type: "uint256",
      },
      {
        internalType: "address payable",
        name: "treasury",
        type: "address",
      },
      {
        internalType: "address payable",
        name: "withdrawor",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tx_fee",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20",
        name: "_token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_period",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_amount_per_period",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_start",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_cliff_amount",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "bool",
            name: "cancelable_by_sender",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "cancelable_by_recipient",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "transferable_by_sender",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "transferable_by_recipient",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "can_topup",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "pausable",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "can_update_rate",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "automatic_withdrawal",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "withdrawal_frequency",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "contract_name",
            type: "string",
          },
        ],
        internalType: "struct ContractMeta",
        name: "_meta",
        type: "tuple",
      },
      {
        internalType: "address",
        name: "_recipient",
        type: "address",
      },
      {
        internalType: "address",
        name: "_partner",
        type: "address",
      },
    ],
    name: "create",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
    ],
    name: "feesRemove",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "streamflow_fee",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "partner_fee",
        type: "uint256",
      },
    ],
    name: "feesWrite",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getAdmin",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAll",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
      {
        components: [
          {
            internalType: "contract IERC20",
            name: "token",
            type: "address",
          },
          {
            components: [
              {
                internalType: "bool",
                name: "cancelable_by_sender",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "cancelable_by_recipient",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "transferable_by_sender",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "transferable_by_recipient",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "can_topup",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "pausable",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "can_update_rate",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "automatic_withdrawal",
                type: "bool",
              },
              {
                internalType: "uint256",
                name: "withdrawal_frequency",
                type: "uint256",
              },
              {
                internalType: "string",
                name: "contract_name",
                type: "string",
              },
            ],
            internalType: "struct ContractMeta",
            name: "meta",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "period",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amount_per_period",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "start",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "end",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "cliff_amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "withdrawn",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "last_withdrawn_at",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "created",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "canceled_at",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "address",
            name: "sender",
            type: "address",
          },
          {
            internalType: "address",
            name: "partner",
            type: "address",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "streamflow_fee_percentage",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "streamflow_fee",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "streamflow_fee_withdrawn",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "partner_fee_percentage",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "partner_fee",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "partner_fee_withdrawn",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "tx_fee",
                type: "uint256",
              },
            ],
            internalType: "struct FeesData",
            name: "fees",
            type: "tuple",
          },
          {
            internalType: "bool",
            name: "closed",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "current_pause_start",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "pause_cumulative",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "last_rate_change_time",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "funds_unlocked_at_last_rate_change",
            type: "uint256",
          },
        ],
        internalType: "struct Contract[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_id",
        type: "address",
      },
    ],
    name: "getById",
    outputs: [
      {
        components: [
          {
            internalType: "contract IERC20",
            name: "token",
            type: "address",
          },
          {
            components: [
              {
                internalType: "bool",
                name: "cancelable_by_sender",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "cancelable_by_recipient",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "transferable_by_sender",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "transferable_by_recipient",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "can_topup",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "pausable",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "can_update_rate",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "automatic_withdrawal",
                type: "bool",
              },
              {
                internalType: "uint256",
                name: "withdrawal_frequency",
                type: "uint256",
              },
              {
                internalType: "string",
                name: "contract_name",
                type: "string",
              },
            ],
            internalType: "struct ContractMeta",
            name: "meta",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "period",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amount_per_period",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "start",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "end",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "cliff_amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "withdrawn",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "last_withdrawn_at",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "created",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "canceled_at",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "address",
            name: "sender",
            type: "address",
          },
          {
            internalType: "address",
            name: "partner",
            type: "address",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "streamflow_fee_percentage",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "streamflow_fee",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "streamflow_fee_withdrawn",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "partner_fee_percentage",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "partner_fee",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "partner_fee_withdrawn",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "tx_fee",
                type: "uint256",
              },
            ],
            internalType: "struct FeesData",
            name: "fees",
            type: "tuple",
          },
          {
            internalType: "bool",
            name: "closed",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "current_pause_start",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "pause_cumulative",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "last_rate_change_time",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "funds_unlocked_at_last_rate_change",
            type: "uint256",
          },
        ],
        internalType: "struct Contract",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_recipient",
        type: "address",
      },
    ],
    name: "getByRecipient",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_sender",
        type: "address",
      },
    ],
    name: "getBySender",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
    ],
    name: "getFees",
    outputs: [
      {
        components: [
          {
            internalType: "bool",
            name: "exists",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "streamflow_fee",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "partner_fee",
            type: "uint256",
          },
        ],
        internalType: "struct StreamflowFeeManager.FeeValue",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "_ids",
        type: "address[]",
      },
    ],
    name: "getMultiple",
    outputs: [
      {
        components: [
          {
            internalType: "contract IERC20",
            name: "token",
            type: "address",
          },
          {
            components: [
              {
                internalType: "bool",
                name: "cancelable_by_sender",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "cancelable_by_recipient",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "transferable_by_sender",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "transferable_by_recipient",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "can_topup",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "pausable",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "can_update_rate",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "automatic_withdrawal",
                type: "bool",
              },
              {
                internalType: "uint256",
                name: "withdrawal_frequency",
                type: "uint256",
              },
              {
                internalType: "string",
                name: "contract_name",
                type: "string",
              },
            ],
            internalType: "struct ContractMeta",
            name: "meta",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "period",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amount_per_period",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "start",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "end",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "cliff_amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "withdrawn",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "last_withdrawn_at",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "created",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "canceled_at",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "address",
            name: "sender",
            type: "address",
          },
          {
            internalType: "address",
            name: "partner",
            type: "address",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "streamflow_fee_percentage",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "streamflow_fee",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "streamflow_fee_withdrawn",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "partner_fee_percentage",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "partner_fee",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "partner_fee_withdrawn",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "tx_fee",
                type: "uint256",
              },
            ],
            internalType: "struct FeesData",
            name: "fees",
            type: "tuple",
          },
          {
            internalType: "bool",
            name: "closed",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "current_pause_start",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "pause_cumulative",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "last_rate_change_time",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "funds_unlocked_at_last_rate_change",
            type: "uint256",
          },
        ],
        internalType: "struct Contract[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
    ],
    name: "getStreamflowFee",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getStreamflowFees",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_stream_id",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "getTopUpWithdrawalFees",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "tx_fee",
            type: "uint256",
          },
        ],
        internalType: "struct WithdrawalFeesData",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTreasuryAddress",
    outputs: [
      {
        internalType: "address payable",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTxFee",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_period",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_amount_per_period",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_start",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_cliff_amount",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "_automatic_withdrawal",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "_withdrawal_frequency",
        type: "uint256",
      },
    ],
    name: "getWithdrawalFees",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "tx_fee",
            type: "uint256",
          },
        ],
        internalType: "struct WithdrawalFeesData",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getWithdraworAddress",
    outputs: [
      {
        internalType: "address payable",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_stream_id",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "topUp",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_stream_id",
        type: "address",
      },
      {
        internalType: "address",
        name: "new_recipient",
        type: "address",
      },
    ],
    name: "transfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_new_admin",
        type: "address",
      },
    ],
    name: "transferAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_stream_id",
        type: "address",
      },
      {
        internalType: "bool[]",
        name: "_automatic_withdrawal",
        type: "bool[]",
      },
      {
        internalType: "uint256[]",
        name: "_withdrawal_frequency",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "_amount_per_period",
        type: "uint256[]",
      },
    ],
    name: "update",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_stream_id",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
