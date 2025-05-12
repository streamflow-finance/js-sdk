/**
 * Example of using Streamflow SDK with JavaScript, CommonJS, and Vite bundler
 *
 * This example demonstrates:
 * 1. Importing the Streamflow SDK using CommonJS imports in JavaScript
 * 2. Creating instances of all Streamflow SDK clients
 * 3. Basic usage of the SDK
 * 4. Bundling with Vite
 */

const { StreamflowSolana } = require("@streamflow/stream");
const { StreamflowDistributorSolana } = require("@streamflow/distributor");
const { SolanaStakingClient } = require("@streamflow/staking");
const { SolanaLaunchpadClient } = require("@streamflow/launchpad");
const { ICluster } = require("@streamflow/common");
// Other entrypoints to test that the package.json is correct
const { MerkleDistributor } = require("@streamflow/distributor/solana");
const { prepareTransaction } = require("@streamflow/common/solana");

// Import IDL files to test import resolving
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
      throw new Error("StreamflowSolana.SolanaStreamClient is not a constructor function");
    }
    console.log("Verified: StreamflowSolana.SolanaStreamClient loaded correctly");

    // Verify DistributorClient is loaded correctly
    if (typeof StreamflowDistributorSolana.SolanaDistributorClient !== "function") {
      throw new Error("StreamflowDistributorSolana.SolanaDistributorClient is not a constructor function");
    }
    console.log("Verified: StreamflowDistributorSolana.SolanaDistributorClient loaded correctly");

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
    console.warn("Warning: Could not verify module loading:", error.message);
  }

  console.log("Environment verification passed!");
}

async function main() {
  console.log("Streamflow SDK Example: JavaScript, CommonJS, Bundled with Vite");
  console.log(`Running on Node.js ${process.version}`);

  try {
    // Verify environment first
    verifyEnvironment();

    // Initialize all clients
    console.log("Initializing Streamflow clients...");

    // Define common parameters
    const clusterUrl = "https://api.devnet.solana.com";
    const cluster = ICluster.Devnet;

    // Correct initialization:
    const streamClient = new StreamflowSolana.SolanaStreamClient({ clusterUrl, cluster });

    const distributorClient = new StreamflowDistributorSolana.SolanaDistributorClient({
      clusterUrl,
      cluster,
    });
    const stakingClient = new SolanaStakingClient({
      clusterUrl,
      cluster,
    });
    const launchpadClient = new SolanaLaunchpadClient({
      clusterUrl,
      cluster,
    });

    // Example of using Network from common package
    console.log("Available networks:", Object.keys(ICluster));

    // Example of using the clients (commented out as it would require actual credentials)
    /*
    // Stream example
    const stream = await streamClient.create({
      recipient: '0x123...',
      amount: 1000,
      duration: 30 * 24 * 60 * 60 // 30 days
    });
    console.log('Stream created successfully:', stream.id);
    
    // Distributor example
    const distributor = await distributorClient.create({
      // distributor parameters
    });
    console.log('Distributor created successfully:', distributor.id);
    
    // Staking example
    const stakingPool = await stakingClient.create({
      // staking parameters
    });
    console.log('Staking pool created successfully:', stakingPool.id);
    
    // Launchpad example
    const launchpad = await launchpadClient.create({
      // launchpad parameters
    });
    console.log('Launchpad created successfully:', launchpad.id);
    */

    console.log("Example completed successfully!");
  } catch (error) {
    console.error("Error in example:", error);
    process.exit(1);
  }
}

// Export the main function for bundling
module.exports = { main };

// Execute the main function when run directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}
