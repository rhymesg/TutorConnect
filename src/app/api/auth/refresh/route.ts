import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { refreshTokenSchema } from '@/schemas/auth';
import { 
  ValidationError, 
  UnauthorizedError,
  handleZodError,
  createErrorResponse,
  TokenExpiredError,
  InvalidTokenError
} from '@/lib/errors';
import { verifyRefreshToken, generateTokenPair } from '@/lib/jwt';

const prisma = new PrismaClient();

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    // Try to get refresh token from body first, then from cookies
    let refreshToken: string;

    const body = await request.json().catch(() => ({}));
    
    if (body.refreshToken) {
      refreshToken = body.refreshToken;
    } else {
      // Try to get from HTTP-only cookie
      refreshToken = request.cookies.get('refreshToken')?.value || '';
    }

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    // Validate refresh token format (basic validation)
    const validatedData = refreshTokenSchema.parse({ refreshToken });

    // Verify the refresh token
    const payload = await verifyRefreshToken(validatedData.refreshToken);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        region: true,
        isActive: true,
        emailVerified: true,
        // tokenVersion: true, // Would need to add this field for proper token versioning
      }
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account has been deactivated');
    }

    // Check token version if implemented
    // if (user.tokenVersion !== payload.version) {
    //   throw new UnauthorizedError('Refresh token has been invalidated');
    // }

    // Update last active timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() }
    });

    // Generate new token pair
    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      region: user.region,
      tokenVersion: 1, // payload.version in the future
    });

    // Calculate expiration times
    const accessTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: accessTokenExpiry.toISOString(),
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            region: user.region,
            isActive: user.isActive,
            emailVerified: !!user.emailVerified,
          }
        },
        meta: {
          timestamp: new Date().toISOString(),
        }
      },
      { status: 200 }
    );

    // Update HTTP-only cookies with new tokens
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
    console.error('Token refresh error:', error);

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
      if (error.message === 'REFRESH_TOKEN_EXPIRED') {
        const expiredError = new TokenExpiredError();
        expiredError.message = 'Refresh token has expired. Please log in again.';
        return NextResponse.json(
          createErrorResponse(expiredError),
          { status: expiredError.statusCode }
        );
      }
      
      if (error.message === 'INVALID_REFRESH_TOKEN' || 
          error.message === 'REFRESH_TOKEN_VERIFICATION_FAILED') {
        const invalidError = new InvalidTokenError();
        invalidError.message = 'Invalid refresh token. Please log in again.';
        return NextResponse.json(
          createErrorResponse(invalidError),
          { status: invalidError.statusCode }
        );
      }
    }

    // Handle known errors
    if (error instanceof ValidationError || 
        error instanceof UnauthorizedError ||
        error instanceof TokenExpiredError ||
        error instanceof InvalidTokenError) {
      
      const response = NextResponse.json(
        createErrorResponse(error),
        { status: error.statusCode }
      );

      // Clear invalid cookies on auth errors
      if (error instanceof UnauthorizedError || 
          error instanceof TokenExpiredError ||
          error instanceof InvalidTokenError) {
        const expiredCookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict' as const,
          path: '/',
          expires: new Date(0),
        };

        response.cookies.set('accessToken', '', expiredCookieOptions);
        response.cookies.set('refreshToken', '', expiredCookieOptions);
      }

      return response;
    }

    // Generic error response
    const response = NextResponse.json(
      createErrorResponse(new Error('Token refresh failed')),
      { status: 500 }
    );

    // Clear cookies on server error as well
    const expiredCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      expires: new Date(0),
    };

    response.cookies.set('accessToken', '', expiredCookieOptions);
    response.cookies.set('refreshToken', '', expiredCookieOptions);

    return response;
  }
}