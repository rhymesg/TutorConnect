import { NextRequest } from 'next/server';
import { POST } from './route';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthRateLimiter } from '@/middleware/auth';
import * as jwt from '@/lib/jwt';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('bcryptjs');
jest.mock('@/middleware/auth');
jest.mock('@/lib/jwt');

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
} as any;

(PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);

const mockAuthRateLimiter = {
  getKey: jest.fn(),
  isRateLimited: jest.fn(),
  getRemainingTime: jest.fn(),
  recordAttempt: jest.fn(),
  clearAttempts: jest.fn(),
};

Object.assign(AuthRateLimiter, mockAuthRateLimiter);

// Mock getClientIP function
jest.mock('@/middleware/auth', () => ({
  ...jest.requireActual('@/middleware/auth'),
  getClientIP: jest.fn(() => '127.0.0.1'),
  AuthRateLimiter: {
    getKey: jest.fn(),
    isRateLimited: jest.fn(),
    getRemainingTime: jest.fn(),
    recordAttempt: jest.fn(),
    clearAttempts: jest.fn(),
  },
}));

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJWT = jwt as jest.Mocked<typeof jwt>;

describe('/api/auth/login', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: '$2a$10$hashed_password',
    name: 'Test User',
    region: 'oslo',
    postalCode: '0123',
    isActive: true,
    emailVerified: new Date(),
    lastActive: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockAuthRateLimiter.getKey.mockReturnValue('127.0.0.1:test@example.com');
    mockAuthRateLimiter.isRateLimited.mockReturnValue(false);
    mockBcrypt.compare.mockResolvedValue(true);
    mockJWT.generateTokenPair.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue(mockUser);
  });

  const createMockRequest = (body: any) => {
    return {
      json: async () => body,
      headers: new Headers({
        'x-forwarded-for': '127.0.0.1',
      }),
    } as NextRequest;
  };

  describe('successful login', () => {
    it('should login user successfully', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Login successful');
      expect(data.data.user.email).toBe('test@example.com');
      expect(data.data.accessToken).toBe('access-token');
      expect(data.data.refreshToken).toBe('refresh-token');
      expect(data.data.requiresEmailVerification).toBe(false);
    });

    it('should require email verification for unverified users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        emailVerified: null,
      });

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.requiresEmailVerification).toBe(true);
    });

    it('should set HTTP-only cookies', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      });

      const response = await POST(request);

      const accessTokenCookie = response.headers.get('Set-Cookie');
      expect(accessTokenCookie).toContain('accessToken=access-token');
      expect(accessTokenCookie).toContain('HttpOnly');
      expect(accessTokenCookie).toContain('SameSite=Strict');
    });

    it('should extend refresh token expiry when remember is true', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        remember: true,
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Check that cookies are set with appropriate expiry
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toContain('refreshToken=refresh-token');
    });

    it('should update user last active timestamp', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      });

      await POST(request);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { lastActive: expect.any(Date) },
      });
    });

    it('should clear rate limiting on successful login', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      });

      await POST(request);

      expect(mockAuthRateLimiter.clearAttempts).toHaveBeenCalledWith('127.0.0.1:test@example.com');
    });

    it('should normalize email to lowercase', async () => {
      const request = createMockRequest({
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
        remember: false,
      });

      await POST(request);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: expect.any(Object),
      });
    });
  });

  describe('validation errors', () => {
    it('should return validation error for invalid email', async () => {
      const request = createMockRequest({
        email: 'invalid-email',
        password: 'password123',
        remember: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for missing password', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        remember: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for short password', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        password: '123',
        remember: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('authentication errors', () => {
    it('should return error for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = createMockRequest({
        email: 'nonexistent@example.com',
        password: 'password123',
        remember: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVALID_CREDENTIALS');
      expect(mockAuthRateLimiter.recordAttempt).toHaveBeenCalled();
    });

    it('should return error for inactive account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.code).toBe('ACCOUNT_LOCKED');
      expect(mockAuthRateLimiter.recordAttempt).toHaveBeenCalled();
    });

    it('should return error for invalid password', async () => {
      mockBcrypt.compare.mockResolvedValue(false);

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'wrongpassword',
        remember: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVALID_CREDENTIALS');
      expect(mockAuthRateLimiter.recordAttempt).toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('should return rate limit error when limit exceeded', async () => {
      mockAuthRateLimiter.isRateLimited.mockReturnValue(true);
      mockAuthRateLimiter.getRemainingTime.mockReturnValue(300000); // 5 minutes

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.headers.get('Retry-After')).toBe('5');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('should use IP and email for rate limiting key', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      });

      await POST(request);

      expect(mockAuthRateLimiter.getKey).toHaveBeenCalledWith('127.0.0.1', 'test@example.com');
      expect(mockAuthRateLimiter.isRateLimited).toHaveBeenCalledWith('127.0.0.1:test@example.com', 5, 900000);
    });
  });

  describe('token generation', () => {
    it('should generate tokens with correct user data', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      });

      await POST(request);

      expect(mockJWT.generateTokenPair).toHaveBeenCalledWith({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        region: 'oslo',
        tokenVersion: 1,
      });
    });

    it('should handle token generation failure', async () => {
      mockJWT.generateTokenPair.mockRejectedValue(new Error('Token generation failed'));

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('database errors', () => {
    it('should handle database connection error', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INTERNAL_ERROR');
    });

    it('should handle user update failure', async () => {
      mockPrisma.user.update.mockRejectedValue(new Error('Update failed'));

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('security headers and cookies', () => {
    it('should set secure cookies in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      });

      const response = await POST(request);
      const setCookieHeader = response.headers.get('Set-Cookie');

      expect(setCookieHeader).toContain('Secure');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not set secure flag in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      });

      const response = await POST(request);
      const setCookieHeader = response.headers.get('Set-Cookie');

      expect(setCookieHeader).not.toContain('Secure');

      process.env.NODE_ENV = originalEnv;
    });

    it('should include metadata in response', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'password123',
        remember: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.meta).toBeDefined();
      expect(data.meta.timestamp).toBeDefined();
      expect(new Date(data.meta.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('malformed requests', () => {
    it('should handle malformed JSON', async () => {
      const request = {
        json: async () => { throw new SyntaxError('Invalid JSON'); },
        headers: new Headers({
          'x-forwarded-for': '127.0.0.1',
        }),
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle missing request body', async () => {
      const request = createMockRequest(undefined);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });
});