import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser, requireAdmin } from '@/middleware/auth';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/errors';
import { MessageType } from "@prisma/client";
import { z } from 'zod';

const prisma = new PrismaClient();

// Moderation action schema
const moderationSchema = z.object({
  action: z.enum(['warn', 'mute', 'ban', 'delete_messages', 'archive', 'restore']),
  reason: z.string().min(1).max(500),
  duration: z.number().optional(), // Duration in minutes for temporary actions
  messageIds: z.array(z.string()).optional(), // For message-specific actions
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
});

// Report chat schema
const reportSchema = z.object({
  reason: z.enum([
    'spam', 
    'harassment', 
    'inappropriate_content', 
    'scam', 
    'fake_profile', 
    'other'
  ]),
  description: z.string().max(1000).optional(),
  messageIds: z.array(z.string()).optional(),
});

interface RouteParams {
  chatId: string;
}

/**
 * Helper function to validate moderation access
 */
async function validateModerationAccess(chatId: string, userId: string) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      participants: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      relatedPost: {
        select: {
          id: true,
          userId: true,
          title: true,
        },
      },
    },
  });

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  // Check if user is post owner (has moderation rights for post-related chats)
  const isPostOwner = chat.relatedPost?.userId === userId;
  
  // Check if user is participant
  const isParticipant = chat.participants.some(p => p.userId === userId);

  return { chat, isPostOwner, isParticipant };
}

/**
 * POST /api/chat/[chatId]/moderate - Perform moderation actions
 */
async function handlePOST(request: NextRequest, { params }: { params: RouteParams }) {
  const user = getAuthenticatedUser(request);
  const { chatId } = params;
  const body = await request.json();

  // This endpoint requires admin privileges for most actions
  // Post owners can perform limited moderation on their post-related chats
  const { chat, isPostOwner } = await validateModerationAccess(chatId, user.id);

  // Validate input
  const { action, reason, duration, messageIds, severity } = moderationSchema.parse(body);

  // Check permissions based on action
  const isAdmin = await isUserAdmin(user.id);
  
  if (!isAdmin && !isPostOwner) {
    throw new ForbiddenError('Insufficient permissions for moderation actions');
  }

  // Post owners can only perform limited actions
  if (!isAdmin && isPostOwner) {
    const allowedPostOwnerActions = ['warn', 'archive'];
    if (!allowedPostOwnerActions.includes(action)) {
      throw new ForbiddenError('Post owners can only warn users or archive chats');
    }
  }

  // Log moderation action
  const moderationLog = await prisma.$transaction(async (tx) => {
    // Create moderation log entry (this would require a ModerationLog model)
    const logEntry = {
      moderatorId: user.id,
      chatId,
      action,
      reason,
      severity,
      duration,
      messageIds: messageIds || [],
      timestamp: new Date(),
    };

    // Perform the moderation action
    let resultMessage = '';
    let affectedUsers: string[] = [];

    switch (action) {
      case 'warn':
        // Send warning message to chat
        await tx.message.create({
          data: {
            content: `⚠️ Warning: ${reason}`,
            type: MessageType.SYSTEM_MESSAGE,
            chatId,
            senderId: user.id,
          },
        });
        resultMessage = 'Warning issued to chat participants';
        affectedUsers = chat.participants.map(p => p.userId);
        break;

      case 'mute':
        if (!duration) {
          throw new BadRequestError('Duration required for mute action');
        }
        // This would require additional schema fields for muting
        // For now, add system message
        await tx.message.create({
          data: {
            content: `🔇 Chat muted for ${duration} minutes. Reason: ${reason}`,
            type: MessageType.SYSTEM_MESSAGE,
            chatId,
            senderId: user.id,
          },
        });
        resultMessage = `Chat muted for ${duration} minutes`;
        break;

      case 'ban':
        // Deactivate all participants except the moderator
        await tx.chatParticipant.updateMany({
          where: {
            chatId,
            userId: { not: user.id },
          },
          data: {
            isActive: false,
            leftAt: new Date(),
          },
        });

        await tx.message.create({
          data: {
            content: `🚫 Chat banned. Reason: ${reason}`,
            type: MessageType.SYSTEM_MESSAGE,
            chatId,
            senderId: user.id,
          },
        });

        await tx.chat.update({
          where: { id: chatId },
          data: { isActive: false },
        });

        resultMessage = 'Chat banned and participants removed';
        affectedUsers = chat.participants.map(p => p.userId);
        break;

      case 'delete_messages':
        if (!messageIds || messageIds.length === 0) {
          throw new BadRequestError('Message IDs required for message deletion');
        }

        // Soft delete messages by updating content
        const deletedCount = await tx.message.updateMany({
          where: {
            id: { in: messageIds },
            chatId,
          },
          data: {
            content: '[Message deleted by moderator]',
            type: MessageType.SYSTEM_MESSAGE,
            isEdited: true,
            editedAt: new Date(),
          },
        });

        resultMessage = `${deletedCount.count} messages deleted`;
        break;

      case 'archive':
        await tx.chat.update({
          where: { id: chatId },
          data: { isActive: false },
        });

        await tx.message.create({
          data: {
            content: `📁 Chat archived. Reason: ${reason}`,
            type: MessageType.SYSTEM_MESSAGE,
            chatId,
            senderId: user.id,
          },
        });

        resultMessage = 'Chat archived';
        break;

      case 'restore':
        await tx.chat.update({
          where: { id: chatId },
          data: { isActive: true },
        });

        await tx.message.create({
          data: {
            content: `🔓 Chat restored by moderator`,
            type: MessageType.SYSTEM_MESSAGE,
            chatId,
            senderId: user.id,
          },
        });

        resultMessage = 'Chat restored';
        break;

      default:
        throw new BadRequestError('Invalid moderation action');
    }

    return { logEntry, resultMessage, affectedUsers };
  });

  // Send notifications to affected users (this would integrate with notification system)
  for (const userId of moderationLog.affectedUsers) {
    console.log(`Moderation notification for user ${userId}: ${action} - ${reason}`);
  }

  return {
    success: true,
    data: {
      action,
      message: moderationLog.resultMessage,
      moderatedBy: {
        id: user.id,
        name: user.name,
      },
      timestamp: new Date(),
      affectedUsers: moderationLog.affectedUsers.length,
    },
  };
}

