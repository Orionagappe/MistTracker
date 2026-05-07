/**
 * Jest Configuration for Phase 17.3 Test Suite
 * 
 * @file jest.config.js
 * @version 1.0.0
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/index.js',
    '!src/**/__tests__/**',
  ],

  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },

  // Reporter options
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathAsClassName: true,
      },
    ],
  ],

  // Timeout for long-running tests
  testTimeout: 30000,

  // Setup files
  setupFilesAfterEnv: ['./tests/setup.js'],

  // Transform files
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },

  // Module aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },

  // Verbose output
  verbose: true,

  // Bail on first error
  bail: false,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Show coverage summary
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary', 'html'],

  // Max workers
  maxWorkers: '50%',

  // Timeout for watchman
  watchman: true,

  // Snapshot update
  snapshotFormat: {
    printBasicPrototype: false,
  },

  // Global setup/teardown
  globalSetup: null,
  globalTeardown: null,

  // Error on deprecated APIs
  errorOnDeprecated: true,
};
