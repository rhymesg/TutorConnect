/**
 * Individual Post API endpoints
 * Handles GET, PATCH, and DELETE operations for specific posts
 */

import { NextRequest } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { 
  createAPIHandler, 
  createSuccessResponse,
  APIContext
} from '@/lib/api-handler';
import { UpdatePostSchema, PostIdSchema } from '@/schemas/post';
import { APIError } from '@/lib/errors';

const prisma = new PrismaClient();

/**
 * GET /api/posts/[postId] - Get individual post with full details
 */
async function handleGetPost(
  request: NextRequest,
  context: APIContext,
  params: any
) {
  const { user } = context;
  const { postId } = params;
  
  try {
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
        isActive: true, // Only return active posts
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            isActive: true,
            region: true,
            school: true,
            degree: true,
            certifications: true,
            bio: true,
            // Privacy-aware fields
            gender: true,
            birthYear: true,
            privacyGender: true,
            privacyAge: true,
            privacyDocuments: true,
            privacyContact: true,
          },
        },
        chats: {
          where: {
            isActive: true,
            // Only include chats if user is authenticated and is a participant
            ...(user && {
              participants: {
                some: {
                  userId: user.id,
                  isActive: true,
                },
              },
            }),
          },
          select: {
            id: true,
            createdAt: true,
            lastMessageAt: true,
            _count: {
              select: {
                messages: true,
              },
            },
          },
        },
        _count: {
          select: {
            chats: true,
          },
        },
      },
    });

    if (!post) {
      throw new APIError('Post not found', 404, 'POST_NOT_FOUND');
    }

    // Apply privacy settings to user data
    const sanitizedUser = {
      ...post.user,
      gender: post.user.privacyGender === 'PRIVATE' ? undefined : post.user.gender,
      birthYear: post.user.privacyAge === 'PRIVATE' ? undefined : post.user.birthYear,
      school: post.user.privacyDocuments === 'PRIVATE' ? undefined : post.user.school,
      degree: post.user.privacyDocuments === 'PRIVATE' ? undefined : post.user.degree,
      certifications: post.user.privacyDocuments === 'PRIVATE' ? undefined : post.user.certifications,
    };

    const responseData = {
      ...post,
      user: sanitizedUser,
      // Add convenience fields
      isOwner: user?.id === post.user.id,
      hasActiveChat: post.chats.length > 0,
      canContact: post.user.privacyContact !== 'PRIVATE' || user?.id === post.user.id,
    };

    return createSuccessResponse(
      responseData,
      'Post retrieved successfully',
      {
        viewedAt: new Date().toISOString(),
        postType: post.type,
        subject: post.subject,
        location: post.location,
      }
    );
  } catch (error) {
    console.error('Error retrieving post:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new Error('Failed to retrieve post');
  }
}

/**
 * PATCH /api/posts/[postId] - Update post (only by owner)
 */
async function handleUpdatePost(
  request: NextRequest,
  context: APIContext,
  params: any
) {
  const { user, validatedData } = context;
  const { postId } = params;
  
  if (!user) {
    throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const updateData = validatedData!.body;

  try {
    // First, verify the post exists and user owns it
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true, isActive: true },
    });

    if (!existingPost) {
      throw new APIError('Post not found', 404, 'POST_NOT_FOUND');
    }

    if (!existingPost.isActive) {
      throw new APIError('Cannot update inactive post', 400, 'POST_INACTIVE');
    }

    if (existingPost.userId !== user.id) {
      throw new APIError('Not authorized to update this post', 403, 'FORBIDDEN');
    }

    // Prepare update data with proper Decimal conversion for pricing
    const updatePayload: Prisma.PostUpdateInput = {
      ...updateData,
      ...(updateData.hourlyRate !== undefined && {
        hourlyRate: updateData.hourlyRate ? new Prisma.Decimal(updateData.hourlyRate) : null,
      }),
      ...(updateData.hourlyRateMin !== undefined && {
        hourlyRateMin: updateData.hourlyRateMin ? new Prisma.Decimal(updateData.hourlyRateMin) : null,
      }),
      ...(updateData.hourlyRateMax !== undefined && {
        hourlyRateMax: updateData.hourlyRateMax ? new Prisma.Decimal(updateData.hourlyRateMax) : null,
      }),
      updatedAt: new Date(),
    };

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: updatePayload,
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
      updatedPost,
      'Post updated successfully',
      {
        updatedFields: Object.keys(updateData),
        updatedAt: updatedPost.updatedAt,
      }
    );
  } catch (error) {
    console.error('Error updating post:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new Error('Failed to update post');
  }
}

/**
 * DELETE /api/posts/[postId] - Soft delete post (deactivate)
 */
async function handleDeletePost(
  request: NextRequest,
  context: APIContext,
  params: any
) {
  const { user } = context;
  const { postId } = params;
  
  if (!user) {
    throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
  }

  try {
    // Verify the post exists and user owns it
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { 
        userId: true, 
        isActive: true,
        _count: {
          select: {
            chats: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!existingPost) {
      throw new APIError('Post not found', 404, 'POST_NOT_FOUND');
    }

    if (existingPost.userId !== user.id) {
      throw new APIError('Not authorized to delete this post', 403, 'FORBIDDEN');
    }

    if (!existingPost.isActive) {
      throw new APIError('Post is already inactive', 400, 'POST_ALREADY_INACTIVE');
    }

    // Soft delete - set isActive to false
    // Note: We keep related chats active but mark the post as inactive
    const deletedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return createSuccessResponse(
      {
        postId: deletedPost.id,
        title: deletedPost.title,
        isActive: deletedPost.isActive,
        deletedAt: deletedPost.updatedAt,
      },
      'Post deleted successfully',
      {
        affectedChats: existingPost._count.chats,
        note: 'Post has been deactivated. Existing chats remain active.',
      }
    );
  } catch (error) {
    console.error('Error deleting post:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new Error('Failed to delete post');
  }
}

// Export handlers with proper middleware
export const GET = createAPIHandler(handleGetPost, {
  optionalAuth: true,
  validation: {
    params: PostIdSchema,
  },
  rateLimit: {
    maxAttempts: 30,
    windowMs: 60 * 1000, // 1 minute
  },
});

export const PATCH = createAPIHandler(handleUpdatePost, {
  requireAuth: true,
  validation: {
    params: PostIdSchema,
    body: UpdatePostSchema,
  },
  rateLimit: {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
  },
});

export const DELETE = createAPIHandler(handleDeletePost, {
  requireAuth: true,
  validation: {
    params: PostIdSchema,
  },
  rateLimit: {
    maxAttempts: 5,
    windowMs: 60 * 1000, // 1 minute
  },
});