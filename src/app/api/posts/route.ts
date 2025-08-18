/**
 * Posts API endpoints - Main posts collection operations
 * Handles POST (create) and GET (search/list) operations
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

const prisma = new PrismaClient();

/**
 * POST /api/posts - Create a new tutoring post
 */
async function handleCreatePost(
  request: NextRequest, 
  context: APIContext
) {
  const { user, validatedData } = context;
  
  if (!user) {
    throw new Error('Authentication required');
  }

  const postData = validatedData!.body;
  
  try {
    // Convert pricing data to Decimal for Prisma
    const createData: Prisma.PostCreateInput = {
      type: postData.type,
      subject: postData.subject,
      ageGroups: postData.ageGroups,
      title: postData.title,
      description: postData.description,
      availableDays: postData.availableDays,
      availableTimes: postData.availableTimes,
      preferredSchedule: postData.preferredSchedule,
      location: postData.location,
      specificLocation: postData.specificLocation,
      hourlyRate: postData.hourlyRate ? new Prisma.Decimal(postData.hourlyRate) : null,
      hourlyRateMin: postData.hourlyRateMin ? new Prisma.Decimal(postData.hourlyRateMin) : null,
      hourlyRateMax: postData.hourlyRateMax ? new Prisma.Decimal(postData.hourlyRateMax) : null,
      currency: 'NOK',
      user: {
        connect: { id: user.id }
      },
    };

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
          },
        },
        _count: {
          select: {
            chats: true,
          },
        },
      },
    });

    return createSuccessResponse(
      newPost,
      'Post created successfully',
      {
        postId: newPost.id,
        type: newPost.type,
        subject: newPost.subject,
      },
      201
    );
  } catch (error) {
    console.error('Error creating post:', error);
    throw new Error('Failed to create post');
  }
}

/**
 * GET /api/posts - Search and list tutoring posts with advanced filtering
 */
async function handleSearchPosts(
  request: NextRequest,
  context: APIContext
) {
  const { validatedData } = context;
  const searchParams = validatedData!.query;
  
  try {
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
      }
    );
  } catch (error) {
    console.error('Error searching posts:', error);
    throw new Error('Failed to search posts');
  }
}

// Export handlers with proper middleware
export const POST = createAPIHandler(handleCreatePost, {
  requireAuth: true,
  validation: {
    body: CreatePostSchema,
  },
  rateLimit: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
});

export const GET = createAPIHandler(handleSearchPosts, {
  optionalAuth: true,
  validation: {
    query: PostSearchSchema,
  },
  rateLimit: {
    maxAttempts: 30,
    windowMs: 60 * 1000, // 1 minute
  },
});