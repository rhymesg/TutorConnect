import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/errors';
import { MessageType } from '@/types/database';
import { z } from 'zod';

const prisma = new PrismaClient();

// Add participants schema
const addParticipantsSchema = z.object({
  userIds: z.array(z.string()).min(1).max(5), // Limit adding 5 participants at once
});

// Update participant schema
const updateParticipantSchema = z.object({
  userId: z.string(),
  action: z.enum(['remove', 'mute', 'unmute']),
});

interface RouteParams {
  chatId: string;
}

/**
 * Helper function to check if user can manage chat participants
 */
async function validateParticipantManagementAccess(chatId: string, userId: string) {
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
            },
          },
        },
      },
      relatedPost: {
        select: {
          id: true,
          userId: true,
          title: true,
        },
      },
    },
  });

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  const userParticipant = chat.participants.find(p => p.userId === userId);
  if (!userParticipant) {
    throw new ForbiddenError('You are not a participant in this chat');
  }

  // Check if user is post owner (has elevated permissions)
  const isPostOwner = chat.relatedPost?.userId === userId;

  return { chat, userParticipant, isPostOwner };
}

/**
 * GET /api/chat/[chatId]/participants - List chat participants
 */
async function handleGET(request: NextRequest, { params }: { params: RouteParams }) {
  const user = getAuthenticatedUser(request);
  const { chatId } = params;

  const { chat } = await validateParticipantManagementAccess(chatId, user.id);

  // Get detailed participant information
  const participants = await prisma.chatParticipant.findMany({
    where: {
      chatId,
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
          isActive: true,
          lastActive: true,
          region: true,
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  // Get participant statistics
  const participantStats = await Promise.all(
    participants.map(async (participant) => {
      const messageCount = await prisma.message.count({
        where: {
          chatId,
          senderId: participant.userId,
        },
      });

      return {
        ...participant,
        messageCount,
        isCurrentUser: participant.userId === user.id,
        isOnline: participant.user.lastActive 
          ? Date.now() - participant.user.lastActive.getTime() < 5 * 60 * 1000 // 5 minutes
          : false,
      };
    })
  );

  return {
    success: true,
    data: {
      participants: participantStats,
      totalParticipants: participants.length,
      chatInfo: {
        id: chat.id,
        isActive: chat.isActive,
        relatedPost: chat.relatedPost,
        createdAt: chat.createdAt,
      },
    },
  };
}

/**
 * POST /api/chat/[chatId]/participants - Add participants to chat
 */
async function handlePOST(request: NextRequest, { params }: { params: RouteParams }) {
  const user = getAuthenticatedUser(request);
  const { chatId } = params;
  const body = await request.json();

  const { chat, isPostOwner } = await validateParticipantManagementAccess(chatId, user.id);

  // Validate input
  const { userIds } = addParticipantsSchema.parse(body);

  // Check if user has permission to add participants
  // For now, any participant can add others, but post owner has elevated permissions
  if (!chat.isActive) {
    throw new BadRequestError('Cannot add participants to inactive chat');
  }

  // Validate that users to add exist and are active
  const usersToAdd = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      profileImage: true,
      emailVerified: true,
    },
  });

  if (usersToAdd.length !== userIds.length) {
    throw new BadRequestError('One or more users not found or inactive');
  }

  // Check for users who require email verification
  const unverifiedUsers = usersToAdd.filter(u => !u.emailVerified);
  if (unverifiedUsers.length > 0) {
    throw new BadRequestError('Cannot add users with unverified email addresses');
  }

  // Check current participant count and limit
  const currentParticipantCount = await prisma.chatParticipant.count({
    where: {
      chatId,
      isActive: true,
    },
  });

  const maxParticipants = 10; // Configurable limit
  if (currentParticipantCount + userIds.length > maxParticipants) {
    throw new BadRequestError(`Chat cannot have more than ${maxParticipants} participants`);
  }

  // Check if users are already participants
  const existingParticipants = await prisma.chatParticipant.findMany({
    where: {
      chatId,
      userId: { in: userIds },
    },
  });

  const existingUserIds = existingParticipants.map(p => p.userId);
  const newUserIds = userIds.filter(id => !existingUserIds.includes(id));
  const reactivatedUserIds = existingParticipants
    .filter(p => !p.isActive)
    .map(p => p.userId);

  if (newUserIds.length === 0 && reactivatedUserIds.length === 0) {
    throw new BadRequestError('All specified users are already active participants');
  }

  // Add participants in transaction
  const addedUsers = await prisma.$transaction(async (tx) => {
    const results: any[] = [];

    // Add new participants
    if (newUserIds.length > 0) {
      await tx.chatParticipant.createMany({
        data: newUserIds.map(userId => ({
          chatId,
          userId,
          joinedAt: new Date(),
          isActive: true,
          unreadCount: 0,
        })),
      });

      const newUsers = usersToAdd.filter(u => newUserIds.includes(u.id));
      results.push(...newUsers.map(u => ({ ...u, status: 'added' })));
    }

    // Reactivate existing participants
    if (reactivatedUserIds.length > 0) {
      await tx.chatParticipant.updateMany({
        where: {
          chatId,
          userId: { in: reactivatedUserIds },
        },
        data: {
          isActive: true,
          joinedAt: new Date(),
          leftAt: null,
          unreadCount: 0,
        },
      });

      const reactivatedUsers = usersToAdd.filter(u => reactivatedUserIds.includes(u.id));
      results.push(...reactivatedUsers.map(u => ({ ...u, status: 'reactivated' })));
    }

    // Add system messages for each added user
    for (const addedUser of results) {
      await tx.message.create({
        data: {
          content: `${user.name} added ${addedUser.name} to the chat`,
          type: MessageType.SYSTEM_MESSAGE,
          chatId,
          senderId: user.id,
        },
      });
    }

    // Update chat's last message timestamp
    await tx.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: new Date() },
    });

    return results;
  });

  return {
    success: true,
    data: {
      addedParticipants: addedUsers,
      message: `Successfully added ${addedUsers.length} participant(s)`,
    },
  };
}

