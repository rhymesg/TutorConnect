import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { BadRequestError, NotFoundError } from '@/lib/errors';
import { CreateChatData, ChatWithParticipants } from "@prisma/client";
import { z } from 'zod';
import { 
  createChatRoom, 
  validateNorwegianTutoringChatCompatibility,
  getChatPermissions 
} from '@/lib/chat-room';
import { chat as chatTranslations } from '@/lib/translations';


// Chat creation schema
const createChatSchema = z.object({
  relatedPostId: z.string().optional(),
  participantIds: z.array(z.string()).min(1).max(10), // Limit to 10 participants
  initialMessage: z.string().min(1).max(1000).optional(),
});

// Chat listing schema - Enhanced with more filters
const listChatsSchema = z.object({
  page: z.string().nullable().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().nullable().optional().transform(val => val ? Math.min(parseInt(val), 50) : 20),
  status: z.enum(['active', 'inactive', 'archived', 'blocked', 'all']).nullable().optional().default('active'),
  hasUnread: z.string().nullable().optional().transform(val => val ? val === 'true' : undefined),
  postType: z.enum(['TEACHER', 'STUDENT', 'all']).nullable().optional().default('all'),
  subject: z.string().nullable().optional(),
  sortBy: z.enum(['lastMessageAt', 'createdAt', 'unreadCount']).nullable().optional().default('lastMessageAt'),
  sortOrder: z.enum(['asc', 'desc']).nullable().optional().default('desc'),
});

/**
 * GET /api/chat - List user's chat rooms
 */
async function handleGET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);
  
  // Validate query parameters
  const { page, limit, status, hasUnread, postType, subject, sortBy, sortOrder } = listChatsSchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    status: searchParams.get('status'),
    hasUnread: searchParams.get('hasUnread'),
    postType: searchParams.get('postType'),
    subject: searchParams.get('subject'),
    sortBy: searchParams.get('sortBy'),
    sortOrder: searchParams.get('sortOrder'),
  });

  const skip = (page - 1) * limit;

  // Build simplified where clause - just get user's active chats for now
  const whereClause: any = {
    participants: {
      some: {
        userId: user.id,
        isActive: true,
      },
    },
    isActive: true, // Only active chats
  };


  // Get chats with participants, latest message, and unread count (including Norwegian context)
  const [chats, totalCount] = await Promise.all([
    prisma.chat.findMany({
      where: whereClause,
      include: {
        participants: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
                isActive: true,
                lastActive: true,
                region: true, // Include Norwegian region
                teacherSessions: true, // For badge calculation
                teacherStudents: true, // For badge calculation
                studentSessions: true, // For badge calculation
                studentTeachers: true, // For badge calculation
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        messages: {
          take: 1,
          orderBy: { sentAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                profileImage: true,
                region: true, // Include sender region for context
              },
            },
          },
        },
        relatedPost: {
          select: {
            id: true,
            title: true,
            type: true,
            subject: true,
            isActive: true,
            user: {
              select: {
                id: true,
                name: true,
                region: true, // Include post owner region
                teacherSessions: true, // For badge calculation
                teacherStudents: true, // For badge calculation
                studentSessions: true, // For badge calculation
                studentTeachers: true, // For badge calculation
              },
            },
          },
        },
      },
      orderBy: sortBy === 'lastMessageAt' ? [
        { lastMessageAt: sortOrder },
        { createdAt: sortOrder },
      ] : sortBy === 'createdAt' ? [
        { createdAt: sortOrder },
      ] : [
        { lastMessageAt: 'desc' }, // Default fallback for unreadCount
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    }),
    prisma.chat.count({
      where: whereClause,
    }),
  ]);


  // Get unread message counts for each chat
  const chatsWithUnreadCounts = [];
  
  for (const chat of chats) {
    try {
        const userParticipant = chat.participants?.find(p => p.userId === user.id);
        const unreadCount = userParticipant ? await prisma.message.count({
          where: {
            chatId: chat.id,
            sentAt: {
              gt: userParticipant.lastReadAt || userParticipant.joinedAt,
            },
            senderId: {
              not: user.id, // Don't count own messages
            },
          },
        }) : 0;

        // Skip region compatibility - not needed for basic chat functionality

        // Determine if this is a Norwegian tutoring context
        const isNorwegianTutoring = !!chat.relatedPost;
        const tutoringSubject = chat.relatedPost?.subject;

        const processedChat = {
          ...chat,
          unreadCount,
          lastMessage: chat.messages?.[0] || null,
          isOwner: chat.participants?.some(p => p.userId === user.id) || false,
          otherParticipants: chat.participants?.filter(p => p.userId !== user.id) || [],
          otherParticipant: chat.participants?.filter(p => p.userId !== user.id)?.[0] || null,
          chatType: (chat.participants?.length || 0) > 2 ? 'group' : 
                   isNorwegianTutoring ? 'lesson' : 'direct',
          hasRecentActivity: chat.lastMessageAt ? 
            (Date.now() - new Date(chat.lastMessageAt).getTime()) < 24 * 60 * 60 * 1000 : false,
          isPostOwnerChat: chat.relatedPost?.user?.id === user.id,
          norwegianContext: {
            isNorwegianTutoring,
            subject: tutoringSubject,
          },
        };
        
        chatsWithUnreadCounts.push(processedChat);
    } catch (error) {
      // console.error(`Failed to process chat ${chat.id}:`, error);
      // Skip this chat and continue with others
    }
  }

  // Apply unread filter if requested (post-processing since it's complex to do in query)
  let filteredChats = chatsWithUnreadCounts;
  if (hasUnread !== undefined) {
    filteredChats = chatsWithUnreadCounts.filter(chat => 
      hasUnread ? chat.unreadCount > 0 : chat.unreadCount === 0
    );
  }

  // Apply unread count sorting if requested
  if (sortBy === 'unreadCount') {
    filteredChats.sort((a, b) => 
      sortOrder === 'desc' ? b.unreadCount - a.unreadCount : a.unreadCount - b.unreadCount
    );
  }

  const totalPages = Math.ceil(totalCount / limit);


  return NextResponse.json({
    success: true,
    data: {
      chats: filteredChats,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
}

/**
 * POST /api/chat - Create new chat room with Norwegian tutoring features
 */
async function handlePOST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  const body = await request.json();
  
  // Validate input
  const validatedData = createChatSchema.parse(body);
  const { relatedPostId, participantIds, initialMessage } = validatedData;

  try {
    // Use Norwegian chat room utility for enhanced validation and creation
    const chatDetails = await createChatRoom({
      relatedPostId,
      participantIds,
      initialMessage,
      creatorId: user.id,
      chatType: relatedPostId ? 'lesson' : participantIds.length > 1 ? 'group' : 'direct',
    });

    // Get full chat details for response
    const chatWithDetails = await prisma.chat.findUnique({
      where: { id: chatDetails.id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            isActive: true,
            region: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            isActive: true,
            region: true,
          },
        },
        participants: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
                isActive: true,
                region: true, // Include Norwegian region
                teacherSessions: true, // For badge calculation
                teacherStudents: true, // For badge calculation
                studentSessions: true, // For badge calculation
                studentTeachers: true, // For badge calculation
              },
            },
          },
        },
        relatedPost: {
          select: {
            id: true,
            title: true,
            type: true,
            subject: true,
            user: {
              select: {
                id: true,
                name: true,
                region: true,
                teacherSessions: true, // For badge calculation
                teacherStudents: true, // For badge calculation
                studentSessions: true, // For badge calculation
                studentTeachers: true, // For badge calculation
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        chat: chatWithDetails,
        message: chatTranslations.no.newChat?.created || 'Chat opprettet',
        metadata: {
          chatType: chatDetails.chatType,
          isNorwegianTutoring: !!relatedPostId,
          regionCompatibility: chatWithDetails?.participants.length > 1 
            ? checkRegionCompatibility(chatWithDetails.participants.map(p => p.user?.region).filter(Boolean))
            : null,
        },
      },
    });

  } catch (error) {
    // Handle Norwegian-specific error messages
    if (error instanceof BadRequestError) {
      const norwegianErrorMessage = translateChatError(error.message);
      throw new BadRequestError(norwegianErrorMessage);
    }
    throw error;
  }
}

