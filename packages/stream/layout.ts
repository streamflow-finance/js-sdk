const BufferLayout = require("buffer-layout");

/**
 * Stream layout
 */
export const streamLayout: typeof BufferLayout.Structure = BufferLayout.struct([
  BufferLayout.blob(8, "magic"),
  BufferLayout.blob(1, "version"),
  BufferLayout.blob(8, "created_at"),
  BufferLayout.blob(8, "withdrawn_amount"),
  BufferLayout.blob(8, "canceled_at"),
  BufferLayout.blob(8, "end_time"),
  BufferLayout.blob(8, "last_withdrawn_at"),
  BufferLayout.blob(32, "sender"),
  BufferLayout.blob(32, "sender_tokens"),
  BufferLayout.blob(32, "recipient"),
  BufferLayout.blob(32, "recipient_tokens"),
  BufferLayout.blob(32, "mint"),
  BufferLayout.blob(32, "escrow_tokens"),
  BufferLayout.blob(32, "streamflow_treasury"),
  BufferLayout.blob(32, "streamflow_treasury_tokens"),
  BufferLayout.blob(8, "streamflow_fee_total"),
  BufferLayout.blob(8, "streamflow_fee_withdrawn"),
  BufferLayout.f32("streamflow_fee_percent"),
  BufferLayout.blob(32, "partner"),
  BufferLayout.blob(32, "partner_tokens"),
  BufferLayout.blob(8, "partner_fee_total"),
  BufferLayout.blob(8, "partner_fee_withdrawn"),
  BufferLayout.f32("partner_fee_percent"),
  BufferLayout.blob(8, "start_time"),
  BufferLayout.blob(8, "net_amount_deposited"),
  BufferLayout.blob(8, "period"),
  BufferLayout.blob(8, "amount_per_period"),
  BufferLayout.blob(8, "cliff"),
  BufferLayout.blob(8, "cliff_amount"),
  BufferLayout.u8("cancelable_by_sender"),
  BufferLayout.u8("cancelable_by_recipient"),
  BufferLayout.u8("automatic_withdrawal"),
  BufferLayout.u8("transferable_by_sender"),
  BufferLayout.u8("transferable_by_recipient"),
  BufferLayout.u8("can_topup"),
  BufferLayout.blob(64, "stream_name"),
  BufferLayout.blob(8, "withdraw_frequency"),
]);

/**
 * Create stream instruction layout
 */
export const createStreamLayout: typeof BufferLayout.Structure =
  BufferLayout.struct([
    BufferLayout.blob(8, "start_time"),
    BufferLayout.blob(8, "net_amount_deposited"),
    BufferLayout.blob(8, "period"),
    BufferLayout.blob(8, "amount_per_period"),
    BufferLayout.blob(8, "cliff"),
    BufferLayout.blob(8, "cliff_amount"),
    BufferLayout.u8("cancelable_by_sender"),
    BufferLayout.u8("cancelable_by_recipient"),
    BufferLayout.u8("automatic_withdrawal"),
    BufferLayout.u8("transferable_by_sender"),
    BufferLayout.u8("transferable_by_recipient"),
    BufferLayout.u8("can_topup"),
    BufferLayout.blob(64, "stream_name"),
    BufferLayout.blob(8, "withdraw_frequency"),
  ]);

/**
 * Create unchecked stream instruction layout
 */
export const createUncheckedStreamLayout: typeof BufferLayout.Structure =
  BufferLayout.struct([
    BufferLayout.blob(8, "start_time"),
    BufferLayout.blob(8, "net_amount_deposited"),
    BufferLayout.blob(8, "period"),
    BufferLayout.blob(8, "amount_per_period"),
    BufferLayout.blob(8, "cliff"),
    BufferLayout.blob(8, "cliff_amount"),
    BufferLayout.u8("cancelable_by_sender"),
    BufferLayout.u8("cancelable_by_recipient"),
    BufferLayout.u8("automatic_withdrawal"),
    BufferLayout.u8("transferable_by_sender"),
    BufferLayout.u8("transferable_by_recipient"),
    BufferLayout.u8("can_topup"),
    BufferLayout.blob(64, "stream_name"),
    BufferLayout.blob(8, "withdraw_frequency"),
    BufferLayout.blob(32, "recipient"),
    BufferLayout.blob(32, "partner"),
    BufferLayout.u8("pausable"),
    BufferLayout.u8("can_update_rate"),
  ]);

/**
 * Withdraw stream instruction layout
 */
export const withdrawStreamLayout: typeof BufferLayout.Structure =
  BufferLayout.struct([BufferLayout.blob(8, "amount")]);

/**
 * Topup stream instruction layout
 */
export const topupStreamLayout: typeof BufferLayout.Structure =
  BufferLayout.struct([BufferLayout.blob(8, "amount")]);
