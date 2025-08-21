import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  optionalAuthMiddleware, 
  type AuthenticatedRequest, 
  getAuthenticatedUser 
} from '@/middleware/auth';
import { applyPrivacySettings } from '@/schemas/profile';
import { 
  APIError, 
  NotFoundError,
  BadRequestError,
  createErrorResponse 
} from '@/lib/errors';

const prisma = new PrismaClient();

interface RouteParams {
  params: {
    userId: string;
  };
}

/**
 * GET /api/profile/[userId] - Get user profile by ID (with privacy filtering)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await params;
    
    // Validate userId format (cuid)
    if (!userId || typeof userId !== 'string' || userId.length < 10) {
      throw new BadRequestError('Invalid user ID format');
    }
    
    // Optional authentication - works for both authenticated and anonymous users
    await optionalAuthMiddleware(request);
    const currentUser = (request as AuthenticatedRequest).user;
    
    // Check if there's an existing info request from the current user
    let hasRequestPermission = false;
    if (currentUser) {
      const infoRequest = await prisma.infoRequest.findUnique({
        where: {
          senderId_receiverId_requestType: {
            senderId: currentUser.id,
            receiverId: userId,
            requestType: 'detailed_profile',
          }
        },
        select: { status: true }
      });
      
      hasRequestPermission = infoRequest?.status === 'APPROVED';
    }
    
    // Get user profile with related data
    const profile = await prisma.user.findUnique({
      where: { 
        id: userId,
        isActive: true, // Only show active users
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
        documents: {
          where: {
            verificationStatus: 'VERIFIED',
          },
          select: {
            id: true,
            documentType: true,
            verificationStatus: true,
            verifiedAt: true,
          }
        },
        posts: {
          where: { isActive: true },
          select: {
            id: true,
            type: true,
            subject: true,
            title: true,
            ageGroups: true,
            location: true,
            hourlyRate: true,
            hourlyRateMin: true,
            hourlyRateMax: true,
            currency: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Show more posts for public profile
        }
      }
    });

    if (!profile) {
      throw new NotFoundError('User profile');
    }

    // Apply privacy settings based on relationship to viewer
    const isOwner = currentUser?.id === userId;
    const filteredProfile = applyPrivacySettings(profile, {
      isOwner,
      hasRequestPermission,
      requesterId: currentUser?.id,
    });

    // Add public statistics
    const stats = await getPublicUserStats(userId);
    
    // Calculate profile verification level
    const verificationLevel = calculateVerificationLevel(profile.documents);
    
    // Add relationship status for authenticated users
    let relationshipStatus = null;
    if (currentUser && !isOwner) {
      relationshipStatus = await getUserRelationshipStatus(currentUser.id, userId);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...filteredProfile,
        stats,
        verificationLevel,
        relationshipStatus,
      },
      meta: {
        timestamp: new Date().toISOString(),
        isOwner,
        hasRequestPermission,
      }
    });

  } catch (error) {
    console.error('Public profile GET error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        createErrorResponse(error, 'en'),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      createErrorResponse(new Error('Failed to fetch user profile'), 'en'),
      { status: 500 }
    );
  }
}

/**
 * Get public statistics for a user
 */
async function getPublicUserStats(userId: string) {
  const [
    totalPosts,
    activePosts,
    completedAppointments,
    averageRating,
    joinDate
  ] = await Promise.all([
    // Total posts created
    prisma.post.count({
      where: { userId, isActive: true }
    }),
    
    // Currently active posts
    prisma.post.count({
      where: { userId, isActive: true }
    }),
    
    // Completed appointments (rough estimate based on appointment status)
    prisma.$queryRaw`
      SELECT COUNT(*)
      FROM appointments a
      JOIN chats c ON a."chatId" = c.id
      JOIN chat_participants cp ON c.id = cp."chatId"
      WHERE cp."userId" = ${userId} 
      AND a.status = 'COMPLETED'
      AND a."bothCompleted" = true
    `,
    
    // Future: average rating from completed appointments
    // For now, return null as rating system is not implemented
    null,
    
    // User join date
    prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    }).then(user => user?.createdAt || null)
  ]);

  return {
    totalPosts: totalPosts || 0,
    activePosts: activePosts || 0,
    completedAppointments: Array.isArray(completedAppointments) ? 
      Number(completedAppointments[0]?.count || 0) : 0,
    averageRating, // null for now
    memberSince: joinDate,
  };
}

/**
 * Calculate verification level based on verified documents
 */
function calculateVerificationLevel(documents: any[]) {
  const verifiedDocuments = documents.filter(doc => doc.verificationStatus === 'VERIFIED');
  const documentTypes = verifiedDocuments.map(doc => doc.documentType);
  
  let level = 'unverified';
  let verifiedCount = 0;
  
  // Check for different types of verification
  if (documentTypes.includes('ID_VERIFICATION')) {
    verifiedCount++;
  }
  
  if (documentTypes.includes('EDUCATION_CERTIFICATE')) {
    verifiedCount++;
  }
  
  if (documentTypes.includes('TEACHING_CERTIFICATE')) {
    verifiedCount++;
  }
  
  // Determine verification level
  if (verifiedCount === 0) {
    level = 'unverified';
  } else if (verifiedCount === 1) {
    level = 'basic';
  } else if (verifiedCount === 2) {
    level = 'verified';
  } else if (verifiedCount >= 3) {
    level = 'premium';
  }
  
  return {
    level,
    verifiedDocuments: verifiedCount,
    totalDocuments: documents.length,
    verificationTypes: documentTypes,
  };
}

/**
 * Get relationship status between current user and profile user
 */
async function getUserRelationshipStatus(currentUserId: string, profileUserId: string) {
  // Check if they have an active chat
  const activeChat = await prisma.chat.findFirst({
    where: {
      isActive: true,
      participants: {
        every: {
          userId: { in: [currentUserId, profileUserId] },
          isActive: true,
        }
      }
    },
    select: { id: true }
  });
  
  // Check for pending info requests
  const pendingInfoRequest = await prisma.infoRequest.findFirst({
    where: {
      OR: [
        { senderId: currentUserId, receiverId: profileUserId },
        { senderId: profileUserId, receiverId: currentUserId },
      ],
      status: 'PENDING'
    },
    select: {
      id: true,
      senderId: true,
      requestType: true,
    }
  });
  
  // Check for upcoming appointments
  const upcomingAppointment = await prisma.appointment.findFirst({
    where: {
      chat: {
        participants: {
          some: { userId: currentUserId }
        }
      },
      dateTime: { gt: new Date() },
      status: { in: ['PENDING', 'CONFIRMED'] }
    },
    select: {
      id: true,
      dateTime: true,
      status: true,
    },
    orderBy: { dateTime: 'asc' }
  });
  
  return {
    hasActiveChat: !!activeChat,
    chatId: activeChat?.id || null,
    pendingInfoRequest: pendingInfoRequest ? {
      id: pendingInfoRequest.id,
      type: pendingInfoRequest.requestType,
      isFromCurrentUser: pendingInfoRequest.senderId === currentUserId,
    } : null,
    upcomingAppointment: upcomingAppointment ? {
      id: upcomingAppointment.id,
      dateTime: upcomingAppointment.dateTime,
      status: upcomingAppointment.status,
    } : null,
  };
}