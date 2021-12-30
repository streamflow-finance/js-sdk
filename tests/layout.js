"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = void 0;
var buffer_layout_1 = __importDefault(require("buffer-layout"));
var web3_js_1 = require("@solana/web3.js");
var anchor_1 = require("@project-serum/anchor");
var LE = "le"; //little endian

var TokenStreamDataLayout = buffer_layout_1.default.struct([
  buffer_layout_1.default.blob(8, "magic"),
  buffer_layout_1.default.blob(8, "created_at"),
  buffer_layout_1.default.blob(8, "withdrawn_amount"),
  buffer_layout_1.default.blob(8, "canceled_at"),
  buffer_layout_1.default.blob(8, "closable_at"),
  buffer_layout_1.default.blob(8, "last_withdrawn_at"),
  buffer_layout_1.default.blob(32, "sender"),
  buffer_layout_1.default.blob(32, "sender_tokens"),
  buffer_layout_1.default.blob(32, "recipient"),
  buffer_layout_1.default.blob(32, "recipient_tokens"),
  buffer_layout_1.default.blob(32, "mint"),
  buffer_layout_1.default.blob(32, "escrow_tokens"),
  buffer_layout_1.default.blob(8, "start_time"),
  buffer_layout_1.default.blob(8, "net_deposited_amount"),
  buffer_layout_1.default.blob(8, "period"),
  buffer_layout_1.default.blob(8, "amount_per_period"),
  buffer_layout_1.default.blob(8, "cliff"),
  buffer_layout_1.default.blob(8, "cliff_amount"),
  buffer_layout_1.default.blob(1, "cancelable_by_sender"),
  buffer_layout_1.default.blob(1, "cancelable_by_recipient"),
  buffer_layout_1.default.blob(1, "automatic_withdrawal"),
  buffer_layout_1.default.blob(1, "transferable_by_sender"),
  buffer_layout_1.default.blob(1, "transferable_by_recipient"),
  buffer_layout_1.default.blob(1, "can_topup"),
  buffer_layout_1.default.utf8(200, "stream_name"), //  NUL-terminated C string
]);

function decode(buf) {
  var raw = TokenStreamDataLayout.decode(buf);
  return {
    magic: new anchor_1.BN(raw.magic, LE),
    created_at: new anchor_1.BN(raw.created_at, LE),
    withdrawn_amount: new anchor_1.BN(raw.withdrawn_amount, LE),
    canceled_at: new anchor_1.BN(raw.canceled_at, LE),
    closable_at: new anchor_1.BN(raw.closable_at, LE),
    last_withdrawn_at: new anchor_1.BN(raw.last_withdrawn_at, LE),
    sender: new web3_js_1.PublicKey(raw.sender),
    sender_tokens: new web3_js_1.PublicKey(raw.sender_tokens),
    recipient: new web3_js_1.PublicKey(raw.recipient),
    recipient_tokens: new web3_js_1.PublicKey(raw.recipient_tokens),
    mint: new web3_js_1.PublicKey(raw.mint),
    escrow_tokens: new web3_js_1.PublicKey(raw.escrow_tokens),
    start_time: new anchor_1.BN(raw.start_time, LE),
    net_deposited_amount: new anchor_1.BN(raw.net_deposited_amount, LE),
    period: new anchor_1.BN(raw.period, LE),
    amount_per_period: new anchor_1.BN(raw.amount_per_period, LE),
    cliff: new anchor_1.BN(raw.cliff, LE),
    cliff_amount: new anchor_1.BN(raw.cliff_amount, LE),
    cancelable_by_sender: Boolean(raw.cancelable_by_sender).valueOf(),
    cancelable_by_recipient: Boolean(raw.cancelable_by_recipient).valueOf(),
    automatic_withdrawal: Boolean(raw.automatic_withdrawal).valueOf(),
    transferable_by_sender: Boolean(raw.transferable_by_sender).valueOf(),
    transferable_by_recipient: Boolean(raw.transferable_by_recipient).valueOf(),
    can_topup: Boolean(raw.can_topup).valueOf(),
    stream_name: String(raw.stream_name),
  };
}

exports.decode = decode;
