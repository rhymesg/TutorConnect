// API and Security Testing Setup

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-with-minimum-32-characters'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-with-minimum-32-characters-different'

// Mock console to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}