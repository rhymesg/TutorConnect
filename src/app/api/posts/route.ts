/**
 * Posts API endpoints - Main posts collection operations
 * Handles POST (create) and GET (search/list) operations
 * Enhanced with comprehensive security validation and content filtering
 */

import { NextRequest } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { 
  createAPIHandler, 
  createSuccessResponse, 
  createPaginatedResponse,
  parsePaginationParams,
  calculatePagination
} from '@/lib/api-handler';
import { CreatePostSchema, PostSearchSchema, RegionProximity } from '@/schemas/post';
import { APIContext } from '@/lib/api-handler';
import { PostSecurityMiddleware, logPostOperation } from '@/middleware/post-security';
import { filterContent, generateContentSafetyReport } from '@/lib/content-filter';
import { checkPostRateLimit, recordFailedAttempt } from '@/lib/rate-limiter';
import { securityLogger } from '@/middleware/security';
import { APIError } from '@/lib/errors';

const prisma = new PrismaClient();

/**
 * POST /api/posts - Create a new tutoring post with enhanced security
 */
async function handleCreatePost(
  request: NextRequest, 
  context: APIContext
) {
  const { user, validatedData, ip } = context;
  
  if (!user) {
    throw new Error('Authentication required');
  }

  const postData = validatedData!.body;
  const startTime = Date.now();
  
  try {
    // Step 1: Security validation
    const securityContext = {
      userId: user.id,
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      operation: 'CREATE' as const,
      postData,
      isAuthenticated: true
    };

    const securityValidation = await PostSecurityMiddleware.validatePostOperation(securityContext);
    
    if (!securityValidation.allowed) {
      // Log failed attempt
      logPostOperation('POST_CREATE', false, user.id, ip, undefined, {
        reason: securityValidation.reason,
        warnings: securityValidation.warnings
      });
      
      throw new APIError(
        securityValidation.reason || 'Security validation failed',
        403,
        'SECURITY_VALIDATION_FAILED'
      );
    }

    // Use sanitized data from security validation
    const sanitizedPostData = securityValidation.sanitizedData || postData;

    // Step 2: Rate limiting check (additional to middleware)
    const rateLimitResult = await checkPostRateLimit('CREATE', user.id, true);
    if (!rateLimitResult.allowed) {
      recordFailedAttempt('CREATE', user.id, true, 'rate_limit_exceeded');
      throw new APIError(
        `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Step 3: Additional content safety check
    if (sanitizedPostData.description) {
      const safetyReport = generateContentSafetyReport(sanitizedPostData.description, 'description');
      if (!safetyReport.safe) {
        logPostOperation('POST_CREATE', false, user.id, ip, undefined, {
          reason: 'Content safety check failed',
          safetyScore: safetyReport.score,
          warnings: safetyReport.warnings
        });
        
        throw new APIError(
          'Content does not meet safety requirements',
          400,
          'CONTENT_SAFETY_VIOLATION'
        );
      }
    }

    // Step 4: Convert pricing data to Decimal for Prisma
    const createData: Prisma.PostCreateInput = {
      type: sanitizedPostData.type,
      subject: sanitizedPostData.subject,
      ageGroups: sanitizedPostData.ageGroups,
      title: sanitizedPostData.title,
      description: sanitizedPostData.description,
      availableDays: sanitizedPostData.availableDays,
      availableTimes: sanitizedPostData.availableTimes,
      preferredSchedule: sanitizedPostData.preferredSchedule,
      location: sanitizedPostData.location,
      specificLocation: sanitizedPostData.specificLocation,
      hourlyRate: sanitizedPostData.hourlyRate ? new Prisma.Decimal(sanitizedPostData.hourlyRate) : null,
      hourlyRateMin: sanitizedPostData.hourlyRateMin ? new Prisma.Decimal(sanitizedPostData.hourlyRateMin) : null,
      hourlyRateMax: sanitizedPostData.hourlyRateMax ? new Prisma.Decimal(sanitizedPostData.hourlyRateMax) : null,
      currency: 'NOK',
      user: {
        connect: { id: user.id }
      },
    };

    // Step 5: Create the post
    const newPost = await prisma.post.create({
      data: createData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            isActive: true,
            region: true,
            teacherSessions: true,
            teacherStudents: true,
            studentSessions: true,
            studentTeachers: true,
          },
        },
        _count: {
          select: {
            chats: true,
          },
        },
      },
    });

    // Step 6: Log successful creation
    const duration = Date.now() - startTime;
    logPostOperation('POST_CREATE', true, user.id, ip, newPost.id, {
      securityScore: securityValidation.securityScore,
      warnings: securityValidation.warnings,
      duration,
      postType: newPost.type,
      subject: newPost.subject
    });

    // Log to security logger
    securityLogger.log({
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      method: 'POST',
      path: '/api/posts',
      userId: user.id,
      eventType: 'API_ACCESS',
      details: {
        operation: 'POST_CREATE',
        postId: newPost.id,
        securityScore: securityValidation.securityScore,
        duration
      }
    });

    return createSuccessResponse(
      newPost,
      'Post created successfully',
      {
        postId: newPost.id,
        type: newPost.type,
        subject: newPost.subject,
        securityWarnings: securityValidation.warnings.length > 0 ? securityValidation.warnings : undefined,
        securityScore: securityValidation.securityScore
      },
      201
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error
    logPostOperation('POST_CREATE', false, user.id, ip, undefined, {
      error: error.message,
      duration,
      errorType: error.constructor.name
    });

    console.error('Error creating post:', error);
    
    if (error instanceof APIError) {
      throw error;
    }
    
    throw new APIError('Failed to create post', 500, 'POST_CREATION_FAILED');
  }
}

/**
 * GET /api/posts - Search and list tutoring posts with enhanced security
 */
async function handleSearchPosts(
  request: NextRequest,
  context: APIContext
) {
  const { validatedData, ip, user } = context;
  const searchParams = validatedData!.query;
  const startTime = Date.now();
  
  try {
    // Step 1: Rate limiting for search operations
    const identifier = user?.id || ip;
    const rateLimitResult = await checkPostRateLimit('SEARCH', identifier, !!user);
    
    if (!rateLimitResult.allowed) {
      recordFailedAttempt('SEARCH', identifier, !!user, 'rate_limit_exceeded');
      
      securityLogger.log({
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        method: 'GET',
        path: '/api/posts',
        userId: user?.id,
        eventType: 'RATE_LIMIT',
        details: {
          operation: 'POST_SEARCH',
          remaining: rateLimitResult.remaining,
          retryAfter: rateLimitResult.retryAfter
        }
      });
      
      throw new APIError(
        `Search rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Step 2: Search query validation and sanitization
    if (searchParams.q) {
      const contentValidation = filterContent(searchParams.q);
      if (!contentValidation.allowed) {
        logPostOperation('POST_SEARCH', false, user?.id, ip, undefined, {
          reason: 'Search query contains inappropriate content',
          query: searchParams.q.substring(0, 100) // Log only first 100 chars
        });
        
        throw new APIError(
          'Search query contains inappropriate content',
          400,
          'INVALID_SEARCH_QUERY'
        );
      }
      
      // Use sanitized search query
      searchParams.q = contentValidation.sanitizedContent || searchParams.q;
    }
    // Build Prisma where clause based on search parameters
    const where: Prisma.PostWhereInput = {
      isActive: true, // Only show active posts
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
        ageGroups: {
          hasSome: searchParams.ageGroups,
        },
      }),
      ...(searchParams.location && {
        OR: searchParams.includeNearbyRegions
          ? [
              { location: searchParams.location },
              { location: { in: RegionProximity[searchParams.location] || [] } },
            ]
          : [{ location: searchParams.location }],
      }),
      ...(searchParams.availableDays && {
        availableDays: {
          hasSome: searchParams.availableDays,
        },
      }),
      // Pricing filters - handle both fixed rates and rate ranges
      ...((searchParams.minRate !== undefined || searchParams.maxRate !== undefined) && {
        OR: [
          // Posts with fixed hourly rate
          {
            AND: [
              { hourlyRate: { not: null } },
              ...(searchParams.minRate !== undefined ? [{ hourlyRate: { gte: searchParams.minRate } }] : []),
              ...(searchParams.maxRate !== undefined ? [{ hourlyRate: { lte: searchParams.maxRate } }] : []),
            ],
          },
          // Posts with rate range
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
      // Date filters
      ...(searchParams.createdAfter && {
        createdAt: { gte: searchParams.createdAfter },
      }),
      ...(searchParams.createdBefore && {
        createdAt: { lte: searchParams.createdBefore },
      }),
      // Advanced filters
      ...(searchParams.hasActiveChats && {
        chats: {
          some: {
            isActive: true,
          },
        },
      }),
      ...(searchParams.onlyVerifiedUsers && {
        user: {
          documents: {
            some: {
              verificationStatus: 'VERIFIED',
            },
          },
        },
      }),
    };

    // Build order by clause
    const orderBy: Prisma.PostOrderByWithRelationInput[] = [];
    
    switch (searchParams.sortBy) {
      case 'hourlyRate':
        // Sort by fixed rate first, then by rate range average
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

    // Calculate pagination
    const { skip, take, hasNext, hasPrev } = calculatePagination(
      searchParams.page,
      searchParams.limit,
      0 // We'll get the total count separately
    );

    // Execute queries in parallel
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
              teacherSessions: true,
              teacherStudents: true,
              studentSessions: true,
              studentTeachers: true,
            },
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

    // Calculate actual pagination info
    const pagination = {
      page: searchParams.page,
      limit: searchParams.limit,
      total: totalCount,
      hasNext: searchParams.page * searchParams.limit < totalCount,
      hasPrev: searchParams.page > 1,
    };

    // Step 4: Log successful search
    const duration = Date.now() - startTime;
    logPostOperation('POST_SEARCH', true, user?.id, ip, undefined, {
      query: searchParams.q,
      resultCount: totalCount,
      duration,
      filters: {
        type: searchParams.type,
        subject: searchParams.subject,
        location: searchParams.location
      }
    });

    // Log to security logger
    securityLogger.log({
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      method: 'GET',
      path: '/api/posts',
      userId: user?.id,
      eventType: 'API_ACCESS',
      details: {
        operation: 'POST_SEARCH',
        resultCount: totalCount,
        duration,
        hasQuery: !!searchParams.q
      }
    });

    return createPaginatedResponse(
      posts,
      pagination,
      `Found ${totalCount} posts`,
      {
        filters: {
          type: searchParams.type,
          subject: searchParams.subject,
          location: searchParams.location,
          minRate: searchParams.minRate,
          maxRate: searchParams.maxRate,
          onlyVerifiedUsers: searchParams.onlyVerifiedUsers,
        },
        search: searchParams.q,
        sorting: {
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
        },
        security: {
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime
          }
        }
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error
    logPostOperation('POST_SEARCH', false, user?.id, ip, undefined, {
      error: error.message,
      duration,
      errorType: error.constructor.name,
      query: searchParams.q?.substring(0, 100)
    });

    console.error('Error searching posts:', error);
    
    if (error instanceof APIError) {
      throw error;
    }
    
    throw new APIError('Failed to search posts', 500, 'POST_SEARCH_FAILED');
  }
}

// Export handlers with enhanced security middleware
export const POST = createAPIHandler(handleCreatePost, {
  requireAuth: true,
  validation: {
    body: CreatePostSchema,
  },
  rateLimit: {
    maxAttempts: 3, // Reduced from 5 for security
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyGenerator: (req) => `post-create:${req.headers.get('authorization') || req.ip}`,
  },
  cors: {
    origin: [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'https://tutorconnect.no',
      'https://www.tutorconnect.no'
    ],
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  language: 'no' // Norwegian language for error messages
});

export const GET = createAPIHandler(handleSearchPosts, {
  optionalAuth: true,
  validation: {
    query: PostSearchSchema,
  },
  rateLimit: {
    maxAttempts: 60, // Increased for legitimate search usage
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (req) => {
      // Different limits for authenticated vs anonymous users
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        return `post-search-auth:${authHeader}`;
      }
      return `post-search-anon:${req.ip}`;
    },
  },
  cors: {
    origin: [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'https://tutorconnect.no',
      'https://www.tutorconnect.no'
    ],
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  language: 'no'
});