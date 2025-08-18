import { z } from 'zod';
import { MessageType } from '@prisma/client';

/**
 * Chat Room Management Validation Schemas
 * For TutorConnect BACK-004: Chat Room Management API
 */

// Chat creation schema
export const createChatSchema = z.object({
  relatedPostId: z.string().cuid('Invalid post ID format').optional(),
  participantIds: z
    .array(z.string().cuid('Invalid user ID format'))
    .min(1, 'At least one participant is required')
    .max(10, 'Maximum 10 participants allowed'),
  initialMessage: z
    .string()
    .min(1, 'Initial message is required')
    .max(1000, 'Initial message cannot exceed 1000 characters')
    .optional(),
  includeProfile: z.boolean().optional().default(false),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;

// Chat listing/filtering schema
export const listChatsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => val ? Math.max(1, parseInt(val)) : 1),
  limit: z
    .string()
    .optional()
    .transform(val => val ? Math.min(Math.max(1, parseInt(val)), 50) : 20),
  status: z.enum(['active', 'inactive', 'archived', 'blocked', 'all']).optional().default('active'),
  postId: z.string().cuid().optional(),
  participantId: z.string().cuid().optional(),
  search: z.string().min(1).max(100).optional(),
  sortBy: z.enum(['lastMessageAt', 'createdAt', 'unreadCount']).optional().default('lastMessageAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ListChatsInput = z.infer<typeof listChatsSchema>;

// Chat update schema
export const updateChatSchema = z.object({
  isActive: z.boolean().optional(),
  status: z.enum(['active', 'archived', 'blocked']).optional(),
  lastReadAt: z.string().datetime().optional(),
});

export type UpdateChatInput = z.infer<typeof updateChatSchema>;

// Chat participant management schema
export const manageChatParticipantsSchema = z.object({
  action: z.enum(['add', 'remove', 'leave', 'kick']),
  participantIds: z
    .array(z.string().cuid('Invalid user ID format'))
    .min(1, 'At least one participant ID is required')
    .max(5, 'Maximum 5 participants can be managed at once'),
  reason: z.string().max(200).optional(), // For kicks/removals
});

export type ManageChatParticipantsInput = z.infer<typeof manageChatParticipantsSchema>;

// Chat details query schema
export const getChatDetailsSchema = z.object({
  includeMessages: z.boolean().optional().default(true),
  messageLimit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .default(50),
  messageOffset: z.number().min(0).optional().default(0),
  includeParticipants: z.boolean().optional().default(true),
  includePost: z.boolean().optional().default(true),
  includeAppointments: z.boolean().optional().default(false),
});

export type GetChatDetailsInput = z.infer<typeof getChatDetailsSchema>;

// Message pagination schema for chat
export const chatMessagePaginationSchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(50),
  before: z.string().cuid().optional(), // Message ID cursor
  after: z.string().cuid().optional(),  // Message ID cursor
  messageType: z.nativeEnum(MessageType).optional(),
  search: z.string().min(1).max(100).optional(),
});

export type ChatMessagePaginationInput = z.infer<typeof chatMessagePaginationSchema>;

// Initiate chat with post schema
export const initiateChatWithPostSchema = z.object({
  message: z
    .string()
    .min(1, 'Initial message is required')
    .max(1000, 'Message cannot exceed 1000 characters'),
  includeProfile: z.boolean().optional().default(false),
});

export type InitiateChatWithPostInput = z.infer<typeof initiateChatWithPostSchema>;

// Chat settings/preferences schema
export const chatSettingsSchema = z.object({
  notifications: z.boolean().optional().default(true),
  soundEnabled: z.boolean().optional().default(true),
  emailNotifications: z.boolean().optional().default(true),
  muteUntil: z.string().datetime().optional(),
  nickname: z.string().min(1).max(50).optional(),
});

export type ChatSettingsInput = z.infer<typeof chatSettingsSchema>;

// Bulk chat operations schema
export const bulkChatOperationsSchema = z.object({
  chatIds: z
    .array(z.string().cuid('Invalid chat ID format'))
    .min(1, 'At least one chat ID is required')
    .max(20, 'Maximum 20 chats can be processed at once'),
  operation: z.enum(['archive', 'unarchive', 'delete', 'markAsRead', 'markAsUnread']),
});

export type BulkChatOperationsInput = z.infer<typeof bulkChatOperationsSchema>;

// Chat statistics schema
export const chatStatsSchema = z.object({
  timeframe: z.enum(['24h', '7d', '30d', '90d', '1y']).optional().default('30d'),
  includeTrends: z.boolean().optional().default(false),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
});

export type ChatStatsInput = z.infer<typeof chatStatsSchema>;

// Chat export schema
export const chatExportSchema = z.object({
  format: z.enum(['json', 'csv', 'txt']).optional().default('json'),
  includeMessages: z.boolean().optional().default(true),
  includeMetadata: z.boolean().optional().default(true),
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }).optional(),
});

export type ChatExportInput = z.infer<typeof chatExportSchema>;

