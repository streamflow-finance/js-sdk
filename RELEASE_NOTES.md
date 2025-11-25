# Streamflow JS SDK Release Notes

## v10.0.0

### Breaking Changes

*   **Removed Payments Stream Type:** The `StreamType.Payment` enum value has been removed. The `StreamType` enum now only includes `All`, `Vesting`, and `Lock`. If your code references `StreamType.Payment`, you'll need to update it to use one of the remaining types or remove the reference.
*   **Removed Multi-Chain Support:** All non-Solana blockchain implementations have been removed from the SDK:
    *   **Aptos** support removed (`packages/stream/aptos/`)
    *   **EVM** (Ethereum/Polygon/Avalanche) support removed (`packages/stream/evm/`)
    *   **Sui** support removed (`packages/stream/sui/`)
    *   The SDK is now **Solana-only**. If you were using any of these implementations, please see the v9 branch of the SDK which we will continue to support, but not activelty improve or add new features.
*   **Removed GenericStreamClient:** The `GenericStreamClient` and `BaseStreamClient` classes have been removed. The SDK now only provides `SolanaStreamClient` (exported as `SolanaStreamClient`). Update your imports:
    *   **Before:** `import { GenericStreamClient } from "@streamflow/stream/common"`
    *   **After:** `import { SolanaStreamClient } from "@streamflow/stream"`
*   **Partner Fee Structure Changes:** The partner fee structure has been updated. The `partner` parameter now defaults to the sender's address if not provided. Review your stream creation code to ensure partner fees are configured correctly.

### New Features

*   **Price-based Streams (Aligned Streams) Documentation:** Added comprehensive documentation for creating and managing price-based streams that dynamically adjust unlock rates based on token price oracles. The documentation includes:
    *   Creating price-based vesting streams
    *   Creating price-based token locks
    *   Fetching and accessing aligned stream data
    *   Integration with Streamflow's Oracle API

### Enhancements

*   **Improved Metadata Handling:** Enhanced support for custom metadata public keys via the `metadataPubKeys` parameter in stream creation methods. You can now pass an array of metadata public keys for batch operations.
*   **Fixed Double ATA Creation:** Resolved an issue where WSOL (wrapped SOL) streams would attempt to create duplicate Associated Token Accounts when the recipient and sender were the same address.
*   **Removed Treasury ATA Creation:** The SDK no longer automatically creates Streamflow treasury ATA accounts, reducing transaction size and costs.
*   **Squads Ephemeral Signatures Support:** Fixed support for Squads multisig wallets using ephemeral signatures.
*   **Better Error Handling:** Improved error handling and null/undefined checks throughout the SDK.

### Documentation Updates

*   Enhanced `@streamflow/stream` README with detailed examples for price-based stream creation
*   Added examples for fetching aligned stream properties using `getOne()`, `get()`, and `searchStreams()`
*   Documented Oracle API integration for fetching price oracle addresses
*   Removed references to non-Solana chains from documentation

### Migration Guide

If you're upgrading from v8.x or v9.x to v10.0.0:

1.   **Update Imports:**
    *   Remove any imports from `@streamflow/stream/common`, `@streamflow/stream/aptos`, `@streamflow/stream/evm`, or `@streamflow/stream/sui`
    *   Use only `@streamflow/stream` for Solana-specific imports
    *   Replace `GenericStreamClient` with `SolanaStreamClient`

2.   **Update Stream Type References:**
    *   Remove any code that references `StreamType.Payment`
    *   Update your code to use `StreamType.Vesting`, `StreamType.Lock`, or `StreamType.All`

3.   **Review Partner Fee Configuration:**
    *   If you were explicitly setting `partner` to `undefined` or relying on default behavior, verify that the new default (sender address) works for your use case
    *   Update partner fee logic if needed

4.   **Update Dependencies:**
    *   Remove any non-Solana blockchain dependencies from your `package.json`
    *   Ensure you're only using Solana-related packages

5.   **Test Metadata Handling:**
    *   If you're using custom metadata public keys, test that the new `metadataPubKeys` array parameter works correctly with your implementation
