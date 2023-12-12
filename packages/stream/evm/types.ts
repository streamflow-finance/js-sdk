import BN from "bn.js";
import { BigNumber } from "ethers";

import { buildStreamType, calculateUnlockedAmount } from "../common/contractUtils";
import { Stream, StreamType } from "../common/types";
import { getNumberFromBN } from "../common/utils";

export interface StreamAbiResult {
  amount: BigNumber;
  amount_per_period: BigNumber;
  canceled_at: BigNumber;
  cliff_amount: BigNumber;
  closed: boolean;
  created: BigNumber;
  current_pause_start: BigNumber;
  end: BigNumber;
  fees: {
    streamflow_fee_percentage: BigNumber;
    streamflow_fee: BigNumber;
    streamflow_fee_withdrawn: BigNumber;
    partner_fee_percentage: BigNumber;
    partner_fee: BigNumber;
    partner_fee_withdrawn: BigNumber;
    tx_fee: BigNumber;
  };
  funds_unlocked_at_last_rate_change: BigNumber;
  last_rate_change_time: BigNumber;
  last_withdrawn_at: BigNumber;
  meta: {
    automatic_withdrawal: boolean;
    can_topup: boolean;
    can_update_rate: boolean;
    cancelable_by_recipient: boolean;
    cancelable_by_sender: boolean;
    contract_name: string;
    pausable: boolean;
    transferable_by_recipient: boolean;
    transferable_by_sender: boolean;
    withdrawal_frequency: BigNumber;
  };
  pause_cumulative: BigNumber;
  period: BigNumber;
  recipient: string;
  sender: string;
  partner: string;
  start: BigNumber;
  token: string;
  withdrawn: BigNumber;
}

export interface FeesAbiResult {
  exists: boolean;
  streamflow_fee: BigNumber;
  partner_fee: BigNumber;
}

export class EvmContract implements Stream {
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

  constructor(stream: StreamAbiResult) {
    this.magic = 0;
    this.version = 0;
    this.createdAt = stream.created.toNumber();
    this.withdrawnAmount = new BN(stream.withdrawn.toString());
    this.canceledAt = stream.canceled_at.toNumber();
    this.end = stream.end.toNumber();
    this.lastWithdrawnAt = stream.last_withdrawn_at.toNumber();
    this.sender = stream.sender;
    this.senderTokens = stream.sender;
    this.recipient = stream.recipient;
    this.recipientTokens = stream.recipient;
    this.mint = stream.token.toLowerCase();
    this.escrowTokens = "";
    this.streamflowTreasury = "";
    this.streamflowTreasuryTokens = "";
    this.streamflowFeeTotal = new BN(stream.fees.streamflow_fee.toString());
    this.streamflowFeeWithdrawn = new BN(stream.fees.streamflow_fee_withdrawn.toString());
    this.streamflowFeePercent = stream.fees.streamflow_fee_percentage.toNumber() / 10000;
    this.partnerFeeTotal = new BN(0);
    this.partnerFeeWithdrawn = new BN(0);
    this.partnerFeePercent = 0;
    this.partner = "";
    this.partnerTokens = "";
    this.start = stream.start.toNumber();
    this.depositedAmount = new BN(stream.amount.toString());
    this.period = stream.period.toNumber();
    this.amountPerPeriod = new BN(stream.amount_per_period.toString());
    this.cliff = stream.start.toNumber();
    this.cliffAmount = new BN(stream.cliff_amount.toString());
    this.cancelableBySender = stream.meta.cancelable_by_sender;
    this.cancelableByRecipient = stream.meta.cancelable_by_recipient;
    this.automaticWithdrawal = stream.meta.automatic_withdrawal;
    this.transferableBySender = stream.meta.transferable_by_sender;
    this.transferableByRecipient = stream.meta.transferable_by_recipient;
    this.canTopup = stream.meta.can_topup;
    this.name = stream.meta.contract_name;
    this.withdrawalFrequency = stream.meta.withdrawal_frequency.toNumber();
    this.closed = stream.closed;
    this.currentPauseStart = stream.current_pause_start.toNumber();
    this.pauseCumulative = new BN(stream.pause_cumulative.toString());
    this.lastRateChangeTime = stream.last_rate_change_time.toNumber();
    this.fundsUnlockedAtLastRateChange = new BN(
      stream.funds_unlocked_at_last_rate_change.toString()
    );
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
