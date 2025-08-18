import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, getAuthenticatedUser, optionalAuthMiddleware } from '@/middleware/auth';
import { createErrorResponse } from '@/lib/errors';

const prisma = new PrismaClient();

/**
 * GET /api/auth/me
 * Get current user information
 */
export async function GET(request: NextRequest) {
  try {
    // Use optional auth to allow checking if user is logged in
    await optionalAuthMiddleware(request);
    
    // If no user is authenticated, return null user
    const authenticatedRequest = request as any;
    if (!authenticatedRequest.user) {
      return NextResponse.json(
        {
          success: true,
          data: {
            user: null,
            isAuthenticated: false,
          },
          meta: {
            timestamp: new Date().toISOString(),
          }
        },
        { status: 200 }
      );
    }

    const user = authenticatedRequest.user;

    // Get additional user information from database
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        region: true,
        postalCode: true,
        gender: true,
        birthYear: true,
        profileImage: true,
        school: true,
        degree: true,
        bio: true,
        isActive: true,
        emailVerified: true,
        lastActive: true,
        createdAt: true,
        privacyGender: true,
        privacyAge: true,
        privacyDocuments: true,
        privacyContact: true,
        // Include counts
        _count: {
          select: {
            posts: true,
            sentMessages: true,
            chatParticipants: true,
          }
        }
      }
    });

    if (!fullUser) {
      return NextResponse.json(
        {
          success: true,
          data: {
            user: null,
            isAuthenticated: false,
          },
          meta: {
            timestamp: new Date().toISOString(),
          }
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: fullUser.id,
            email: fullUser.email,
            name: fullUser.name,
            region: fullUser.region,
            postalCode: fullUser.postalCode,
            gender: fullUser.gender,
            birthYear: fullUser.birthYear,
            profileImage: fullUser.profileImage,
            school: fullUser.school,
            degree: fullUser.degree,
            bio: fullUser.bio,
            isActive: fullUser.isActive,
            emailVerified: !!fullUser.emailVerified,
            lastActive: fullUser.lastActive,
            createdAt: fullUser.createdAt,
            privacy: {
              gender: fullUser.privacyGender,
              age: fullUser.privacyAge,
              documents: fullUser.privacyDocuments,
              contact: fullUser.privacyContact,
            },
            stats: {
              postsCount: fullUser._count.posts,
              messagesCount: fullUser._count.sentMessages,
              chatsCount: fullUser._count.chatParticipants,
            }
          },
          isAuthenticated: true,
        },
        meta: {
          timestamp: new Date().toISOString(),
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get user info error:', error);

    // Handle authentication errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      return NextResponse.json(
        createErrorResponse(error as any),
        { status: (error as any).statusCode }
      );
    }

    // Generic error response
    return NextResponse.json(
      createErrorResponse(new Error('Failed to get user information')),
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/auth/me
 * Update current user's basic information
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate the request
    await authMiddleware(request);
    const user = getAuthenticatedUser(request);

    // Parse request body
    const body = await request.json();
    
    // Define allowed fields for updating via this endpoint
    const allowedFields = ['name', 'region', 'postalCode'];
    const updates: any = {};

    // Only include allowed fields in updates
    for (const field of allowedFields) {
      if (field in body && body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Validate that at least one field is being updated
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No valid fields provided for update',
          code: 'NO_UPDATES',
          statusCode: 400,
          meta: {
            timestamp: new Date().toISOString(),
          }
        },
        { status: 400 }
      );
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        region: true,
        postalCode: true,
        isActive: true,
        emailVerified: true,
        updatedAt: true,
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            region: updatedUser.region,
            postalCode: updatedUser.postalCode,
            isActive: updatedUser.isActive,
            emailVerified: !!updatedUser.emailVerified,
            updatedAt: updatedUser.updatedAt,
          }
        },
        meta: {
          timestamp: new Date().toISOString(),
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Update user info error:', error);

    // Handle authentication errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      return NextResponse.json(
        createErrorResponse(error as any),
        { status: (error as any).statusCode }
      );
    }

    // Generic error response
    return NextResponse.json(
      createErrorResponse(new Error('Failed to update user information')),
      { status: 500 }
    );
  }
}