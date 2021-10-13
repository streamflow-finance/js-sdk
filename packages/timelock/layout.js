"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = void 0;
var buffer_layout_1 = __importDefault(require("buffer-layout"));
var web3_js_1 = require("@solana/web3.js");
var anchor_1 = require("@project-serum/anchor");
var instructionsFields = [
    buffer_layout_1.default.blob(8, "start_time"),
    buffer_layout_1.default.blob(8, "end_time"),
    buffer_layout_1.default.blob(8, "deposited_amount"),
    buffer_layout_1.default.blob(8, "total_amount"),
    buffer_layout_1.default.blob(8, "period"),
    buffer_layout_1.default.blob(8, "cliff"),
    buffer_layout_1.default.blob(8, "cliff_amount"),
];
var StreamInstructionLayout = buffer_layout_1.default.struct(instructionsFields);
function decode_stream_instruction(buf) {
    var raw = StreamInstructionLayout.decode(buf);
    return {
        start_time: new anchor_1.BN(raw.start_time),
        end_time: new anchor_1.BN(raw.end_time),
        deposited_amount: new anchor_1.BN(raw.deposited_amount),
        total_amount: new anchor_1.BN(raw.total_amount),
        period: new anchor_1.BN(raw.period),
        cliff: new anchor_1.BN(raw.cliff),
        cliff_amount: new anchor_1.BN(raw.cliff_amount),
    };
}
var TokenStreamDataLayout = buffer_layout_1.default.struct(__spreadArray(__spreadArray([
    buffer_layout_1.default.blob(8, "magic")
], instructionsFields, true), [
    buffer_layout_1.default.blob(8, "created_at"),
    buffer_layout_1.default.blob(8, "withdrawn"),
    buffer_layout_1.default.blob(8, "cancel_time"),
    buffer_layout_1.default.blob(32, "sender"),
    buffer_layout_1.default.blob(32, "sender_tokens"),
    buffer_layout_1.default.blob(32, "recipient"),
    buffer_layout_1.default.blob(32, "recipient_tokens"),
    buffer_layout_1.default.blob(32, "mint"),
    buffer_layout_1.default.blob(32, "escrow_tokens"),
], false));
function decode(buf) {
    var raw = TokenStreamDataLayout.decode(buf);
    return {
        magic: new anchor_1.BN(raw.magic),
        start_time: new anchor_1.BN(raw.start_time),
        end_time: new anchor_1.BN(raw.end_time),
        deposited_amount: new anchor_1.BN(raw.deposited_amount),
        total_amount: new anchor_1.BN(raw.total_amount),
        period: new anchor_1.BN(raw.period),
        cliff: new anchor_1.BN(raw.cliff),
        cliff_amount: new anchor_1.BN(raw.cliff_amount),
        created_at: new anchor_1.BN(raw.created_at),
        withdrawn: new anchor_1.BN(raw.withdrawn),
        cancel_time: new anchor_1.BN(raw.cancel_time),
        sender: new web3_js_1.PublicKey(raw.sender),
        sender_tokens: new web3_js_1.PublicKey(raw.sender_tokens),
        recipient: new web3_js_1.PublicKey(raw.recipient),
        recipient_tokens: new web3_js_1.PublicKey(raw.recipient_tokens),
        mint: new web3_js_1.PublicKey(raw.mint),
        escrow_tokens: new web3_js_1.PublicKey(raw.escrow_tokens),
    };
}
exports.decode = decode;
