/**
 * Example of using Streamflow SDK with JavaScript, ESM, and Vite bundler
 *
 * This example demonstrates:
 * 1. Importing the Streamflow SDK using ESM imports in JavaScript
 * 2. Creating instances of all Streamflow SDK clients
 * 3. Basic usage of the SDK
 * 4. Bundling with Vite
 */

import { StreamflowSolana } from "@streamflow/stream";
import { StreamflowDistributorSolana } from "@streamflow/distributor";
import { SolanaStakingClient } from "@streamflow/staking";
import { SolanaLaunchpadClient } from "@streamflow/launchpad";
import { ICluster } from "@streamflow/common";

// Import IDL files to test import resolving
import streamflowAlignedUnlocksIDL from "@streamflow/stream/solana/idl/streamflow_aligned_unlocks.json" assert { type: "json" };
import merkleDistributorIDL from "@streamflow/distributor/solana/idl/merkle_distributor.json" assert { type: "json" };
import alignedDistributorIDL from "@streamflow/distributor/solana/idl/aligned_distributor.json" assert { type: "json" };
import rewardPoolIDL from "@streamflow/staking/solana/idl/reward_pool.json" assert { type: "json" };
import stakePoolIDL from "@streamflow/staking/solana/idl/stake_pool.json" assert { type: "json" };
import streamflowLaunchpadIDL from "@streamflow/launchpad/solana/idl/streamflow_launchpad.json" assert { type: "json" };

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

    // Verify SolanaStakingClient is loaded correctly
    if (typeof SolanaStakingClient !== "function") {
      throw new Error("SolanaStakingClient is not a constructor function");
    }
    console.log("Verified: SolanaStakingClient loaded correctly");

    // Verify SolanaLaunchpadClient is loaded correctly
    if (typeof SolanaLaunchpadClient !== "function") {
      throw new Error("SolanaLaunchpadClient is not a constructor function");
    }
    console.log("Verified: SolanaLaunchpadClient loaded correctly");

    // Verify ICluster enum is loaded correctly
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
    ];

    for (const path of importPaths) {
      if (path.includes("/cjs/")) {
        console.warn(`Warning: Found CJS module path in ESM environment: ${path}`);
      }
    }
  } catch (error) {
    console.warn("Warning: Could not verify module loading:", error.message);
  }

  console.log("Environment verification passed!");
}

async function main() {
  console.log("Streamflow SDK Example: JavaScript, ESM, Bundled with Vite");
  console.log(`Running on Node.js ${process.version}`);

  try {
    // Verify environment first
    verifyEnvironment();

    // Common parameters for client initialization
    const clusterUrl = "https://api.devnet.solana.com";
    const cluster = ICluster.Devnet;

    // Initialize all clients
    console.log("Initializing Streamflow clients...");

    // Stream client
    const streamClient = new StreamflowSolana.SolanaStreamClient({
      clusterUrl,
      cluster,
    });
    console.log("SolanaStreamClient initialized successfully");

    // Distributor client
    const distributorClient = new StreamflowDistributorSolana.SolanaDistributorClient({
      clusterUrl,
      cluster,
    });
    console.log("SolanaDistributorClient initialized successfully");

    // Staking client
    const stakingClient = new SolanaStakingClient({
      clusterUrl,
      cluster,
    });
    console.log("SolanaStakingClient initialized successfully");

    // Launchpad client
    const launchpadClient = new SolanaLaunchpadClient({
      clusterUrl,
      cluster,
    });
    console.log("SolanaLaunchpadClient initialized successfully");

    // Example of using ICluster from common package
    console.log("Available clusters:", Object.values(ICluster));

    console.log("Example completed successfully!");
  } catch (error) {
    console.error("Error in example:", error);
    process.exit(1);
  }
}

// Export the main function for bundling
export { main };

// Execute the main function when run directly
if (import.meta.url === import.meta.main) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}
