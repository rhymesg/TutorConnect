import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { passwordResetConfirmSchema } from '@/schemas/auth';
import { 
  ValidationError, 
  NotFoundError,
  BadRequestError,
  TokenExpiredError,
  InvalidTokenError,
  handleZodError,
  createErrorResponse
} from '@/lib/errors';
import { verifyPasswordResetToken } from '@/lib/jwt';

const prisma = new PrismaClient();

/**
 * POST /api/auth/reset-password
 * Reset user's password using reset token
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = passwordResetConfirmSchema.parse(body);

    const { token, password } = validatedData;

    // Verify the password reset token
    const payload = await verifyPasswordResetToken(token);

    // Find user by ID and check if they have a matching reset token
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        verificationToken: true, // Using this field temporarily for reset tokens
        isActive: true,
        updatedAt: true,
      }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new BadRequestError('Account is deactivated');
    }

    // Check if the token matches the stored reset token
    if (user.verificationToken !== token) {
      throw new InvalidTokenError();
    }

    // Check if email matches
    if (user.email !== payload.email) {
      throw new BadRequestError('Token is not valid for this email address');
    }

    // Check if the token is not too old (additional safety check)
    const tokenAge = Date.now() - user.updatedAt.getTime();
    const maxTokenAge = 60 * 60 * 1000; // 1 hour in milliseconds
    
    if (tokenAge > maxTokenAge) {
      throw new TokenExpiredError();
    }

    // Verify that new password is different from current password
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      throw new BadRequestError('New password must be different from your current password');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user password and clear reset token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        verificationToken: null, // Clear the reset token
        updatedAt: new Date(),
        // In the future, you might want to increment tokenVersion to invalidate all existing sessions
        // tokenVersion: { increment: 1 },
      },
      select: {
        id: true,
        email: true,
        name: true,
        region: true,
        isActive: true,
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            region: updatedUser.region,
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
    console.error('Password reset error:', error);

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
      if (error.message === 'PASSWORD_RESET_TOKEN_EXPIRED') {
        const expiredError = new TokenExpiredError();
        expiredError.message = 'Password reset token has expired. Please request a new password reset.';
        return NextResponse.json(
          createErrorResponse(expiredError),
          { status: expiredError.statusCode }
        );
      }
      
      if (error.message === 'INVALID_PASSWORD_RESET_TOKEN') {
        const invalidError = new InvalidTokenError();
        invalidError.message = 'Invalid password reset token.';
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
      createErrorResponse(new Error('Password reset failed')),
      { status: 500 }
    );
  }
}