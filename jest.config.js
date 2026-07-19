module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
  // The example apps have no tests; keep jest (and its haste map) out of them
  // and out of the build output.
  modulePathIgnorePatterns: [
    '<rootDir>/lib/',
    '<rootDir>/example/',
    '<rootDir>/example-legacy/',
  ],
};
