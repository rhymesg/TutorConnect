import { NextRequest, NextResponse } from 'next/server';
import { verifyJWTToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

/**
 * Simple GET /api/profile - Get current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const cookieStore = cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = await verifyJWTToken(accessToken, 'access');
    
    // Get user profile
    const profile = await prisma.user.findUnique({
      where: { id: decoded.sub },
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
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Calculate simple completeness
    const requiredFields = ['name', 'bio', 'school', 'degree'];
    const completedFields = requiredFields.filter(field => 
      profile[field as keyof typeof profile]
    );
    const completeness = {
      percentage: Math.round((completedFields.length / requiredFields.length) * 100),
      missingFields: requiredFields.filter(field => 
        !profile[field as keyof typeof profile]
      )
    };

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        completeness,
      }
    });

  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}