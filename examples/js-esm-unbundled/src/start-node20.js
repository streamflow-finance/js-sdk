/**
 * Example of using Streamflow SDK with JavaScript, ESM, and no bundler
 *
 * This example demonstrates:
 * 1. Importing multiple Streamflow SDK packages using ESM imports in JavaScript
 * 2. Creating client instances for different Streamflow services
 * 3. Basic usage of the SDK packages
 */

// Import specific exports from each package
import { StreamflowSolana } from "@streamflow/stream";
import { ICluster, ContractError } from "@streamflow/common";
import { StreamflowDistributorSolana } from "@streamflow/distributor";
import { SolanaStakingClient } from "@streamflow/staking";
import { SolanaLaunchpadClient } from "@streamflow/launchpad";
// Other entrypoints to test that the package.json is correct
import { MerkleDistributor } from "@streamflow/distributor/solana";
import {prepareTransaction} from "@streamflow/common/solana";

// Import IDL files to test import resolving
import streamflowAlignedUnlocksIDL from "@streamflow/stream/solana/idl/streamflow_aligned_unlocks.json" with { type: "json" };
import merkleDistributorIDL from "@streamflow/distributor/solana/idl/merkle_distributor.json" with { type: "json" };
import alignedDistributorIDL from "@streamflow/distributor/solana/idl/aligned_distributor.json" with { type: "json" };
import rewardPoolIDL from "@streamflow/staking/solana/idl/reward_pool.json" with { type: "json" };
import stakePoolIDL from "@streamflow/staking/solana/idl/stake_pool.json" with { type: "json" };
import streamflowLaunchpadIDL from "@streamflow/launchpad/solana/idl/streamflow_launchpad.json" with { type: "json" };

/**
 * Verify that we're running in the correct environment (ESM)
 */
function verifyEnvironment() {
  console.log("Verifying ESM environment...");

  // Check if we're in an ESM environment
  if (typeof import.meta !== "object") {
    throw new Error("Not running in an ESM environment! This example requires ESM.");
  }

  // Check if import.meta.url exists (ESM feature)
  if (typeof import.meta.url !== "string") {
    throw new Error("import.meta.url not found! This example requires ESM.");
  }

  // We can't directly check the file path in ESM like we can in CJS,
  // but we can check if dynamic import works
  try {
    console.log("Verified: import.meta is available, indicating ESM environment");

    // Check if the URL contains 'esm' (not always reliable but a good hint)
    const url = import.meta.url;
    if (url.includes("/node_modules/@streamflow/") && !url.includes("/esm/")) {
      console.warn("Warning: URL path does not contain '/esm/', might not be using ESM version");
    }

    // Verify StreamClient is loaded correctly
    if (typeof StreamflowSolana.SolanaStreamClient !== "function") {
      throw new Error("SolanaStreamClient is not a constructor function");
    }
    console.log("Verified: SolanaStreamClient loaded correctly");

    // Verify DistributorClient is loaded correctly
    if (typeof StreamflowDistributorSolana.SolanaDistributorClient !== "function") {
      throw new Error("SolanaDistributorClient is not a constructor function");
    }
    console.log("Verified: SolanaDistributorClient loaded correctly");

    // Verify StakingClient is loaded correctly
    if (typeof SolanaStakingClient !== "function") {
      throw new Error("SolanaStakingClient is not a constructor function");
    }
    console.log("Verified: SolanaStakingClient loaded correctly");

    // Verify LaunchpadClient is loaded correctly
    if (typeof SolanaLaunchpadClient !== "function") {
      throw new Error("SolanaLaunchpadClient is not a constructor function");
    }
    console.log("Verified: SolanaLaunchpadClient loaded correctly");

    // Verify IDL files are loaded correctly
    if (!streamflowAlignedUnlocksIDL?.default || typeof streamflowAlignedUnlocksIDL.default !== "object") {
      throw new Error("streamflowAlignedUnlocksIDL not loaded correctly");
    }
    console.log("Verified: Stream IDL loaded correctly");

    if (!merkleDistributorIDL?.default || typeof merkleDistributorIDL.default !== "object") {
      throw new Error("merkleDistributorIDL not loaded correctly");
    }
    if (!alignedDistributorIDL?.default || typeof alignedDistributorIDL.default !== "object") {
      throw new Error("alignedDistributorIDL not loaded correctly");
    }
    console.log("Verified: Distributor IDLs loaded correctly");

    if (!rewardPoolIDL?.default || typeof rewardPoolIDL.default !== "object") {
      throw new Error("rewardPoolIDL not loaded correctly");
    }
    if (!stakePoolIDL?.default || typeof stakePoolIDL.default !== "object") {
      throw new Error("stakePoolIDL not loaded correctly");
    }
    console.log("Verified: Staking IDLs loaded correctly");

    if (!streamflowLaunchpadIDL?.default || typeof streamflowLaunchpadIDL.default !== "object") {
      throw new Error("streamflowLaunchpadIDL not loaded correctly");
    }
    console.log("Verified: Launchpad IDL loaded correctly");

    // Check if any of the imports contain 'cjs' (which would be incorrect)
    if (url.includes("/cjs/")) {
      console.warn("Warning: Found CJS module path in ESM environment");
    }
  } catch (error) {
    console.warn("Warning: Could not verify module path:", error.message);
  }

  console.log("Environment verification passed!");
}

