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
var PROGRAM_ID = idl_1.default.metadata.address; //todo: make optional.
function initProgram(connection, wallet) {
    var provider = new anchor_1.Provider(connection, wallet, {});
    return new anchor_1.Program(idl_1.default, PROGRAM_ID, provider);
}
var Timelock = /** @class */ (function () {
    function Timelock() {
    }
    Timelock.create = function (connection, wallet, newAcc, recipient, mint, depositedAmount, start, end, period, cliff, cliffAmount) {
        return __awaiter(this, void 0, void 0, function () {
            var program, metadata, escrowTokens, senderTokens, signers, instructions, balanceNeeded, newAccount, recipientTokens;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        program = initProgram(connection, wallet);
                        metadata = newAcc;
                        return [4 /*yield*/, anchor_1.web3.PublicKey.findProgramAddress([metadata.publicKey.toBuffer()], program.programId)];
                    case 1:
                        escrowTokens = (_a.sent())[0];
                        return [4 /*yield*/, spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, mint, wallet.publicKey)];
                    case 2:
                        senderTokens = _a.sent();
                        signers = [metadata];
                        instructions = undefined;
                        if (!(mint.toBase58() === spl_token_1.NATIVE_MINT.toBase58())) return [3 /*break*/, 4];
                        //this effectively means new account is created for each wSOL stream, as we can't derive it.
                        instructions = [];
                        return [4 /*yield*/, spl_token_1.Token.getMinBalanceRentForExemptAccount(connection)];
                    case 3:
                        balanceNeeded = _a.sent();
                        newAccount = web3_js_1.Keypair.generate();
                        signers.push(newAccount);
                        senderTokens = newAccount.publicKey;
                        instructions.push(web3_js_1.SystemProgram.createAccount({
                            fromPubkey: wallet.publicKey,
                            newAccountPubkey: newAccount.publicKey,
                            lamports: balanceNeeded,
                            space: spl_token_1.AccountLayout.span,
                            programId: spl_token_1.TOKEN_PROGRAM_ID,
                        }));
                        // Send lamports to it (these will be wrapped into native tokens by the token program)
                        instructions.push(web3_js_1.SystemProgram.transfer({
                            fromPubkey: wallet.publicKey,
                            toPubkey: newAccount.publicKey,
                            lamports: depositedAmount.toNumber(),
                        }));
                        // Assign the new account to the native token mint.
                        // the account will be initialized with a balance equal to the native token balance.
                        // (i.e. amount)
                        instructions.push(spl_token_1.Token.createInitAccountInstruction(spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.NATIVE_MINT, newAccount.publicKey, wallet.publicKey));
                        _a.label = 4;
                    case 4: return [4 /*yield*/, spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, mint, recipient)];
                    case 5:
                        recipientTokens = _a.sent();
                        return [4 /*yield*/, program.rpc.create(
                            // Order of the parameters must match the ones in program
                            depositedAmount, start, end, period, cliff, cliffAmount, {
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
                    case 6: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    //TODO: docs. 0 == max
    Timelock.withdraw = function (connection, wallet, stream, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var program, escrow, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        program = initProgram(connection, wallet);
                        return [4 /*yield*/, connection.getAccountInfo(stream)];
                    case 1:
                        escrow = _a.sent();
                        if (!(escrow === null || escrow === void 0 ? void 0 : escrow.data)) {
                            throw new Error("Couldn't get account info");
                        }
                        data = (0, layout_1.decode)(escrow.data);
                        return [4 /*yield*/, program.rpc.withdraw(amount, {
                                accounts: {
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
    Timelock.cancel = function (connection, wallet, stream) {
        return __awaiter(this, void 0, void 0, function () {
            var program, escrow_acc, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        program = initProgram(connection, wallet);
                        return [4 /*yield*/, connection.getAccountInfo(stream)];
                    case 1:
                        escrow_acc = _a.sent();
                        if (!(escrow_acc === null || escrow_acc === void 0 ? void 0 : escrow_acc.data)) {
                            throw new Error("Couldn't get account info");
                        }
                        data = (0, layout_1.decode)(escrow_acc === null || escrow_acc === void 0 ? void 0 : escrow_acc.data);
                        return [4 /*yield*/, program.rpc.cancel({
                                accounts: {
                                    sender: wallet.publicKey,
                                    senderTokens: data.sender_tokens,
                                    recipient: data.recipient,
                                    recipientTokens: data.recipient_tokens,
                                    metadata: stream,
                                    escrowTokens: data.escrow_tokens,
                                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                                    mint: data.mint,
                                },
                            })];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Timelock.transferRecipient = function (connection, wallet, stream, newRecipient) {
        return __awaiter(this, void 0, void 0, function () {
            var program, escrow, data, mint, newRecipientTokens;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        program = initProgram(connection, wallet);
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
    return Timelock;
}());
exports.default = Timelock;
