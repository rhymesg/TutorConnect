import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { chatStatsSchema } from '@/schemas/chat';

const prisma = new PrismaClient();

/**
 * GET /api/chat/stats - Get comprehensive chat statistics for the user
 */
async function handleGET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);

  // Validate query parameters
  const { timeframe, includeTrends, groupBy } = chatStatsSchema.parse({
    timeframe: searchParams.get('timeframe'),
    includeTrends: searchParams.get('includeTrends'),
    groupBy: searchParams.get('groupBy'),
  });

  // Calculate date range
  const now = new Date();
  const timeframeDays = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  };

  const days = timeframeDays[timeframe];
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Get comprehensive statistics
  const [
    overallStats,
    activityStats,
    subjectBreakdown,
    responseTimeStats,
    topPartners,
    messageTypeStats,
    appointmentStats,
    growthTrends,
  ] = await Promise.all([
    // Overall chat statistics
    getOverallChatStats(user.id),
    
    // Activity statistics for the timeframe
    getActivityStats(user.id, startDate, now),
    
    // Subject breakdown
    getSubjectBreakdown(user.id, startDate),
    
    // Response time analytics
    getResponseTimeStats(user.id, startDate),
    
    // Top chat partners
    getTopChatPartners(user.id, startDate),
    
    // Message type distribution
    getMessageTypeStats(user.id, startDate),
    
    // Appointment-related statistics
    getAppointmentStats(user.id, startDate),
    
    // Growth trends (if requested)
    includeTrends ? getTrendData(user.id, timeframe, groupBy) : null,
  ]);

  // Calculate engagement metrics
  const engagementMetrics = calculateEngagementMetrics(overallStats, activityStats);

  // Generate insights based on data
  const insights = generateStatisticalInsights({
    overall: overallStats,
    activity: activityStats,
    engagement: engagementMetrics,
    responseTime: responseTimeStats,
    timeframe,
  });

  return {
    success: true,
    data: {
      timeframe,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString(),
        days,
      },
      overview: overallStats,
      activity: activityStats,
      engagement: engagementMetrics,
      breakdown: {
        subjects: subjectBreakdown,
        messageTypes: messageTypeStats,
        topPartners: topPartners.slice(0, 10),
      },
      performance: {
        responseTime: responseTimeStats,
        appointments: appointmentStats,
      },
      trends: includeTrends ? growthTrends : null,
      insights,
      recommendations: generateRecommendations(insights, engagementMetrics),
    },
  };
}

/**
 * Get overall chat statistics for user
 */
