/**
 * Post Moderation API
 * Handles post status management and moderation actions
 * NOTE: In a full implementation, this would require admin roles
 */

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { 
  createAPIHandler, 
  createSuccessResponse,
  APIContext
} from '@/lib/api-handler';
import { PostIdSchema } from '@/schemas/post';
import { APIError } from '@/lib/errors';

const prisma = new PrismaClient();

// Moderation action schema
const ModerationActionSchema = z.object({
  action: z.enum([
    'activate',
    'deactivate', 
    'flag_inappropriate',
    'unflag',
    'feature',
    'unfeature',
    'hide_temporarily',
    'restore_visibility'
  ]),
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters')
    .optional(),
  duration: z.number()
    .min(1)
    .max(365)
    .optional(), // Duration in days for temporary actions
  notifyUser: z.boolean().default(true),
});

/**
 * PATCH /api/posts/[postId]/moderate - Moderate post (admin action)
 */
async function handleModeratePost(
  request: NextRequest,
  context: APIContext,
  params: any
) {
  const { user, validatedData } = context;
  const { postId } = params;
  const { action, reason, duration, notifyUser } = validatedData!.body;
  
  if (!user) {
    throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
  }

  // TODO: In production, verify user has moderator/admin role
  // For now, only post owners can moderate their own posts
  
  try {
    // Get the post with current status
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            chats: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!post) {
      throw new APIError('Post not found', 404, 'POST_NOT_FOUND');
    }

    // Check authorization (in production, this would check for admin role)
    const canModerate = user.id === post.userId; // TODO: || user.role === 'admin';
    
    if (!canModerate) {
      throw new APIError('Not authorized to moderate this post', 403, 'FORBIDDEN');
    }

    let updateData: any = { updatedAt: new Date() };
    let moderationLog: any = {
      postId,
      userId: user.id,
      action,
      reason,
      timestamp: new Date(),
    };

    // Apply moderation action
    switch (action) {
      case 'activate':
        updateData.isActive = true;
        break;
        
      case 'deactivate':
        updateData.isActive = false;
        break;
        
      case 'flag_inappropriate':
        // In a full system, this would set a flag field
        updateData.isActive = false;
        moderationLog.severity = 'high';
        break;
        
      case 'unflag':
        updateData.isActive = true;
        break;
        
      case 'feature':
        // In a full system, this would set a featured field
        // For now, we'll use the description to indicate featured status
        break;
        
      case 'unfeature':
        // Remove featured status
        break;
        
      case 'hide_temporarily':
        updateData.isActive = false;
        if (duration) {
          moderationLog.duration = duration;
          // In a full system, set a restoration date
        }
        break;
        
      case 'restore_visibility':
        updateData.isActive = true;
        break;
        
      default:
        throw new APIError('Invalid moderation action', 400, 'INVALID_ACTION');
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            chats: true,
          },
        },
      },
    });

    // Log the moderation action (in a full system, this would go to a moderation_logs table)
    console.log('Moderation action logged:', moderationLog);

    // Send notification if requested (in a full system)
    if (notifyUser && post.user.email) {
      console.log(`Would send notification to ${post.user.email} about moderation action: ${action}`);
    }

    // Calculate impact of the action
    const impact = {
      affectedChats: post._count.chats,
      postVisibility: updatedPost.isActive,
      actionTimestamp: new Date().toISOString(),
    };

    return createSuccessResponse(
      {
        postId: updatedPost.id,
        action,
        newStatus: {
          isActive: updatedPost.isActive,
          lastUpdated: updatedPost.updatedAt,
        },
        moderatedBy: {
          id: user.id,
          name: user.name,
        },
        reason,
        impact,
      },
      `Post ${action} completed successfully`,
      {
        moderationId: `mod_${Date.now()}`,
        affectedUsers: post.user.name,
        reversible: ['activate', 'deactivate', 'hide_temporarily', 'restore_visibility'].includes(action),
      }
    );
    
  } catch (error) {
    console.error('Error moderating post:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new Error('Moderation action failed');
  }
}

/**
 * GET /api/posts/[postId]/moderate - Get moderation history and status
 */
async function handleGetModerationInfo(
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
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!post) {
      throw new APIError('Post not found', 404, 'POST_NOT_FOUND');
    }

    // Check authorization
    const canViewModeration = user.id === post.userId; // TODO: || user.role === 'admin';
    
    if (!canViewModeration) {
      throw new APIError('Not authorized to view moderation info', 403, 'FORBIDDEN');
    }

    // In a full system, we'd fetch from moderation_logs table
    const moderationInfo = {
      postId: post.id,
      currentStatus: {
        isActive: post.isActive,
        lastStatusChange: post.updatedAt,
      },
      moderationHistory: [
        // This would come from moderation_logs in a full system
        {
          action: 'create',
          timestamp: post.createdAt,
          moderatedBy: post.user,
          reason: 'Post created',
        },
      ],
      availableActions: generateAvailableActions(post, user),
      guidelines: {
        prohibitedContent: [
          'Inappropriate or offensive language',
          'False or misleading information about qualifications',
          'Contact information in post content (should use chat system)',
          'Duplicate posts for the same service',
          'Spam or excessive self-promotion',
        ],
        bestPractices: [
          'Clear and descriptive titles',
          'Detailed but concise descriptions',
          'Accurate pricing information',
          'Realistic availability schedules',
          'Professional language and tone',
        ],
      },
    };

    return createSuccessResponse(
      moderationInfo,
      'Moderation information retrieved successfully'
    );
    
  } catch (error) {
    console.error('Error retrieving moderation info:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new Error('Failed to retrieve moderation information');
  }
}

function generateAvailableActions(post: any, user: any) {
  const actions = [];
  
  // Owner actions
  if (user.id === post.userId) {
    if (post.isActive) {
      actions.push({
        action: 'deactivate',
        description: 'Temporarily hide your post from search results',
        reason: 'User requested deactivation',
      });
    } else {
      actions.push({
        action: 'activate',
        description: 'Make your post visible in search results again',
        reason: 'User requested reactivation',
      });
    }
  }

  // TODO: Admin actions would go here
  /*
  if (user.role === 'admin') {
    actions.push(
      {
        action: 'flag_inappropriate',
        description: 'Flag post as inappropriate and hide it',
        requiresReason: true,
      },
      {
        action: 'feature',
        description: 'Feature this post in search results',
        requiresReason: false,
      },
      // ... more admin actions
    );
  }
  */

  return actions;
}

// Export handlers
export const PATCH = createAPIHandler(handleModeratePost, {
  requireAuth: true,
  validation: {
    params: PostIdSchema,
    body: ModerationActionSchema,
  },
  rateLimit: {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
  },
});

export const GET = createAPIHandler(handleGetModerationInfo, {
  requireAuth: true,
  validation: {
    params: PostIdSchema,
  },
  rateLimit: {
    maxAttempts: 20,
    windowMs: 60 * 1000, // 1 minute
  },
});