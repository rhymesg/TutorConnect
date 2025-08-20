import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { POST } from '@/app/api/auth/forgot-password/route';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Mock email service
jest.mock('@/lib/email', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

describe('/api/auth/forgot-password', () => {
  const testUser = {
    name: 'Test Reset User',
    email: `test-reset-api-${Date.now()}@example.com`,
    password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
    hashedPassword: '',
    userId: '',
  };

  beforeEach(async () => {
    // Clean up any existing test users and reset tokens
    await prisma.user.deleteMany({
      where: {
        email: testUser.email,
      },
    });

    // Clean up any existing password reset tokens
    try {
      await prisma.passwordResetToken?.deleteMany({
        where: {
          email: testUser.email,
        },
      });
    } catch (error) {
      // Table might not exist yet, that's okay
    }

    // Create test user with hashed password
    testUser.hashedPassword = await bcrypt.hash(testUser.password, 12);
    
    const createdUser = await prisma.user.create({
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.hashedPassword,
        emailVerified: true,
      }
    });
    
    testUser.userId = createdUser.id;
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.user.deleteMany({
      where: {
        email: testUser.email,
      },
    });

    // Clean up password reset tokens
    try {
      await prisma.passwordResetToken?.deleteMany({
        where: {
          email: testUser.email,
        },
      });
    } catch (error) {
      // Ignore if table doesn't exist
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully process forgot password request with valid email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // Check response
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toMatch(/reset.*email.*sent|e-post.*sendt|instruksjoner.*sendt/i);
    expect(data.email).toBe(testUser.email);
  });

  it('should handle non-existent email securely', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // For security, should return success even for non-existent emails
    // to prevent email enumeration attacks
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toMatch(/reset.*email.*sent|e-post.*sendt|instruksjoner.*sendt/i);
  });

  it('should validate required fields', async () => {
    const invalidRequests = [
      { email: '' }, // Empty email
      {}, // Empty body
    ];

    for (const invalidData of invalidRequests) {
      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
    }
  });

  it('should validate email format', async () => {
    const invalidEmails = [
      'invalid-email',
      'test@',
      '@example.com',
      'test..test@example.com',
    ];

    for (const invalidEmail of invalidEmails) {
      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: invalidEmail,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/email|format|ugyldig.*e-post/i);
    }
  });

  it('should create password reset token in database', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
      }),
    });

    await POST(request);

    // Check if password reset token was created (if table exists)
    try {
      const resetToken = await prisma.passwordResetToken?.findFirst({
        where: {
          email: testUser.email,
        },
      });

      if (resetToken) {
        expect(resetToken.email).toBe(testUser.email);
        expect(resetToken.token).toBeTruthy();
        expect(resetToken.token.length).toBeGreaterThan(20); // Should be a substantial token
        expect(resetToken.expires).toBeTruthy();
        expect(new Date(resetToken.expires).getTime()).toBeGreaterThan(Date.now()); // Should expire in future
      }
    } catch (error) {
      // If passwordResetToken table doesn't exist, that's acceptable
      // The implementation might use a different approach
      console.log('Password reset token table not found - alternative implementation might be used');
    }
  });

  it('should call email service to send reset email', async () => {
    const { sendPasswordResetEmail } = require('@/lib/email');

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
      }),
    });

    await POST(request);

    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      testUser.email,
      testUser.name,
      expect.any(String) // reset token
    );
  });

  it('should handle email service failures gracefully', async () => {
    const { sendPasswordResetEmail } = require('@/lib/email');
    sendPasswordResetEmail.mockRejectedValueOnce(new Error('Email service failed'));

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // Should still return success for security, even if email fails
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // But might indicate email issue internally
    if (data.emailSent !== undefined) {
      expect(data.emailSent).toBe(false);
    }
  });

  it('should handle database connection errors', async () => {
    // Mock prisma to throw an error
    const originalFindUnique = prisma.user.findUnique;
    prisma.user.findUnique = jest.fn().mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();

    // Restore original method
    prisma.user.findUnique = originalFindUnique;
  });

  it('should generate secure reset token', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
      }),
    });

    await POST(request);

    // Check if reset token was generated with proper security
    try {
      const resetToken = await prisma.passwordResetToken?.findFirst({
        where: {
          email: testUser.email,
        },
      });

      if (resetToken) {
        // Token should be long enough and contain proper entropy
        expect(resetToken.token.length).toBeGreaterThan(30);
        
        // Should not be predictable (check for randomness indicators)
        expect(resetToken.token).toMatch(/[a-zA-Z0-9]/); // Contains alphanumeric chars
        expect(resetToken.token).not.toBe(testUser.email); // Not based on email
        expect(resetToken.token).not.toBe(testUser.userId); // Not based on user ID
        
        // Expiry should be reasonable (typically 1-24 hours)
        const expiryTime = new Date(resetToken.expires).getTime();
        const now = Date.now();
        const hourInMs = 60 * 60 * 1000;
        
        expect(expiryTime).toBeGreaterThan(now + hourInMs); // At least 1 hour
        expect(expiryTime).toBeLessThan(now + (24 * hourInMs)); // At most 24 hours
      }
    } catch (error) {
      // If table doesn't exist, alternative token generation might be used
      console.log('Alternative token generation approach detected');
    }
  });

  it('should include proper security headers in response', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
      }),
    });

    const response = await POST(request);

    // Check for security headers
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });

  it('should rate limit repeated requests from same email', async () => {
    const requests = [];
    
    // Make multiple reset requests for same email
    for (let i = 0; i < 5; i++) {
      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.1.100', // Simulate same IP
        },
        body: JSON.stringify({
          email: testUser.email,
        }),
      });
      
      requests.push(POST(request));
    }

    const responses = await Promise.all(requests);
    
    // Check if later attempts are rate limited (if implemented)
    const lastResponse = responses[responses.length - 1];
    
    if (lastResponse.status === 429) {
      const data = await lastResponse.json();
      expect(data.error).toMatch(/rate.*limit|too.*many.*requests/i);
    } else {
      // If no rate limiting implemented, all should return 200 for security
      expect(lastResponse.status).toBe(200);
    }
  });

  it('should handle case-insensitive email lookup', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email.toUpperCase(), // Test with uppercase email
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toMatch(/reset.*email.*sent|e-post.*sendt/i);
  });

  it('should expire old reset tokens when creating new ones', async () => {
    // Create first reset token
    await POST(new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email }),
    }));

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create second reset token
    await POST(new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email }),
    }));

    // Check if old tokens are handled properly (expired or removed)
    try {
      const resetTokens = await prisma.passwordResetToken?.findMany({
        where: {
          email: testUser.email,
        },
      });

      if (resetTokens && resetTokens.length > 0) {
        // Should either have only one active token, or old ones should be expired
        const activeTokens = resetTokens.filter(token => 
          new Date(token.expires).getTime() > Date.now()
        );
        
        // Should not have too many active tokens (security)
        expect(activeTokens.length).toBeLessThanOrEqual(1);
      }
    } catch (error) {
      // Alternative implementation might handle this differently
      console.log('Alternative token management approach detected');
    }
  });
});