async function getOverallChatStats(userId: string) {
  const [totalChats, activeChats, totalMessages, totalParticipants] = await Promise.all([
    prisma.chat.count({
      where: {
        participants: {
          some: { userId, isActive: true },
        },
      },
    }),
    
    prisma.chat.count({
      where: {
        participants: {
          some: { userId, isActive: true },
        },
        isActive: true,
      },
    }),
    
    prisma.message.count({
      where: {
        chat: {
          participants: {
            some: { userId, isActive: true },
          },
        },
      },
    }),
    
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT cp.user_id) as count
      FROM chat_participants cp
      JOIN chats c ON cp.chat_id = c.id
      JOIN chat_participants user_cp ON c.id = user_cp.chat_id
      WHERE user_cp.user_id = ${userId}
        AND user_cp.is_active = true
        AND cp.user_id != ${userId}
        AND cp.is_active = true
    `.then(result => Number(result[0]?.count || 0)),
  ]);

  return {
    totalChats,
    activeChats,
    inactiveChats: totalChats - activeChats,
    totalMessages,
    totalParticipants,
    averageMessagesPerChat: totalChats > 0 ? totalMessages / totalChats : 0,
  };
}

/**
 * Get activity statistics for timeframe
 */
async function getActivityStats(userId: string, startDate: Date, endDate: Date) {
  const [messagesInPeriod, chatsInPeriod, activeChatsInPeriod] = await Promise.all([
    prisma.message.count({
      where: {
        senderId: userId,
        sentAt: { gte: startDate, lte: endDate },
      },
    }),
    
    prisma.chat.count({
      where: {
        participants: {
          some: { userId, isActive: true },
        },
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    
    prisma.chat.count({
      where: {
        participants: {
          some: { userId, isActive: true },
        },
        lastMessageAt: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  
  return {
    messagesInPeriod,
    chatsCreatedInPeriod: chatsInPeriod,
    activeChatsInPeriod,
    dailyAverageMessages: days > 0 ? messagesInPeriod / days : 0,
    dailyAverageActiveChats: days > 0 ? activeChatsInPeriod / days : 0,
  };
}

/**
 * Get subject breakdown statistics
 */
async function getSubjectBreakdown(userId: string, startDate: Date) {
  const results = await prisma.$queryRaw<Array<{
    subject: string;
    chatCount: bigint;
    messageCount: bigint;
  }>>`
    SELECT 
      COALESCE(p.subject, 'NONE') as subject,
      COUNT(DISTINCT c.id) as "chatCount",
      COUNT(DISTINCT m.id) as "messageCount"
    FROM chats c
    JOIN chat_participants cp ON c.id = cp.chat_id
    LEFT JOIN posts p ON c.related_post_id = p.id
    LEFT JOIN messages m ON c.id = m.chat_id AND m.sent_at >= ${startDate}
    WHERE cp.user_id = ${userId}
      AND cp.is_active = true
    GROUP BY p.subject
    ORDER BY "chatCount" DESC
  `;

  return results.map(result => ({
    subject: result.subject,
    chatCount: Number(result.chatCount),
    messageCount: Number(result.messageCount),
  }));
}

/**
 * Get response time statistics
 */
async function getResponseTimeStats(userId: string, startDate: Date) {
  // Simplified response time calculation
  // In production, you'd want more sophisticated conversation analysis
  
  const userMessages = await prisma.$queryRaw<Array<{
    avgResponseMinutes: number | null;
    totalResponses: bigint;
  }>>`
    WITH user_responses AS (
      SELECT 
        m1.sent_at as response_time,
        m2.sent_at as initial_time,
        EXTRACT(EPOCH FROM (m1.sent_at - m2.sent_at))/60 as response_minutes
      FROM messages m1
      JOIN messages m2 ON m1.chat_id = m2.chat_id
      WHERE m1.sender_id = ${userId}
        AND m2.sender_id != ${userId}
        AND m1.sent_at > m2.sent_at
        AND m1.sent_at >= ${startDate}
        AND EXTRACT(EPOCH FROM (m1.sent_at - m2.sent_at))/60 < 1440
    )
    SELECT 
      AVG(response_minutes) as "avgResponseMinutes",
      COUNT(*) as "totalResponses"
    FROM user_responses
  `;

  const result = userMessages[0];
  
  return {
    averageResponseMinutes: result?.avgResponseMinutes || 0,
    totalResponses: Number(result?.totalResponses || 0),
    category: getResponseTimeCategory(result?.avgResponseMinutes || 0),
  };
}

/**
 * Get top chat partners
 */
async function getTopChatPartners(userId: string, startDate: Date) {
  const results = await prisma.$queryRaw<Array<{
    userId: string;
    name: string;
    profileImage: string | null;
    messageCount: bigint;
    chatCount: bigint;
    lastInteraction: Date;
  }>>`
    SELECT 
      u.id as "userId",
      u.name,
      u.profile_image as "profileImage",
      COUNT(DISTINCT m.id) as "messageCount",
      COUNT(DISTINCT c.id) as "chatCount",
      MAX(m.sent_at) as "lastInteraction"
    FROM users u
    JOIN chat_participants cp ON u.id = cp.user_id
    JOIN chats c ON cp.chat_id = c.id
    JOIN chat_participants user_cp ON c.id = user_cp.chat_id
    LEFT JOIN messages m ON c.id = m.chat_id AND m.sent_at >= ${startDate}
    WHERE user_cp.user_id = ${userId}
      AND u.id != ${userId}
      AND cp.is_active = true
      AND user_cp.is_active = true
    GROUP BY u.id, u.name, u.profile_image
    HAVING COUNT(DISTINCT m.id) > 0
    ORDER BY "messageCount" DESC, "lastInteraction" DESC
    LIMIT 15
  `;

  return results.map(result => ({
    ...result,
    messageCount: Number(result.messageCount),
    chatCount: Number(result.chatCount),
  }));
}

/**
 * Get message type statistics
 */
async function getMessageTypeStats(userId: string, startDate: Date) {
  const results = await prisma.message.groupBy({
    by: ['type'],
    where: {
      chat: {
        participants: {
          some: { userId, isActive: true },
        },
      },
      sentAt: { gte: startDate },
    },
    _count: { type: true },
  });

  return results.reduce((acc, result) => {
    acc[result.type] = result._count.type;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Get appointment statistics
 */
async function getAppointmentStats(userId: string, startDate: Date) {
  const [total, completed, cancelled, upcoming] = await Promise.all([
    prisma.appointment.count({
      where: {
        chat: {
          participants: {
            some: { userId, isActive: true },
          },
        },
        createdAt: { gte: startDate },
      },
    }),
    
    prisma.appointment.count({
      where: {
        chat: {
          participants: {
            some: { userId, isActive: true },
          },
        },
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
    }),
    
    prisma.appointment.count({
      where: {
        chat: {
          participants: {
            some: { userId, isActive: true },
          },
        },
        status: 'CANCELLED',
        createdAt: { gte: startDate },
      },
    }),
    
    prisma.appointment.count({
      where: {
        chat: {
          participants: {
            some: { userId, isActive: true },
          },
        },
        status: { in: ['PENDING', 'CONFIRMED'] },
        dateTime: { gte: new Date() },
      },
    }),
  ]);

  return {
    total,
    completed,
    cancelled,
    upcoming,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
  };
}

/**
 * Get trend data for charts
 */
async function getTrendData(userId: string, timeframe: string, groupBy: string) {
  const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // This would generate time-series data for charts
  // Simplified version for demonstration
  
  const messagesByPeriod = await prisma.$queryRaw<Array<{
    period: string;
    messageCount: bigint;
    chatCount: bigint;
  }>>`
    SELECT 
      DATE_TRUNC(${groupBy}, m.sent_at) as period,
      COUNT(DISTINCT m.id) as "messageCount",
      COUNT(DISTINCT m.chat_id) as "chatCount"
    FROM messages m
    JOIN chats c ON m.chat_id = c.id
    JOIN chat_participants cp ON c.id = cp.chat_id
    WHERE cp.user_id = ${userId}
      AND cp.is_active = true
      AND m.sent_at >= ${startDate}
    GROUP BY DATE_TRUNC(${groupBy}, m.sent_at)
    ORDER BY period ASC
  `;

  return messagesByPeriod.map(row => ({
    period: row.period,
    messageCount: Number(row.messageCount),
    chatCount: Number(row.chatCount),
  }));
}

/**
 * Calculate engagement metrics
 */
function calculateEngagementMetrics(overall: any, activity: any) {
  return {
    chatEngagementRate: overall.totalChats > 0 ? (overall.activeChats / overall.totalChats) * 100 : 0,
    averageSessionActivity: activity.dailyAverageMessages,
    participantDiversity: overall.totalParticipants,
    messageVolume: activity.messagesInPeriod,
    chatCreationRate: activity.dailyAverageActiveChats,
  };
}

/**
 * Generate statistical insights
 */
function generateStatisticalInsights(data: any): string[] {
  const insights: string[] = [];
  
  if (data.activity.messagesInPeriod === 0) {
    insights.push('No messaging activity in the selected period');
  } else if (data.activity.dailyAverageMessages > 20) {
    insights.push('High messaging activity - you\'re very engaged with your chats');
  } else if (data.activity.dailyAverageMessages < 5) {
    insights.push('Low messaging activity - consider being more active in your chats');
  }
  
  if (data.responseTime.averageResponseMinutes < 60) {
    insights.push('Excellent response time - you respond quickly to messages');
  } else if (data.responseTime.averageResponseMinutes > 240) {
    insights.push('Consider responding faster to improve communication');
  }
  
  if (data.engagement.chatEngagementRate > 80) {
    insights.push('Great chat engagement - you actively participate in most chats');
  }
  
  return insights.length > 0 ? insights : ['Your chat activity is within normal ranges'];
}

/**
 * Generate recommendations based on insights
 */
function generateRecommendations(insights: string[], engagement: any): string[] {
  const recommendations: string[] = [];
  
  if (engagement.averageSessionActivity < 5) {
    recommendations.push('Try to be more active in your chats to build stronger connections');
  }
  
  if (engagement.chatEngagementRate < 50) {
    recommendations.push('Consider archiving inactive chats to focus on active conversations');
  }
  
  if (engagement.participantDiversity < 3) {
    recommendations.push('Expand your network by initiating more conversations with different tutors/students');
  }
  
  return recommendations.length > 0 ? recommendations : 
    ['Keep up the good communication habits!'];
}

/**
 * Helper function to categorize response time
 */
function getResponseTimeCategory(minutes: number): string {
  if (minutes < 5) return 'immediate';
  if (minutes < 30) return 'quick';
  if (minutes < 120) return 'moderate';
  if (minutes < 1440) return 'slow';
  return 'delayed';
}

export const GET = apiHandler({
  requireAuth: true,
  middlewares: [authMiddleware],
  handler: handleGET,
});