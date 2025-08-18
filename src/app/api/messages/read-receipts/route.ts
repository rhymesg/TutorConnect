import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/jwt';
import { APIError } from '@/lib/errors';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    const userId = payload.userId as string;

    const body = await request.json();
    const { chatId, messageId, markAsRead = true } = body;

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

    if (messageId) {
      // Mark specific message as read
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          chatId,
        },
      });

      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      // Update participant's last read timestamp
      await prisma.chatParticipant.update({
        where: {
          chatId_userId: {
            chatId,
            userId,
          },
        },
        data: {
          lastReadAt: markAsRead ? message.sentAt : null,
        },
      });
    } else {
      // Mark all messages in chat as read
      const latestMessage = await prisma.message.findFirst({
        where: { chatId },
        orderBy: { sentAt: 'desc' },
        select: { sentAt: true },
      });

      if (latestMessage) {
        await prisma.chatParticipant.update({
          where: {
            chatId_userId: {
              chatId,
              userId,
            },
          },
          data: {
            lastReadAt: markAsRead ? latestMessage.sentAt : null,
            unreadCount: markAsRead ? 0 : undefined,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating read receipt:', error);
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
    const messageId = url.searchParams.get('messageId');

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

    if (messageId) {
      // Get read status for specific message
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          chatId,
        },
        select: {
          id: true,
          sentAt: true,
          senderId: true,
        },
      });

      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      // Get read status for all participants
      const participants = await prisma.chatParticipant.findMany({
        where: {
          chatId,
          isActive: true,
          userId: { not: message.senderId }, // Exclude sender
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

      const readStatus = participants.map(participant => ({
        userId: participant.userId,
        userName: participant.user.name,
        userImage: participant.user.profileImage,
        hasRead: participant.lastReadAt && participant.lastReadAt >= message.sentAt,
        readAt: participant.lastReadAt,
      }));

      return NextResponse.json({
        messageId,
        readStatus,
        totalParticipants: participants.length,
        readCount: readStatus.filter(status => status.hasRead).length,
      });
    } else {
      // Get unread count and last read info for the chat
      const [participantInfo, totalMessages, unreadMessages] = await Promise.all([
        prisma.chatParticipant.findFirst({
          where: {
            chatId,
            userId,
          },
          select: {
            lastReadAt: true,
            unreadCount: true,
          },
        }),
        prisma.message.count({
          where: { chatId },
        }),
        prisma.message.count({
          where: {
            chatId,
            senderId: { not: userId },
            sentAt: {
              gt: participant.lastReadAt || new Date(0),
            },
          },
        }),
      ]);

      return NextResponse.json({
        chatId,
        lastReadAt: participantInfo?.lastReadAt,
        unreadCount: unreadMessages,
        storedUnreadCount: participantInfo?.unreadCount || 0,
        totalMessages,
      });
    }
  } catch (error) {
    console.error('Error fetching read receipts:', error);
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}