/**
 * PATCH /api/chat/[chatId]/participants - Update participant (remove, mute, etc.)
 */
async function handlePATCH(request: NextRequest, { params }: { params: RouteParams }) {
  const user = getAuthenticatedUser(request);
  const { chatId } = params;
  const body = await request.json();

  const { chat, isPostOwner } = await validateParticipantManagementAccess(chatId, user.id);

  // Validate input
  const { userId, action } = updateParticipantSchema.parse(body);

  // Check if target user is a participant
  const targetParticipant = await prisma.chatParticipant.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId,
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

  if (!targetParticipant || !targetParticipant.isActive) {
    throw new NotFoundError('Participant not found in this chat');
  }

  // Permission checks
  if (action === 'remove') {
    // Users can remove themselves, post owners can remove others
    if (userId !== user.id && !isPostOwner) {
      throw new ForbiddenError('You can only remove yourself from the chat');
    }

    // Don't allow removing the last participant
    const activeParticipantCount = await prisma.chatParticipant.count({
      where: {
        chatId,
        isActive: true,
      },
    });

    if (activeParticipantCount <= 1) {
      throw new BadRequestError('Cannot remove the last participant from the chat');
    }
  }

  // Execute action
  let resultMessage = '';
  let systemMessageContent = '';

  switch (action) {
    case 'remove':
      await prisma.chatParticipant.update({
        where: {
          chatId_userId: {
            chatId,
            userId,
          },
        },
        data: {
          isActive: false,
          leftAt: new Date(),
        },
      });

      systemMessageContent = userId === user.id 
        ? `${user.name} left the chat`
        : `${user.name} removed ${targetParticipant.user.name} from the chat`;
      resultMessage = userId === user.id 
        ? 'Left chat successfully'
        : 'Participant removed successfully';
      break;

    case 'mute':
      // This would require additional schema fields for muting functionality
      // For now, just return success
      resultMessage = 'Participant muted (feature not yet implemented)';
      systemMessageContent = `${targetParticipant.user.name} was muted`;
      break;

    case 'unmute':
      // This would require additional schema fields for muting functionality
      // For now, just return success
      resultMessage = 'Participant unmuted (feature not yet implemented)';
      systemMessageContent = `${targetParticipant.user.name} was unmuted`;
      break;

    default:
      throw new BadRequestError('Invalid action');
  }

  // Add system message if content is provided
  if (systemMessageContent) {
    await prisma.$transaction(async (tx) => {
      await tx.message.create({
        data: {
          content: systemMessageContent,
          type: MessageType.SYSTEM_MESSAGE,
          chatId,
          senderId: user.id,
        },
      });

      await tx.chat.update({
        where: { id: chatId },
        data: { lastMessageAt: new Date() },
      });
    });
  }

  // Check if chat should be deactivated after removal
  if (action === 'remove') {
    const remainingParticipants = await prisma.chatParticipant.count({
      where: {
        chatId,
        isActive: true,
      },
    });

    if (remainingParticipants === 0) {
      await prisma.chat.update({
        where: { id: chatId },
        data: { isActive: false },
      });
    }
  }

  return {
    success: true,
    data: {
      message: resultMessage,
      action,
      targetUser: targetParticipant.user,
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

export const PATCH = apiHandler({
  requireAuth: true,
  middlewares: [authMiddleware],
  handler: handlePATCH,
});