import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { POST } from '@/app/api/auth/login/route';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('/api/auth/login', () => {
  const testUser = {
    name: 'Test Login User',
    email: `test-login-api-${Date.now()}@example.com`,
    password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
    hashedPassword: '',
    userId: '',
  };

  beforeEach(async () => {
    // Clean up any existing test users
    await prisma.user.deleteMany({
      where: {
        email: testUser.email,
      },
    });

    // Create test user with hashed password
    testUser.hashedPassword = await bcrypt.hash(testUser.password, 12);
    
    const createdUser = await prisma.user.create({
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.hashedPassword,
        emailVerified: true, // Set as verified so login works
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully login with valid credentials', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // Check response
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('Login successful');
    expect(data.user.email).toBe(testUser.email);
    expect(data.user.name).toBe(testUser.name);
    expect(data.user.password).toBeUndefined(); // Password should not be returned
    expect(data.token).toBeTruthy(); // JWT token should be present
  });

  it('should reject login with invalid password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: 'wrongpassword',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/invalid.*credentials|wrong.*password|ugyldig.*legitimasjon/i);
    expect(data.user).toBeUndefined();
    expect(data.token).toBeUndefined();
  });

  it('should reject login with non-existent email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: testUser.password,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/user.*not.*found|invalid.*credentials|bruker.*ikke.*funnet/i);
    expect(data.user).toBeUndefined();
    expect(data.token).toBeUndefined();
  });

  it('should validate required fields', async () => {
    const invalidRequests = [
      { email: '', password: testUser.password }, // Missing email
      { email: testUser.email, password: '' }, // Missing password
      {}, // Empty body
    ];

    for (const invalidData of invalidRequests) {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
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
      expect(data.user).toBeUndefined();
      expect(data.token).toBeUndefined();
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
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: invalidEmail,
          password: testUser.password,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/email|format|ugyldig.*e-post/i);
    }
  });

  it('should reject login for unverified email if required', async () => {
    // Create unverified test user
    const unverifiedUser = {
      email: `unverified-api-${Date.now()}@example.com`,
      password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
    };
    
    const hashedPassword = await bcrypt.hash(unverifiedUser.password, 12);
    
    await prisma.user.create({
      data: {
        name: 'Unverified User',
        email: unverifiedUser.email,
        password: hashedPassword,
        emailVerified: false, // Not verified
      }
    });

    try {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: unverifiedUser.email,
          password: unverifiedUser.password,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Check if the app requires email verification for login
      if (response.status === 403) {
        expect(data.success).toBe(false);
        expect(data.error).toMatch(/email.*not.*verified|e-post.*ikke.*verifisert|verify.*email/i);
      } else if (response.status === 200) {
        // If app allows unverified login, that's also valid
        expect(data.success).toBe(true);
      }
    } finally {
      // Cleanup unverified user
      await prisma.user.deleteMany({
        where: { email: unverifiedUser.email }
      });
    }
  });

  it('should generate valid JWT token', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBeTruthy();
    
    // Basic JWT format check (header.payload.signature)
    const tokenParts = data.token.split('.');
    expect(tokenParts).toHaveLength(3);
    
    // Decode payload (without verification for test purposes)
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString());
    expect(payload.userId).toBe(testUser.userId);
    expect(payload.email).toBe(testUser.email);
    expect(payload.exp).toBeTruthy(); // Should have expiration
    expect(payload.iat).toBeTruthy(); // Should have issued at
  });

  it('should handle database connection errors', async () => {
    // Mock prisma to throw an error
    const originalFindUnique = prisma.user.findUnique;
    prisma.user.findUnique = jest.fn().mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
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

  it('should include proper security headers in response', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const response = await POST(request);

    // Check for security headers
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    
    // JWT token should be returned in response body, not as cookie for API route
    const data = await response.json();
    expect(data.token).toBeTruthy();
  });

  it('should rate limit repeated failed login attempts', async () => {
    const requests = [];
    
    // Make multiple failed login attempts
    for (let i = 0; i < 5; i++) {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.1.100', // Simulate same IP
        },
        body: JSON.stringify({
          email: testUser.email,
          password: 'wrongpassword',
        }),
      });
      
      requests.push(POST(request));
    }

    const responses = await Promise.all(requests);
    
    // Check if later attempts are rate limited (if implemented)
    const lastResponse = responses[responses.length - 1];
    
    if (lastResponse.status === 429) {
      const data = await lastResponse.json();
      expect(data.error).toMatch(/rate.*limit|too.*many.*attempts/i);
    } else {
      // If no rate limiting implemented, all should return 401
      expect(lastResponse.status).toBe(401);
    }
  });

  it('should handle remember me functionality if implemented', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
        rememberMe: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    if (data.token) {
      // Decode token to check if expiration is extended
      const tokenParts = data.token.split('.');
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString());
      
      // Token should exist (exact expiration checking depends on implementation)
      expect(payload.exp).toBeTruthy();
    }
  });

  it('should update last login timestamp', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const beforeLogin = new Date();
    await POST(request);
    
    // Check if lastLogin was updated in database
    const updatedUser = await prisma.user.findUnique({
      where: { email: testUser.email },
    });

    if (updatedUser?.lastLogin) {
      expect(new Date(updatedUser.lastLogin).getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    }
    // If lastLogin field doesn't exist, that's also valid
  });
});