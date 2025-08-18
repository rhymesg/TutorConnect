/**
 * Advanced Post Search API - Norwegian-specific features
 * Provides enhanced search capabilities with Norwegian curriculum integration
 */

import { NextRequest } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { 
  createAPIHandler, 
  createPaginatedResponse,
  APIContext
} from '@/lib/api-handler';
import { PostSearchSchema, RegionProximity, NorwegianSubjectCategories, AgeGroupToGrades } from '@/schemas/post';
import { calculatePagination } from '@/lib/api-handler';

const prisma = new PrismaClient();

// Enhanced search schema with Norwegian-specific features
const AdvancedSearchSchema = z.object({
  // Basic search fields from PostSearchSchema
  q: z.string().trim().optional(),
  type: z.enum(['TUTOR_OFFER', 'STUDENT_REQUEST']).optional(),
  subject: z.enum(['MATHEMATICS', 'NORWEGIAN', 'ENGLISH', 'SCIENCE', 'HISTORY', 'GEOGRAPHY', 'ART', 'MUSIC', 'SPORTS', 'PROGRAMMING', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'OTHER']).optional(),
  ageGroups: z.union([
    z.enum(['CHILDREN_7_12', 'TEENAGERS_13_15', 'YOUTH_16_18', 'ADULTS_19_PLUS']),
    z.array(z.enum(['CHILDREN_7_12', 'TEENAGERS_13_15', 'YOUTH_16_18', 'ADULTS_19_PLUS']))
  ]).optional().transform(val => Array.isArray(val) ? val : val ? [val] : undefined),
  location: z.enum(['OSLO', 'BERGEN', 'TRONDHEIM', 'STAVANGER', 'KRISTIANSAND', 'FREDRIKSTAD', 'SANDNES', 'TROMSOE', 'DRAMMEN', 'ASKER', 'BAERUM', 'AKERSHUS', 'OESTFOLD', 'BUSKERUD', 'VESTFOLD', 'TELEMARK', 'AUST_AGDER', 'VEST_AGDER', 'ROGALAND', 'HORDALAND', 'SOGN_OG_FJORDANE', 'MOERE_OG_ROMSDAL', 'SOER_TROENDELAG', 'NORD_TROENDELAG', 'NORDLAND', 'TROMS', 'FINNMARK']).optional(),
  minRate: z.coerce.number().min(0).optional(),
  maxRate: z.coerce.number().min(0).optional(),
  availableDays: z.union([
    z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    z.array(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']))
  ]).optional().transform(val => Array.isArray(val) ? val : val ? [val] : undefined),
  createdAfter: z.coerce.date().optional(),
  createdBefore: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'hourlyRate', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  hasActiveChats: z.coerce.boolean().optional(),
  userRegion: z.enum(['OSLO', 'BERGEN', 'TRONDHEIM', 'STAVANGER', 'KRISTIANSAND', 'FREDRIKSTAD', 'SANDNES', 'TROMSOE', 'DRAMMEN', 'ASKER', 'BAERUM', 'AKERSHUS', 'OESTFOLD', 'BUSKERUD', 'VESTFOLD', 'TELEMARK', 'AUST_AGDER', 'VEST_AGDER', 'ROGALAND', 'HORDALAND', 'SOGN_OG_FJORDANE', 'MOERE_OG_ROMSDAL', 'SOER_TROENDELAG', 'NORD_TROENDELAG', 'NORDLAND', 'TROMS', 'FINNMARK']).optional(),
  includeNearbyRegions: z.coerce.boolean().default(false),
  onlyVerifiedUsers: z.coerce.boolean().default(false),

  // Subject category filtering
  subjectCategory: z.enum([
    'CORE_SUBJECTS',
    'SCIENCES',
    'HUMANITIES',
    'CREATIVE',
    'TECHNICAL',
    'PHYSICAL',
    'OTHER'
  ]).optional(),
  
  // Grade level filtering (Norwegian system)
  gradeLevel: z.union([
    z.string(),
    z.array(z.string())
  ]).optional().transform(val => Array.isArray(val) ? val : val ? [val] : undefined),
  
  // Advanced location features
  maxDistanceKm: z.coerce.number().min(1).max(200).optional(),
  onlineOnly: z.coerce.boolean().default(false),
  
  // Time-based filtering
  availableToday: z.coerce.boolean().default(false),
  availableThisWeek: z.coerce.boolean().default(false),
  preferredTimeSlots: z.union([
    z.string(),
    z.array(z.string())
  ]).optional().transform(val => Array.isArray(val) ? val : val ? [val] : undefined),
  
  // User quality filters
  minResponseRate: z.coerce.number().min(0).max(100).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  verifiedTeachersOnly: z.coerce.boolean().default(false),
  
  // Norwegian educational context
  norwegianSpeakingOnly: z.coerce.boolean().default(false),
  internationalStudentFriendly: z.coerce.boolean().default(false),
  
  // Special needs support
  specialNeedsSupport: z.coerce.boolean().default(false),
  
  // Session type preferences
  sessionTypes: z.union([
    z.enum(['INDIVIDUAL', 'GROUP', 'ONLINE', 'HOME_VISIT', 'LIBRARY', 'SCHOOL', 'CAFE']),
    z.array(z.enum(['INDIVIDUAL', 'GROUP', 'ONLINE', 'HOME_VISIT', 'LIBRARY', 'SCHOOL', 'CAFE']))
  ]).optional().transform(val => Array.isArray(val) ? val : val ? [val] : undefined),
}).superRefine((data, ctx) => {
  // Validate price range
  if (data.minRate !== undefined && data.maxRate !== undefined) {
    if (data.minRate >= data.maxRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum rate must be less than maximum rate',
        path: ['minRate']
      });
    }
  }
  
  // Validate date range
  if (data.createdAfter && data.createdBefore) {
    if (data.createdAfter >= data.createdBefore) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Created after date must be before created before date',
        path: ['createdAfter']
      });
    }
  }
});

