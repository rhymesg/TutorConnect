/** @type {import('jest').Config} */
module.exports = {
  // Use Node.js environment for API route testing
  testEnvironment: 'node',
  
  // Run only integration tests
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.ts',
  ],
  
  // Exclude directories
  testPathIgnorePatterns: [
    '<rootDir>/.next/', 
    '<rootDir>/node_modules/', 
    '<rootDir>/coverage/',
  ],
  
  // Use ts-jest for TypeScript
  preset: 'ts-jest',
  
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Transform ES modules to CommonJS
  transformIgnorePatterns: [
    'node_modules/(?!(jose|@supabase|@next)/)'
  ],
  
  // Handle ES modules
  extensionsToTreatAsEsm: ['.ts'],
  
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  
  // Setup file for API tests
  setupFilesAfterEnv: ['<rootDir>/jest.integration.setup.js'],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'json', 'json-summary'],
  collectCoverageFrom: [
    'src/app/api/**/*.ts',
    'src/lib/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
  ],
};