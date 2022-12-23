import { WalletContextState } from "@manahippo/aptos-wallet-adapter";
import BN from "bn.js";

import { IRecipient } from "../common/types";
import { getNumberFromBN } from "../common/utils";

export interface ICreateStreamAptosExt {
  senderWallet: WalletContextState;
}

type MetadataId = string;

export interface CreateMultiError {
  recipient: string;
  error: string;
}

export interface IMultiTransactionResult {
  txs: string[];
  metadatas: MetadataId[];
  metadataToRecipient: Record<MetadataId, IRecipient>;
  errors: CreateMultiError[];
}

export interface ITransactionResult {
  txId: string;
}

export type ITransactionAptosExt = ICreateStreamAptosExt & {
  tokenId: string;
};

export interface StreamResource {
  amount: string;
  amount_per_period: string;
  canceled_at: string;
  cliff_amount: string;
  closed: boolean;
  contract_signer_cap: {
    account: string;
  };
  created: string;
  current_pause_start: string;
  end: string;
  fees: {
    streamflow_fee: string;
    streamflow_fee_percentage: string;
    streamflow_fee_withdrawn: string;
  };
  funds_unlocked_at_last_rate_change: string;
  last_rate_change_time: string;
  last_withdrawn_at: string;
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
    withdrawal_frequency: string;
  };
  pause_cumulative: string;
  period: string;
  recipient: string;
  sender: string;
  start: string;
  withdrawn: string;
}

export interface Stream {
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

  unlocked(currentTimestamp: number, decimals: number): number;
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

  constructor(stream: StreamResource, tokenId: string) {
    this.magic = 0;
    this.version = 0;
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
    this.streamflowFeePercent = parseInt(stream.fees.streamflow_fee_percentage) / 10000;
    this.partnerFeeTotal = new BN(0);
    this.partnerFeeWithdrawn = new BN(0);
    this.partnerFeePercent = 0;
    this.partner = "";
    this.partnerTokens = "";
    this.start = parseInt(stream.start);
    this.depositedAmount = new BN(stream.amount);
    this.period = parseInt(stream.period);
    this.amountPerPeriod = new BN(stream.amount_per_period);
    this.cliff = parseInt(stream.start);
    this.cliffAmount = new BN(stream.cliff_amount);
    this.cancelableBySender = stream.meta.cancelable_by_sender;
    this.cancelableByRecipient = stream.meta.cancelable_by_recipient;
    this.automaticWithdrawal = stream.meta.automatic_withdrawal;
    this.transferableBySender = stream.meta.transferable_by_sender;
    this.transferableByRecipient = stream.meta.transferable_by_recipient;
    this.canTopup = stream.meta.can_topup;
    const name = stream.meta.contract_name.replace("0x", "");
    this.name = Buffer.from(name, "hex").toString("utf8");
    this.withdrawalFrequency = parseInt(stream.meta.withdrawal_frequency);
  }

  unlocked(currentTimestamp: number, decimals: number): number {
    const deposited = getNumberFromBN(this.depositedAmount, decimals);

    if (currentTimestamp < this.cliff) return 0;
    if (currentTimestamp > this.end) return deposited;

    const streamedBN = this.cliffAmount.add(
      new BN(Math.floor((currentTimestamp - this.cliff) / this.period)).mul(this.amountPerPeriod)
    );
    const streamed = getNumberFromBN(streamedBN, decimals);

    return streamed < deposited ? streamed : deposited;
  }

  remaining(decimals: number): number {
    return getNumberFromBN(this.depositedAmount.sub(this.withdrawnAmount), decimals);
  }
}
