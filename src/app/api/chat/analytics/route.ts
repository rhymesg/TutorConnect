import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

// Analytics query schema
const analyticsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).optional().default('month'),
  chatId: z.string().optional(),
  includeInactive: z.boolean().optional().default(false),
});

/**
 * GET /api/chat/analytics - Get chat analytics and statistics
 */
async function handleGET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);

  // Validate query parameters
  const { period, chatId, includeInactive } = analyticsQuerySchema.parse({
    period: searchParams.get('period'),
    chatId: searchParams.get('chatId'),
    includeInactive: searchParams.get('includeInactive'),
  });

  // Calculate date range based on period
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Base filter for user's chats
  const chatFilter: any = {
    participants: {
      some: {
        userId: user.id,
        isActive: true,
      },
    },
  };

  if (!includeInactive) {
    chatFilter.isActive = true;
  }

  if (chatId) {
    chatFilter.id = chatId;
  }

  // Get comprehensive chat statistics
  const [
    totalChats,
    activeChats,
    totalMessages,
    recentMessages,
    chatsBySubject,
    messagesByDay,
    averageResponseTime,
    participantStats
  ] = await Promise.all([
    // Total chats
    prisma.chat.count({
      where: chatFilter,
    }),

    // Active chats (with recent activity)
    prisma.chat.count({
      where: {
        ...chatFilter,
        lastMessageAt: {
          gte: startDate,
        },
      },
    }),

    // Total messages in user's chats
    prisma.message.count({
      where: {
        chat: chatFilter,
      },
    }),

    // Recent messages
    prisma.message.count({
      where: {
        chat: chatFilter,
        sentAt: {
          gte: startDate,
        },
      },
    }),

    // Chats by subject (from related posts)
    prisma.chat.groupBy({
      by: ['relatedPostId'],
      where: chatFilter,
      _count: {
        id: true,
      },
    }).then(async (results) => {
      // Get subject information for each post
      const postIds = results.map(r => r.relatedPostId).filter(Boolean) as string[];
      const posts = await prisma.post.findMany({
        where: { id: { in: postIds } },
        select: { id: true, subject: true },
      });

      const subjectCounts: Record<string, number> = {};
      results.forEach(result => {
        if (result.relatedPostId) {
          const post = posts.find(p => p.id === result.relatedPostId);
          const subject = post?.subject || 'UNKNOWN';
          subjectCounts[subject] = (subjectCounts[subject] || 0) + result._count.id;
        } else {
          subjectCounts['NO_SUBJECT'] = (subjectCounts['NO_SUBJECT'] || 0) + result._count.id;
        }
      });

      return subjectCounts;
    }),

    // Messages by day for the period
    prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT 
        DATE(sent_at) as date,
        COUNT(*) as count
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE cp.user_id = ${user.id}
        AND cp.is_active = true
        AND m.sent_at >= ${startDate}
        AND m.sent_at <= ${now}
      GROUP BY DATE(sent_at)
      ORDER BY date DESC
    `.then(results => 
      results.map(r => ({
        date: r.date.toISOString().split('T')[0],
        count: Number(r.count),
      }))
    ),

    // Average response time calculation
    calculateAverageResponseTime(user.id, startDate),

    // Participant statistics
    prisma.chatParticipant.groupBy({
      by: ['chatId'],
      where: {
        userId: user.id,
        isActive: true,
        chat: chatFilter,
      },
    }).then(async (userChats) => {
      const chatIds = userChats.map(uc => uc.chatId);
      
      const [totalParticipants, averageParticipants] = await Promise.all([
        prisma.chatParticipant.count({
          where: {
            chatId: { in: chatIds },
            isActive: true,
          },
        }),
        
        prisma.chat.findMany({
          where: { id: { in: chatIds } },
          include: {
            _count: {
              select: {
                participants: {
                  where: { isActive: true },
                },
              },
            },
          },
        }).then(chats => {
          const totalCount = chats.reduce((sum, chat) => sum + chat._count.participants, 0);
          return chats.length > 0 ? totalCount / chats.length : 0;
        }),
      ]);

      return { totalParticipants, averageParticipants };
    }),
  ]);

  // Get top chat partners
  const topChatPartners = await getTopChatPartners(user.id, startDate);

  // Get message type distribution
  const messageTypeStats = await prisma.message.groupBy({
    by: ['type'],
    where: {
      chat: chatFilter,
      sentAt: {
        gte: startDate,
      },
    },
    _count: {
      type: true,
    },
  });

  // Calculate engagement metrics
  const engagementMetrics = {
    averageMessagesPerChat: totalMessages > 0 ? totalMessages / totalChats : 0,
    recentActivityRate: totalChats > 0 ? (activeChats / totalChats) * 100 : 0,
    dailyAverageMessages: recentMessages / Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))),
  };

  // Response time categories
  const responseTimeCategories = {
    immediate: 0,    // < 5 minutes
    quick: 0,        // 5-30 minutes  
    moderate: 0,     // 30 minutes - 2 hours
    slow: 0,         // 2-24 hours
    delayed: 0,      // > 24 hours
  };

  // This would require more complex query to calculate response times
  // For now, provide placeholder data

  return {
    success: true,
    data: {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      overview: {
        totalChats,
        activeChats,
        totalMessages,
        recentMessages,
        chatActivityRate: totalChats > 0 ? (activeChats / totalChats) * 100 : 0,
      },
      engagement: engagementMetrics,
      distribution: {
        chatsBySubject,
        messageTypes: messageTypeStats.reduce((acc, stat) => {
          acc[stat.type] = stat._count.type;
          return acc;
        }, {} as Record<string, number>),
      },
      timeline: {
        messagesByDay,
        averageResponseTime: {
          minutes: averageResponseTime,
          category: getResponseTimeCategory(averageResponseTime),
        },
        responseTimeDistribution: responseTimeCategories,
      },
      social: {
        topChatPartners,
        participantStats,
      },
      insights: generateInsights({
        totalChats,
        activeChats,
        recentMessages,
        averageResponseTime,
        engagementMetrics,
      }),
    },
  };
}

/**
 * Helper function to calculate average response time
 */
async function calculateAverageResponseTime(userId: string, since: Date): Promise<number> {
  // This is a simplified calculation
  // In a real implementation, you'd want to calculate the time between
  // when someone sends a message and when the user responds
  
  const userMessages = await prisma.message.findMany({
    where: {
      senderId: userId,
      sentAt: { gte: since },
    },
    select: {
      sentAt: true,
      chatId: true,
    },
    orderBy: { sentAt: 'asc' },
  });

  if (userMessages.length === 0) return 0;

  // Simplified: return average time between user's own messages
  let totalGaps = 0;
  let gapCount = 0;

  for (let i = 1; i < userMessages.length; i++) {
    const currentMessage = userMessages[i];
    const previousMessage = userMessages[i - 1];
    
    if (currentMessage.chatId === previousMessage.chatId) {
      const gap = currentMessage.sentAt.getTime() - previousMessage.sentAt.getTime();
      totalGaps += gap;
      gapCount++;
    }
  }

  return gapCount > 0 ? totalGaps / gapCount / (1000 * 60) : 0; // Convert to minutes
}

/**
 * Helper function to get top chat partners
 */
async function getTopChatPartners(userId: string, since: Date) {
  const chatParticipants = await prisma.$queryRaw<Array<{
    userId: string;
    name: string;
    profileImage: string | null;
    messageCount: bigint;
    chatCount: bigint;
  }>>`
    SELECT 
      u.id as "userId",
      u.name,
      u.profile_image as "profileImage",
      COUNT(DISTINCT m.id) as "messageCount",
      COUNT(DISTINCT c.id) as "chatCount"
    FROM users u
    JOIN chat_participants cp ON u.id = cp.user_id
    JOIN chats c ON cp.chat_id = c.id
    JOIN chat_participants user_cp ON c.id = user_cp.chat_id
    LEFT JOIN messages m ON c.id = m.chat_id AND m.sent_at >= ${since}
    WHERE user_cp.user_id = ${userId}
      AND u.id != ${userId}
      AND cp.is_active = true
      AND user_cp.is_active = true
    GROUP BY u.id, u.name, u.profile_image
    ORDER BY "messageCount" DESC, "chatCount" DESC
    LIMIT 10
  `;

  return chatParticipants.map(partner => ({
    ...partner,
    messageCount: Number(partner.messageCount),
    chatCount: Number(partner.chatCount),
  }));
}

/**
 * Helper function to categorize response time
 */
function getResponseTimeCategory(minutes: number): string {
  if (minutes < 5) return 'immediate';
  if (minutes < 30) return 'quick';
  if (minutes < 120) return 'moderate';
  if (minutes < 1440) return 'slow'; // 24 hours
  return 'delayed';
}

/**
 * Helper function to generate insights
 */
function generateInsights(stats: any): string[] {
  const insights: string[] = [];
  
  if (stats.activeChats === 0) {
    insights.push('No recent chat activity. Consider reaching out to tutors or students.');
  } else if (stats.engagementMetrics.recentActivityRate > 80) {
    insights.push('High engagement rate! You\'re actively participating in most of your chats.');
  }

  if (stats.averageResponseTime < 30) {
    insights.push('You respond very quickly to messages. Great communication!');
  } else if (stats.averageResponseTime > 240) {
    insights.push('Consider responding faster to improve your tutoring relationships.');
  }

  if (stats.engagementMetrics.dailyAverageMessages < 5) {
    insights.push('Low messaging activity. Engaging more could lead to better connections.');
  }

  if (insights.length === 0) {
    insights.push('Your chat activity looks healthy. Keep up the good communication!');
  }

  return insights;
}

export const GET = apiHandler({
  requireAuth: true,
  middlewares: [authMiddleware],
  handler: handleGET,
});