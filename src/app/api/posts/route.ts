import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PostSearchSchema } from '@/schemas/post';

/**
 * POST /api/posts - Create a new post (placeholder)
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'POST not implemented in simplified version' }, { status: 501 });
}

/**
 * Simplified GET /api/posts - Search posts with proper PAUSET filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate search parameters
    const params = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '12'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      type: searchParams.get('type'),
      subject: searchParams.get('subject'),
      location: searchParams.get('location'),
      userId: searchParams.get('userId'),
      includePaused: searchParams.get('includePaused') === 'true',
      q: searchParams.get('q'),
    };

    // Build where clause
    const where: any = {
      isActive: true,
    };

    // Add type filter
    if (params.type) {
      where.type = params.type;
    }

    // Add user filter for "Mine annonser"
    if (params.userId) {
      where.userId = params.userId;
    }

    // Add search filter
    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
        { user: { name: { contains: params.q, mode: 'insensitive' } } },
      ];
    }

    // Add subject filter
    if (params.subject) {
      where.subject = params.subject;
    }

    // Add location filter
    if (params.location) {
      where.location = params.location;
    }

    // CRITICAL: Add status filter - exclude PAUSET posts by default
    if (!params.includePaused) {
      where.status = 'AKTIV';
    }

    // Calculate pagination
    const skip = (params.page - 1) * params.limit;

    // Execute query
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: {
          [params.sortBy]: params.sortOrder,
        },
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

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / params.limit);
    const hasNext = params.page < totalPages;
    const hasPrev = params.page > 1;

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalCount,
        totalPages,
        hasNext,
        hasPrev,
      },
      message: `Found ${totalCount} posts`,
      debug: {
        includePaused: params.includePaused,
        statusFilter: !params.includePaused ? 'AKTIV only' : 'All statuses',
        whereClause: where,
      },
    });

  } catch (error) {
    console.error('Simplified API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch posts',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}