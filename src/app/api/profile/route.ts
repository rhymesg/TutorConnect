import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, type AuthenticatedRequest, getAuthenticatedUser } from '@/middleware/auth';
import { 
  updateProfileSchema, 
  updatePrivacySettingsSchema,
  applyPrivacySettings,
  calculateProfileCompleteness,
  type UpdateProfileInput
} from '@/schemas/profile';
import { 
  APIError, 
  ValidationError, 
  NotFoundError,
  handlePrismaError,
  handleZodError,
  createErrorResponse 
} from '@/lib/errors';
import { getLocalizedErrorMessage } from '@/lib/errors';

const prisma = new PrismaClient();

/**
 * GET /api/profile - Get current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    await authMiddleware(request);
    const user = getAuthenticatedUser(request as AuthenticatedRequest);
    
    // Get full profile with related data
    const profile = await prisma.user.findUnique({
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
        certifications: true,
        bio: true,
        privacyGender: true,
        privacyAge: true,
        privacyDocuments: true,
        privacyContact: true,
        isActive: true,
        lastActive: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        documents: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
            verificationStatus: true,
            uploadedAt: true,
          }
        },
        posts: {
          where: { isActive: true },
          select: {
            id: true,
            type: true,
            subject: true,
            title: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }
      }
    });

    if (!profile) {
      throw new NotFoundError('Profile');
    }

    // Calculate profile completeness
    const completeness = calculateProfileCompleteness(profile);

    // Since this is the user's own profile, return full data
    const responseData = applyPrivacySettings(profile, { 
      isOwner: true,
      requesterId: user.id 
    });

    return NextResponse.json({
      success: true,
      data: {
        ...responseData,
        completeness,
      },
      meta: {
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Profile GET error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        createErrorResponse(error, 'en'),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      createErrorResponse(new Error('Failed to fetch profile'), 'en'),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile - Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    await authMiddleware(request);
    const user = getAuthenticatedUser(request as AuthenticatedRequest);
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Update profile in database
    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
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
        certifications: true,
        bio: true,
        privacyGender: true,
        privacyAge: true,
        privacyDocuments: true,
        privacyContact: true,
        updatedAt: true,
      }
    });

    // Calculate updated profile completeness
    const completeness = calculateProfileCompleteness(updatedProfile);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...updatedProfile,
        completeness,
      },
      meta: {
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Profile PUT error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = handleZodError(error);
      return NextResponse.json(
        createErrorResponse(validationError, 'en'),
        { status: validationError.statusCode }
      );
    }
    
    if (error instanceof APIError) {
      return NextResponse.json(
        createErrorResponse(error, 'en'),
        { status: error.statusCode }
      );
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = handlePrismaError(error);
      return NextResponse.json(
        createErrorResponse(prismaError, 'en'),
        { status: prismaError.statusCode }
      );
    }

    return NextResponse.json(
      createErrorResponse(new Error('Failed to update profile'), 'en'),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile - Deactivate user account (soft delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    await authMiddleware(request);
    const user = getAuthenticatedUser(request as AuthenticatedRequest);
    
    // Get confirmation from request body
    const body = await request.json();
    const { confirmEmail } = body;

    if (confirmEmail !== user.email) {
      throw new ValidationError({
        confirmEmail: ['Email confirmation does not match your account email']
      });
    }

    // Soft delete: deactivate account instead of hard delete (GDPR compliance)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      }
    });

    // Also deactivate user's posts
    await prisma.post.updateMany({
      where: { userId: user.id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Account deactivated successfully',
      meta: {
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Profile DELETE error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = handleZodError(error);
      return NextResponse.json(
        createErrorResponse(validationError, 'en'),
        { status: validationError.statusCode }
      );
    }
    
    if (error instanceof APIError) {
      return NextResponse.json(
        createErrorResponse(error, 'en'),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      createErrorResponse(new Error('Failed to deactivate account'), 'en'),
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile - Update specific profile fields
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    await authMiddleware(request);
    const user = getAuthenticatedUser(request as AuthenticatedRequest);
    
    // Parse and validate request body
    const body = await request.json();
    
    // Check if this is a privacy settings update
    if (body.privacyGender || body.privacyAge || body.privacyDocuments || body.privacyContact) {
      const validatedPrivacyData = updatePrivacySettingsSchema.parse(body);
      
      const updatedProfile = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...validatedPrivacyData,
          updatedAt: new Date(),
        },
        select: {
          privacyGender: true,
          privacyAge: true,
          privacyDocuments: true,
          privacyContact: true,
          updatedAt: true,
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Privacy settings updated successfully',
        data: updatedProfile,
        meta: {
          timestamp: new Date().toISOString(),
        }
      });
    }

    // Otherwise, validate as regular profile update
    const validatedData = updateProfileSchema.parse(body);

    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        region: true,
        postalCode: true,
        gender: true,
        birthYear: true,
        school: true,
        degree: true,
        certifications: true,
        bio: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
      meta: {
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Profile PATCH error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = handleZodError(error);
      return NextResponse.json(
        createErrorResponse(validationError, 'en'),
        { status: validationError.statusCode }
      );
    }
    
    if (error instanceof APIError) {
      return NextResponse.json(
        createErrorResponse(error, 'en'),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      createErrorResponse(new Error('Failed to update profile'), 'en'),
      { status: 500 }
    );
  }
}