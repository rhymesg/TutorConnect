import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser, requireResourceOwnership } from '@/middleware/auth';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/errors';
import { MessageType } from "@prisma/client";
import { z } from 'zod';

const prisma = new PrismaClient();

// Update chat schema
const updateChatSchema = z.object({
  isActive: z.boolean().optional(),
});

// Message listing schema
const listMessagesSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 50),
  before: z.string().optional(), // Message ID for pagination
  after: z.string().optional(), // Message ID for pagination
});

interface RouteParams {
  chatId: string;
}

/**
 * Helper function to check if user is chat participant
 */
async function validateChatAccess(chatId: string, userId: string) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      participants: {
        where: {
          userId,
          isActive: true,
        },
      },
    },
  });

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  if (chat.participants.length === 0) {
    throw new ForbiddenError('You do not have access to this chat');
  }

  return chat;
}

/**
 * GET /api/chat/[chatId] - Get chat details with messages
 */
async function handleGET(request: NextRequest, { params }: { params: RouteParams }) {
  const user = getAuthenticatedUser(request);
  const { chatId } = params;
  const { searchParams } = new URL(request.url);

  // Validate access
  await validateChatAccess(chatId, user.id);

  // Validate query parameters
  const { page, limit, before, after } = listMessagesSchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    before: searchParams.get('before'),
    after: searchParams.get('after'),
  });

  // Get chat with full details
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
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
      relatedPost: {
        select: {
          id: true,
          title: true,
          type: true,
          subject: true,
          userId: true,
          isActive: true,
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      },
      appointments: {
        where: {
          status: { not: 'CANCELLED' },
        },
        orderBy: { dateTime: 'desc' },
        take: 5,
        select: {
          id: true,
          dateTime: true,
          location: true,
          status: true,
          duration: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  // Build message query based on pagination parameters
  const messageWhere: any = { chatId };
  
  if (before) {
    const beforeMessage = await prisma.message.findUnique({
      where: { id: before },
      select: { sentAt: true },
    });
    if (beforeMessage) {
      messageWhere.sentAt = { lt: beforeMessage.sentAt };
    }
  }
  
  if (after) {
    const afterMessage = await prisma.message.findUnique({
      where: { id: after },
      select: { sentAt: true },
    });
    if (afterMessage) {
      messageWhere.sentAt = { gt: afterMessage.sentAt };
    }
  }

  const skip = before || after ? 0 : (page - 1) * limit;

  // Get messages
  const messages = await prisma.message.findMany({
    where: messageWhere,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
      appointment: {
        select: {
          id: true,
          dateTime: true,
          location: true,
          status: true,
          duration: true,
        },
      },
    },
    orderBy: { sentAt: 'desc' },
    skip,
    take: limit,
  });

  // Get user's participant info for unread count
  const userParticipant = chat.participants.find(p => p.userId === user.id);
  const unreadCount = userParticipant ? await prisma.message.count({
    where: {
      chatId,
      sentAt: {
        gt: userParticipant.lastReadAt || userParticipant.joinedAt,
      },
      senderId: {
        not: user.id,
      },
    },
  }) : 0;

  // Mark messages as read by updating lastReadAt
  if (userParticipant && messages.length > 0) {
    await prisma.chatParticipant.update({
      where: {
        chatId_userId: {
          chatId,
          userId: user.id,
        },
      },
      data: {
        lastReadAt: new Date(),
        unreadCount: 0,
      },
    });
  }

  return {
    success: true,
    data: {
      chat: {
        ...chat,
        unreadCount,
        isOwner: chat.participants.some(p => p.userId === user.id),
        otherParticipants: chat.participants.filter(p => p.userId !== user.id),
      },
      messages: messages.reverse(), // Return messages in chronological order
      pagination: {
        page,
        limit,
        total: chat._count.messages,
        hasMore: messages.length === limit,
        oldestMessageId: messages.length > 0 ? messages[0].id : null,
        newestMessageId: messages.length > 0 ? messages[messages.length - 1].id : null,
      },
    },
  };
}

/**
 * PATCH /api/chat/[chatId] - Update chat settings
 */
async function handlePATCH(request: NextRequest, { params }: { params: RouteParams }) {
  const user = getAuthenticatedUser(request);
  const { chatId } = params;
  const body = await request.json();

  // Validate access
  await validateChatAccess(chatId, user.id);

  // Validate input
  const validatedData = updateChatSchema.parse(body);
  const { isActive } = validatedData;

  // Only allow deactivation (leaving chat) for now
  if (isActive !== undefined && isActive === false) {
    // Remove user from chat by setting participant as inactive
    await prisma.chatParticipant.update({
      where: {
        chatId_userId: {
          chatId,
          userId: user.id,
        },
      },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });

    // Add system message about user leaving
    await prisma.message.create({
      data: {
        content: `${user.name} left the chat`,
        type: MessageType.SYSTEM_MESSAGE,
        chatId,
        senderId: user.id,
      },
    });

    // Check if chat should be deactivated (no active participants)
    const activeParticipants = await prisma.chatParticipant.count({
      where: {
        chatId,
        isActive: true,
      },
    });

    if (activeParticipants === 0) {
      await prisma.chat.update({
        where: { id: chatId },
        data: { isActive: false },
      });
    }

    return {
      success: true,
      data: {
        message: 'Left chat successfully',
      },
    };
  }

  return {
    success: true,
    data: {
      message: 'No changes made',
    },
  };
}

/**
 * DELETE /api/chat/[chatId] - Delete/deactivate chat (admin or post owner only)
 */
async function handleDELETE(request: NextRequest, { params }: { params: RouteParams }) {
  const user = getAuthenticatedUser(request);
  const { chatId } = params;

  // Get chat with post info
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      relatedPost: {
        select: {
          id: true,
          userId: true,
        },
      },
      participants: {
        where: { userId: user.id },
      },
    },
  });

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  // Check if user has permission to delete
  const isParticipant = chat.participants.length > 0;
  const isPostOwner = chat.relatedPost?.userId === user.id;
  
  if (!isParticipant && !isPostOwner) {
    throw new ForbiddenError('You do not have permission to delete this chat');
  }

  // Deactivate chat and all participants
  await prisma.$transaction(async (tx) => {
    await tx.chat.update({
      where: { id: chatId },
      data: { isActive: false },
    });

    await tx.chatParticipant.updateMany({
      where: { chatId },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });

    // Add system message about chat deletion
    await tx.message.create({
      data: {
        content: 'This chat has been deleted',
        type: MessageType.SYSTEM_MESSAGE,
        chatId,
        senderId: user.id,
      },
    });
  });

  return {
    success: true,
    data: {
      message: 'Chat deleted successfully',
    },
  };
}

export const GET = apiHandler({
  requireAuth: true,
  middlewares: [authMiddleware],
  handler: handleGET,
});

export const PATCH = apiHandler({
  requireAuth: true,
  middlewares: [authMiddleware],
  handler: handlePATCH,
});

export const DELETE = apiHandler({
  requireAuth: true,
  middlewares: [authMiddleware],
  handler: handleDELETE,
});