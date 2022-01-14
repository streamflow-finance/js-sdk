#!/usr/bin/env bash
# This script configures the devnet for test transfers with hardcoded addresses.
set -x

solana config set --url l
# Fund our account (as defined in solana/keys/solana-devnet.json).
retry solana airdrop 1000

# Create a new SPL token
token=$(spl-token create-token | grep 'Creating token' | awk '{ print $3 }')

# Create token account
account=$(spl-token create-account "$token" | grep 'Creating account' | awk '{ print $3 }')

# Mint new tokens owned by our CLI account
spl-token mint "$token" 10000000000 "$account"

spl-token transfer "$token" 1000000 "$1" --fund-recipient --allow-unfunded-recipient

echo "Token $token"
