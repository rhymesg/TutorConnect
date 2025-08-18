import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/chat/realtime/websocket - Initialize WebSocket connection for real-time chat
 * This endpoint helps establish real-time subscriptions for chat updates
 */
async function handlePOST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  const body = await request.json();
  const { chatIds, subscriptionTypes } = body;

  // Validate that user has access to requested chats
  const accessibleChats = await prisma.chat.findMany({
    where: {
      id: { in: chatIds },
      participants: {
        some: {
          userId: user.id,
          isActive: true,
        },
      },
    },
    select: { id: true },
  });

  const validChatIds = accessibleChats.map(chat => chat.id);

  // Create subscription configuration
  const subscriptionConfig = {
    userId: user.id,
    chatIds: validChatIds,
    types: subscriptionTypes || ['message', 'typing', 'participant_status'],
    timestamp: new Date().toISOString(),
  };

  // In a real implementation, you'd establish WebSocket connections here
  // For now, return configuration for client-side Supabase real-time setup

  return {
    success: true,
    data: {
      subscriptionConfig,
      channels: validChatIds.map(chatId => ({
        channel: `chat:${chatId}`,
        events: ['INSERT', 'UPDATE', 'DELETE'],
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      })),
      userChannel: {
        channel: `user:${user.id}`,
        events: ['UPDATE'],
        schema: 'public', 
        table: 'chat_participants',
        filter: `user_id=eq.${user.id}`,
      },
      instructions: {
        setup: 'Use Supabase client to subscribe to the provided channels',
        events: {
          'new_message': 'Triggered when a new message is added to subscribed chats',
          'message_updated': 'Triggered when a message is edited',
          'typing_start': 'Triggered when someone starts typing',
          'typing_stop': 'Triggered when someone stops typing', 
          'participant_joined': 'Triggered when someone joins a chat',
          'participant_left': 'Triggered when someone leaves a chat',
          'chat_updated': 'Triggered when chat metadata changes',
        },
      },
    },
  };
}

/**
 * GET /api/chat/realtime/websocket - Get current real-time subscription status
 */
async function handleGET(request: NextRequest) {
  const user = getAuthenticatedUser(request);

  // Get user's active chats for subscription status
  const activeChats = await prisma.chat.findMany({
    where: {
      participants: {
        some: {
          userId: user.id,
          isActive: true,
        },
      },
      isActive: true,
    },
    select: {
      id: true,
      lastMessageAt: true,
      _count: {
        select: {
          participants: { where: { isActive: true } },
        },
      },
    },
  });

  return {
    success: true,
    data: {
      userId: user.id,
      availableChats: activeChats.map(chat => ({
        id: chat.id,
        lastActivity: chat.lastMessageAt,
        participantCount: chat._count.participants,
        subscriptionChannel: `chat:${chat.id}`,
      })),
      globalUserChannel: `user:${user.id}`,
      recommendedSubscriptions: [
        'new_message',
        'typing_indicators', 
        'participant_status',
      ],
      limits: {
        maxConcurrentSubscriptions: 50,
        messageRateLimit: '100/minute',
        typingRateLimit: '10/second',
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