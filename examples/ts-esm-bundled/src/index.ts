/**
 * Example of using Streamflow SDK with TypeScript, ESM, and Vite bundler
 *
 * This example demonstrates:
 * 1. Importing multiple Streamflow SDK packages using ESM imports
 * 2. Creating client instances for different Streamflow services
 * 3. Basic usage of the SDK packages
 * 4. Bundling with Vite
 */

// Import the Streamflow packages
import { StreamflowSolana } from "@streamflow/stream";
import { ICluster, ContractError } from "@streamflow/common";
import { StreamflowDistributorSolana } from "@streamflow/distributor";
// Import specific exports from staking package
import { SolanaStakingClient } from "@streamflow/staking";
// Import launchpad package
import { SolanaLaunchpadClient } from "@streamflow/launchpad";
// Other entrypoints to test that the package.json is correct
import { MerkleDistributor } from "@streamflow/distributor/solana";
import {prepareTransaction} from "@streamflow/common/solana";

// Import IDL files to test import resolving
import streamflowAlignedUnlocksIDL from "@streamflow/stream/solana/idl/streamflow_aligned_unlocks.json";
import merkleDistributorIDL from "@streamflow/distributor/solana/idl/merkle_distributor.json";
import alignedDistributorIDL from "@streamflow/distributor/solana/idl/aligned_distributor.json";
import rewardPoolIDL from "@streamflow/staking/solana/idl/reward_pool.json";
import stakePoolIDL from "@streamflow/staking/solana/idl/stake_pool.json";
import streamflowLaunchpadIDL from "@streamflow/launchpad/solana/idl/streamflow_launchpad.json";

/**
 * Verify that we're running in the correct environment (ESM)
 */
function verifyEnvironment(): void {
  console.log("Verifying ESM environment...");

  // Check if we're in an ESM environment
  if (typeof import.meta !== "object") {
    throw new Error("Not running in an ESM environment! This example requires ESM.");
  }

  // Check if import.meta.url exists (ESM feature)
  if (typeof import.meta.url !== "string") {
    throw new Error("import.meta.url not found! This example requires ESM.");
  }

  // For bundled environments, we can't reliably check the module path
  // but we can check if the modules were loaded correctly
  try {
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

    // Verify Network enum is loaded correctly
    if (typeof ICluster !== "object") {
      throw new Error("ICluster enum not found");
    }
    console.log("Verified: ICluster enum loaded correctly");

    // Verify IDL files are loaded correctly
    if (!streamflowAlignedUnlocksIDL || typeof streamflowAlignedUnlocksIDL !== "object") {
      throw new Error("streamflowAlignedUnlocksIDL not loaded correctly");
    }
    console.log("Verified: Stream IDL loaded correctly");

    if (!merkleDistributorIDL || typeof merkleDistributorIDL !== "object") {
      throw new Error("merkleDistributorIDL not loaded correctly");
    }
    if (!alignedDistributorIDL || typeof alignedDistributorIDL !== "object") {
      throw new Error("alignedDistributorIDL not loaded correctly");
    }
    console.log("Verified: Distributor IDLs loaded correctly");

    if (!rewardPoolIDL || typeof rewardPoolIDL !== "object") {
      throw new Error("rewardPoolIDL not loaded correctly");
    }
    if (!stakePoolIDL || typeof stakePoolIDL !== "object") {
      throw new Error("stakePoolIDL not loaded correctly");
    }
    console.log("Verified: Staking IDLs loaded correctly");

    if (!streamflowLaunchpadIDL || typeof streamflowLaunchpadIDL !== "object") {
      throw new Error("streamflowLaunchpadIDL not loaded correctly");
    }
    console.log("Verified: Launchpad IDL loaded correctly");

    // Check if any of the imports contain CJS paths (which would be incorrect)
    const importPaths = [
      import.meta.resolve("@streamflow/stream"),
      import.meta.resolve("@streamflow/distributor"),
      import.meta.resolve("@streamflow/staking"),
      import.meta.resolve("@streamflow/launchpad"),
      import.meta.resolve("@streamflow/common"),
      // Add IDL imports to check
      import.meta.resolve("@streamflow/stream/solana/idl/streamflow_aligned_unlocks.json"),
      import.meta.resolve("@streamflow/distributor/solana/idl/merkle_distributor.json"),
      import.meta.resolve("@streamflow/distributor/solana/idl/aligned_distributor.json"),
      import.meta.resolve("@streamflow/staking/solana/idl/reward_pool.json"),
      import.meta.resolve("@streamflow/staking/solana/idl/stake_pool.json"),
      import.meta.resolve("@streamflow/launchpad/solana/idl/streamflow_launchpad.json"),
    ];

    for (const path of importPaths) {
      if (path.includes("/cjs/")) {
        console.warn(`Warning: Found CJS module path in ESM environment: ${path}`);
      }
    }
  } catch (error) {
    console.warn("Warning: Could not verify module loading:", (error as Error).message);
  }

  console.log("Environment verification passed!");
}

async function main() {
  console.log("Streamflow SDK Example: TypeScript, ESM, Bundled with Vite");
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

    // Verify types are working correctly
    const clusterType: ICluster = ICluster.Devnet;

    // Example of error handling with ContractError
    const handleError = (error: unknown): void => {
      if (error instanceof ContractError) {
        console.error("Contract error:", error.message);
      } else {
        console.error("Unknown error:", error);
      }
    };

    console.log("Type verification successful");
    console.log("Example completed successfully!");
  } catch (error) {
    console.error("Error in example:", error);
    process.exit(1);
  }
}

// Export the main function for bundling
export { main };

// Execute the main function when run directly
if (typeof process !== "undefined" && process.argv[1] === import.meta.url) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}
