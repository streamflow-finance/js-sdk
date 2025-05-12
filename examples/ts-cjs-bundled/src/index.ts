import { Stream, StreamflowSolana } from "@streamflow/stream";
import { ICluster } from "@streamflow/common";
import { SolanaStakingClient } from "@streamflow/staking";
import { StreamflowDistributorSolana } from "@streamflow/distributor";
import { SolanaLaunchpadClient } from "@streamflow/launchpad";
// Other entrypoints to test that the package.json is correct
import { MerkleDistributor } from "@streamflow/distributor/solana";
import {prepareTransaction} from "@streamflow/common/solana";

// Import IDL files to test import resolving
// Note: Using require for JSON imports in CJS context
const streamflowAlignedUnlocksIDL = require("@streamflow/stream/solana/idl/streamflow_aligned_unlocks.json");
const merkleDistributorIDL = require("@streamflow/distributor/solana/idl/merkle_distributor.json");
const alignedDistributorIDL = require("@streamflow/distributor/solana/idl/aligned_distributor.json");
const rewardPoolIDL = require("@streamflow/staking/solana/idl/reward_pool.json");
const stakePoolIDL = require("@streamflow/staking/solana/idl/stake_pool.json");
const streamflowLaunchpadIDL = require("@streamflow/launchpad/solana/idl/streamflow_launchpad.json");

/**
 * Verify that we're running in the correct environment (CommonJS)
 */
function verifyEnvironment() {
  console.log("Verifying CommonJS environment...");

  // Check if we're in a CommonJS environment
  if (typeof module !== "object" || typeof module.exports !== "object") {
    throw new Error("Not running in a CommonJS environment! This example requires CommonJS.");
  }

  // Check if require function exists (CommonJS feature)
  if (typeof require !== "function") {
    throw new Error("require function not found! This example requires CommonJS.");
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

    // Check if any of the imports contain ESM paths (which would be incorrect)
    const modules = [
      require.resolve("@streamflow/stream"),
      require.resolve("@streamflow/distributor"),
      require.resolve("@streamflow/staking"),
      require.resolve("@streamflow/launchpad"),
      require.resolve("@streamflow/common"),
      // Add IDL imports to check
      require.resolve("@streamflow/stream/solana/idl/streamflow_aligned_unlocks.json"),
      require.resolve("@streamflow/distributor/solana/idl/merkle_distributor.json"),
      require.resolve("@streamflow/distributor/solana/idl/aligned_distributor.json"),
      require.resolve("@streamflow/staking/solana/idl/reward_pool.json"),
      require.resolve("@streamflow/staking/solana/idl/stake_pool.json"),
      require.resolve("@streamflow/launchpad/solana/idl/streamflow_launchpad.json"),
    ];

    for (const path of modules) {
      if (path.includes("/esm/")) {
        console.warn(`Warning: Found ESM module path in CommonJS environment: ${path}`);
      }
    }
  } catch (error) {
    console.warn("Warning: Could not verify module loading:", (error as Error).message);
  }

  console.log("Environment verification passed!");
}

async function main() {
  try {
    console.log("Initializing Streamflow SDK example (TypeScript + CommonJS + Bundled)...");

    // Verify environment first
    verifyEnvironment();

    // Define common parameters
    const clusterUrl = "https://api.devnet.solana.com";
    const cluster = ICluster.Devnet;

    // Initialize the Streamflow client
    const streamClient = new StreamflowSolana.SolanaStreamClient({ clusterUrl, cluster });
    console.log("SolanaStreamClient initialized successfully");

    console.log("Available clusters:", Object.values(ICluster));

    // Staking client
    const stakingClient = new SolanaStakingClient({
      clusterUrl,
      cluster,
    });
    console.log("SolanaStakingClient initialized successfully");

    // Distributor client
    const distributorClient = new StreamflowDistributorSolana.SolanaDistributorClient({
      clusterUrl,
      cluster,
    });
    console.log("SolanaDistributorClient initialized successfully");

    // Launchpad client
    const launchpadClient = new SolanaLaunchpadClient({
      clusterUrl,
      cluster,
    });
    console.log("SolanaLaunchpadClient initialized successfully");

    // Example code for working with streams (commented out as it requires actual credentials)
    /*
    // Get stream data
    const streamId = "YOUR_STREAM_ID"; // Replace with an actual stream ID
    const stream = await Stream.get(streamClient, streamId);

    // Display stream information
    console.log("Stream details:");
    console.log(`- ID: ${stream.id}`);
    console.log(`- Name: ${stream.name || "Unnamed"}`);
    console.log(`- Created at: ${new Date(stream.createdAt).toLocaleString()}`);
    console.log(`- Start time: ${new Date(stream.startTime).toLocaleString()}`);
    console.log(`- End time: ${new Date(stream.endTime).toLocaleString()}`);
    console.log(`- Amount: ${stream.depositedAmount}`);
    console.log(`- Withdrawn: ${stream.withdrawnAmount}`);
    console.log(`- Status: ${stream.status}`);
    
    // Example for staking
    const stakingPoolId = "YOUR_STAKING_POOL_ID";
    const stakingPool = await stakingClient.getStakePool(stakingPoolId);
    console.log("Staking pool details:", stakingPool);
    
    // Example for distributor
    const distributorId = "YOUR_DISTRIBUTOR_ID";
    const distributor = await distributorClient.getDistributor(distributorId);
    console.log("Distributor details:", distributor);
    
    // Example for launchpad
    const launchpadId = "YOUR_LAUNCHPAD_ID";
    const launchpadInstance = await launchpadClient.getLaunchpad(launchpadId);
    console.log("Launchpad details:", launchpadInstance);
    */

    console.log("Example completed successfully!");
  } catch (error) {
    console.error("Error in Streamflow SDK example:", error);
  }
}

// Execute the main function
main();

// Export for module usage
export { main };
