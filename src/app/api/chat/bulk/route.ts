import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { BadRequestError, NotFoundError, ForbiddenError } from '@/lib/errors';
import { bulkChatOperationsSchema } from '@/schemas/chat';
import { MessageType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/chat/bulk - Perform bulk operations on multiple chats
 * Supports: archive, unarchive, delete, markAsRead, markAsUnread operations
 */
async function handlePOST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  const body = await request.json();

  // Validate input
  const { chatIds, operation } = bulkChatOperationsSchema.parse(body);

  // Verify user has access to all specified chats
  const userChats = await prisma.chat.findMany({
    where: {
      id: { in: chatIds },
      participants: {
        some: {
          userId: user.id,
          isActive: true,
        },
      },
    },
    include: {
      participants: {
        where: { userId: user.id },
      },
      _count: {
        select: {
          participants: { where: { isActive: true } },
          messages: true,
        },
      },
    },
  });

  if (userChats.length !== chatIds.length) {
    throw new ForbiddenError('You do not have access to one or more specified chats');
  }

  const results: Array<{
    chatId: string;
    success: boolean;
    error?: string;
  }> = [];

  // Process each operation
  try {
    switch (operation) {
      case 'archive':
        await bulkArchiveChats(chatIds, user.id, results);
        break;
      
      case 'unarchive':
        await bulkUnarchiveChats(chatIds, user.id, results);
        break;
      
      case 'delete':
        await bulkDeleteChats(chatIds, user.id, results, userChats);
        break;
      
      case 'markAsRead':
        await bulkMarkAsRead(chatIds, user.id, results);
        break;
      
      case 'markAsUnread':
        await bulkMarkAsUnread(chatIds, user.id, results);
        break;
      
      default:
        throw new BadRequestError('Invalid bulk operation');
    }
  } catch (error) {
    // Mark all as failed if transaction fails
    chatIds.forEach(chatId => {
      results.push({
        chatId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  return {
    success: true,
    data: {
      operation,
      processed: chatIds.length,
      successful: successCount,
      failed: failureCount,
      results,
      message: `Bulk ${operation} operation completed: ${successCount} successful, ${failureCount} failed`,
    },
  };
}

/**
 * Bulk archive chats (user-specific)
 */
async function bulkArchiveChats(
  chatIds: string[],
  userId: string,
  results: Array<{ chatId: string; success: boolean; error?: string }>
) {
  for (const chatId of chatIds) {
    try {
      await prisma.$transaction(async (tx) => {
        // Update user's participant record to mark as archived
        await tx.chatParticipant.updateMany({
          where: {
            chatId,
            userId,
            isActive: true,
          },
          data: {
            // Use a custom field for user-specific archiving
            // For now, we'll use isActive: false to represent archived
            isActive: false,
            leftAt: new Date(),
          },
        });

        // Add system message
        await tx.message.create({
          data: {
            content: 'Chat archived',
            
            chatId,
            senderId: userId,
          },
        });
      });

      results.push({ chatId, success: true });
    } catch (error) {
      results.push({
        chatId,
        success: false,
        error: error instanceof Error ? error.message : 'Archive failed',
      });
    }
  }
}

/**
 * Bulk unarchive chats
 */
async function bulkUnarchiveChats(
  chatIds: string[],
  userId: string,
  results: Array<{ chatId: string; success: boolean; error?: string }>
) {
  for (const chatId of chatIds) {
    try {
      await prisma.$transaction(async (tx) => {
        // Reactivate user's participation
        await tx.chatParticipant.updateMany({
          where: {
            chatId,
            userId,
          },
          data: {
            isActive: true,
            leftAt: null,
            joinedAt: new Date(), // Reset join time
          },
        });

        // Add system message
        await tx.message.create({
          data: {
            content: 'Chat unarchived',
            
            chatId,
            senderId: userId,
          },
        });
      });

      results.push({ chatId, success: true });
    } catch (error) {
      results.push({
        chatId,
        success: false,
        error: error instanceof Error ? error.message : 'Unarchive failed',
      });
    }
  }
}

/**
 * Bulk delete chats (only if user is sole participant or has permission)
 */
async function bulkDeleteChats(
  chatIds: string[],
  userId: string,
  results: Array<{ chatId: string; success: boolean; error?: string }>,
  userChats: any[]
) {
  for (const chatId of chatIds) {
    try {
      const chat = userChats.find(c => c.id === chatId);
      if (!chat) {
        results.push({
          chatId,
          success: false,
          error: 'Chat not found',
        });
        continue;
      }

      await prisma.$transaction(async (tx) => {
        // If user is the last active participant, deactivate the entire chat
        if (chat._count.participants <= 1) {
          await tx.chat.update({
            where: { id: chatId },
            data: { isActive: false },
          });
        }

        // Remove user's participation
        await tx.chatParticipant.updateMany({
          where: {
            chatId,
            userId,
          },
          data: {
            isActive: false,
            leftAt: new Date(),
          },
        });

        // Add system message
        await tx.message.create({
          data: {
            content: 'User left the chat',
            
            chatId,
            senderId: userId,
          },
        });
      });

      results.push({ chatId, success: true });
    } catch (error) {
      results.push({
        chatId,
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      });
    }
  }
}

/**
 * Bulk mark chats as read
 */
async function bulkMarkAsRead(
  chatIds: string[],
  userId: string,
  results: Array<{ chatId: string; success: boolean; error?: string }>
) {
  for (const chatId of chatIds) {
    try {
      await prisma.chatParticipant.updateMany({
        where: {
          chatId,
          userId,
          isActive: true,
        },
        data: {
          lastReadAt: new Date(),
          unreadCount: 0,
        },
      });

      results.push({ chatId, success: true });
    } catch (error) {
      results.push({
        chatId,
        success: false,
        error: error instanceof Error ? error.message : 'Mark as read failed',
      });
    }
  }
}

/**
 * Bulk mark chats as unread
 */
async function bulkMarkAsUnread(
  chatIds: string[],
  userId: string,
  results: Array<{ chatId: string; success: boolean; error?: string }>
) {
  for (const chatId of chatIds) {
    try {
      // Get latest message to calculate unread count
      const latestMessage = await prisma.message.findFirst({
        where: {
          chatId,
          senderId: { not: userId }, // Only count messages from others
        },
        orderBy: { sentAt: 'desc' },
      });

      if (latestMessage) {
        // Count messages since last read (or beginning if never read)
        const unreadCount = await prisma.message.count({
          where: {
            chatId,
            senderId: { not: userId },
            sentAt: {
              gt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours as fallback
            },
          },
        });

        await prisma.chatParticipant.updateMany({
          where: {
            chatId,
            userId,
            isActive: true,
          },
          data: {
            lastReadAt: null, // Clear last read time
            unreadCount: Math.max(unreadCount, 1), // At least 1 unread
          },
        });
      }

      results.push({ chatId, success: true });
    } catch (error) {
      results.push({
        chatId,
        success: false,
        error: error instanceof Error ? error.message : 'Mark as unread failed',
      });
    }
  }
}

export const POST = apiHandler({
  requireAuth: true,
  middlewares: [authMiddleware],
  handler: handlePOST,
});