/**
 * POST /api/chat/[chatId]/moderate/report - Report chat for violations
 */
async function handleReport(request: NextRequest, { params }: { params: RouteParams }) {
  const user = getAuthenticatedUser(request);
  const { chatId } = params;
  const body = await request.json();

  // Validate user access to chat
  const { isParticipant } = await validateModerationAccess(chatId, user.id);
  
  if (!isParticipant) {
    throw new ForbiddenError('You must be a participant to report this chat');
  }

  // Validate input
  const { reason, description, messageIds } = reportSchema.parse(body);

  // Check for duplicate reports
  const existingReport = await prisma.chatReport.findFirst({
    where: {
      chatId,
      reporterId: user.id,
      status: { in: ['PENDING', 'UNDER_REVIEW'] },
    },
  });

  if (existingReport) {
    throw new BadRequestError('You already have a pending report for this chat');
  }

  // Create report
  const report = await prisma.$transaction(async (tx) => {
    const newReport = await tx.chatReport.create({
      data: {
        chatId,
        reporterId: user.id,
        reason,
        description,
        messageIds: messageIds || [],
        status: 'PENDING',
        priority: reason === 'harassment' || reason === 'scam' ? 'HIGH' : 'MEDIUM',
      },
    });

    // Add system message about report (optional, might not want to notify all users)
    if (reason === 'spam' || reason === 'scam') {
      await tx.message.create({
        data: {
          content: `Report submitted for review`,
          type: MessageType.SYSTEM_MESSAGE,
          chatId,
          senderId: user.id,
        },
      });
    }

    return newReport;
  });

  // Notify administrators about the report
  console.log(`New chat report: ${report.id} for chat ${chatId} by user ${user.id}`);

  return {
    success: true,
    data: {
      reportId: report.id,
      message: 'Report submitted successfully. Moderators will review it soon.',
      status: 'PENDING',
      estimatedReviewTime: '24-48 hours',
    },
  };
}

/**
 * GET /api/chat/[chatId]/moderate - Get moderation info and reports
 */
async function handleGET(request: NextRequest, { params }: { params: RouteParams }) {
  const user = getAuthenticatedUser(request);
  const { chatId } = params;

  // Check if user is admin or post owner
  const { chat, isPostOwner } = await validateModerationAccess(chatId, user.id);
  const isAdmin = await isUserAdmin(user.id);

  if (!isAdmin && !isPostOwner) {
    throw new ForbiddenError('Insufficient permissions to view moderation info');
  }

  // Get chat moderation status and reports
  const [reports, moderationLogs] = await Promise.all([
    prisma.chatReport.findMany({
      where: { chatId },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    // This would require a ModerationLog model
    // For now, return empty array
    Promise.resolve([]),
  ]);

  // Get chat statistics for moderation review
  const [totalMessages, participantCount, recentActivity] = await Promise.all([
    prisma.message.count({ where: { chatId } }),
    prisma.chatParticipant.count({ where: { chatId, isActive: true } }),
    prisma.message.count({
      where: {
        chatId,
        sentAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    }),
  ]);

  // Check for suspicious patterns
  const suspiciousIndicators = [];
  
  if (recentActivity > 100) {
    suspiciousIndicators.push('High message volume (24h)');
  }
  
  if (participantCount > 8) {
    suspiciousIndicators.push('Large participant count');
  }

  const activeReports = reports.filter(r => r.status === 'PENDING' || r.status === 'UNDER_REVIEW');

  return {
    success: true,
    data: {
      chatId,
      moderationStatus: {
        isActive: chat.isActive,
        totalReports: reports.length,
        activeReports: activeReports.length,
        highPriorityReports: reports.filter(r => r.priority === 'HIGH').length,
        lastReportDate: reports.length > 0 ? reports[0].createdAt : null,
      },
      statistics: {
        totalMessages,
        participantCount,
        recentActivity,
        createdAt: chat.createdAt,
        lastActivity: chat.lastMessageAt,
      },
      suspiciousIndicators,
      reports: isAdmin ? reports : reports.filter(r => r.reporterId === user.id), // Post owners see limited info
      moderationLogs, // Empty for now
      availableActions: isAdmin 
        ? ['warn', 'mute', 'ban', 'delete_messages', 'archive', 'restore']
        : ['warn', 'archive'], // Limited actions for post owners
    },
  };
}

/**
 * Helper function to check if user is admin
 */
async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) return false;

  // Check admin email domains
  const adminDomains = ['@tutorconnect.no', '@admin.tutorconnect.no'];
  const isAdminEmail = adminDomains.some(domain => user.email.includes(domain));
  
  // Also check against environment variable
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const isInAdminList = adminEmails.includes(user.email);

  return isAdminEmail || isInAdminList;
}

// Note: Need to create ChatReport model in schema
// This is referenced but not yet implemented in the current schema

export const GET = apiHandler({
  requireAuth: true,
  middlewares: [authMiddleware],
  handler: handleGET,
});

export const POST = apiHandler({
  requireAuth: true,
  middlewares: [authMiddleware],
  handler: handlePOST,
});

// Add report endpoint as a separate export for clarity
export { handleReport as handleReportPOST };