/**
 * POST /api/posts/search/advanced - Advanced search with Norwegian features
 */
async function handleAdvancedSearch(
  request: NextRequest,
  context: APIContext
) {
  const { validatedData, user } = context;
  const searchParams = validatedData!.body;
  
  try {
    // Build enhanced where clause
    const where: Prisma.PostWhereInput = {
      isActive: true,
      
      // Basic filters from parent schema
      ...(searchParams.q && {
        OR: [
          { title: { contains: searchParams.q, mode: 'insensitive' } },
          { description: { contains: searchParams.q, mode: 'insensitive' } },
          { user: { name: { contains: searchParams.q, mode: 'insensitive' } } },
        ],
      }),
      ...(searchParams.type && { type: searchParams.type }),
      ...(searchParams.subject && { subject: searchParams.subject }),
      ...(searchParams.ageGroups && {
        ageGroups: { hasSome: searchParams.ageGroups },
      }),
      
      // Subject category filtering
      ...(searchParams.subjectCategory && {
        subject: {
          in: NorwegianSubjectCategories[searchParams.subjectCategory],
        },
      }),
      
      // Grade level to age group mapping
      ...(searchParams.gradeLevel && {
        ageGroups: {
          hasSome: mapGradeLevelsToAgeGroups(searchParams.gradeLevel),
        },
      }),
      
      // Enhanced location filtering
      ...(searchParams.location && {
        OR: [
          { location: searchParams.location },
          ...(searchParams.includeNearbyRegions ? [{
            location: { in: RegionProximity[searchParams.location] || [] },
          }] : []),
        ],
      }),
      
      // Online-only filtering
      ...(searchParams.onlineOnly && {
        OR: [
          { specificLocation: { contains: 'online', mode: 'insensitive' } },
          { specificLocation: { contains: 'nett', mode: 'insensitive' } },
          { description: { contains: 'online', mode: 'insensitive' } },
          { description: { contains: 'nettundervisning', mode: 'insensitive' } },
        ],
      }),
      
      // Time availability filters
      ...(searchParams.availableDays && {
        availableDays: { hasSome: searchParams.availableDays },
      }),
      
      ...(searchParams.preferredTimeSlots && {
        availableTimes: { hasSome: searchParams.preferredTimeSlots },
      }),
      
      // Today availability (Norwegian timezone)
      ...(searchParams.availableToday && {
        availableDays: {
          has: getCurrentNorwegianWeekday(),
        },
      }),
      
      // This week availability
      ...(searchParams.availableThisWeek && {
        availableDays: {
          hasSome: getRemainingWeekdays(),
        },
      }),
      
      // User quality filters
      ...(searchParams.verifiedTeachersOnly && {
        user: {
          documents: {
            some: {
              documentType: { in: ['TEACHING_CERTIFICATE', 'EDUCATION_CERTIFICATE'] },
              verificationStatus: 'VERIFIED',
            },
          },
        },
      }),
      
      // Norwegian language context
      ...(searchParams.norwegianSpeakingOnly && {
        OR: [
          { user: { region: { in: ['OSLO', 'BERGEN', 'TRONDHEIM', 'STAVANGER'] } } },
          { subject: 'NORWEGIAN' },
        ],
      }),
      
      // International student friendly
      ...(searchParams.internationalStudentFriendly && {
        OR: [
          { subject: 'ENGLISH' },
          { description: { contains: 'english', mode: 'insensitive' } },
          { description: { contains: 'international', mode: 'insensitive' } },
          { title: { contains: 'english', mode: 'insensitive' } },
        ],
      }),
      
      // Special needs support
      ...(searchParams.specialNeedsSupport && {
        OR: [
          { description: { contains: 'special', mode: 'insensitive' } },
          { description: { contains: 'særskilte', mode: 'insensitive' } },
          { description: { contains: 'tilpasset', mode: 'insensitive' } },
          { user: {
            certifications: { 
              contains: 'spesialpedagogikk',
              mode: 'insensitive',
            },
          }},
        ],
      }),
      
      // Pricing filters
      ...((searchParams.minRate !== undefined || searchParams.maxRate !== undefined) && {
        OR: [
          {
            AND: [
              { hourlyRate: { not: null } },
              ...(searchParams.minRate !== undefined ? [{ hourlyRate: { gte: searchParams.minRate } }] : []),
              ...(searchParams.maxRate !== undefined ? [{ hourlyRate: { lte: searchParams.maxRate } }] : []),
            ],
          },
          {
            AND: [
              { hourlyRateMin: { not: null } },
              { hourlyRateMax: { not: null } },
              ...(searchParams.minRate !== undefined ? [{ hourlyRateMax: { gte: searchParams.minRate } }] : []),
              ...(searchParams.maxRate !== undefined ? [{ hourlyRateMin: { lte: searchParams.maxRate } }] : []),
            ],
          },
        ],
      }),
    };

    // Enhanced ordering with relevance scoring
    const orderBy: Prisma.PostOrderByWithRelationInput[] = [];
    
    // If there's a search query, prioritize relevance
    if (searchParams.q) {
      // PostgreSQL full-text search would go here in a production app
      orderBy.push({ updatedAt: 'desc' });
    } else {
      switch (searchParams.sortBy) {
        case 'hourlyRate':
          orderBy.push(
            { hourlyRate: searchParams.sortOrder },
            { hourlyRateMin: searchParams.sortOrder }
          );
          break;
        case 'title':
          orderBy.push({ title: searchParams.sortOrder });
          break;
        case 'updatedAt':
          orderBy.push({ updatedAt: searchParams.sortOrder });
          break;
        default:
          orderBy.push({ createdAt: searchParams.sortOrder });
      }
    }

    // Calculate pagination
    const { skip, take } = calculatePagination(
      searchParams.page,
      searchParams.limit,
      0
    );

    // Execute enhanced query with additional data
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              isActive: true,
              region: true,
              school: true,
              certifications: true,
              _count: {
                select: {
                  posts: {
                    where: { isActive: true },
                  },
                  documents: {
                    where: { verificationStatus: 'VERIFIED' },
                  },
                },
              },
            },
          },
          chats: {
            where: { isActive: true },
            select: { id: true },
          },
          _count: {
            select: {
              chats: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    // Enhance posts with computed fields
    const enhancedPosts = posts.map(post => ({
      ...post,
      // Add convenience fields
      isPopular: post._count.chats > 5,
      hasVerifiedTeacher: post.user._count.documents > 0,
      teacherExperience: post.user._count.posts,
      matchScore: calculateMatchScore(post, searchParams),
    }));

    const pagination = {
      page: searchParams.page,
      limit: searchParams.limit,
      total: totalCount,
      hasNext: searchParams.page * searchParams.limit < totalCount,
      hasPrev: searchParams.page > 1,
    };

    return createPaginatedResponse(
      enhancedPosts,
      pagination,
      `Found ${totalCount} posts using advanced search`,
      {
        searchCriteria: {
          basic: {
            query: searchParams.q,
            type: searchParams.type,
            subject: searchParams.subject,
            location: searchParams.location,
          },
          advanced: {
            subjectCategory: searchParams.subjectCategory,
            gradeLevel: searchParams.gradeLevel,
            onlineOnly: searchParams.onlineOnly,
            verifiedTeachersOnly: searchParams.verifiedTeachersOnly,
            norwegianSpeakingOnly: searchParams.norwegianSpeakingOnly,
            internationalStudentFriendly: searchParams.internationalStudentFriendly,
          },
        },
        suggestions: await generateSearchSuggestions(searchParams, totalCount),
      }
    );
  } catch (error) {
    console.error('Error in advanced search:', error);
    throw new Error('Advanced search failed');
  }
}

