import { Keypair } from "@mysten/sui.js/cryptography";
import { WalletContextState } from "@suiet/wallet-kit";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import {
  ExecuteTransactionRequestType,
  SuiTransactionBlockResponseOptions,
} from "@mysten/sui.js/client";
import BN from "bn.js";

import { buildStreamType, calculateUnlockedAmount } from "../common/contractUtils";
import { Stream, StreamType } from "../common/types";
import { getNumberFromBN } from "../common/utils";

export interface ICreateStreamSuiExt {
  senderWallet: WalletContextState | Keypair;
}

export interface ITransactionSuiExt {
  senderWallet: WalletContextState | Keypair;
  tokenId: string;
}

export interface ISuiIdParameters {
  program: string;
  config: string;
  feeTable: string;
}

export interface IContractCreated {
  address: string;
}

export interface IContractWithdrawn {
  address: string;
  amount: number;
  streamflow_amount: number;
  partner_amount: number;
}

export interface StreamResource {
  id: { id: string };
  amount: string;
  amount_per_period: string;
  balance: string;
  canceled_at: string;
  cliff_amount: string;
  closed: boolean;
  created: string;
  current_pause_start: string;
  end: string;
  fees: {
    fields: {
      partner_fee: string;
      partner_fee_percentage: string;
      partner_fee_withdrawn: string;
      streamflow_fee: string;
      streamflow_fee_percentage: string;
      streamflow_fee_withdrawn: string;
    };
    type: string;
  };
  funds_unlocked_at_last_rate_change: string;
  last_rate_change_time: string;
  last_withdrawn_at: string;
  meta: {
    fields: {
      automatic_withdrawal: boolean;
      can_topup: boolean;
      can_update_rate: boolean;
      cancelable_by_recipient: boolean;
      cancelable_by_sender: boolean;
      contract_name: number[];
      pausable: boolean;
      transferable_by_recipient: boolean;
      transferable_by_sender: boolean;
      withdrawal_frequency: string;
    };
    type: string;
  };
  partner: string;
  pause_cumulative: string;
  period: string;
  recipient: string;
  sender: string;
  start: string;
  version: string;
  withdrawn: string;
}

export interface ClassResource {
  streamflow_fee: string;
  treasury: string;
  tx_fee: string;
  withdrawor: string;
}

export interface FeeTableResource {
  values: {
    type: string;
    fields: {
      id: {
        id: string;
      };
    };
  };
}

export interface FeeValueResource {
  name: string;
  value: {
    type: string;
    fields: {
      partner_fee: string;
      streamflow_fee: string;
    };
  };
}

export class Contract implements Stream {
  magic: number;

  version: number;

  createdAt: number;

  withdrawnAmount: BN;

  canceledAt: number;

  end: number;

  lastWithdrawnAt: number;

  sender: string;

  senderTokens: string;

  recipient: string;

  recipientTokens: string;

  mint: string;

  escrowTokens: string;

  streamflowTreasury: string;

  streamflowTreasuryTokens: string;

  streamflowFeeTotal: BN;

  streamflowFeeWithdrawn: BN;

  streamflowFeePercent: number;

  partnerFeeTotal: BN;

  partnerFeeWithdrawn: BN;

  partnerFeePercent: number;

  partner: string;

  partnerTokens: string;

  start: number;

  depositedAmount: BN;

  period: number;

  amountPerPeriod: BN;

  cliff: number;

  cliffAmount: BN;

  cancelableBySender: boolean;

  cancelableByRecipient: boolean;

  automaticWithdrawal: boolean;

  transferableBySender: boolean;

  transferableByRecipient: boolean;

  canTopup: boolean;

  name: string;

  withdrawalFrequency: number;

  closed: boolean;

  currentPauseStart: number;

  pauseCumulative: BN;

  lastRateChangeTime: number;

  fundsUnlockedAtLastRateChange: BN;

  type: StreamType;

  constructor(stream: StreamResource, tokenId: string) {
    const meta = stream.meta.fields;
    const fees = stream.fees.fields;

    this.magic = 0;
    this.version = parseInt(stream.version);
    this.createdAt = parseInt(stream.created);
    this.withdrawnAmount = new BN(stream.withdrawn);
    this.canceledAt = parseInt(stream.canceled_at);
    this.end = parseInt(stream.end);
    this.lastWithdrawnAt = parseInt(stream.last_withdrawn_at);
    this.sender = stream.sender;
    this.senderTokens = stream.sender;
    this.recipient = stream.recipient;
    this.recipientTokens = stream.recipient;
    this.mint = tokenId;
    this.escrowTokens = "";
    this.streamflowTreasury = "";
    this.streamflowTreasuryTokens = "";
    this.streamflowFeeTotal = new BN(0);
    this.streamflowFeeWithdrawn = new BN(0);
    this.streamflowFeePercent = parseInt(fees.streamflow_fee_percentage) / 10000;
    this.partnerFeeTotal = new BN(0);
    this.partnerFeeWithdrawn = new BN(0);
    this.partnerFeePercent = parseInt(fees.partner_fee_percentage) / 10000;
    this.partner = stream.partner;
    this.partnerTokens = "";
    this.start = parseInt(stream.start);
    this.depositedAmount = new BN(stream.amount);
    this.period = parseInt(stream.period);
    this.amountPerPeriod = new BN(stream.amount_per_period);
    this.cliff = parseInt(stream.start);
    this.cliffAmount = new BN(stream.cliff_amount);
    this.cancelableBySender = meta.cancelable_by_sender;
    this.cancelableByRecipient = meta.cancelable_by_recipient;
    this.automaticWithdrawal = meta.automatic_withdrawal;
    this.transferableBySender = meta.transferable_by_sender;
    this.transferableByRecipient = meta.transferable_by_recipient;
    this.canTopup = meta.can_topup;
    this.name = String.fromCharCode(...meta.contract_name);
    this.withdrawalFrequency = parseInt(meta.withdrawal_frequency);
    this.closed = stream.closed;
    this.currentPauseStart = parseInt(stream.current_pause_start);
    this.pauseCumulative = new BN(stream.pause_cumulative);
    this.lastRateChangeTime = parseInt(stream.last_rate_change_time);
    this.fundsUnlockedAtLastRateChange = new BN(stream.funds_unlocked_at_last_rate_change);
    this.type = buildStreamType(this);
  }

  unlocked(currentTimestamp: number): BN {
    return calculateUnlockedAmount({
      ...this,
      currentTimestamp,
    });
  }

  remaining(decimals: number): number {
    return getNumberFromBN(this.depositedAmount.sub(this.withdrawnAmount), decimals);
  }
}

export interface SuiParsedError {
  module: "protocol" | "admin" | "fee_manager";
  code: number;
  name: string;
}

export interface SuiErrorInfo {
  index?: number;
  text: string;
  parsed?: SuiParsedError;
}

export interface SuiSignAndExecuteTransactionBlockInput {
  transactionBlock: TransactionBlock;
  requestType?: ExecuteTransactionRequestType;
  options?: SuiTransactionBlockResponseOptions;
}
