"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    version: "0.0.0",
    name: "timelock",
    instructions: [
        {
            name: "create",
            accounts: [
                {
                    name: "sender",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "senderTokens",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "recipient",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "recipientTokens",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "metadata",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "escrowTokens",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "mint",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "rent",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "timelockProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "associatedTokenProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "amount",
                    type: "u64",
                },
                {
                    name: "startTime",
                    type: "u64",
                },
                {
                    name: "endTime",
                    type: "u64",
                },
                {
                    name: "period",
                    type: "u64",
                },
                {
                    name: "cliff",
                    type: "u64",
                },
                {
                    name: "cliffAmount",
                    type: "u64",
                },
            ],
        },
        {
            name: "withdraw",
            accounts: [
                {
                    name: "recipient",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "recipientTokens",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "metadata",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "escrowTokens",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "mint",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "amount",
                    type: "u64",
                },
            ],
        },
        {
            name: "cancel",
            accounts: [
                {
                    name: "sender",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "senderTokens",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "recipient",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "recipientTokens",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "metadata",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "escrowTokens",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "mint",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
        {
            name: "transferRecipient",
            accounts: [
                {
                    name: "existingRecipient",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "newRecipient",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "newRecipientTokens",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "metadata",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "escrowTokens",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "mint",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "rent",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "tokenProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "associatedTokenProgram",
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: "system",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [],
        },
    ],
    metadata: {
        address: "BBbP5MHFSfcoygAtaPpWUmiEdb7yW2mZHDzg2MTnAsVa",
    },
};
