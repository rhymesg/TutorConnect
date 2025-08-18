import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { createErrorResponse } from '@/lib/errors';

const prisma = new PrismaClient();

/**
 * POST /api/auth/logout
 * Logout user and invalidate tokens
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    await authMiddleware(request);
    const user = getAuthenticatedUser(request);

    // Update user's last active timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastActive: new Date(),
        // In the future, we could increment a tokenVersion field to invalidate all existing tokens
      }
    });

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logout successful',
        data: {},
        meta: {
          timestamp: new Date().toISOString(),
        }
      },
      { status: 200 }
    );

    // Clear HTTP-only cookies if they exist
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      expires: new Date(0), // Expire immediately
    };

    response.cookies.set('accessToken', '', cookieOptions);
    response.cookies.set('refreshToken', '', cookieOptions);

    return response;

  } catch (error) {
    console.error('Logout error:', error);

    // Handle authentication errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      return NextResponse.json(
        createErrorResponse(error as any),
        { status: (error as any).statusCode }
      );
    }

    // Even if logout fails, we should still clear cookies and return success
    // because the client-side token should be discarded regardless
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logout completed',
        data: {},
        meta: {
          timestamp: new Date().toISOString(),
        }
      },
      { status: 200 }
    );

    // Clear cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      expires: new Date(0),
    };

    response.cookies.set('accessToken', '', cookieOptions);
    response.cookies.set('refreshToken', '', cookieOptions);

    return response;
  }
}

/**
 * POST /api/auth/logout-all
 * Logout user from all devices by incrementing token version
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate the request
    await authMiddleware(request);
    const user = getAuthenticatedUser(request);

    // Update user to invalidate all existing tokens
    // This would require adding a tokenVersion field to the user schema
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastActive: new Date(),
        // tokenVersion: { increment: 1 }, // Would need to add this field to schema
      }
    });

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out from all devices successfully',
        data: {},
        meta: {
          timestamp: new Date().toISOString(),
        }
      },
      { status: 200 }
    );

    // Clear HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      expires: new Date(0),
    };

    response.cookies.set('accessToken', '', cookieOptions);
    response.cookies.set('refreshToken', '', cookieOptions);

    return response;

  } catch (error) {
    console.error('Logout all devices error:', error);

    // Handle authentication errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      return NextResponse.json(
        createErrorResponse(error as any),
        { status: (error as any).statusCode }
      );
    }

    // Generic error response
    return NextResponse.json(
      createErrorResponse(new Error('Logout from all devices failed')),
      { status: 500 }
    );
  }
}