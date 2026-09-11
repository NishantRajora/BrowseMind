/**
 * Jest configuration for BrowseMind tests.
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/tests"],
  setupFiles: ["<rootDir>/tests/setup.ts"],
  moduleFileExtensions: ["ts", "js", "json", "node"]
};
