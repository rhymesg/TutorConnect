import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/errors';
import { CreateMessageData, MessageType } from "@prisma/client";
import { z } from 'zod';

const prisma = new PrismaClient();

// Send message schema
const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.nativeEnum(MessageType).optional().default(MessageType.TEXT),
  appointmentId: z.string().optional(),
  replyToMessageId: z.string().optional(),
});

// Message query schema
const messageQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 50),
  before: z.string().optional(), // Message ID for pagination
  after: z.string().optional(), // Message ID for pagination
  type: z.nativeEnum(MessageType).optional(),
  search: z.string().optional(),
});

interface RouteParams {
  chatId: string;
}

/**
 * Helper function to validate chat access for messaging
 */
async function validateChatMessageAccess(chatId: string, userId: string) {
  const participant = await prisma.chatParticipant.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId,
      },
    },
    include: {
      chat: {
        select: {
          id: true,
          isActive: true,
          relatedPostId: true,
        },
      },
    },
  });

  if (!participant || !participant.isActive) {
    throw new ForbiddenError('You do not have access to this chat');
  }

  if (!participant.chat.isActive) {
    throw new BadRequestError('Cannot send messages to inactive chat');
  }

  return participant;
}

/**
 * GET /api/chat/[chatId]/messages - Get chat messages with pagination
 */
async function handleGET(request: NextRequest, { params }: { params: RouteParams }) {
  const user = getAuthenticatedUser(request);
  const { chatId } = params;
  const { searchParams } = new URL(request.url);

  // Validate access
  await validateChatMessageAccess(chatId, user.id);

  // Validate query parameters
  const { page, limit, before, after, type, search } = messageQuerySchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    before: searchParams.get('before'),
    after: searchParams.get('after'),
    type: searchParams.get('type'),
    search: searchParams.get('search'),
  });

  // Build message query
  let messageWhere: any = { chatId };

  // Add type filter
  if (type) {
    messageWhere.type = type;
  }

  // Add search filter
  if (search) {
    messageWhere.content = {
      contains: search,
      mode: 'insensitive',
    };
  }

  // Handle pagination
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

  // Get messages with sender details
  const [messages, totalCount] = await Promise.all([
    prisma.message.findMany({
      where: messageWhere,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            isActive: true,
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
        replyTo: {
          select: {
            id: true,
            content: true,
            type: true,
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { sentAt: 'desc' },
      skip,
      take: limit,
    }),
    search ? undefined : prisma.message.count({
      where: { chatId, ...(type && { type }) },
    }),
  ]);

  // Get message read status for each message
  const messagesWithReadStatus = await Promise.all(
    messages.map(async (message) => {
      // Get read receipts (participants who have read this message)
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

      return {
        ...message,
        readBy: readBy.map(p => p.user),
        isOwnMessage: message.senderId === user.id,
        canEdit: message.senderId === user.id && 
          message.type === MessageType.TEXT &&
          Date.now() - message.sentAt.getTime() < 15 * 60 * 1000, // 15 minutes
        canDelete: message.senderId === user.id ||
          // Add admin check here if needed
          false,
      };
    })
  );

  const totalPages = totalCount ? Math.ceil(totalCount / limit) : 0;

  return {
    success: true,
    data: {
      messages: messagesWithReadStatus.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total: totalCount || messages.length,
        totalPages,
        hasMore: messages.length === limit,
        oldestMessageId: messages.length > 0 ? messages[messages.length - 1].id : null,
        newestMessageId: messages.length > 0 ? messages[0].id : null,
      },
    },
  };
}

/**
 * POST /api/chat/[chatId]/messages - Send a new message
 */
async function handlePOST(request: NextRequest, { params }: { params: RouteParams }) {
  const user = getAuthenticatedUser(request);
  const { chatId } = params;
  const body = await request.json();

  // Validate access
  const participant = await validateChatMessageAccess(chatId, user.id);

  // Validate input
  const { content, type, appointmentId, replyToMessageId } = sendMessageSchema.parse(body);

  // Additional validations based on message type
  if (type === MessageType.APPOINTMENT_REQUEST && !appointmentId) {
    throw new BadRequestError('Appointment ID required for appointment messages');
  }

  if (appointmentId) {
    // Verify appointment exists and is related to this chat
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        chatId: true,
        status: true,
      },
    });

    if (!appointment || appointment.chatId !== chatId) {
      throw new BadRequestError('Invalid appointment for this chat');
    }
  }

  if (replyToMessageId) {
    // Verify the message being replied to exists in this chat
    const replyToMessage = await prisma.message.findUnique({
      where: { id: replyToMessageId },
      select: {
        id: true,
        chatId: true,
      },
    });

    if (!replyToMessage || replyToMessage.chatId !== chatId) {
      throw new BadRequestError('Invalid message to reply to');
    }
  }

  // Rate limiting: Check recent messages from this user
  const recentMessageCount = await prisma.message.count({
    where: {
      chatId,
      senderId: user.id,
      sentAt: {
        gte: new Date(Date.now() - 60 * 1000), // Last minute
      },
    },
  });

  if (recentMessageCount >= 10) {
    throw new BadRequestError('Too many messages sent recently. Please wait before sending more.');
  }

  // Content filtering for Norwegian context (basic)
  const bannedWords = ['spam', 'scam', 'fake']; // Extend with Norwegian words
  const containsBannedContent = bannedWords.some(word => 
    content.toLowerCase().includes(word.toLowerCase())
  );

  if (containsBannedContent) {
    throw new BadRequestError('Message contains inappropriate content');
  }

  // Create message in transaction
  const newMessage = await prisma.$transaction(async (tx) => {
    // Create the message
    const message = await tx.message.create({
      data: {
        content,
        type,
        chatId,
        senderId: user.id,
        appointmentId,
        replyToMessageId,
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
            duration: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            type: true,
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

    // Update chat's last message timestamp
    await tx.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: new Date() },
    });

    // Update unread counts for other participants
    await tx.chatParticipant.updateMany({
      where: {
        chatId,
        userId: { not: user.id },
        isActive: true,
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    // Reset sender's unread count and update last read time
    await tx.chatParticipant.update({
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

    return message;
  });

  // Trigger real-time notification (handled by Supabase realtime)
  // This would be where you'd emit to the real-time channel

  return {
    success: true,
    data: {
      message: {
        ...newMessage,
        readBy: [], // New message hasn't been read by others yet
        isOwnMessage: true,
        canEdit: type === MessageType.TEXT,
        canDelete: true,
      },
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