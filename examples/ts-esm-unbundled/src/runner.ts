// start.js
import { execSync } from "child_process";

const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split(".")[0], 10);

if (majorVersion >= 20) {
  console.log("Running script for Node 20+");
  execSync("pnpm run start-node20", { stdio: "inherit" });
} else {
  console.log("Running script for Node less than 20");
  execSync("pnpm run start-node18", { stdio: "inherit" });
}
