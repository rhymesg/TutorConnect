/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Run only unit tests in src directory
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
  ],
  
  // Exclude only necessary directories
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