/**
 * Post Statistics API
 * Provides detailed analytics and statistics for individual posts
 */

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  createAPIHandler, 
  createSuccessResponse,
  APIContext
} from '@/lib/api-handler';
import { PostIdSchema } from '@/schemas/post';
import { APIError } from '@/lib/errors';

const prisma = new PrismaClient();

/**
 * GET /api/posts/[postId]/stats - Get comprehensive post statistics
 */
async function handleGetPostStats(
  request: NextRequest,
  context: APIContext,
  params: any
) {
  const { user } = context;
  const { postId } = params;
  
  try {
    // Verify post exists and get basic info
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        userId: true,
        title: true,
        type: true,
        subject: true,
        location: true,
        createdAt: true,
        isActive: true,
      },
    });

    if (!post) {
      throw new APIError('Post not found', 404, 'POST_NOT_FOUND');
    }

    // Only post owner can see detailed stats
    const isOwner = user?.id === post.userId;
    
    if (!isOwner) {
      throw new APIError('Not authorized to view post statistics', 403, 'FORBIDDEN');
    }

    // Get comprehensive statistics
    const [
      chatStats,
      messageStats,
      appointmentStats,
      userEngagement,
      timeAnalytics
    ] = await Promise.all([
      // Chat statistics
      prisma.chat.aggregate({
        where: { relatedPostId: postId },
        _count: true,
      }).then(result => ({
        totalChats: result._count,
        activeChats: prisma.chat.count({
          where: { 
            relatedPostId: postId,
            isActive: true,
          },
        }),
      })),
      
      // Message statistics
      prisma.message.aggregate({
        where: {
          chat: { relatedPostId: postId },
        },
        _count: true,
      }).then(result => ({
        totalMessages: result._count,
        recentMessages: prisma.message.count({
          where: {
            chat: { relatedPostId: postId },
            sentAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      })),
      
      // Appointment statistics  
      prisma.appointment.aggregate({
        where: {
          chat: { relatedPostId: postId },
        },
        _count: true,
      }).then(result => ({
        totalAppointments: result._count,
        completedAppointments: prisma.appointment.count({
          where: {
            chat: { relatedPostId: postId },
            status: 'COMPLETED',
          },
        }),
        pendingAppointments: prisma.appointment.count({
          where: {
            chat: { relatedPostId: postId },
            status: 'PENDING',
          },
        }),
      })),
      
      // User engagement
      prisma.chat.findMany({
        where: { relatedPostId: postId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  region: true,
                  createdAt: true,
                },
              },
            },
          },
          messages: {
            select: {
              senderId: true,
              sentAt: true,
            },
            orderBy: {
              sentAt: 'desc',
            },
            take: 1,
          },
        },
      }).then(chats => {
        const uniqueUsers = new Set();
        const regionCounts: Record<string, number> = {};
        let totalResponseTime = 0;
        let responseTimeCount = 0;
        
        chats.forEach(chat => {
          chat.participants.forEach(participant => {
            uniqueUsers.add(participant.userId);
            const region = participant.user.region;
            regionCounts[region] = (regionCounts[region] || 0) + 1;
          });
          
          // Calculate average response time (simplified)
          if (chat.messages.length > 0) {
            const lastMessage = chat.messages[0];
            const timeDiff = Date.now() - new Date(lastMessage.sentAt).getTime();
            if (timeDiff < 24 * 60 * 60 * 1000) { // Only recent messages
              totalResponseTime += timeDiff;
              responseTimeCount++;
            }
          }
        });
        
        return {
          uniqueUsers: uniqueUsers.size,
          regionDistribution: regionCounts,
          averageResponseTime: responseTimeCount > 0 
            ? Math.round(totalResponseTime / responseTimeCount / (60 * 1000)) // in minutes
            : null,
        };
      }),
      
      // Time-based analytics
      prisma.chat.groupBy({
        by: ['createdAt'],
        where: { relatedPostId: postId },
        _count: true,
      }).then(results => {
        const dailyActivity: Record<string, number> = {};
        const hourlyActivity: Record<string, number> = {};
        
        results.forEach(result => {
          const date = new Date(result.createdAt);
          const day = date.toISOString().split('T')[0];
          const hour = date.getHours().toString();
          
          dailyActivity[day] = (dailyActivity[day] || 0) + result._count;
          hourlyActivity[hour] = (hourlyActivity[hour] || 0) + result._count;
        });
        
        return {
          dailyActivity,
          hourlyActivity,
        };
      }),
    ]);

    // Calculate performance metrics
    const performanceMetrics = {
      responseRate: chatStats.totalChats > 0 
        ? Math.round((chatStats.activeChats / chatStats.totalChats) * 100)
        : 0,
      
      conversionRate: chatStats.totalChats > 0
        ? Math.round((appointmentStats.totalAppointments / chatStats.totalChats) * 100)
        : 0,
        
      completionRate: appointmentStats.totalAppointments > 0
        ? Math.round((appointmentStats.completedAppointments / appointmentStats.totalAppointments) * 100)
        : 0,
        
      engagement: messageStats.totalMessages > 0
        ? Math.round(messageStats.totalMessages / chatStats.totalChats)
        : 0,
    };

    // Calculate post age and activity metrics
    const postAge = Math.floor((Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const dailyInteractionRate = chatStats.totalChats / Math.max(postAge, 1);

    const stats = {
      postInfo: {
        id: post.id,
        title: post.title,
        type: post.type,
        subject: post.subject,
        location: post.location,
        ageInDays: postAge,
        isActive: post.isActive,
      },
      
      overview: {
        totalChats: chatStats.totalChats,
        activeChats: chatStats.activeChats,
        totalMessages: messageStats.totalMessages,
        totalAppointments: appointmentStats.totalAppointments,
        uniqueUsers: userEngagement.uniqueUsers,
      },
      
      performance: performanceMetrics,
      
      engagement: {
        averageResponseTime: userEngagement.averageResponseTime,
        dailyInteractionRate: Math.round(dailyInteractionRate * 100) / 100,
        recentActivity: messageStats.recentMessages,
        regionDistribution: userEngagement.regionDistribution,
      },
      
      appointments: {
        total: appointmentStats.totalAppointments,
        completed: appointmentStats.completedAppointments,
        pending: appointmentStats.pendingAppointments,
        completionRate: performanceMetrics.completionRate,
      },
      
      analytics: {
        dailyActivity: timeAnalytics.dailyActivity,
        hourlyActivity: timeAnalytics.hourlyActivity,
        peakHour: Object.entries(timeAnalytics.hourlyActivity)
          .reduce((a, b) => timeAnalytics.hourlyActivity[a[0]] > timeAnalytics.hourlyActivity[b[0]] ? a : b, ['0', 0])[0],
      },
      
      insights: generateInsights(performanceMetrics, userEngagement, postAge),
    };

    return createSuccessResponse(
      stats,
      'Post statistics retrieved successfully',
      {
        generatedAt: new Date().toISOString(),
        dataRange: `Last ${postAge} days`,
      }
    );
    
  } catch (error) {
    console.error('Error retrieving post stats:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new Error('Failed to retrieve post statistics');
  }
}

function generateInsights(performance: any, engagement: any, postAge: number) {
  const insights = [];
  
  // Performance insights
  if (performance.responseRate > 80) {
    insights.push({
      type: 'positive',
      category: 'engagement',
      message: 'Excellent response rate! Your post is attracting quality interactions.',
    });
  } else if (performance.responseRate < 30) {
    insights.push({
      type: 'suggestion',
      category: 'engagement',
      message: 'Consider updating your post description to attract more engaged users.',
    });
  }
  
  // Conversion insights
  if (performance.conversionRate > 50) {
    insights.push({
      type: 'positive',
      category: 'conversion',
      message: 'High conversion rate from chats to appointments. Great job!',
    });
  } else if (performance.conversionRate < 20) {
    insights.push({
      type: 'suggestion',
      category: 'conversion',
      message: 'Try being more proactive in suggesting appointments during chats.',
    });
  }
  
  // Regional insights
  const regions = Object.keys(engagement.regionDistribution || {});
  if (regions.length > 3) {
    insights.push({
      type: 'positive',
      category: 'reach',
      message: `Your post is attracting users from ${regions.length} different regions.`,
    });
  }
  
  // Age insights
  if (postAge > 30 && performance.responseRate < 40) {
    insights.push({
      type: 'suggestion',
      category: 'freshness',
      message: 'Consider updating your post or creating a new one to increase visibility.',
    });
  }
  
  // Response time insights
  if (engagement.averageResponseTime && engagement.averageResponseTime < 60) {
    insights.push({
      type: 'positive',
      category: 'responsiveness',
      message: 'Excellent response time! Quick responses lead to better conversions.',
    });
  }
  
  return insights;
}

export const GET = createAPIHandler(handleGetPostStats, {
  requireAuth: true,
  validation: {
    params: PostIdSchema,
  },
  rateLimit: {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
  },
});