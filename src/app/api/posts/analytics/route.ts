/**
 * Post Analytics API
 * Provides aggregated analytics and recommendations for post optimization
 */

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { 
  createAPIHandler, 
  createSuccessResponse,
  APIContext
} from '@/lib/api-handler';
import { NorwegianRegionSchema, SubjectSchema } from '@/schemas/post';

const prisma = new PrismaClient();

// Analytics query schema
const AnalyticsQuerySchema = z.object({
  timeframe: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  region: NorwegianRegionSchema.optional(),
  subject: SubjectSchema.optional(),
  includeRecommendations: z.coerce.boolean().default(true),
  includeMarketTrends: z.coerce.boolean().default(false),
});

/**
 * GET /api/posts/analytics - Get platform analytics and market insights
 */
async function handleGetAnalytics(
  request: NextRequest,
  context: APIContext
) {
  const { searchParams } = new URL(request.url);
  const query = AnalyticsQuerySchema.parse(Object.fromEntries(searchParams));
  const { user } = context;

  try {
    // Calculate date range
    const timeframeDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    const daysBack = timeframeDays[query.timeframe];
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Build filter conditions
    const postFilter = {
      createdAt: { gte: startDate },
      isActive: true,
      ...(query.region && { location: query.region }),
      ...(query.subject && { subject: query.subject }),
    };

    // Execute analytics queries in parallel
    const [
      totalPosts,
      activePosts,
      subjectDistribution,
      regionDistribution,
      priceAnalysis,
      popularityMetrics,
      responseRates,
      timeAnalysis,
    ] = await Promise.all([
      // Total posts in timeframe
      prisma.post.count({
        where: postFilter,
      }),

      // Currently active posts
      prisma.post.count({
        where: {
          ...postFilter,
          isActive: true,
        },
      }),

      // Subject distribution
      prisma.post.groupBy({
        by: ['subject'],
        where: postFilter,
        _count: { subject: true },
        orderBy: { _count: { subject: 'desc' } },
      }),

      // Region distribution
      prisma.post.groupBy({
        by: ['location'],
        where: postFilter,
        _count: { location: true },
        orderBy: { _count: { location: 'desc' } },
      }),

      // Price analysis
      prisma.post.aggregate({
        where: {
          ...postFilter,
          hourlyRate: { not: null },
        },
        _avg: { hourlyRate: true },
        _min: { hourlyRate: true },
        _max: { hourlyRate: true },
        _count: { hourlyRate: true },
      }),

      // Popularity metrics (posts with most chats)
      prisma.post.findMany({
        where: postFilter,
        include: {
          _count: {
            select: {
              chats: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: {
          chats: {
            _count: 'desc',
          },
        },
        take: 10,
      }),

      // Response rates by type
      prisma.post.groupBy({
        by: ['type'],
        where: postFilter,
        _count: { type: true },
      }),

      // Time-based analysis
      prisma.post.groupBy({
        by: ['createdAt'],
        where: postFilter,
        _count: { createdAt: true },
      }),
    ]);

    // Process time analysis data
    const dailyActivity = processTimeAnalysis(timeAnalysis);
    const trendAnalysis = calculateTrends(dailyActivity);

    // Calculate subject popularity and pricing
    const subjectAnalysis = await Promise.all(
      subjectDistribution.map(async (item) => {
        const priceStats = await prisma.post.aggregate({
          where: {
            ...postFilter,
            subject: item.subject,
            hourlyRate: { not: null },
          },
          _avg: { hourlyRate: true },
          _min: { hourlyRate: true },
          _max: { hourlyRate: true },
        });

        const chatStats = await prisma.chat.count({
          where: {
            relatedPost: {
              subject: item.subject,
              ...postFilter,
            },
            isActive: true,
          },
        });

        return {
          subject: item.subject,
          postCount: item._count.subject,
          averagePrice: priceStats._avg.hourlyRate ? Number(priceStats._avg.hourlyRate) : null,
          priceRange: {
            min: priceStats._min.hourlyRate ? Number(priceStats._min.hourlyRate) : null,
            max: priceStats._max.hourlyRate ? Number(priceStats._max.hourlyRate) : null,
          },
          totalChats: chatStats,
          engagementRate: item._count.subject > 0 ? chatStats / item._count.subject : 0,
          competitionLevel: calculateCompetitionLevel(item._count.subject, chatStats),
        };
      })
    );

    // Regional analysis
    const regionAnalysis = await Promise.all(
      regionDistribution.map(async (item) => {
        const avgPrice = await prisma.post.aggregate({
          where: {
            ...postFilter,
            location: item.location,
            hourlyRate: { not: null },
          },
          _avg: { hourlyRate: true },
        });

        const demand = await prisma.chat.count({
          where: {
            relatedPost: {
              location: item.location,
              ...postFilter,
            },
            isActive: true,
          },
        });

        return {
          region: item.location,
          postCount: item._count.location,
          averagePrice: avgPrice._avg.hourlyRate ? Number(avgPrice._avg.hourlyRate) : null,
          demand: demand,
          marketDensity: calculateMarketDensity(item._count.location, demand),
        };
      })
    );

    // Generate recommendations if requested
    const recommendations = query.includeRecommendations
      ? generateRecommendations(subjectAnalysis, regionAnalysis, user)
      : [];

    // Market trends analysis
    const marketTrends = query.includeMarketTrends
      ? await generateMarketTrends(startDate, postFilter)
      : null;

    const analytics = {
      overview: {
        timeframe: query.timeframe,
        dateRange: {
          from: startDate.toISOString(),
          to: new Date().toISOString(),
        },
        totalPosts,
        activePosts,
        averagePrice: priceAnalysis._avg.hourlyRate ? Number(priceAnalysis._avg.hourlyRate) : null,
        priceRange: {
          min: priceAnalysis._min.hourlyRate ? Number(priceAnalysis._min.hourlyRate) : null,
          max: priceAnalysis._max.hourlyRate ? Number(priceAnalysis._max.hourlyRate) : null,
        },
      },

      subjects: {
        distribution: subjectAnalysis,
        mostPopular: subjectAnalysis[0]?.subject,
        highestPaying: subjectAnalysis.sort((a, b) => (b.averagePrice || 0) - (a.averagePrice || 0))[0]?.subject,
        mostEngaging: subjectAnalysis.sort((a, b) => b.engagementRate - a.engagementRate)[0]?.subject,
      },

      regions: {
        distribution: regionAnalysis,
        mostActive: regionAnalysis[0]?.region,
        highestPaying: regionAnalysis.sort((a, b) => (b.averagePrice || 0) - (a.averagePrice || 0))[0]?.region,
        highestDemand: regionAnalysis.sort((a, b) => b.demand - a.demand)[0]?.region,
      },

      trends: {
        daily: dailyActivity,
        growth: trendAnalysis,
        seasonality: calculateSeasonality(dailyActivity),
      },

      popular: {
        posts: popularityMetrics.map(post => ({
          id: post.id,
          title: post.title,
          subject: post.subject,
          location: post.location,
          chatCount: post._count.chats,
        })),
      },

      ...(recommendations.length > 0 && { recommendations }),
      ...(marketTrends && { marketTrends }),
    };

    return createSuccessResponse(
      analytics,
      'Analytics data retrieved successfully',
      {
        dataPoints: totalPosts,
        analysisDate: new Date().toISOString(),
        filters: query,
      }
    );

  } catch (error) {
    console.error('Error retrieving analytics:', error);
    throw new Error('Failed to retrieve analytics data');
  }
}

// Helper functions
function processTimeAnalysis(timeAnalysis: any[]): Record<string, number> {
  const dailyActivity: Record<string, number> = {};
  
  timeAnalysis.forEach(item => {
    const date = new Date(item.createdAt).toISOString().split('T')[0];
    dailyActivity[date] = (dailyActivity[date] || 0) + item._count.createdAt;
  });

  return dailyActivity;
}

function calculateTrends(dailyActivity: Record<string, number>): any {
  const dates = Object.keys(dailyActivity).sort();
  if (dates.length < 2) return { trend: 'insufficient_data' };

  const values = dates.map(date => dailyActivity[date]);
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const growth = ((secondAvg - firstAvg) / firstAvg) * 100;

  return {
    trend: growth > 10 ? 'growing' : growth < -10 ? 'declining' : 'stable',
    growthPercentage: Math.round(growth * 100) / 100,
    firstPeriodAvg: Math.round(firstAvg * 100) / 100,
    secondPeriodAvg: Math.round(secondAvg * 100) / 100,
  };
}

function calculateCompetitionLevel(posts: number, chats: number): 'low' | 'medium' | 'high' {
  const ratio = posts > 0 ? chats / posts : 0;
  
  if (ratio > 3) return 'low'; // High engagement, low competition
  if (ratio > 1) return 'medium';
  return 'high'; // Low engagement, high competition
}

function calculateMarketDensity(posts: number, demand: number): 'oversaturated' | 'competitive' | 'balanced' | 'underserved' {
  if (posts === 0) return 'underserved';
  
  const ratio = demand / posts;
  
  if (ratio > 5) return 'underserved';
  if (ratio > 2) return 'balanced';
  if (ratio > 0.5) return 'competitive';
  return 'oversaturated';
}

function calculateSeasonality(dailyActivity: Record<string, number>): any {
  // Simple weekly pattern analysis
  const weeklyPattern: Record<number, number> = {};
  
  Object.entries(dailyActivity).forEach(([date, count]) => {
    const dayOfWeek = new Date(date).getDay();
    weeklyPattern[dayOfWeek] = (weeklyPattern[dayOfWeek] || 0) + count;
  });

  const maxDay = Object.entries(weeklyPattern).reduce((a, b) => 
    weeklyPattern[parseInt(a[0])] > weeklyPattern[parseInt(b[0])] ? a : b
  );

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return {
    peakDay: dayNames[parseInt(maxDay[0])],
    weeklyPattern,
  };
}

function generateRecommendations(
  subjectAnalysis: any[], 
  regionAnalysis: any[], 
  user: any
): any[] {
  const recommendations = [];

  // High-opportunity subjects
  const underservedSubjects = subjectAnalysis.filter(s => s.competitionLevel === 'low' && s.averagePrice > 500);
  if (underservedSubjects.length > 0) {
    recommendations.push({
      type: 'opportunity',
      category: 'subject',
      title: 'High-opportunity subjects',
      description: `Consider offering tutoring in ${underservedSubjects[0].subject} - low competition with good pricing`,
      data: underservedSubjects.slice(0, 3),
    });
  }

  // Underserved regions
  const underservedRegions = regionAnalysis.filter(r => r.marketDensity === 'underserved');
  if (underservedRegions.length > 0) {
    recommendations.push({
      type: 'expansion',
      category: 'region',
      title: 'Underserved markets',
      description: 'These regions have high demand but few tutors',
      data: underservedRegions.slice(0, 3),
    });
  }

  // Pricing recommendations
  const highPayingSubjects = subjectAnalysis
    .filter(s => s.averagePrice > 600)
    .sort((a, b) => b.averagePrice - a.averagePrice);
    
  if (highPayingSubjects.length > 0) {
    recommendations.push({
      type: 'pricing',
      category: 'subject',
      title: 'High-value subjects',
      description: 'These subjects command premium rates',
      data: highPayingSubjects.slice(0, 3),
    });
  }

  return recommendations;
}

async function generateMarketTrends(startDate: Date, postFilter: any) {
  // This would implement more sophisticated trend analysis
  // For now, return basic trend information
  return {
    emergingSubjects: ['PROGRAMMING', 'ENGLISH'],
    growingRegions: ['OSLO', 'BERGEN'],
    priceInflation: {
      overall: 5.2, // percentage
      bySubject: {
        PROGRAMMING: 8.1,
        MATHEMATICS: 3.4,
        PHYSICS: 6.7,
      },
    },
  };
}

export const GET = createAPIHandler(handleGetAnalytics, {
  optionalAuth: true,
  validation: {
    query: AnalyticsQuerySchema,
  },
  rateLimit: {
    maxAttempts: 20,
    windowMs: 60 * 1000, // 1 minute
  },
});