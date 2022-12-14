/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["spec.ts", "js", "ts"],
  modulePathIgnorePatterns: ["dist", "test_dependencies"],
};
