import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { loginUserSchema } from '@/schemas/auth';
import { 
  ValidationError, 
  InvalidCredentialsError,
  AccountLockedError,
  handleZodError,
  createErrorResponse,
  RateLimitError,
  UnauthorizedError
} from '@/lib/errors';
import { generateTokenPair } from '@/lib/jwt';
import { AuthRateLimiter, getClientIP } from '@/middleware/auth';

const prisma = new PrismaClient();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP and email for rate limiting
    const clientIP = getClientIP(request);
    let rateLimitKey = AuthRateLimiter.getKey(clientIP);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = loginUserSchema.parse(body);

    const { email, password, remember } = validatedData;

    // Update rate limit key to include email for more specific limiting
    rateLimitKey = AuthRateLimiter.getKey(clientIP, email);

    // Check rate limiting (max 5 failed attempts per 15 minutes per IP+email)
    if (AuthRateLimiter.isRateLimited(rateLimitKey, 5, 15 * 60 * 1000)) {
      const remainingTime = AuthRateLimiter.getRemainingTime(rateLimitKey);
      throw new RateLimitError(Math.ceil(remainingTime / 1000 / 60)); // minutes
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        region: true,
        postalCode: true,
        isActive: true,
        emailVerified: true,
        lastActive: true,
      }
    });

    // Check if user exists
    if (!user) {
      // Record failed attempt for rate limiting
      AuthRateLimiter.recordAttempt(rateLimitKey, 15 * 60 * 1000);
      throw new InvalidCredentialsError();
    }

    // Check if account is active
    if (!user.isActive) {
      // Record failed attempt for rate limiting
      AuthRateLimiter.recordAttempt(rateLimitKey, 15 * 60 * 1000);
      throw new AccountLockedError();
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Record failed attempt for rate limiting
      AuthRateLimiter.recordAttempt(rateLimitKey, 15 * 60 * 1000);
      throw new InvalidCredentialsError();
    }

    // Clear rate limiting on successful login
    AuthRateLimiter.clearAttempts(rateLimitKey);

    // Update last active timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() }
    });

    // Generate token pair
    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      region: user.region,
      tokenVersion: 1, // In the future, we can track token versions per user
    });

    // Determine token expiration based on remember me option
    const accessTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const refreshTokenExpiry = remember 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days if remember me
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);  // 7 days normal

    // Set secure HTTP-only cookies for tokens (optional, can be used alongside header auth)
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            region: user.region,
            postalCode: user.postalCode,
            isActive: user.isActive,
            emailVerified: !!user.emailVerified,
            lastActive: user.lastActive,
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: accessTokenExpiry.toISOString(),
          requiresEmailVerification: !user.emailVerified,
        },
        meta: {
          timestamp: new Date().toISOString(),
        }
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookies (optional - client can choose to use headers instead)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    response.cookies.set('accessToken', tokens.accessToken, {
      ...cookieOptions,
      expires: accessTokenExpiry,
    });

    response.cookies.set('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      expires: refreshTokenExpiry,
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = handleZodError(error);
      return NextResponse.json(
        createErrorResponse(validationError),
        { status: validationError.statusCode }
      );
    }

    // Handle known errors
    if (error instanceof ValidationError || 
        error instanceof InvalidCredentialsError ||
        error instanceof AccountLockedError ||
        error instanceof RateLimitError ||
        error instanceof UnauthorizedError) {
      
      const response = NextResponse.json(
        createErrorResponse(error),
        { status: error.statusCode }
      );

      // Add rate limit headers for client feedback
      if (error instanceof RateLimitError) {
        response.headers.set('Retry-After', error.retryAfter.toString());
        response.headers.set('X-RateLimit-Limit', '5');
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set('X-RateLimit-Reset', (Date.now() + error.retryAfter * 1000).toString());
      }

      return response;
    }

    // Generic error response
    return NextResponse.json(
      createErrorResponse(new Error('Login failed')),
      { status: 500 }
    );
  }
}