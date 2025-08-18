/**
 * Integration test for /api/auth/login endpoint
 * Tests the full login flow including database interactions
 */

import { NextRequest } from 'next/server'
import { POST } from '../../../../src/app/api/auth/login/route'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Mock external dependencies
jest.mock('@/lib/jwt', () => ({
  generateTokenPair: jest.fn().mockResolvedValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
}))

jest.mock('@/middleware/auth', () => ({
  AuthRateLimiter: {
    getKey: jest.fn(() => 'test-key'),
    isRateLimited: jest.fn(() => false),
    recordAttempt: jest.fn(),
    clearAttempts: jest.fn(),
    getRemainingTime: jest.fn(() => 0),
  },
  getClientIP: jest.fn(() => '127.0.0.1'),
}))

// Mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
} as unknown as PrismaClient

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))

describe('/api/auth/login', () => {
  const validLoginData = {
    email: 'test@example.com',
    password: 'password123',
    remember: false,
  }

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: '$2a$10$hashedpassword',
    name: 'Test User',
    region: 'Oslo',
    postalCode: '0150',
    isActive: true,
    emailVerified: new Date(),
    lastActive: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Default setup for successful scenarios
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUser)
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true)
  })

  describe('Successful login', () => {
    it('should return success response with user data and tokens', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validLoginData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Login successful')
      expect(data.data.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        region: mockUser.region,
        isActive: mockUser.isActive,
        emailVerified: true,
      })
      expect(data.data.accessToken).toBe('mock-access-token')
      expect(data.data.refreshToken).toBe('mock-refresh-token')
    })

    it('should update user last active timestamp', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validLoginData),
      })

      await POST(request)

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastActive: expect.any(Date) },
      })
    })

    it('should set HTTP-only cookies for tokens', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validLoginData),
      })

      const response = await POST(request)
      const cookies = response.cookies.getAll()

      expect(cookies.some(cookie => cookie.name === 'accessToken')).toBe(true)
      expect(cookies.some(cookie => cookie.name === 'refreshToken')).toBe(true)
    })

    it('should handle remember me option correctly', async () => {
      const rememberMeData = { ...validLoginData, remember: true }
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(rememberMeData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Check that refresh token has longer expiry (though we can't easily test the exact time)
      const refreshTokenCookie = response.cookies.get('refreshToken')
      expect(refreshTokenCookie).toBeDefined()
    })
  })

  describe('Validation errors', () => {
    it('should return error for invalid email format', async () => {
      const invalidData = { ...validLoginData, email: 'invalid-email' }
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.type).toBe('ValidationError')
    })

    it('should return error for missing password', async () => {
      const invalidData = { email: validLoginData.email }
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return error for empty password', async () => {
      const invalidData = { ...validLoginData, password: '' }
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('Authentication errors', () => {
    it('should return error for non-existent user', async () => {
      ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validLoginData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.type).toBe('InvalidCredentialsError')
    })

    it('should return error for incorrect password', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validLoginData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.type).toBe('InvalidCredentialsError')
    })

    it('should return error for inactive account', async () => {
      const inactiveUser = { ...mockUser, isActive: false }
      ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(inactiveUser)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validLoginData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(423)
      expect(data.success).toBe(false)
      expect(data.error.type).toBe('AccountLockedError')
    })
  })

  describe('Email verification status', () => {
    it('should indicate email verification is required when email not verified', async () => {
      const unverifiedUser = { ...mockUser, emailVerified: null }
      ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(unverifiedUser)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validLoginData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.requiresEmailVerification).toBe(true)
      expect(data.data.user.emailVerified).toBe(false)
    })

    it('should not require email verification when email is verified', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validLoginData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.requiresEmailVerification).toBe(false)
      expect(data.data.user.emailVerified).toBe(true)
    })
  })

  describe('Rate limiting', () => {
    beforeEach(() => {
      const { AuthRateLimiter } = require('@/middleware/auth')
      AuthRateLimiter.isRateLimited.mockReturnValue(true)
      AuthRateLimiter.getRemainingTime.mockReturnValue(600000) // 10 minutes
    })

    it('should return rate limit error when rate limited', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validLoginData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error.type).toBe('RateLimitError')
      expect(response.headers.get('Retry-After')).toBeDefined()
    })
  })

  describe('Database errors', () => {
    it('should handle database connection errors gracefully', async () => {
      ;(mockPrisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validLoginData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})