/**
 * Chat status enums and constants
 */
export const CHAT_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive', 
  ARCHIVED: 'archived',
  BLOCKED: 'blocked',
  DELETED: 'deleted'
} as const;

export const CHAT_PARTICIPANT_LIMITS = {
  MIN_PARTICIPANTS: 2,
  MAX_PARTICIPANTS: 10,
  MAX_GROUP_PARTICIPANTS: 10,
  MAX_DIRECT_PARTICIPANTS: 2,
} as const;

export const CHAT_MESSAGE_LIMITS = {
  MIN_MESSAGE_LENGTH: 1,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_MESSAGES_PER_PAGE: 100,
  DEFAULT_MESSAGES_PER_PAGE: 50,
} as const;

export const CHAT_RATE_LIMITS = {
  MAX_CHATS_PER_HOUR: 10,
  MAX_MESSAGES_PER_MINUTE: 30,
  MAX_PARTICIPANTS_PER_HOUR: 20,
} as const;

/**
 * Validation helpers
 */

/**
 * Validates chat participant compatibility based on post types
 */
export function validateChatParticipantCompatibility(
  postType: 'TEACHER' | 'STUDENT',
  initiatorType: 'TEACHER' | 'STUDENT'
): { isCompatible: boolean; reason?: string } {
  // Teachers can contact student posts, students can contact teacher posts
  if (postType === 'TEACHER' && initiatorType === 'TEACHER') {
    return { 
      isCompatible: false, 
      reason: 'Teachers cannot initiate chats with other teacher posts' 
    };
  }
  
  if (postType === 'STUDENT' && initiatorType === 'STUDENT') {
    return { 
      isCompatible: false, 
      reason: 'Students cannot initiate chats with other student posts' 
    };
  }

  return { isCompatible: true };
}

/**
 * Validates chat message content for spam/inappropriate content
 */
export function validateChatMessageContent(message: string): {
  isValid: boolean;
  violations: string[];
  severity: 'low' | 'medium' | 'high';
} {
  const violations: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  // Basic spam detection patterns
  const spamPatterns = [
    /make money/i,
    /urgent.{0,10}payment/i,
    /click here/i,
    /free money/i,
    /guaranteed income/i,
  ];

  // Scam detection patterns
  const scamPatterns = [
    /wire transfer/i,
    /send money/i,
    /pay upfront/i,
    /advance payment/i,
    /western union/i,
  ];

  // Inappropriate content patterns
  const inappropriatePatterns = [
    /fake/i,
    /scam/i,
    /fraud/i,
  ];

  // Check for spam patterns
  spamPatterns.forEach(pattern => {
    if (pattern.test(message)) {
      violations.push('potential_spam');
      severity = 'medium';
    }
  });

  // Check for scam patterns
  scamPatterns.forEach(pattern => {
    if (pattern.test(message)) {
      violations.push('potential_scam');
      severity = 'high';
    }
  });

  // Check for inappropriate content
  inappropriatePatterns.forEach(pattern => {
    if (pattern.test(message)) {
      violations.push('inappropriate_content');
      severity = 'medium';
    }
  });

  // Check message length
  if (message.length > CHAT_MESSAGE_LIMITS.MAX_MESSAGE_LENGTH) {
    violations.push('message_too_long');
  }

  if (message.length < CHAT_MESSAGE_LIMITS.MIN_MESSAGE_LENGTH) {
    violations.push('message_too_short');
  }

  return {
    isValid: violations.length === 0,
    violations,
    severity,
  };
}

/**
 * Validates chat rate limiting for user
 */
export function shouldApplyChatRateLimit(
  recentChatCount: number,
  timeWindowHours: number = 1
): { isLimited: boolean; waitTimeMinutes?: number } {
  const maxChatsPerHour = CHAT_RATE_LIMITS.MAX_CHATS_PER_HOUR;
  
  if (recentChatCount >= maxChatsPerHour) {
    const waitTimeMinutes = Math.ceil((timeWindowHours * 60) - 
      ((Date.now() - (Date.now() - timeWindowHours * 60 * 60 * 1000)) / (60 * 1000)));
    
    return {
      isLimited: true,
      waitTimeMinutes: Math.max(waitTimeMinutes, 1),
    };
  }

  return { isLimited: false };
}

/**
 * Generate chat room metadata for search and filtering
 */
export function generateChatMetadata(chat: {
  id: string;
  relatedPostId?: string | null;
  participants: Array<{ user: { name: string } }>;
  messages: Array<{ content: string; createdAt: Date }>;
}) {
  const participantNames = chat.participants.map(p => p.user.name).join(', ');
  const lastMessage = chat.messages[0];
  const messageCount = chat.messages.length;
  
  return {
    searchableContent: `${participantNames} ${lastMessage?.content || ''}`,
    participantCount: chat.participants.length,
    messageCount,
    lastActivity: lastMessage?.createdAt || new Date(),
    chatType: chat.participants.length > 2 ? 'group' : 'direct',
    isPostRelated: !!chat.relatedPostId,
  };
}