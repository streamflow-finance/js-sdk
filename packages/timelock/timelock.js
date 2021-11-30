"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var anchor_1 = require("@project-serum/anchor");
var spl_token_1 = require("@solana/spl-token");
var web3_js_1 = require("@solana/web3.js");
var idl_1 = __importDefault(require("./idl"));
var layout_1 = require("./layout");
function initProgram(connection, wallet, timelockProgramId) {
    var provider = new anchor_1.Provider(connection, wallet, {});
    return new anchor_1.Program(idl_1.default, timelockProgramId, provider);
}
var Timelock = /** @class */ (function () {
    function Timelock() {
    }
    /**
     * Creates a new stream/vesting contract. All fees are paid by sender. (escrow metadata account rent, escrow token account, recipient's associated token account creation
     * @param {Connection} connection
     * @param {Wallet} wallet - Wallet signing the transaction.
     * @param {Address} timelockProgramId - Program ID of a timelock program on chain.
     * @param {Keypair} newAcc - New escrow account containing all of the stream/vesting contract metadata.
     * @param {PublicKey} recipient - Solana address of a recipient. Associated token account will be derived from this address and SPL Token mint address.
     * @param {PublicKey} mint - SPL Token mint.
     * @param {BN} depositedAmount - Initially deposited amount of tokens.
     * @param {BN} start - Timestamp (in seconds) when the tokens start vesting
     * @param {BN} end - Timestamp when all tokens are fully vested
     * @param {BN} period - Time step (period) in seconds per which the vesting occurs
     * @param {BN} cliff - Vesting contract "cliff" timestamp
     * @param {BN} cliffAmount - Amount unlocked at the "cliff" timestamp
     * @param {boolean} cancelable_by_sender - Can sender cancel stream
     * @param {boolean} cancelable_by_recipient - Can recepient cancel stream
     * @param {boolean} withdrawal_public - Whether or not a 3rd party can initiate withdraw in the name of recipient (currently not used, set to FALSE)
     * @param {boolean} transferable - Whether or not recipient can transfer the stream
     * @param {BN} releaseRate - Period rate in recurring payment
     * @param {String} streamName - Name or subject of the stream
     */
    Timelock.create = function (connection, wallet, timelockProgramId, newAcc, recipient, mint, depositedAmount, start, end, period, cliff, cliffAmount, cancelable_by_sender, cancelable_by_recipient, withdrawal_public, transferable, release_rate, stream_name) {
        return __awaiter(this, void 0, void 0, function () {
            var program, metadata, escrowTokens, senderTokens, signers, instructions, recipientTokens;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("program", timelockProgramId);
                        program = initProgram(connection, wallet, timelockProgramId);
                        console.log("program", program.programId);
                        metadata = newAcc;
                        return [4 /*yield*/, anchor_1.web3.PublicKey.findProgramAddress([metadata.publicKey.toBuffer()], program.programId)];
                    case 1:
                        escrowTokens = (_a.sent())[0];
                        return [4 /*yield*/, spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, mint, wallet.publicKey)];
                    case 2:
                        senderTokens = _a.sent();
                        signers = [metadata];
                        instructions = undefined;
                        return [4 /*yield*/, spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, mint, recipient)];
                    case 3:
                        recipientTokens = _a.sent();
                        return [4 /*yield*/, program.rpc.create(
                            // Order of the parameters must match the ones in program
                            start, end, depositedAmount, depositedAmount, period, cliff, cliffAmount, cancelable_by_sender, cancelable_by_recipient, withdrawal_public, transferable, release_rate, stream_name, {
                                accounts: {
                                    sender: wallet.publicKey,
                                    senderTokens: senderTokens,
                                    recipient: recipient,
                                    recipientTokens: recipientTokens,
                                    metadata: metadata.publicKey,
                                    escrowTokens: escrowTokens,
                                    mint: mint,
                                    rent: web3_js_1.SYSVAR_RENT_PUBKEY,
                                    timelockProgram: program.programId,
                                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                                    systemProgram: anchor_1.web3.SystemProgram.programId,
                                    associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
                                },
                                signers: signers,
                                instructions: instructions,
                            })];
                    case 4: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Attempts withdrawal from a specified stream.
     * @param {Connection} connection
     * @param {Wallet} wallet - Wallet signing the transaction. It's address should match current stream recipient or transaction will fail.
     * @param {Address} timelockProgramId - Program ID of a timelock program on chain.
     * @param {PublicKey} stream - Identifier of a stream (escrow account with metadata) to be withdrawn from.
     * @param {BN} amount - Requested amount to withdraw. If BN(0), program attempts to withdraw maximum available amount.
     */
    Timelock.withdraw = function (connection, wallet, timelockProgramId, stream, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var program, escrow, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        program = initProgram(connection, wallet, timelockProgramId);
                        return [4 /*yield*/, connection.getAccountInfo(stream)];
                    case 1:
                        escrow = _a.sent();
                        if (!(escrow === null || escrow === void 0 ? void 0 : escrow.data)) {
                            throw new Error("Couldn't get account info");
                        }
                        data = (0, layout_1.decode)(escrow.data);
                        return [4 /*yield*/, program.rpc.withdraw(amount, {
                                accounts: {
                                    withdrawAuthority: wallet.publicKey,
                                    sender: data.sender,
                                    recipient: wallet.publicKey,
                                    recipientTokens: data.recipient_tokens,
                                    metadata: stream,
                                    escrowTokens: data.escrow_tokens,
                                    mint: data.mint,
                                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                                },
                            })];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Attempts canceling the specified stream.
     * @param {Connection} connection
     * @param {Wallet} wallet - Wallet signing the transaction. It's address should match current stream sender or transaction will fail.
     * @param {Address} timelockProgramId - Program ID of a timelock program on chain.
     * @param {PublicKey} stream - Identifier of a stream (escrow account with metadata) to be canceled.
     */
    Timelock.cancel = function (connection, wallet, timelockProgramId, stream) {
        return __awaiter(this, void 0, void 0, function () {
            var program, escrow_acc, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        program = initProgram(connection, wallet, timelockProgramId);
                        return [4 /*yield*/, connection.getAccountInfo(stream)];
                    case 1:
                        escrow_acc = _a.sent();
                        if (!(escrow_acc === null || escrow_acc === void 0 ? void 0 : escrow_acc.data)) {
                            throw new Error("Couldn't get account info");
                        }
                        data = (0, layout_1.decode)(escrow_acc === null || escrow_acc === void 0 ? void 0 : escrow_acc.data);
                        return [4 /*yield*/, program.rpc.cancel({
                                accounts: {
                                    cancelAuthority: wallet.publicKey,
                                    sender: wallet.publicKey,
                                    senderTokens: data.sender_tokens,
                                    recipient: data.recipient,
                                    recipientTokens: data.recipient_tokens,
                                    metadata: stream,
                                    escrowTokens: data.escrow_tokens,
                                    mint: data.mint,
                                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                                },
                            })];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Attempts changing the stream/vesting contract's recipient (effectively transferring the stream/vesting contract).
     * Potential associated token account rent fee (to make it rent-exempt) is paid by the transaction initiator (i.e. current recipient)
     * @param {Connection} connection
     * @param {Wallet} wallet - Wallet signing the transaction. It's address should match current stream recipient or transaction will fail.
     * @param {Address} timelockProgramId - Program ID of a timelock program on chain.
     * @param {PublicKey} stream - Identifier of a stream (escrow account with metadata) to be transferred.
     * @param {PublicKey} newRecipient - Address of a new stream/vesting contract recipient.
     */
    Timelock.transferRecipient = function (connection, wallet, timelockProgramId, stream, newRecipient) {
        return __awaiter(this, void 0, void 0, function () {
            var program, escrow, data, mint, newRecipientTokens;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        program = initProgram(connection, wallet, timelockProgramId);
                        return [4 /*yield*/, connection.getAccountInfo(stream)];
                    case 1:
                        escrow = _a.sent();
                        if (!(escrow === null || escrow === void 0 ? void 0 : escrow.data)) {
                            throw new Error("Couldn't get account info");
                        }
                        data = (0, layout_1.decode)(escrow === null || escrow === void 0 ? void 0 : escrow.data);
                        mint = data.mint;
                        return [4 /*yield*/, spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, mint, newRecipient)];
                    case 2:
                        newRecipientTokens = _a.sent();
                        return [4 /*yield*/, program.rpc.transferRecipient({
                                accounts: {
                                    existingRecipient: wallet.publicKey,
                                    newRecipient: newRecipient,
                                    newRecipientTokens: newRecipientTokens,
                                    metadata: stream,
                                    escrowTokens: data.escrow_tokens,
                                    mint: mint,
                                    rent: web3_js_1.SYSVAR_RENT_PUBKEY,
                                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                                    associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
                                    system: anchor_1.web3.SystemProgram.programId,
                                },
                            })];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
   * Tops up stream account deposited amount
   * @param {Connection} connection
   * @param {Wallet} wallet - Wallet signing the transaction. It's address should match current stream recipient or transaction will fail.
   * @param {Address} timelockProgramId - Program ID of a timelock program on chain.
   * @param {PublicKey} stream - Identifier of a stream (escrow account with metadata) to be transferred.
   * @param {BN} amount - Requested amount to withdraw. If BN(0), program attempts to withdraw maximum available amount.
   */
    Timelock.topup = function (connection, wallet, timelockProgramId, stream, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var program, escrow, data, mint;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        program = initProgram(connection, wallet, timelockProgramId);
                        return [4 /*yield*/, connection.getAccountInfo(stream)];
                    case 1:
                        escrow = _a.sent();
                        if (!(escrow === null || escrow === void 0 ? void 0 : escrow.data)) {
                            throw new Error("Couldn't get account info");
                        }
                        data = (0, layout_1.decode)(escrow === null || escrow === void 0 ? void 0 : escrow.data);
                        mint = data.mint;
                        return [4 /*yield*/, program.rpc.topup(amount, {
                                accounts: {
                                    sender: wallet.publicKey,
                                    senderTokens: data.sender_tokens,
                                    metadata: stream,
                                    escrowTokens: data.escrow_tokens,
                                    mint: mint,
                                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                                },
                            })];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return Timelock;
}());
exports.default = Timelock;
