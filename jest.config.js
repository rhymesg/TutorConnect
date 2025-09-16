/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000, // Double the default timeout from 5000ms to 10000ms
  
  // Run tests from tests/ directory
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx',
  ],
  
  // Exclude only build and dependency directories
  testPathIgnorePatterns: [
    '<rootDir>/.next/', 
    '<rootDir>/node_modules/', 
    '<rootDir>/coverage/',
  ],
  
  // Simple transform - use ts-jest
  preset: 'ts-jest',
  
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json', 'json-summary'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}', // Include all source files
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/types/**', // Exclude type definitions
  ],
};