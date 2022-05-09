export const AIRDROP_AMOUNT = 1; // 1 SOL is the cap on the testnet
export const AIRDROP_PDA = "DRCLpDJUNiMeKuRP9dcnGuibjTMjDGFwbZEXsq1RRgiR";
export const AIRDROP_TEST_TOKEN =
  "Gssm3vfi8s65R31SBdmQRq6cKeYojGgup7whkw4VCiQj";
export const AIRDROP_WHITELIST = [
  "3r1cS6LS7Q5e2XzMhjV4jwuJEyMsPnTFSSEU8HitWYFc",
  "9CTuPR1xDwyAnQmtAY7PawFDta7yjhkyZhLkXXsUQWFS",
  "8HRZui7gdzueWfB1Bgj2GesaPMJFyqLEk4y67TnNXcJd",
  "4pYeM1AhyqCXy63xtwfMtytz8keWxBD2gHWHqdwacK3C",
];

export const ALLOWED_PDA_PROGRAMS = [
  "GokivDYuQXPZCWRkwMhdH2h91KpDQXBEmpgBgs55bnpH",
];

export const TX_FINALITY_CONFIRMED = "confirmed";
export const TX_FINALITY_FINALIZED = "finalized";

export const INSTRUCTION_CREATE_STREAM = 0;
export const INSTRUCTION_WITHDRAW_STREAM = 1;
export const INSTRUCTION_CANCEL_STREAM = 2;
export const INSTRUCTION_TRANSFER_RECIPIENT = 3;

export enum ProgramInstruction {
  Create,
  Withdraw,
  Topup,
  Cancel,
  TransferRecipient,
}

export const EXPLORER_TYPE_TX = "tx";
export const EXPLORER_TYPE_ADDR = "address";

export const DATE_FORMAT = "yyyy-MM-dd";
export const TIME_FORMAT = "HH:mm";

export const START = "start";
export const END = "end";

//might move to a separate class if it becomes clunky
export const ERR_NO_STREAM =
  "Specified stream doesn't exist. Please double check with the sender.";
export const ERR_NOT_CONNECTED =
  "There was an issue with the connection - please try to refresh the page.";
export const ERR_NO_TOKEN_SELECTED = "Please select the token";
export const ERR_NO_PRIOR_CREDIT =
  "You don't have enough SOL in your wallet to pay for transaction fees.";

export const PRODUCT_VESTING = "vesting";
export const PRODUCT_STREAMS = "streams";
export const PRODUCT_MULTIPAY = "multipay";
export const PRODUCT_MULTISIG = "multisig";

export const products = [
  PRODUCT_VESTING,
  PRODUCT_STREAMS,
  PRODUCT_MULTIPAY,
  PRODUCT_MULTISIG,
];

export const DEFAULT_DECIMAL_PLACES = 2;

export const ERRORS = {
  amount_required: "Amount is required.",
  amount_greater_than: "Please provide amount greater than 0.",
  token_required: "Token is required.",
  recipient_required: "You must choose a recipient.",
  not_valid_email: "Must be a valid email.",
  subject_required: "Please provide a subject (title).",
  start_date_required: "Start date is required.",
  start_date_is_in_the_past: "Cannot start stream in the past.",
  start_time_required: "Start time is required.",
  start_time_is_in_the_past: "Should start in future.",
  end_date_required: "End date is required.",
  end_time_required: "End time is required.",
  deposited_amount_required: "Deposited amount is required.",
  amount_too_high: "You don't have enough tokens.",
  invalid_address: "Please enter a valid Solana wallet address.",
  address_is_a_program: "Address cannot be a program.",
  release_amount_greater_than_deposited: "Should be <= deposited amount.",
  end_should_be_after_start: "End should happen after start.",
  cliff_should_be_after_start: "Cliff should happen after start.",
  cliff_should_be_before_end: "Cliff should happen before end.",
  required: "Required.",
  release_frequency_is_too_slow:
    "Should be smaller or equal to difference between END and CLIFF time.",
  should_be_greater_than_0: "Should be greater than 0.",
  max_year: "Year should be less than 9999.",
  subject_too_long:
    "It is either too long or there are many complex characters.",
  withdrawal_frequency_too_high:
    "Withdrawal frequency should be >= release frequency.",
};

export const PERIOD = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 24 * 3600,
  WEEK: 7 * 24 * 3600,
  MONTH: Math.floor(30.4167 * 24 * 3600), //30.4167 days
  YEAR: 365 * 24 * 3600, // 365 days
};

export const timePeriodOptions = [
  { value: PERIOD.SECOND, label: "second" },
  { value: PERIOD.MINUTE, label: "minute" },
  { value: PERIOD.HOUR, label: "hour" },
  { value: PERIOD.DAY, label: "day" },
  { value: PERIOD.WEEK, label: "week" },
  { value: PERIOD.MONTH, label: "month" },
  { value: PERIOD.YEAR, label: "year" },
];

export const EVENT_CATEGORY = {
  WALLET: "wallet",
  STREAM: "stream",
  VESTING: "vesting",
};

export const EVENT_ACTION = {
  TRANSFER: "transfer",
  CANCEL: "cancel",
  TOP_UP: "top_up",
  WITHDRAW: "withdraw",
  CONNECT: "connect",
  DISCONNECT: "disconnect",
};

export const EVENT_LABEL = {
  NONE: "none",
};

export const EVENT_TYPE = {
  EVENT: "event",
  PAGEVIEW: "pageview",
  PURCHASE: "purchase",
};

export const TRANSACTION_VARIANT = {
  CREATE_VESTING: "create_vesting",
  CREATE_STREAM: "create_stream",
  TOP_UP_STREAM: "top_up_stream",
};

export const AFFILIATION = {
  FREE: "free",
  APP: "app",
};
export const DEFAULT_GA_PURCHASE_CURRENCY = "USD";
export const USD_PEGGED_COINS = ["USDT", "USDC"];

export const DATA_LAYER_VARIABLE = {
  WALLET_TYPE: "walletType",
  TOKEN_FEE: "tokenFee",
  TOKEN_SYMBOL: "tokenSymbol",
  STREAM_ADDRESS: "streamAddress",
  TOKEN_WITHDRAW_USD: "tokenWithdrawUsd",
  STREAMFLOW_FEE_USD: "streamflowFeeUsd",
  STREAMFLOW_FEE_TOKEN: "streamflowFeeToken",
  TOTAL_AMOUNT_TOKEN: "totalAmountToken",
  TOTAL_AMOUNT_USD: "totalAmountUsd",
};

export const transferCancelOptions = [
  {
    value: "recipient",
    label: "Only Recipient",
  },
  {
    value: "sender",
    label: "Only Sender",
  },
  {
    value: "both",
    label: "Both",
  },
  {
    value: "neither",
    label: "Neither",
  },
];
