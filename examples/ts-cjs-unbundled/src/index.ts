/**
 * Example of using Streamflow SDK with TypeScript, CommonJS, and no bundler
 *
 * This example demonstrates:
 * 1. Importing multiple Streamflow SDK packages using CommonJS imports
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
function verifyEnvironment(): void {
  console.log("Verifying CommonJS environment...");

  // Check if we're in a CommonJS environment
  if (typeof module !== "object" || typeof module.exports !== "object") {
    throw new Error("Not running in a CommonJS environment! This example requires CommonJS.");
  }

  // Check if require function exists
  if (typeof require !== "function") {
    throw new Error("require function not found! This example requires CommonJS.");
  }

  // Check if the resolved modules contain 'cjs' in their path
  try {
    // We need to use require here, which TypeScript might complain about
    // @ts-ignore
    const streamPath = require.resolve("@streamflow/stream");
    if (!streamPath.includes("/cjs/")) {
      console.warn("Warning: @streamflow/stream does not appear to be using the CJS version.");
    } else {
      console.log("Verified: Using CJS version of @streamflow/stream");
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
    console.warn("Warning: Could not verify module path:", (error as Error).message);
  }

  console.log("Environment verification passed!");
}

async function main() {
  console.log("Streamflow SDK Example: TypeScript, CommonJS, Unbundled");
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
    const streamClient = new StreamflowSolana.SolanaStreamClient({ clusterUrl, cluster });

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

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
