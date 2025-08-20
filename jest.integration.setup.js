// Setup for integration tests (Node.js environment)

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret';
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
process.env.TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

// Mock console.log to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
};

// Add global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Add timeout for database operations
jest.setTimeout(30000);

// Mock Next.js headers and cookies for API route testing
global.Request = global.Request || require('node-fetch').Request;
global.Response = global.Response || require('node-fetch').Response;
global.Headers = global.Headers || require('node-fetch').Headers;

// Mock JWT library to avoid ES module issues
jest.mock('@/lib/jwt', () => ({
  generateEmailVerificationToken: jest.fn().mockResolvedValue('mock-verification-token'),
  generateTokenPair: jest.fn().mockResolvedValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
  verifyToken: jest.fn().mockResolvedValue({ 
    userId: 'mock-user-id',
    email: 'test@example.com'
  }),
}));

// Mock email service
jest.mock('@/lib/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));