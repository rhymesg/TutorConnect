import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { BadRequestError, NotFoundError } from '@/lib/errors';
import { CreateChatData, ChatWithParticipants, MessageType } from "@prisma/client";
import { z } from 'zod';

const prisma = new PrismaClient();

// Chat creation schema
const createChatSchema = z.object({
  relatedPostId: z.string().optional(),
  participantIds: z.array(z.string()).min(1).max(10), // Limit to 10 participants
  initialMessage: z.string().min(1).max(1000).optional(),
});

// Chat listing schema - Enhanced with more filters
const listChatsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 50) : 20),
  status: z.enum(['active', 'inactive', 'archived', 'blocked', 'all']).optional().default('active'),
  hasUnread: z.string().optional().transform(val => val === 'true'),
  postType: z.enum(['TEACHER', 'STUDENT', 'all']).optional().default('all'),
  subject: z.string().optional(),
  sortBy: z.enum(['lastMessageAt', 'createdAt', 'unreadCount']).optional().default('lastMessageAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
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

  // Build enhanced where clause based on filters
  const whereClause: any = {
    participants: {
      some: {
        userId: user.id,
        isActive: true,
      },
    },
  };

  // Apply status filter
  if (status === 'active') {
    whereClause.isActive = true;
  } else if (status === 'inactive') {
    whereClause.isActive = false;
  } else if (status === 'archived') {
    // For archived, we'd check user-specific archival status
    whereClause.participants.some.isActive = false;
  } else if (status === 'blocked') {
    // For blocked chats, you'd have a separate blocking mechanism
    whereClause.isActive = false;
  }

  // Apply post type filter
  if (postType !== 'all') {
    whereClause.relatedPost = {
      type: postType,
    };
  }

  // Apply subject filter
  if (subject) {
    whereClause.relatedPost = {
      ...whereClause.relatedPost,
      subject: subject,
    };
  }

  // Get chats with participants, latest message, and unread count
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
          },
        },
        _count: {
          select: {
            messages: true,
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
  const chatsWithUnreadCounts = await Promise.all(
    chats.map(async (chat) => {
      const userParticipant = chat.participants.find(p => p.userId === user.id);
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

      return {
        ...chat,
        unreadCount,
        lastMessage: chat.messages[0] || null,
        isOwner: chat.participants.some(p => p.userId === user.id),
        otherParticipants: chat.participants.filter(p => p.userId !== user.id),
        chatType: chat.participants.length > 2 ? 'group' : 'direct',
        hasRecentActivity: chat.lastMessageAt && 
          (Date.now() - chat.lastMessageAt.getTime()) < 24 * 60 * 60 * 1000,
        isPostOwnerChat: chat.relatedPost?.userId === user.id,
      };
    })
  );

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

  return {
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
  };
}

/**
 * POST /api/chat - Create new chat room
 */
async function handlePOST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  const body = await request.json();
  
  // Validate input
  const validatedData = createChatSchema.parse(body);
  const { relatedPostId, participantIds, initialMessage } = validatedData;

  // Add current user to participants if not already included
  const allParticipantIds = participantIds.includes(user.id) 
    ? participantIds 
    : [user.id, ...participantIds];

  // Validate participants exist and are active
  const participants = await prisma.user.findMany({
    where: {
      id: { in: allParticipantIds },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      profileImage: true,
      isActive: true,
    },
  });

  if (participants.length !== allParticipantIds.length) {
    throw new BadRequestError('One or more participants not found or inactive');
  }

  // If related to a post, verify post exists and user has access
  let relatedPost = null;
  if (relatedPostId) {
    relatedPost = await prisma.post.findUnique({
      where: { id: relatedPostId },
      select: {
        id: true,
        userId: true,
        title: true,
        type: true,
        subject: true,
        isActive: true,
      },
    });

    if (!relatedPost) {
      throw new NotFoundError('Related post not found');
    }

    if (!relatedPost.isActive) {
      throw new BadRequestError('Cannot create chat for inactive post');
    }

    // Check if user is either post owner or one of the participants
    const hasAccess = relatedPost.userId === user.id || allParticipantIds.includes(relatedPost.userId);
    if (!hasAccess) {
      throw new BadRequestError('You do not have access to create chat for this post');
    }
  }

  // Check if chat already exists between these participants for this post
  if (relatedPostId) {
    const existingChat = await prisma.chat.findFirst({
      where: {
        relatedPostId,
        isActive: true,
        participants: {
          every: {
            userId: { in: allParticipantIds },
            isActive: true,
          },
        },
      },
      include: {
        participants: true,
      },
    });

    if (existingChat && existingChat.participants.length === allParticipantIds.length) {
      return {
        success: true,
        data: {
          chatId: existingChat.id,
          message: 'Chat already exists',
        },
      };
    }
  }

  // Create chat in transaction
  const newChat = await prisma.$transaction(async (tx) => {
    // Create the chat
    const chat = await tx.chat.create({
      data: {
        relatedPostId,
        isActive: true,
      },
    });

    // Add all participants
    await tx.chatParticipant.createMany({
      data: allParticipantIds.map(participantId => ({
        chatId: chat.id,
        userId: participantId,
        joinedAt: new Date(),
        isActive: true,
        unreadCount: 0,
      })),
    });

    // Send initial message if provided
    if (initialMessage) {
      await tx.message.create({
        data: {
          content: initialMessage,
          type: MessageType.TEXT,
          chatId: chat.id,
          senderId: user.id,
        },
      });

      // Update chat's last message timestamp
      await tx.chat.update({
        where: { id: chat.id },
        data: { lastMessageAt: new Date() },
      });

      // Update unread counts for other participants
      await tx.chatParticipant.updateMany({
        where: {
          chatId: chat.id,
          userId: { not: user.id },
        },
        data: {
          unreadCount: { increment: 1 },
        },
      });
    }

    // Add system message for chat creation
    await tx.message.create({
      data: {
        content: `${user.name} created this chat${relatedPost ? ` for "${relatedPost.title}"` : ''}`,
        type: MessageType.SYSTEM_MESSAGE,
        chatId: chat.id,
        senderId: user.id,
      },
    });

    return chat;
  });

  // Return chat with full details
  const chatWithDetails = await prisma.chat.findUnique({
    where: { id: newChat.id },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              isActive: true,
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
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  return {
    success: true,
    data: {
      chat: chatWithDetails,
      message: 'Chat created successfully',
    },
  };
}

export const GET = apiHandler({
  requireAuth: true,
  middlewares: [authMiddleware],
  handler: handleGET,
});

export const POST = apiHandler({
  requireAuth: true,
  middlewares: [authMiddleware],
  handler: handlePOST,
});