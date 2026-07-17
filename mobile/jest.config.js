/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'clover', 'html'],
};
