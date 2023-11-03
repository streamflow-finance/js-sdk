/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["spec.ts", "js", "ts"],
  modulePathIgnorePatterns: ["dist", "test_dependencies"],
};
