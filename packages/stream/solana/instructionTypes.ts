export interface IStreamLayout {
  magic: Uint8Array;
  version: Uint8Array;
  created_at: Uint8Array;
  withdrawn_amount: Uint8Array;
  canceled_at: Uint8Array;
  end_time: Uint8Array;
  last_withdrawn_at: Uint8Array;
  sender: Uint8Array;
  sender_tokens: Uint8Array;
  recipient: Uint8Array;
  recipient_tokens: Uint8Array;
  mint: Uint8Array;
  escrow_tokens: Uint8Array;
  streamflow_treasury: Uint8Array;
  streamflow_treasury_tokens: Uint8Array;
  streamflow_fee_total: Uint8Array;
  streamflow_fee_withdrawn: Uint8Array;
  streamflow_fee_percent: number;
  partner: Uint8Array;
  partner_tokens: Uint8Array;
  partner_fee_total: Uint8Array;
  partner_fee_withdrawn: Uint8Array;
  partner_fee_percent: number;
  start_time: Uint8Array;
  net_amount_deposited: Uint8Array;
  period: Uint8Array;
  amount_per_period: Uint8Array;
  cliff: Uint8Array;
  cliff_amount: Uint8Array;
  cancelable_by_sender: number;
  cancelable_by_recipient: number;
  automatic_withdrawal: number;
  transferable_by_sender: number;
  transferable_by_recipient: number;
  can_topup: number;
  stream_name: Uint8Array;
  withdraw_frequency: Uint8Array;
  ghost: Uint8Array;
  pausable: number;
  can_update_rate: number;
  create_params_padding_length: number;
  create_params_padding: number[];
  closed: number;
  current_pause_start: Uint8Array;
  pause_cumulative: Uint8Array;
  last_rate_change_time: Uint8Array;
  funds_unlocked_at_last_rate_change: Uint8Array;
  creation_fee: number;
  creation_fee_claimed: number;
  auto_claim_fee: number;
  auto_claim_fee_claimed: number;
  old_metadata: Uint8Array;
}

export interface ICreateStreamLayout {
  start_time: Uint8Array;
  net_amount_deposited: Uint8Array;
  period: Uint8Array;
  amount_per_period: Uint8Array;
  cliff: Uint8Array;
  cliff_amount: Uint8Array;
  cancelable_by_sender: number;
  cancelable_by_recipient: number;
  automatic_withdrawal: number;
  transferable_by_sender: number;
  transferable_by_recipient: number;
  can_topup: number;
  stream_name: Uint8Array;
  withdraw_frequency: Uint8Array;
}

export interface ICreateUncheckedStreamLayout {
  start_time: Uint8Array;
  net_amount_deposited: Uint8Array;
  period: Uint8Array;
  amount_per_period: Uint8Array;
  cliff: Uint8Array;
  cliff_amount: Uint8Array;
  cancelable_by_sender: number;
  cancelable_by_recipient: number;
  automatic_withdrawal: number;
  transferable_by_sender: number;
  transferable_by_recipient: number;
  can_topup: number;
  stream_name: Uint8Array;
  withdraw_frequency: Uint8Array;
  recipient: Uint8Array;
  partner: Uint8Array;
  pausable: number;
  can_update_rate: number;
}

export interface ICreateStreamV2Layout {
  start_time: Uint8Array;
  net_amount_deposited: Uint8Array;
  period: Uint8Array;
  amount_per_period: Uint8Array;
  cliff: Uint8Array;
  cliff_amount: Uint8Array;
  cancelable_by_sender: number;
  cancelable_by_recipient: number;
  automatic_withdrawal: number;
  transferable_by_sender: number;
  transferable_by_recipient: number;
  can_topup: number;
  stream_name: Uint8Array;
  withdraw_frequency: Uint8Array;
  pausable: number;
  can_update_rate: number;
  nonce: Uint8Array;
}

export interface ICreateUncheckedStreamV2Layout {
  start_time: Uint8Array;
  net_amount_deposited: Uint8Array;
  period: Uint8Array;
  amount_per_period: Uint8Array;
  cliff: Uint8Array;
  cliff_amount: Uint8Array;
  cancelable_by_sender: number;
  cancelable_by_recipient: number;
  automatic_withdrawal: number;
  transferable_by_sender: number;
  transferable_by_recipient: number;
  can_topup: number;
  stream_name: Uint8Array;
  withdraw_frequency: Uint8Array;
  recipient: Uint8Array;
  partner: Uint8Array;
  pausable: number;
  can_update_rate: number;
  nonce: Uint8Array;
}

export interface IWithdrawStreamLayout {
  amount: Uint8Array;
}

export interface IUpdateStreamLayout {
  enable_automatic_withdrawal?: number;
  withdraw_frequency?: Uint8Array;
  amount_per_period?: Uint8Array;
  transferable_by_sender?: number;
  transferable_by_recipient?: number;
  cancelable_by_sender?: number;
}

export interface ITopupStreamLayout {
  amount: Uint8Array;
}

export interface IPartnerLayout {
  pubkey: Uint8Array;
  creation_fee: number;
  auto_claim_fee: number;
  token_fee_percent: number;
}
