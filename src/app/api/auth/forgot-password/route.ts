import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { passwordResetRequestSchema } from '@/schemas/auth';
import { 
  ValidationError, 
  RateLimitError,
  handleZodError,
  createErrorResponse
} from '@/lib/errors';
import { generatePasswordResetToken } from '@/lib/jwt';
import { AuthRateLimiter, getClientIP } from '@/middleware/auth';
import { sendPasswordResetEmail } from '@/lib/email';

const prisma = new PrismaClient();

/**
 * POST /api/auth/forgot-password
 * Send password reset email to user
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    let rateLimitKey = AuthRateLimiter.getKey(clientIP);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = passwordResetRequestSchema.parse(body);

    const { email } = validatedData;

    // Update rate limit key to include email for more specific limiting
    rateLimitKey = AuthRateLimiter.getKey(clientIP, email);

    // Check rate limiting (max 3 password reset requests per hour per IP+email)
    if (AuthRateLimiter.isRateLimited(rateLimitKey, 3, 60 * 60 * 1000)) {
      const remainingTime = AuthRateLimiter.getRemainingTime(rateLimitKey);
      throw new RateLimitError(Math.ceil(remainingTime / 1000 / 60)); // minutes
    }

    // Record the attempt for rate limiting (regardless of whether user exists)
    AuthRateLimiter.recordAttempt(rateLimitKey, 60 * 60 * 1000);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        emailVerified: true,
      }
    });

    // Always return success message (don't reveal if email exists)
    const successResponse = {
      success: true,
      message: 'If the email address exists in our system, a password reset email will be sent.',
      data: {},
      meta: {
        timestamp: new Date().toISOString(),
      }
    };

    // If user doesn't exist, still return success (security measure)
    if (!user) {
      return NextResponse.json(successResponse, { status: 200 });
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(successResponse, { status: 200 });
    }

    // Check if email is verified (optional - you might want to allow password reset even without verification)
    // if (!user.emailVerified) {
    //   return NextResponse.json(successResponse, { status: 200 });
    // }

    // Generate password reset token
    const resetToken = await generatePasswordResetToken({
      userId: user.id,
      email: user.email,
    });

    // Store reset token in database (you might want to add a password_reset_token field to user schema)
    // For now, we'll use the verificationToken field temporarily
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        verificationToken: resetToken, // In production, use a separate field
        updatedAt: new Date(),
      }
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Still return success to not reveal if email exists
    }

    return NextResponse.json(successResponse, { status: 200 });

  } catch (error) {
    console.error('Password reset request error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = handleZodError(error);
      return NextResponse.json(
        createErrorResponse(validationError),
        { status: validationError.statusCode }
      );
    }

    // Handle rate limiting errors
    if (error instanceof RateLimitError) {
      const response = NextResponse.json(
        createErrorResponse(error),
        { status: error.statusCode }
      );

      // Add rate limit headers
      response.headers.set('Retry-After', error.retryAfter.toString());
      response.headers.set('X-RateLimit-Limit', '3');
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', (Date.now() + error.retryAfter * 1000).toString());

      return response;
    }

    // Handle known errors
    if (error instanceof ValidationError) {
      return NextResponse.json(
        createErrorResponse(error),
        { status: error.statusCode }
      );
    }

    // Generic error response
    return NextResponse.json(
      createErrorResponse(new Error('Password reset request failed')),
      { status: 500 }
    );
  }
}