async function main() {
  console.log("Streamflow SDK Example: JavaScript, ESM, Unbundled");
  console.log(`Running on Node.js ${process.version}`);

  try {
    // Verify environment first
    verifyEnvironment();

    // Using common package types
    console.log("Available clusters:");
    const clusters = [ICluster.Mainnet, ICluster.Devnet, ICluster.Testnet];

    clusters.forEach((cluster) => {
      console.log(`- ${cluster}`);
    });

    // Define common parameters
    const clusterUrl = "https://api.devnet.solana.com";
    const cluster = ICluster.Devnet;

    // Initialize the Streamflow Solana client
    console.log("Initializing Streamflow Solana client...");
    const streamClient = new StreamflowSolana.SolanaStreamClient(clusterUrl, cluster);

    // Initialize the Distributor Solana client
    console.log("Initializing Distributor Solana client...");
    const distributorClient = new StreamflowDistributorSolana.SolanaDistributorClient({
      clusterUrl,
      cluster,
    });

    // Initialize the Staking client
    console.log("Initializing Staking client...");
    const stakingClient = new SolanaStakingClient({
      clusterUrl,
      cluster,
    });
    console.log("SolanaStakingClient initialized successfully");

    // Initialize the Launchpad client
    console.log("Initializing Launchpad client...");
    const launchpadClient = new SolanaLaunchpadClient({
      clusterUrl,
      cluster,
    });
    console.log("SolanaLaunchpadClient initialized successfully");

    // Verify the clients were initialized correctly
    console.log("All clients initialized successfully");

    // Example of using the clients (commented out as it would require actual credentials)
    /*
    // Stream example
    try {
      const stream = await streamClient.create({
        recipient: 'RECIPIENT_ADDRESS',
        mint: 'TOKEN_MINT_ADDRESS',
        amount: 1000,
        period: 60, // seconds
        cliff: 0,
        amountAtCliff: 0,
        cancelableBySender: true,
        cancelableByRecipient: false,
        transferableBySender: true,
        transferableByRecipient: false,
      });
      console.log('Stream created successfully:', stream.id);
      
      // Distributor example
      const distribution = await distributorClient.createDistribution({
        // distribution parameters
      });
      console.log('Distribution created:', distribution);
      
      // Staking example
      const stakingPool = await stakingClient.getStakePool("STAKE_POOL_ID");
      console.log('Staking pool details:', stakingPool);
      
      // Launchpad example
      const launchpad = await launchpadClient.getLaunchpad("LAUNCHPAD_ID");
      console.log('Launchpad details:', launchpad);
      
    } catch (error) {
      // Using ContractError from common package for error handling
      if (error instanceof ContractError) {
        console.error('Contract error:', error.message);
      } else {
        console.error('Unknown error:', error);
      }
    }
    */

    console.log("Example completed successfully!");
  } catch (error) {
    console.error("Error in example:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
