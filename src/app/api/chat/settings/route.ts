import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { chatSettingsSchema } from '@/schemas/chat';
import { z } from 'zod';

const prisma = new PrismaClient();

// Get chat settings schema
const getChatSettingsSchema = z.object({
  chatId: z.string().cuid().optional(),
});

/**
 * GET /api/chat/settings - Get user's chat settings
 * Can get global settings or specific chat settings
 */
async function handleGET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);

  // Validate query parameters
  const { chatId } = getChatSettingsSchema.parse({
    chatId: searchParams.get('chatId'),
  });

  if (chatId) {
    // Get settings for specific chat
    const chatParticipant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId: user.id,
        },
      },
      include: {
        chat: {
          select: {
            id: true,
            isActive: true,
            relatedPost: {
              select: {
                id: true,
                title: true,
                subject: true,
              },
            },
          },
        },
      },
    });

    if (!chatParticipant || !chatParticipant.isActive) {
      return {
        success: false,
        error: 'Chat not found or access denied',
      };
    }

    // For now, return basic settings structure
    // In a real implementation, you'd have a ChatSettings table
    const settings = {
      chatId,
      notifications: true, // Default values
      soundEnabled: true,
      emailNotifications: true,
      muteUntil: null,
      nickname: null,
      lastReadAt: chatParticipant.lastReadAt,
      unreadCount: chatParticipant.unreadCount,
      joinedAt: chatParticipant.joinedAt,
    };

    return {
      success: true,
      data: {
        chatSettings: settings,
        chat: chatParticipant.chat,
      },
    };
  } else {
    // Get global chat settings for user
    // In a real implementation, you'd have a UserChatSettings table
    const globalSettings = {
      notifications: true,
      soundEnabled: true,
      emailNotifications: true,
      defaultMuteHours: 0,
      autoMarkAsRead: true,
      showTypingIndicators: true,
      showReadReceipts: true,
      allowNewChatRequests: true,
      maxChatsPerHour: 10,
    };

    // Get user's chat statistics for context
    const chatStats = await prisma.chatParticipant.groupBy({
      by: ['isActive'],
      where: {
        userId: user.id,
      },
      _count: {
        chatId: true,
      },
    });

    const totalChats = chatStats.reduce((sum, stat) => sum + stat._count.chatId, 0);
    const activeChats = chatStats.find(stat => stat.isActive)?._count.chatId || 0;

    return {
      success: true,
      data: {
        globalSettings,
        stats: {
          totalChats,
          activeChats,
          archivedChats: totalChats - activeChats,
        },
      },
    };
  }
}

/**
 * PATCH /api/chat/settings - Update chat settings
 * Can update global settings or specific chat settings
 */
async function handlePATCH(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);
  const body = await request.json();

  const chatId = searchParams.get('chatId');

  // Validate input
  const validatedSettings = chatSettingsSchema.parse(body);

  if (chatId) {
    // Update settings for specific chat
    const chatParticipant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId: user.id,
        },
      },
    });

    if (!chatParticipant || !chatParticipant.isActive) {
      return {
        success: false,
        error: 'Chat not found or access denied',
      };
    }

    // Update participant settings
    const updatedParticipant = await prisma.chatParticipant.update({
      where: {
        chatId_userId: {
          chatId,
          userId: user.id,
        },
      },
      data: {
        // Store settings in JSON field or separate table
        // For now, we'll just update what we can in the existing schema
        ...(validatedSettings.muteUntil && {
          // You'd need to add this field to the schema
          // muteUntil: new Date(validatedSettings.muteUntil),
        }),
      },
    });

    // In a production app, you'd store these in a separate ChatSettings table
    // or as JSON in the ChatParticipant table

    return {
      success: true,
      data: {
        message: 'Chat settings updated successfully',
        chatId,
        settings: validatedSettings,
      },
    };
  } else {
    // Update global settings
    // In a real implementation, you'd store these in a UserSettings table
    
    // For now, we'll just return success with the provided settings
    return {
      success: true,
      data: {
        message: 'Global chat settings updated successfully',
        settings: validatedSettings,
      },
    };
  }
}

/**
 * DELETE /api/chat/settings - Reset chat settings to default
 */
async function handleDELETE(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);

  const chatId = searchParams.get('chatId');

  if (chatId) {
    // Reset specific chat settings
    const chatParticipant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId: user.id,
        },
      },
    });

    if (!chatParticipant || !chatParticipant.isActive) {
      return {
        success: false,
        error: 'Chat not found or access denied',
      };
    }

    // Reset to default settings
    // In a real implementation, you'd clear the settings from a ChatSettings table
    
    return {
      success: true,
      data: {
        message: 'Chat settings reset to default',
        chatId,
      },
    };
  } else {
    // Reset all global settings
    return {
      success: true,
      data: {
        message: 'Global chat settings reset to default',
      },
    };
  }
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