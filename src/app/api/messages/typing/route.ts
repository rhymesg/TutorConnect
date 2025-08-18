import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/jwt';
import { APIError } from '@/lib/errors';

const prisma = new PrismaClient();

// In-memory store for typing indicators (in production, use Redis)
const typingUsers = new Map<string, Map<string, { timestamp: number; userName: string }>>();

// Clean up old typing indicators (older than 5 seconds)
const cleanupTypingIndicators = () => {
  const now = Date.now();
  const timeout = 5000; // 5 seconds

  for (const [chatId, users] of typingUsers.entries()) {
    for (const [userId, data] of users.entries()) {
      if (now - data.timestamp > timeout) {
        users.delete(userId);
      }
    }
    if (users.size === 0) {
      typingUsers.delete(chatId);
    }
  }
};

// Run cleanup every 10 seconds
setInterval(cleanupTypingIndicators, 10000);

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    const userId = payload.userId as string;

    const body = await request.json();
    const { chatId, isTyping } = body;

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Verify user is participant in the chat
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied to this chat' }, { status: 403 });
    }

    // Update typing indicator
    if (isTyping) {
      if (!typingUsers.has(chatId)) {
        typingUsers.set(chatId, new Map());
      }
      typingUsers.get(chatId)!.set(userId, {
        timestamp: Date.now(),
        userName: participant.user.name,
      });
    } else {
      if (typingUsers.has(chatId)) {
        typingUsers.get(chatId)!.delete(userId);
        if (typingUsers.get(chatId)!.size === 0) {
          typingUsers.delete(chatId);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating typing indicator:', error);
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    const userId = payload.userId as string;

    const url = new URL(request.url);
    const chatId = url.searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Verify user is participant in the chat
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied to this chat' }, { status: 403 });
    }

    // Clean up old indicators first
    cleanupTypingIndicators();

    // Get current typing users (excluding the requesting user)
    const chatTypingUsers = typingUsers.get(chatId);
    const typingUsersList = chatTypingUsers
      ? Array.from(chatTypingUsers.entries())
          .filter(([typingUserId]) => typingUserId !== userId)
          .map(([typingUserId, data]) => ({
            userId: typingUserId,
            userName: data.userName,
            timestamp: data.timestamp,
          }))
      : [];

    return NextResponse.json({
      typingUsers: typingUsersList,
      count: typingUsersList.length,
    });
  } catch (error) {
    console.error('Error fetching typing indicators:', error);
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}