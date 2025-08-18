import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

// Chat search schema
const chatSearchSchema = z.object({
  query: z.string().min(1).max(100).optional(),
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val)) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(Math.max(1, parseInt(val)), 50) : 20),
  sortBy: z.enum(['relevance', 'lastMessage', 'created', 'unread']).optional().default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  filters: z.object({
    status: z.enum(['active', 'inactive', 'archived', 'all']).optional(),
    hasUnread: z.boolean().optional(),
    subject: z.string().optional(),
    participantCount: z.enum(['direct', 'group', 'all']).optional().default('all'),
    postType: z.enum(['TEACHER', 'STUDENT', 'all']).optional().default('all'),
    dateRange: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    }).optional(),
    hasAppointments: z.boolean().optional(),
  }).optional().default({}),
});

type ChatSearchInput = z.infer<typeof chatSearchSchema>;

/**
 * GET /api/chat/search - Advanced chat search and filtering
 */
async function handleGET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);

  // Parse and validate search parameters
  const searchInput = chatSearchSchema.parse({
    query: searchParams.get('query'),
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    sortBy: searchParams.get('sortBy'),
    sortOrder: searchParams.get('sortOrder'),
    filters: {
      status: searchParams.get('status') as any,
      hasUnread: searchParams.get('hasUnread') === 'true',
      subject: searchParams.get('subject'),
      participantCount: searchParams.get('participantCount') as any,
      postType: searchParams.get('postType') as any,
      dateRange: {
        start: searchParams.get('dateStart'),
        end: searchParams.get('dateEnd'),
      },
      hasAppointments: searchParams.get('hasAppointments') === 'true',
    },
  });

  const { query, page, limit, sortBy, sortOrder, filters } = searchInput;
  const skip = (page - 1) * limit;

  // Build where clause
  const whereClause = await buildSearchWhereClause(user.id, query, filters);

  // Build order by clause
  const orderByClause = buildOrderByClause(sortBy, sortOrder);

  // Execute search query
  const [chats, totalCount] = await Promise.all([
    prisma.chat.findMany({
      where: whereClause,
      include: {
        participants: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
                isActive: true,
                lastActive: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        messages: {
          take: 1,
          orderBy: { sentAt: 'desc' },
          include: {
            sender: {
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
            title: true,
            type: true,
            subject: true,
            isActive: true,
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
        appointments: filters.hasAppointments ? {
          where: {
            status: { not: 'CANCELLED' },
          },
          take: 1,
          orderBy: { dateTime: 'desc' },
        } : false,
        _count: {
          select: {
            messages: true,
            participants: { where: { isActive: true } },
            appointments: filters.hasAppointments ? {
              where: { status: { not: 'CANCELLED' } }
            } : false,
          },
        },
      },
      orderBy: orderByClause,
      skip,
      take: limit,
    }),
    prisma.chat.count({ where: whereClause }),
  ]);

  // Enhance results with additional metadata
  const enhancedChats = await Promise.all(
    chats.map(async (chat) => {
      const userParticipant = chat.participants.find(p => p.userId === user.id);
      const unreadCount = userParticipant ? await prisma.message.count({
        where: {
          chatId: chat.id,
          sentAt: {
            gt: userParticipant.lastReadAt || userParticipant.joinedAt,
          },
          senderId: {
            not: user.id,
          },
        },
      }) : 0;

      // Calculate relevance score if searching by query
      let relevanceScore = 0;
      if (query && sortBy === 'relevance') {
        relevanceScore = calculateRelevanceScore(chat, query);
      }

      return {
        ...chat,
        unreadCount,
        lastMessage: chat.messages[0] || null,
        isOwner: chat.participants.some(p => p.userId === user.id),
        otherParticipants: chat.participants.filter(p => p.userId !== user.id),
        chatType: chat.participants.length > 2 ? 'group' : 'direct',
        relevanceScore,
        metadata: {
          hasRecentActivity: chat.lastMessageAt && 
            (Date.now() - chat.lastMessageAt.getTime()) < 24 * 60 * 60 * 1000,
          averageResponseTime: await calculateAverageResponseTime(chat.id, user.id),
          isPostOwnerChat: chat.relatedPost?.user.id === user.id,
        },
      };
    })
  );

  // Sort by relevance if that was requested
  if (sortBy === 'relevance' && query) {
    enhancedChats.sort((a, b) => 
      sortOrder === 'desc' ? 
        b.relevanceScore - a.relevanceScore : 
        a.relevanceScore - b.relevanceScore
    );
  }

  const totalPages = Math.ceil(totalCount / limit);

  // Generate search suggestions based on query
  const suggestions = query ? await generateSearchSuggestions(user.id, query) : [];

  return {
    success: true,
    data: {
      chats: enhancedChats,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      searchInfo: {
        query: query || null,
        filters: filters,
        sortBy,
        sortOrder,
        resultsFound: totalCount,
        suggestions,
      },
      aggregations: await generateSearchAggregations(whereClause, user.id),
    },
  };
}

/**
 * Build complex where clause for search
 */
async function buildSearchWhereClause(
  userId: string, 
  query: string | undefined, 
  filters: ChatSearchInput['filters']
) {
  const baseWhere: any = {
    participants: {
      some: {
        userId,
        isActive: true,
      },
    },
  };

  // Apply status filter
  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'active') {
      baseWhere.isActive = true;
    } else if (filters.status === 'inactive') {
      baseWhere.isActive = false;
    } else if (filters.status === 'archived') {
      // In a real implementation, you'd check user-specific archive status
      baseWhere.participants.some.isActive = false;
    }
  }

  // Apply text search
  if (query) {
    baseWhere.OR = [
      {
        messages: {
          some: {
            content: {
              contains: query,
              mode: 'insensitive',
            },
          },
        },
      },
      {
        relatedPost: {
          title: {
            contains: query,
            mode: 'insensitive',
          },
        },
      },
      {
        participants: {
          some: {
            user: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
        },
      },
    ];
  }

  // Apply subject filter
  if (filters.subject) {
    baseWhere.relatedPost = {
      subject: filters.subject,
    };
  }

  // Apply post type filter
  if (filters.postType && filters.postType !== 'all') {
    baseWhere.relatedPost = {
      ...baseWhere.relatedPost,
      type: filters.postType,
    };
  }

  // Apply date range filter
  if (filters.dateRange?.start || filters.dateRange?.end) {
    baseWhere.createdAt = {};
    if (filters.dateRange.start) {
      baseWhere.createdAt.gte = new Date(filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      baseWhere.createdAt.lte = new Date(filters.dateRange.end);
    }
  }

  // Apply appointments filter
  if (filters.hasAppointments !== undefined) {
    if (filters.hasAppointments) {
      baseWhere.appointments = {
        some: {
          status: { not: 'CANCELLED' },
        },
      };
    } else {
      baseWhere.appointments = {
        none: {},
      };
    }
  }

  return baseWhere;
}

/**
 * Build order by clause for search results
 */
function buildOrderByClause(sortBy: string, sortOrder: 'asc' | 'desc') {
  switch (sortBy) {
    case 'lastMessage':
      return { lastMessageAt: sortOrder };
    case 'created':
      return { createdAt: sortOrder };
    case 'unread':
      // This would require a more complex query in production
      return { lastMessageAt: sortOrder };
    case 'relevance':
    default:
      return { lastMessageAt: sortOrder };
  }
}

/**
 * Calculate relevance score for search results
 */
function calculateRelevanceScore(chat: any, query: string): number {
  let score = 0;
  const queryLower = query.toLowerCase();

  // Score based on post title match
  if (chat.relatedPost?.title?.toLowerCase().includes(queryLower)) {
    score += 10;
  }

  // Score based on participant name match
  chat.participants.forEach((participant: any) => {
    if (participant.user.name.toLowerCase().includes(queryLower)) {
      score += 8;
    }
  });

  // Score based on recent message content (simplified)
  if (chat.messages[0]?.content?.toLowerCase().includes(queryLower)) {
    score += 6;
  }

  // Score based on message recency
  if (chat.lastMessageAt) {
    const daysSinceLastMessage = (Date.now() - chat.lastMessageAt.getTime()) / (24 * 60 * 60 * 1000);
    score += Math.max(0, 5 - daysSinceLastMessage); // Decay over time
  }

  return score;
}

/**
 * Calculate average response time for a chat
 */
async function calculateAverageResponseTime(chatId: string, userId: string): Promise<number> {
  // Simplified calculation - in production, you'd want more sophisticated logic
  const recentMessages = await prisma.message.findMany({
    where: {
      chatId,
      sentAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
    select: {
      sentAt: true,
      senderId: true,
    },
    orderBy: { sentAt: 'asc' },
  });

  // Calculate gaps between user's messages and others' messages
  let totalResponseTime = 0;
  let responseCount = 0;

  for (let i = 1; i < recentMessages.length; i++) {
    const currentMsg = recentMessages[i];
    const previousMsg = recentMessages[i - 1];

    // If current message is from user and previous was from someone else
    if (currentMsg.senderId === userId && previousMsg.senderId !== userId) {
      const responseTime = currentMsg.sentAt.getTime() - previousMsg.sentAt.getTime();
      totalResponseTime += responseTime;
      responseCount++;
    }
  }

  return responseCount > 0 ? totalResponseTime / responseCount / (1000 * 60) : 0; // Convert to minutes
}

/**
 * Generate search suggestions
 */
async function generateSearchSuggestions(userId: string, query: string): Promise<string[]> {
  const suggestions: string[] = [];

  // Get common subjects from user's chats
  const subjectResults = await prisma.chat.findMany({
    where: {
      participants: {
        some: { userId, isActive: true },
      },
      relatedPost: {
        subject: {
          not: null,
        },
      },
    },
    select: {
      relatedPost: {
        select: { subject: true },
      },
    },
    distinct: ['relatedPostId'],
  });

  const subjects = subjectResults
    .map(r => r.relatedPost?.subject)
    .filter(Boolean)
    .filter(s => s!.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3);

  suggestions.push(...subjects.map(s => `subject:${s}`));

  // Add common search patterns
  if (query.length >= 2) {
    const commonPatterns = [
      'appointment',
      'homework',
      'test prep',
      'assignment',
      'lesson',
    ].filter(pattern => pattern.includes(query.toLowerCase()));

    suggestions.push(...commonPatterns.slice(0, 2));
  }

  return suggestions.slice(0, 5);
}

/**
 * Generate aggregations for filter options
 */
async function generateSearchAggregations(whereClause: any, userId: string) {
  const [subjectCounts, typeCounts, statusCounts] = await Promise.all([
    // Subject aggregation
    prisma.chat.findMany({
      where: whereClause,
      select: {
        relatedPost: {
          select: { subject: true },
        },
      },
    }).then(results => {
      const counts: Record<string, number> = {};
      results.forEach(r => {
        const subject = r.relatedPost?.subject || 'NONE';
        counts[subject] = (counts[subject] || 0) + 1;
      });
      return counts;
    }),

    // Type aggregation
    prisma.chat.findMany({
      where: whereClause,
      select: {
        relatedPost: {
          select: { type: true },
        },
      },
    }).then(results => {
      const counts: Record<string, number> = {};
      results.forEach(r => {
        const type = r.relatedPost?.type || 'NONE';
        counts[type] = (counts[type] || 0) + 1;
      });
      return counts;
    }),

    // Status aggregation
    prisma.chat.groupBy({
      by: ['isActive'],
      where: {
        participants: {
          some: { userId, isActive: true },
        },
      },
      _count: {
        id: true,
      },
    }).then(results => {
      const counts: Record<string, number> = {};
      results.forEach(r => {
        counts[r.isActive ? 'active' : 'inactive'] = r._count.id;
      });
      return counts;
    }),
  ]);

  return {
    subjects: subjectCounts,
    types: typeCounts,
    statuses: statusCounts,
  };
}

export const GET = apiHandler({
  requireAuth: true,
  middlewares: [authMiddleware],
  handler: handleGET,
});