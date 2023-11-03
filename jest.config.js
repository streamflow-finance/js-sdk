/** @type {import('ts-jest').JestConfigWithTsJest} */
const streamPkg = require("./packages/stream/package.json");

module.exports = {
  verbose: true,
  projects: [
    {
      preset: "ts-jest",
      testEnvironment: "node",
      displayName: streamPkg.name,
      testMatch: ["<rootDir>/packages/stream/**/?(*.)+(spec|test).[jt]s?(x)"],
    },
  ],
};
