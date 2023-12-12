import * as BufferLayout from "@solana/buffer-layout";

import { CREATE_PARAMS_PADDING } from "./constants";
import {
  ICreateStreamLayout,
  ICreateUncheckedStreamLayout,
  IPartnerLayout,
  IStreamLayout,
  ITopupStreamLayout,
  IUpdateStreamLayout,
  IWithdrawStreamLayout,
} from "./instructionTypes";

/**
 * Stream layout
 */
export const streamLayout: BufferLayout.Structure<IStreamLayout> = BufferLayout.struct([
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

  // Unused, kept for backward compatibility™
  BufferLayout.blob(4, "ghost"),

  BufferLayout.u8("pausable"),
  BufferLayout.u8("can_update_rate"),
  BufferLayout.blob(4, "create_stream_params_padding_length"),
  BufferLayout.seq(BufferLayout.u8(), CREATE_PARAMS_PADDING, "create_params_padding"),
  BufferLayout.u8("closed"),
  BufferLayout.blob(8, "current_pause_start"),
  BufferLayout.blob(8, "pause_cumulative"),
  BufferLayout.blob(8, "last_rate_change_time"),
  BufferLayout.blob(8, "funds_unlocked_at_last_rate_change"),
]);

export const partnerLayout: BufferLayout.Structure<IPartnerLayout> = BufferLayout.struct([
  BufferLayout.blob(32, "pubkey"),
  BufferLayout.f32("partner_fee"),
  BufferLayout.f32("strm_fee"),
]);

/**
 * Create stream instruction layout
 */
export const createStreamLayout: BufferLayout.Structure<ICreateStreamLayout> = BufferLayout.struct([
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
export const createUncheckedStreamLayout: BufferLayout.Structure<ICreateUncheckedStreamLayout> =
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
export const withdrawStreamLayout: BufferLayout.Structure<IWithdrawStreamLayout> =
  BufferLayout.struct([BufferLayout.blob(8, "amount")]);

/**
 * Encode stream instruction layout
 */
export const encodeUpdateStream = (values: IUpdateStreamLayout, data: Buffer): number => {
  const structs: (BufferLayout.UInt | BufferLayout.Blob)[] = [];
  if (values.enable_automatic_withdrawal) {
    structs.push(BufferLayout.u8("enable_automatic_withdrawal_exists"));
    structs.push(BufferLayout.u8("enable_automatic_withdrawal"));
  } else {
    structs.push(BufferLayout.u8("enable_automatic_withdrawal_exists"));
  }
  if (values.withdraw_frequency) {
    structs.push(BufferLayout.u8("withdraw_frequency_exists"));
    structs.push(BufferLayout.blob(8, "withdraw_frequency"));
  } else {
    structs.push(BufferLayout.u8("withdraw_frequency_exists"));
  }
  if (values.amount_per_period) {
    structs.push(BufferLayout.u8("amount_per_period_exists"));
    structs.push(BufferLayout.blob(8, "amount_per_period"));
  } else {
    structs.push(BufferLayout.u8("amount_per_period_exists"));
  }
  return BufferLayout.struct<any>(structs).encode(
    {
      enable_automatic_withdrawal_exists: values.enable_automatic_withdrawal ? 1 : 0,
      enable_automatic_withdrawal: values.enable_automatic_withdrawal ?? 0,
      withdraw_frequency_exists: values.withdraw_frequency ? 1 : 0,
      withdraw_frequency: values.withdraw_frequency ?? 0,
      amount_per_period_exists: values.amount_per_period ? 1 : 0,
      amount_per_period: values.amount_per_period ?? 0,
    },
    data
  );
};

/**
 * Topup stream instruction layout
 */
export const topupStreamLayout: BufferLayout.Structure<ITopupStreamLayout> = BufferLayout.struct([
  BufferLayout.blob(8, "amount"),
]);
