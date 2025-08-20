import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { emailVerificationSchema, resendVerificationSchema } from '@/schemas/auth';
import { 
  ValidationError, 
  NotFoundError,
  BadRequestError,
  handleZodError,
  createErrorResponse,
  TokenExpiredError,
  InvalidTokenError
} from '@/lib/errors';
import { generateEmailVerificationToken } from '@/lib/jwt';
import { sendVerificationEmail } from '@/lib/email';

const prisma = new PrismaClient();

/**
 * POST /api/auth/verify-email
 * Verify user's email address using verification token
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = emailVerificationSchema.parse(body);

    const { token } = validatedData;

    // Find user by verification token
    const user = await prisma.user.findFirst({
      where: { 
        verificationToken: token,
        emailVerified: null // Not yet verified
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        verificationToken: true,
        isActive: true,
      }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: true,
          message: 'Email is already verified',
          data: {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              emailVerified: true,
            }
          },
          meta: {
            timestamp: new Date().toISOString(),
          }
        },
        { status: 200 }
      );
    }

    // Token is already validated by the query above

    // Update user to mark email as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null, // Clear the verification token
      },
      select: {
        id: true,
        email: true,
        name: true,
        region: true,
        emailVerified: true,
        isActive: true,
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            region: updatedUser.region,
            emailVerified: !!updatedUser.emailVerified,
            isActive: updatedUser.isActive,
          }
        },
        meta: {
          timestamp: new Date().toISOString(),
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Email verification error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = handleZodError(error);
      return NextResponse.json(
        createErrorResponse(validationError),
        { status: validationError.statusCode }
      );
    }

    // Handle JWT-specific errors
    if (error instanceof Error) {
      if (error.message === 'EMAIL_VERIFICATION_TOKEN_EXPIRED') {
        const expiredError = new TokenExpiredError();
        expiredError.message = 'Email verification token has expired. Please request a new verification email.';
        return NextResponse.json(
          createErrorResponse(expiredError),
          { status: expiredError.statusCode }
        );
      }
      
      if (error.message === 'INVALID_EMAIL_VERIFICATION_TOKEN') {
        const invalidError = new InvalidTokenError();
        invalidError.message = 'Invalid email verification token.';
        return NextResponse.json(
          createErrorResponse(invalidError),
          { status: invalidError.statusCode }
        );
      }
    }

    // Handle known errors
    if (error instanceof ValidationError || 
        error instanceof NotFoundError ||
        error instanceof BadRequestError ||
        error instanceof TokenExpiredError ||
        error instanceof InvalidTokenError) {
      return NextResponse.json(
        createErrorResponse(error),
        { status: error.statusCode }
      );
    }

    // Generic error response
    return NextResponse.json(
      createErrorResponse(new Error('Email verification failed')),
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/verify-email/resend
 * Resend verification email to user
 */
export async function PUT(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = resendVerificationSchema.parse(body);

    const { email } = validatedData;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        isActive: true,
      }
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        {
          success: true,
          message: 'If the email address exists in our system, a verification email will be sent.',
          data: {},
          meta: {
            timestamp: new Date().toISOString(),
          }
        },
        { status: 200 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: true,
          message: 'Email is already verified',
          data: {
            emailVerified: true,
          },
          meta: {
            timestamp: new Date().toISOString(),
          }
        },
        { status: 200 }
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account is deactivated',
          code: 'ACCOUNT_DEACTIVATED',
          statusCode: 403,
          meta: {
            timestamp: new Date().toISOString(),
          }
        },
        { status: 403 }
      );
    }

    // Generate new verification token
    const verificationToken = await generateEmailVerificationToken({
      userId: user.id,
      email: user.email,
    });

    // Update user with new verification token
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken }
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      throw new Error('Failed to send verification email');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Verification email sent successfully',
        data: {},
        meta: {
          timestamp: new Date().toISOString(),
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Resend verification error:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = handleZodError(error);
      return NextResponse.json(
        createErrorResponse(validationError),
        { status: validationError.statusCode }
      );
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
      createErrorResponse(new Error('Failed to resend verification email')),
      { status: 500 }
    );
  }
}