/**
 * Helper function to check region compatibility for Norwegian users
 */
function checkRegionCompatibility(regions: (string | null)[]): {
  compatible: boolean;
  diversity: 'same-region' | 'mixed-regions' | 'unknown';
  message?: string;
} {
  const validRegions = regions.filter(Boolean);
  
  if (validRegions.length === 0) {
    return { compatible: true, diversity: 'unknown' };
  }

  const uniqueRegions = new Set(validRegions);
  
  if (uniqueRegions.size === 1) {
    return {
      compatible: true,
      diversity: 'same-region',
      message: `Alle deltakere er fra ${validRegions[0]}`,
    };
  }

  return {
    compatible: true,
    diversity: 'mixed-regions',
    message: `Deltakere fra ${uniqueRegions.size} forskjellige fylker`,
  };
}

/**
 * Helper function to translate chat error messages to Norwegian
 */
function translateChatError(englishMessage: string): string {
  const errorTranslations: Record<string, string> = {
    'One or more participants not found or inactive': 'En eller flere deltakere ble ikke funnet eller er inaktive',
    'Related post not found': 'Relatert innlegg ikke funnet',
    'Cannot create chat for inactive post': 'Kan ikke opprette chat for inaktivt innlegg',
    'You do not have access to create chat for this post': 'Du har ikke tilgang til å opprette chat for dette innlegget',
    'Maximum 10 participants allowed': 'Maksimalt 10 deltakere tillatt',
    'Email verification required before starting chats': 'E-postbekreftelse kreves før du kan starte samtaler',
    'Cannot create chat with your own post': 'Kan ikke opprette samtale med ditt eget innlegg',
    'Teachers cannot initiate chats with other teacher posts': 'Lærere kan ikke starte samtaler med andre lærerinnlegg',
    'Students cannot initiate chats with other student posts': 'Studenter kan ikke starte samtaler med andre studentinnlegg',
    'Message validation failed': 'Meldingsvalidering feilet',
    'Initiator account is inactive': 'Starterens konto er inaktiv',
    'Initiator not found': 'Starter ikke funnet',
    'Post not found': 'Innlegg ikke funnet',
  };

  return errorTranslations[englishMessage] || englishMessage;
}

export const GET = apiHandler(async (request: NextRequest, context: any) => {
  await authMiddleware(request);
  return handleGET(request);
});

export const POST = apiHandler(async (request: NextRequest, context: any) => {
  await authMiddleware(request);
  return handlePOST(request);
});