// Helper functions
function mapGradeLevelsToAgeGroups(gradeLevels: string[]): string[] {
  const ageGroups = new Set<string>();
  
  for (const grade of gradeLevels) {
    for (const [ageGroup, grades] of Object.entries(AgeGroupToGrades)) {
      if (grades.includes(grade as any)) {
        ageGroups.add(ageGroup);
      }
    }
  }
  
  return Array.from(ageGroups);
}

function getCurrentNorwegianWeekday(): string {
  const now = new Date();
  const dayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const weekdays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return weekdays[dayIndex];
}

function getRemainingWeekdays(): string[] {
  const today = new Date().getDay();
  const allWeekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  
  // Return weekdays from today onwards
  return allWeekdays.slice(today === 0 ? 0 : today - 1);
}

function calculateMatchScore(post: any, searchParams: any): number {
  let score = 0;
  
  // Basic matching
  if (searchParams.type && post.type === searchParams.type) score += 20;
  if (searchParams.subject && post.subject === searchParams.subject) score += 30;
  if (searchParams.location && post.location === searchParams.location) score += 15;
  
  // Quality factors
  if (post.hasVerifiedTeacher) score += 10;
  if (post.isPopular) score += 5;
  if (post.teacherExperience > 5) score += 10;
  
  // Recency bonus
  const daysSinceUpdate = Math.floor((Date.now() - new Date(post.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceUpdate < 7) score += 10;
  else if (daysSinceUpdate < 30) score += 5;
  
  return Math.min(100, score);
}

async function generateSearchSuggestions(searchParams: any, currentCount: number) {
  if (currentCount > 0) return [];
  
  const suggestions = [];
  
  // Suggest broadening search
  if (searchParams.subject) {
    suggestions.push(`Try searching for related subjects in the same category`);
  }
  
  if (searchParams.location && !searchParams.includeNearbyRegions) {
    suggestions.push(`Include nearby regions to see more results`);
  }
  
  if (searchParams.minRate && searchParams.maxRate) {
    suggestions.push(`Consider adjusting your price range`);
  }
  
  if (searchParams.verifiedTeachersOnly) {
    suggestions.push(`Include non-verified teachers to see more options`);
  }
  
  return suggestions;
}

// Export handler
export const POST = createAPIHandler(handleAdvancedSearch, {
  optionalAuth: true,
  validation: {
    body: AdvancedSearchSchema,
  },
  rateLimit: {
    maxAttempts: 20,
    windowMs: 60 * 1000, // 1 minute
  },
});