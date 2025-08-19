/** @type {import('jest').Config} */
const config = {
  // Simplified configuration for unit tests only
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Only run unit tests
  testMatch: [
    '<rootDir>/src/**/*.test.{js,ts,jsx,tsx}',
    '<rootDir>/tests/unit/**/*.test.{js,ts,jsx,tsx}',
  ],
  
  // Use @swc/jest for better TypeScript support
  transform: {
    '^.+\\.(ts|tsx)$': '@swc/jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Global configuration
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(jose|.*\\.mjs$))',
  ],
  
  testPathIgnorePatterns: [
    '<rootDir>/.next/', 
    '<rootDir>/node_modules/', 
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/integration/',
    '<rootDir>/tests/security/',
    '<rootDir>/.*encryption.*\\.test\\.(js|ts|jsx|tsx)$',
  ],
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  
  collectCoverageFrom: [
    'src/**/*.{js,ts,jsx,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
    '!src/app/globals.css',
    '!**/*.config.{js,ts}',
    '!**/node_modules/**',
    '!src/**/*.stories.{js,ts,jsx,tsx}',
  ],
  
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@/middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@/schemas/(.*)$': '<rootDir>/src/schemas/$1',
    '^@/prisma/(.*)$': '<rootDir>/prisma/$1',
  },
};

module.exports = config;