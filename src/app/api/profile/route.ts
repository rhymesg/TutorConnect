import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const prisma = new PrismaClient();

/**
 * GET /api/profile - Get current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    let accessToken: string | undefined;
    
    // Try Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    } else {
      // Fallback to cookies
      const cookieStore = await cookies();
      accessToken = cookieStore.get('accessToken')?.value;
    }

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const { payload } = await jwtVerify(accessToken, secret);
    const decoded = { sub: payload.sub as string };
    
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
        degree: true,
        education: true,
        certifications: true,
        bio: true,
        privacyGender: true,
        privacyAge: true,
        privacyDocuments: true,
        privacyContact: true,
        privacyEducation: true,
        privacyCertifications: true,
        privacyLocation: true,
        privacyPostalCode: true,
        privacyMemberSince: true,
        privacyLastActive: true,
        privacyActivity: true,
        privacyStats: true,
        teacherSessions: true,
        teacherStudents: true,
        studentSessions: true,
        studentTeachers: true,
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
    const requiredFields = ['name', 'bio', 'education', 'degree'];
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

  } catch (error: any) {
    console.error('Profile GET error:', error);
    
    // Handle JWT-specific errors
    if (error.code === 'ERR_JWT_EXPIRED' || error.claim === 'exp') {
      return NextResponse.json(
        { success: false, error: 'TOKEN_EXPIRED', message: 'Access token has expired' },
        { status: 401 }
      );
    }
    
    if (error.code === 'ERR_JWS_INVALID' || error.message?.includes('invalid')) {
      return NextResponse.json(
        { success: false, error: 'INVALID_TOKEN', message: 'Invalid access token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile - Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    let accessToken: string | undefined;
    
    // Try Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    } else {
      // Fallback to cookies
      const cookieStore = await cookies();
      accessToken = cookieStore.get('accessToken')?.value;
    }

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const { payload } = await jwtVerify(accessToken, secret);
    const decoded = { sub: payload.sub as string };
    
    // Parse request body
    const body = await request.json();
    
    // Update profile
    const updatedProfile = await prisma.user.update({
      where: { id: decoded.sub },
      data: {
        ...body,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        region: true,
        postalCode: true,
        gender: true,
        birthYear: true,
        degree: true,
        education: true,
        certifications: true,
        bio: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedProfile
    });

  } catch (error: any) {
    console.error('Profile PUT error:', error);
    
    // Handle JWT-specific errors
    if (error.code === 'ERR_JWT_EXPIRED' || error.claim === 'exp') {
      return NextResponse.json(
        { success: false, error: 'TOKEN_EXPIRED', message: 'Access token has expired' },
        { status: 401 }
      );
    }
    
    if (error.code === 'ERR_JWS_INVALID' || error.message?.includes('invalid')) {
      return NextResponse.json(
        { success: false, error: 'INVALID_TOKEN', message: 'Invalid access token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile - Update specific profile fields including privacy settings
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    let accessToken: string | undefined;
    
    // Try Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    } else {
      // Fallback to cookies
      const cookieStore = await cookies();
      accessToken = cookieStore.get('accessToken')?.value;
    }

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const { payload } = await jwtVerify(accessToken, secret);
    const decoded = { sub: payload.sub as string };
    
    // Parse request body
    const body = await request.json();

    // Prepare data for database update  
    const updateData = { ...body };

    // Update profile
    const updatedProfile = await prisma.user.update({
      where: { id: decoded.sub },
      data: {
        ...updateData,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedProfile
    });

  } catch (error: any) {
    console.error('Profile PATCH error:', error);
    
    // Handle JWT-specific errors
    if (error.code === 'ERR_JWT_EXPIRED' || error.claim === 'exp') {
      return NextResponse.json(
        { success: false, error: 'TOKEN_EXPIRED', message: 'Access token has expired' },
        { status: 401 }
      );
    }
    
    if (error.code === 'ERR_JWS_INVALID' || error.message?.includes('invalid')) {
      return NextResponse.json(
        { success: false, error: 'INVALID_TOKEN', message: 'Invalid access token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}