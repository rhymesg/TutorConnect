import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/errors';
import { z } from 'zod';

// Update message schema
const updateMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

interface RouteParams {
  chatId: string;
  messageId: string;
}

/**
 * Helper function to validate message access and permissions
 */
async function validateMessageAccess(chatId: string, messageId: string, userId: string) {
  // Check if user is participant in the chat
  const participant = await prisma.chatParticipant.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId,
      },
    },
  });

  if (!participant || !participant.isActive) {
    throw new ForbiddenError('You do not have access to this chat');
  }

  // Get the message
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
      chat: {
        select: {
          id: true,
          isActive: true,
        },
      },
      appointment: {
        select: {
          id: true,
          dateTime: true,
          location: true,
          status: true,
        },
      },
      replyTo: {
        select: {
          id: true,
          content: true,
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!message) {
    throw new NotFoundError('Message not found');
  }

  if (message.chatId !== chatId) {
    throw new BadRequestError('Message does not belong to this chat');
  }

  return { message, participant };
}

/**
 * GET /api/chat/[chatId]/messages/[messageId] - Get specific message details
 */
async function handleGET(request: NextRequest, { params }: { params: RouteParams }) {
  const user = getAuthenticatedUser(request);
  const { chatId, messageId } = params;

  const { message } = await validateMessageAccess(chatId, messageId, user.id);

  // Get read receipts for this message
  const readBy = await prisma.chatParticipant.findMany({
    where: {
      chatId,
      isActive: true,
      lastReadAt: {
        gte: message.sentAt,
      },
      userId: {
        not: message.senderId, // Exclude sender
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
    },
  });

  // Get replies to this message
  const replies = await prisma.message.findMany({
    where: {
      replyToMessageId: messageId,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
    },
    orderBy: { sentAt: 'asc' },
    take: 10, // Limit replies shown
  });

  const messageAge = Date.now() - message.sentAt.getTime();
  const canEdit = message.senderId === user.id && 
    messageAge < 15 * 60 * 1000; // 15 minutes

  const canDelete = message.senderId === user.id && 
    messageAge < 60 * 60 * 1000; // 1 hour

  return {
    success: true,
    data: {
      message: {
        ...message,
        readBy: readBy.map(p => p.user),
        replies: replies.map(reply => ({
          ...reply,
          isOwnMessage: reply.senderId === user.id,
        })),
        isOwnMessage: message.senderId === user.id,
        canEdit,
        canDelete,
        age: messageAge,
      },
    },
  };
}

/**
 * PATCH /api/chat/[chatId]/messages/[messageId] - Edit message
 */
async function handlePATCH(request: NextRequest, { params }: { params: RouteParams }) {
  const user = getAuthenticatedUser(request);
  const { chatId, messageId } = params;
  const body = await request.json();

  const { message } = await validateMessageAccess(chatId, messageId, user.id);

  // Validate ownership
  if (message.senderId !== user.id) {
    throw new ForbiddenError('You can only edit your own messages');
  }

  // Check if message can be edited
  const messageAge = Date.now() - message.sentAt.getTime();
  const editTimeLimit = 15 * 60 * 1000; // 15 minutes

  if (messageAge > editTimeLimit) {
    throw new BadRequestError('Message is too old to edit (15 minute limit)');
  }


  // Validate input
  const { content } = updateMessageSchema.parse(body);

  // Content filtering
  const bannedWords = ['spam', 'scam', 'fake'];
  const containsBannedContent = bannedWords.some(word => 
    content.toLowerCase().includes(word.toLowerCase())
  );

  if (containsBannedContent) {
    throw new BadRequestError('Message contains inappropriate content');
  }

  // Update message
  const updatedMessage = await prisma.message.update({
    where: { id: messageId },
    data: {
      content,
      isEdited: true,
      editedAt: new Date(),
    },
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
        },
      },
      replyTo: {
        select: {
          id: true,
          content: true,
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return {
    success: true,
    data: {
      message: {
        ...updatedMessage,
        isOwnMessage: true,
        canEdit: true,
        canDelete: messageAge < 60 * 60 * 1000, // Can still delete within 1 hour
      },
    },
  };
}

/**
 * DELETE /api/chat/[chatId]/messages/[messageId] - Delete message
 */
async function handleDELETE(request: NextRequest, { params }: { params: RouteParams }) {
  const user = getAuthenticatedUser(request);
  const { chatId, messageId } = params;

  const { message } = await validateMessageAccess(chatId, messageId, user.id);

  // Validate ownership
  if (message.senderId !== user.id) {
    throw new ForbiddenError('You can only delete your own messages');
  }

  // Check if message can be deleted
  const messageAge = Date.now() - message.sentAt.getTime();
  const deleteTimeLimit = 60 * 60 * 1000; // 1 hour

  if (messageAge > deleteTimeLimit) {
    throw new BadRequestError('Message is too old to delete (1 hour limit)');
  }


  // Check if message has replies
  const replyCount = await prisma.message.count({
    where: {
      replyToMessageId: messageId,
    },
  });

  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === 'true';

  if (replyCount > 0 && !force) {
    return {
      success: false,
      data: {
        message: 'This message has replies. Use force=true to delete anyway.',
        replyCount,
        canForceDelete: true,
      },
    };
  }

  // Delete message (soft delete by updating content)
  await prisma.$transaction(async (tx) => {
    // Update message content to indicate deletion
    await tx.message.update({
      where: { id: messageId },
      data: {
        content: '[Message deleted]',
        isEdited: true,
        editedAt: new Date(),
      },
    });

    // If forcing delete and has replies, update reply references
    if (replyCount > 0 && force) {
      await tx.message.updateMany({
        where: {
          replyToMessageId: messageId,
        },
        data: {
          replyToMessageId: null, // Remove reply reference
        },
      });
    }

    // Update unread counts (decrease by 1 for participants who haven't read it)
    const unreadParticipants = await tx.chatParticipant.findMany({
      where: {
        chatId,
        isActive: true,
        userId: { not: user.id },
        lastReadAt: {
          lt: message.sentAt,
        },
        unreadCount: { gt: 0 },
      },
    });

    for (const participant of unreadParticipants) {
      await tx.chatParticipant.update({
        where: {
          chatId_userId: {
            chatId,
            userId: participant.userId,
          },
        },
        data: {
          unreadCount: { decrement: 1 },
        },
      });
    }
  });

  return {
    success: true,
    data: {
      message: 'Message deleted successfully',
      deletedReplies: force ? replyCount : 0,
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