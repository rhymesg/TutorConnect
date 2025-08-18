import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { registerUserSchema } from '@/schemas/auth';
import { 
  ValidationError, 
  EmailExistsError,
  handlePrismaError,
  handleZodError,
  createErrorResponse,
  RateLimitError
} from '@/lib/errors';
import { generateEmailVerificationToken, generateTokenPair } from '@/lib/jwt';
import { AuthRateLimiter, getClientIP } from '@/middleware/auth';
import { sendVerificationEmail } from '@/lib/email';

const prisma = new PrismaClient();

/**
 * POST /api/auth/register
 * Register a new user account
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    const rateLimitKey = AuthRateLimiter.getKey(clientIP);

    // Check rate limiting (max 3 registrations per hour per IP)
    if (AuthRateLimiter.isRateLimited(rateLimitKey, 3, 60 * 60 * 1000)) {
      const remainingTime = AuthRateLimiter.getRemainingTime(rateLimitKey);
      throw new RateLimitError(Math.ceil(remainingTime / 1000 / 60)); // minutes
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerUserSchema.parse(body);

    // Extract validated data
    const {
      email,
      password,
      name,
      region,
      postalCode,
    } = validatedData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      throw new EmailExistsError();
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const verificationToken = await generateEmailVerificationToken({
      userId: 'temp', // We'll update this after user creation
      email,
    });

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        region,
        postalCode: postalCode || null,
        verificationToken,
        // Default privacy settings are handled by schema defaults
      },
      select: {
        id: true,
        email: true,
        name: true,
        region: true,
        postalCode: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      }
    });

    // Update verification token with actual user ID
    const finalVerificationToken = await generateEmailVerificationToken({
      userId: user.id,
      email: user.email,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: finalVerificationToken }
    });

    // Record successful registration attempt for rate limiting
    AuthRateLimiter.recordAttempt(rateLimitKey, 60 * 60 * 1000);

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.name, finalVerificationToken);
    } catch (emailError) {
      // Log email error but don't fail registration
      console.error('Failed to send verification email:', emailError);
    }

    // Generate tokens (user needs to verify email to access full features)
    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      region: user.region,
      tokenVersion: 1,
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please check your email for verification instructions.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            region: user.region,
            postalCode: user.postalCode,
            isActive: user.isActive,
            emailVerified: !!user.emailVerified,
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          requiresEmailVerification: !user.emailVerified,
        },
        meta: {
          timestamp: new Date().toISOString(),
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = handleZodError(error);
      return NextResponse.json(
        createErrorResponse(validationError),
        { status: validationError.statusCode }
      );
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = handlePrismaError(error);
      return NextResponse.json(
        createErrorResponse(prismaError),
        { status: prismaError.statusCode }
      );
    }

    // Handle known errors
    if (error instanceof ValidationError || 
        error instanceof EmailExistsError ||
        error instanceof RateLimitError) {
      return NextResponse.json(
        createErrorResponse(error),
        { status: error.statusCode }
      );
    }

    // Generic error response
    return NextResponse.json(
      createErrorResponse(new Error('Registration failed')),
      { status: 500 }
    );
  }
}