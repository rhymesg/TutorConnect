import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/jwt';
import { APIError } from '@/lib/errors';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    const userId = payload.userId as string;

    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const chatId = url.searchParams.get('chatId');
    const type = url.searchParams.get('type');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const senderId = url.searchParams.get('senderId');

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // Build base where condition - user must be participant in chats
    const baseWhere = {
      chat: {
        participants: {
          some: {
            userId,
            isActive: true,
          },
        },
      },
    };

    // Build search conditions
    const where: any = {
      ...baseWhere,
      content: {
        contains: query.trim(),
        mode: 'insensitive',
      },
    };

    // Apply additional filters
    if (chatId) {
      where.chatId = chatId;
    }

    if (type) {
      where.type = type;
    }

    if (senderId) {
      where.senderId = senderId;
    }

    if (dateFrom || dateTo) {
      where.sentAt = {};
      if (dateFrom) {
        where.sentAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.sentAt.lte = new Date(dateTo);
      }
    }

    const skip = (page - 1) * limit;

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
          chat: {
            select: {
              id: true,
              relatedPostId: true,
              relatedPost: {
                select: {
                  id: true,
                  title: true,
                  subject: true,
                },
              },
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
        },
        orderBy: {
          sentAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.message.count({ where }),
    ]);

    // Group results by chat for better organization
    const messagesByChat = messages.reduce((acc, message) => {
      const chatId = message.chatId;
      if (!acc[chatId]) {
        acc[chatId] = {
          chatId,
          chatTitle: message.chat.relatedPost?.title || 'Direct Message',
          messages: [],
        };
      }
      acc[chatId].messages.push(message);
      return acc;
    }, {} as Record<string, any>);

    const response = {
      data: {
        messages,
        groupedByChat: Object.values(messagesByChat),
        searchQuery: query,
        filters: {
          chatId,
          type,
          senderId,
          dateFrom,
          dateTo,
        },
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error searching messages:', error);
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}