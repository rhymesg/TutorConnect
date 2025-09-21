import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';
import { APIError } from '@/lib/errors';
import type { CreateMessageData } from '@prisma/client';
import { sendNewChatEmail } from '@/lib/email';


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
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search');
    const type = url.searchParams.get('type');
    const after = url.searchParams.get('after'); // For cursor-based pagination
    const before = url.searchParams.get('before');

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

    // Build query conditions
    const where: any = {
      chatId,
    };

    if (search) {
      where.content = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (type) {
      where.type = type;
    }

    // Cursor-based pagination for real-time updates
    if (after) {
      where.sentAt = {
        gt: new Date(after),
      };
    }

    if (before) {
      where.sentAt = {
        lt: new Date(before),
      };
    }

    const skip = (page - 1) * limit;
    
    // Get messages with sender information
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          appointment: true,
        },
        orderBy: {
          sentAt: 'desc',
        },
        skip: after || before ? 0 : skip, // Skip pagination for cursor-based queries
        take: limit,
      }),
      after || before ? 0 : prisma.message.count({ where }),
    ]);

    // Update last read timestamp for the requesting user
    if (messages.length > 0) {
      await prisma.chatParticipant.update({
        where: {
          chatId_userId: {
            chatId,
            userId,
          },
        },
        data: {
          lastReadAt: new Date(),
          unreadCount: 0,
        },
      });
    }

    const response = {
      data: messages.reverse(), // Reverse to show oldest first
      pagination: after || before ? undefined : {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      cursor: messages.length > 0 ? {
        after: messages[messages.length - 1]?.sentAt?.toISOString(),
        before: messages[0]?.sentAt?.toISOString(),
      } : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching messages:', error);
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    const userId = payload.userId as string;

    const body: CreateMessageData = await request.json();
    const { content, type = 'TEXT', chatId, appointmentId } = body;

    // Validate required fields
    if (!content?.trim() || !chatId) {
      return NextResponse.json({ error: 'Content and chat ID are required' }, { status: 400 });
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

    // Validate appointment ID if provided
    if (appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          chatId,
        },
      });

      if (!appointment) {
        return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        type,
        chatId,
        senderId: userId,
        appointmentId: appointmentId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        appointment: true,
      },
    });
    
    // Update chat's last message timestamp and get related data for notifications
    const chat = await prisma.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: new Date() },
      include: {
        relatedPost: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                emailNewChat: true,
              },
            },
          },
        },
      },
    });

    // Update unread count for other participants
    const otherParticipants = await prisma.chatParticipant.findMany({
      where: {
        chatId,
        userId: { not: userId },
        isActive: true,
      },
    });

    if (otherParticipants.length > 0) {
      await prisma.chatParticipant.updateMany({
        where: {
          id: {
            in: otherParticipants.map(p => p.id),
          },
        },
        data: {
          unreadCount: {
            increment: 1,
          },
        },
      });
    }

    // Update user's last active timestamp
    await prisma.user.update({
      where: { id: userId },
      data: { lastActive: new Date() },
    });

    // Send first-contact notification to post owner if applicable
    let shouldMarkNotificationDone = false;
    try {
      const postOwner = chat.relatedPost?.user;
      if (
        postOwner &&
        postOwner.id !== userId &&
        !chat.newChatNotificationDone
      ) {
        shouldMarkNotificationDone = true;
        const wantsEmail = postOwner.emailNewChat ?? true;

        if (wantsEmail && postOwner.email) {
          const receiverName = postOwner.name || 'TutorConnect-bruker';
          const senderName = message.sender?.name || 'en TutorConnect-bruker';

          await sendNewChatEmail(
            postOwner.email,
            receiverName,
            senderName,
            chat.relatedPost?.title
          );
        }
      }
    } catch (notificationError) {
      console.error('Failed to handle new chat notification email:', notificationError);
    } finally {
      if (shouldMarkNotificationDone) {
        try {
          await prisma.chat.update({
            where: { id: chatId },
            data: { newChatNotificationDone: true },
          });
        } catch (flagError) {
          console.error('Failed to mark new chat notification as done:', flagError);
        }
      }
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
