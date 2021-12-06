"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = void 0;
var buffer_layout_1 = __importDefault(require("buffer-layout"));
var web3_js_1 = require("@solana/web3.js");
var anchor_1 = require("@project-serum/anchor");
var LE = "le"; //little endian
var StreamInstructionLayout = buffer_layout_1.default.struct([
    buffer_layout_1.default.blob(8, "start_time"),
    buffer_layout_1.default.blob(8, "end_time"),
    buffer_layout_1.default.blob(8, "deposited_amount"),
    buffer_layout_1.default.blob(8, "total_amount"),
    buffer_layout_1.default.blob(8, "period"),
    buffer_layout_1.default.blob(8, "cliff"),
    buffer_layout_1.default.blob(8, "cliff_amount"),
    buffer_layout_1.default.blob(1, "cancelable_by_sender"),
    buffer_layout_1.default.blob(1, "cancelable_by_recipient"),
    buffer_layout_1.default.blob(1, "withdrawal_public"),
    buffer_layout_1.default.blob(1, "transferable by sender"),
    buffer_layout_1.default.blob(1, "transferable by recipient"),
    buffer_layout_1.default.blob(8, "release_rate"),
    buffer_layout_1.default.utf8(60, "stream_name"), //  NUL-terminated C string
]);
function decode_stream_instruction(buf) {
    var raw = StreamInstructionLayout.decode(buf);
    return {
        start_time: new anchor_1.BN(raw.start_time, LE),
        end_time: new anchor_1.BN(raw.end_time, LE),
        deposited_amount: new anchor_1.BN(raw.deposited_amount, LE),
        total_amount: new anchor_1.BN(raw.total_amount, LE),
        period: new anchor_1.BN(raw.period, LE),
        cliff: new anchor_1.BN(raw.cliff, LE),
        cliff_amount: new anchor_1.BN(raw.cliff_amount, LE),
        cancelable_by_sender: new Boolean(raw.cancelable_by_sender),
        cancelable_by_recipient: new Boolean(raw.cancelable_by_recipient),
        withdrawal_public: new Boolean(raw.withdrawal_public),
        transferable_by_sender: new Boolean(raw.transferable_by_sender),
        transferable_by_recipient: new Boolean(raw.transferable_by_recipient),
        release_rate: new anchor_1.BN(raw.release_rate, LE),
        stream_name: new String(raw.stream_name),
    };
}
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
    buffer_layout_1.default.blob(8, "end_time"),
    buffer_layout_1.default.blob(8, "deposited_amount"),
    buffer_layout_1.default.blob(8, "total_amount"),
    buffer_layout_1.default.blob(8, "period"),
    buffer_layout_1.default.blob(8, "cliff"),
    buffer_layout_1.default.blob(8, "cliff_amount"),
    buffer_layout_1.default.blob(1, "cancelable_by_sender"),
    buffer_layout_1.default.blob(1, "cancelable_by_recipient"),
    buffer_layout_1.default.blob(1, "withdrawal_public"),
    buffer_layout_1.default.blob(1, "transferable by sender"),
    buffer_layout_1.default.blob(1, "transferable by recipient"),
    buffer_layout_1.default.blob(8, "release_rate"),
    buffer_layout_1.default.utf8(200, "stream_name"), //  it is not NUL-terminated C string
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
        end_time: new anchor_1.BN(raw.end_time, LE),
        deposited_amount: new anchor_1.BN(raw.deposited_amount, LE),
        total_amount: new anchor_1.BN(raw.total_amount, LE),
        period: new anchor_1.BN(raw.period, LE),
        cliff: new anchor_1.BN(raw.cliff, LE),
        cliff_amount: new anchor_1.BN(raw.cliff_amount, LE),
        cancelable_by_sender: new Boolean(raw.cancelable_by_sender),
        cancelable_by_recipient: new Boolean(raw.cancelable_by_recipient),
        withdrawal_public: new Boolean(raw.withdrawal_public),
        transferable_by_sender: new Boolean(raw.transferable_by_sender),
        transferable_by_recipient: new Boolean(raw.transferable_by_recipient),
        release_rate: new anchor_1.BN(raw.release_rate, LE),
        stream_name: new String(raw.stream_name),
    };
}
exports.decode = decode;
