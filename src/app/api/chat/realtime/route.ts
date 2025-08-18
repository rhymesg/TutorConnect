import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { BadRequestError, NotFoundError } from '@/lib/errors';
import { createAdminClient } from '@/lib/supabase';
import { z } from 'zod';

const prisma = new PrismaClient();

// Real-time subscription schema
const subscriptionSchema = z.object({
  action: z.enum(['subscribe', 'unsubscribe', 'presence']),
  chatId: z.string().optional(),
  status: z.enum(['online', 'typing', 'away', 'offline']).optional(),
});

// Typing indicator schema
const typingSchema = z.object({
  chatId: z.string(),
  isTyping: z.boolean(),
});

/**
 * POST /api/chat/realtime - Handle real-time chat operations
 */
async function handlePOST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  const body = await request.json();
  
  const { action, chatId, status } = subscriptionSchema.parse(body);
  const supabase = createAdminClient();

  switch (action) {
    case 'subscribe':
      if (!chatId) {
        throw new BadRequestError('Chat ID required for subscription');
      }

      // Validate user access to chat
      const participant = await prisma.chatParticipant.findUnique({
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
            },
          },
        },
      });

      if (!participant || !participant.isActive || !participant.chat.isActive) {
        throw new NotFoundError('Chat not found or access denied');
      }

      // Generate channel name and auth token for Supabase realtime
      const channelName = `chat:${chatId}`;
      
      // Update user's presence in chat
      await prisma.chatParticipant.update({
        where: {
          chatId_userId: {
            chatId,
            userId: user.id,
          },
        },
        data: {
          lastReadAt: new Date(),
        },
      });

      // Broadcast user joined event
      try {
        await supabase.channel(channelName).send({
          type: 'broadcast',
          event: 'user_joined',
          payload: {
            userId: user.id,
            userName: user.name,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.warn('Failed to broadcast user joined event:', error);
      }

      return {
        success: true,
        data: {
          channelName,
          message: 'Subscribed to chat updates',
          chatId,
        },
      };

    case 'presence':
      if (!chatId || !status) {
        throw new BadRequestError('Chat ID and status required for presence update');
      }

      // Validate user access
      const presenceParticipant = await prisma.chatParticipant.findUnique({
        where: {
          chatId_userId: {
            chatId,
            userId: user.id,
          },
        },
      });

      if (!presenceParticipant || !presenceParticipant.isActive) {
        throw new NotFoundError('Chat access denied');
      }

      // Update user status and broadcast
      const presenceChannel = `chat:${chatId}`;
      
      try {
        await supabase.channel(presenceChannel).send({
          type: 'broadcast',
          event: 'presence_update',
          payload: {
            userId: user.id,
            userName: user.name,
            status,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.warn('Failed to broadcast presence update:', error);
      }

      // Update database if going offline
      if (status === 'offline') {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastActive: new Date() },
        });
      }

      return {
        success: true,
        data: {
          status,
          chatId,
          message: 'Presence updated',
        },
      };

    case 'unsubscribe':
      if (!chatId) {
        throw new BadRequestError('Chat ID required for unsubscription');
      }

      // Broadcast user left event
      const leaveChannel = `chat:${chatId}`;
      
      try {
        await supabase.channel(leaveChannel).send({
          type: 'broadcast',
          event: 'user_left',
          payload: {
            userId: user.id,
            userName: user.name,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.warn('Failed to broadcast user left event:', error);
      }

      return {
        success: true,
        data: {
          message: 'Unsubscribed from chat updates',
          chatId,
        },
      };

    default:
      throw new BadRequestError('Invalid action');
  }
}

/**
 * PUT /api/chat/realtime - Update typing indicator
 */
async function handlePUT(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  const body = await request.json();
  
  const { chatId, isTyping } = typingSchema.parse(body);
  const supabase = createAdminClient();

  // Validate user access to chat
  const participant = await prisma.chatParticipant.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId: user.id,
      },
    },
  });

  if (!participant || !participant.isActive) {
    throw new NotFoundError('Chat access denied');
  }

  // Broadcast typing indicator
  const channelName = `chat:${chatId}`;
  
  try {
    await supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'typing_indicator',
      payload: {
        userId: user.id,
        userName: user.name,
        isTyping,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.warn('Failed to broadcast typing indicator:', error);
  }

  return {
    success: true,
    data: {
      chatId,
      isTyping,
      message: 'Typing indicator updated',
    },
  };
}

/**
 * GET /api/chat/realtime - Get real-time chat status and active users
 */
async function handleGET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    throw new BadRequestError('Chat ID required');
  }

  // Validate user access to chat
  const participant = await prisma.chatParticipant.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId: user.id,
      },
    },
    include: {
      chat: {
        include: {
          participants: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profileImage: true,
                  lastActive: true,
                  isActive: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!participant || !participant.isActive) {
    throw new NotFoundError('Chat access denied');
  }

  // Determine online status for each participant (simplified)
  const participantsWithStatus = participant.chat.participants.map(p => {
    const isOnline = p.user.lastActive 
      ? Date.now() - p.user.lastActive.getTime() < 5 * 60 * 1000 // 5 minutes
      : false;

    return {
      userId: p.user.id,
      name: p.user.name,
      profileImage: p.user.profileImage,
      isOnline,
      lastSeen: p.user.lastActive,
      joinedAt: p.joinedAt,
    };
  });

  // Get recent activity stats
  const recentMessageCount = await prisma.message.count({
    where: {
      chatId,
      sentAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
  });

  return {
    success: true,
    data: {
      chatId,
      isActive: participant.chat.isActive,
      participants: participantsWithStatus,
      onlineCount: participantsWithStatus.filter(p => p.isOnline).length,
      totalParticipants: participantsWithStatus.length,
      recentActivity: {
        last24Hours: recentMessageCount,
      },
      realtime: {
        channelName: `chat:${chatId}`,
        events: [
          'message_sent',
          'message_edited',
          'message_deleted',
          'typing_indicator',
          'presence_update',
          'user_joined',
          'user_left',
          'appointment_created',
          'appointment_updated',
        ],
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

export const PUT = apiHandler({
  requireAuth: true,
  middlewares: [authMiddleware],
  handler: handlePUT,
});