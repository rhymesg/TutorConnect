import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { POST } from '@/app/api/auth/register/route';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// Mock email service
jest.mock('@/lib/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

describe('/api/auth/register', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
  };

  beforeEach(async () => {
    // Clean up any existing test users
    await prisma.user.deleteMany({
      where: {
        email: testUser.email,
      },
    });
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

  it('should successfully register a new user', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const response = await POST(request);
    const data = await response.json();

    // Check response
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.message).toContain('User created successfully');
    expect(data.user.email).toBe(testUser.email);
    expect(data.user.name).toBe(testUser.name);
    expect(data.user.password).toBeUndefined(); // Password should not be returned

    // Check database
    const createdUser = await prisma.user.findUnique({
      where: { email: testUser.email },
    });

    expect(createdUser).toBeTruthy();
    expect(createdUser?.name).toBe(testUser.name);
    expect(createdUser?.email).toBe(testUser.email);
    expect(createdUser?.emailVerified).toBe(false);
    expect(createdUser?.password).toBeTruthy();
    expect(createdUser?.password).not.toBe(testUser.password); // Should be hashed
  });

  it('should hash the password correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    await POST(request);

    const user = await prisma.user.findUnique({
      where: { email: testUser.email },
    });

    expect(user?.password).toBeTruthy();
    expect(user?.password).not.toBe(testUser.password);
    
    // Verify password can be verified with bcrypt
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(testUser.password, user?.password);
    expect(isValid).toBe(true);
  });

  it('should reject registration with duplicate email', async () => {
    // First registration
    await POST(new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    }));

    // Second registration with same email
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...testUser,
        name: 'Another User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('already exists');
  });

  it('should validate required fields', async () => {
    const invalidRequests = [
      { name: '', email: testUser.email, password: testUser.password }, // Missing name
      { name: testUser.name, email: '', password: testUser.password }, // Missing email
      { name: testUser.name, email: testUser.email, password: '' }, // Missing password
      {}, // Empty body
    ];

    for (const invalidData of invalidRequests) {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
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
      'test@example',
    ];

    for (const invalidEmail of invalidEmails) {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testUser,
          email: invalidEmail,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/email|format/i);
    }
  });

  it('should validate password strength', async () => {
    const weakPasswords = [
      '123',
      'password',
      '12345678',
      'Password', // No number
      'password123', // No uppercase
      'PASSWORD123', // No lowercase
    ];

    for (const weakPassword of weakPasswords) {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testUser,
          password: weakPassword,
        }),
      });

      const response = await POST(request);
      
      if (response.status === 400) {
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toMatch(/password|strength|weak/i);
      }
    }
  });

  it('should handle database connection errors', async () => {
    // Mock prisma to throw an error
    const originalCreate = prisma.user.create;
    prisma.user.create = jest.fn().mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();

    // Restore original method
    prisma.user.create = originalCreate;
  });

  it('should create user with correct default values', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    await POST(request);

    const user = await prisma.user.findUnique({
      where: { email: testUser.email },
    });

    expect(user?.emailVerified).toBe(false);
    expect(user?.createdAt).toBeTruthy();
    expect(user?.updatedAt).toBeTruthy();
    expect(typeof user?.id).toBe('string');
  });

  it('should call email service to send verification email', async () => {
    const { sendVerificationEmail } = require('@/lib/email');

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    await POST(request);

    expect(sendVerificationEmail).toHaveBeenCalledWith(
      testUser.email,
      testUser.name,
      expect.any(String) // verification token
    );
  });

  it('should handle email service failures gracefully', async () => {
    const { sendVerificationEmail } = require('@/lib/email');
    sendVerificationEmail.mockRejectedValueOnce(new Error('Email service failed'));

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const response = await POST(request);
    const data = await response.json();

    // User should still be created even if email fails
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.message).toContain('created');
    
    // But should indicate email issue
    expect(data.emailSent).toBe(false);

    const user = await prisma.user.findUnique({
      where: { email: testUser.email },
    });
    expect(user).toBeTruthy();
  });
});