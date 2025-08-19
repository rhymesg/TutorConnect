import { PrismaClient, MessageType, Subject, PostType, NorwegianRegion } from '@prisma/client';
import { ForbiddenError, BadRequestError, NotFoundError } from './errors';
import { validateChatParticipantCompatibility, validateChatMessageContent, CHAT_PARTICIPANT_LIMITS } from '@/schemas/chat';

const prisma = new PrismaClient();

/**
 * Chat Room Management Utilities
 * Provides helper functions for chat room operations, permissions, and Norwegian-specific business logic
 */

export interface ChatParticipantInfo {
  id: string;
  name: string;
  profileImage?: string | null;
  region?: NorwegianRegion | null;
  isActive: boolean;
  lastActive?: Date | null;
}

export interface ChatRoomDetails {
  id: string;
  relatedPostId?: string | null;
  isActive: boolean;
  participantCount: number;
  messageCount: number;
  lastMessageAt?: Date | null;
  chatType: 'direct' | 'group' | 'lesson';
  relatedPost?: {
    id: string;
    title: string;
    type: PostType;
    subject: Subject;
    userId: string;
  } | null;
}

export interface CreateChatRoomOptions {
  relatedPostId?: string;
  participantIds: string[];
  initialMessage?: string;
  creatorId: string;
  chatType?: 'direct' | 'group' | 'lesson';
}

export interface ChatPermissions {
  canSendMessage: boolean;
  canAddParticipants: boolean;
  canRemoveParticipants: boolean;
  canDeleteChat: boolean;
  canModerateChat: boolean;
  canAccessChatHistory: boolean;
}

/**
 * Norwegian-specific validation for chat creation between tutors and students
 */
export async function validateNorwegianTutoringChatCompatibility(
  initiatorId: string,
  targetPostId?: string
): Promise<{ isValid: boolean; reason?: string; postOwner?: any }> {
  if (!targetPostId) {
    return { isValid: true };
  }

  // Get post details and initiator profile
  const [post, initiator] = await Promise.all([
    prisma.post.findUnique({
      where: { id: targetPostId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            region: true,
            isActive: true,
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: initiatorId },
      select: {
        id: true,
        name: true,
        region: true,
        isActive: true,
        emailVerified: true,
      },
    }),
  ]);

  if (!post) {
    return { isValid: false, reason: 'Post not found' };
  }

  if (!post.isActive) {
    return { isValid: false, reason: 'Cannot create chat for inactive post' };
  }

  if (!initiator) {
    return { isValid: false, reason: 'Initiator not found' };
  }

  if (!initiator.isActive) {
    return { isValid: false, reason: 'Initiator account is inactive' };
  }

  if (!initiator.emailVerified) {
    return { isValid: false, reason: 'Email verification required before starting chats' };
  }

  // Check if initiator is trying to chat with their own post
  if (post.userId === initiatorId) {
    return { isValid: false, reason: 'Cannot create chat with your own post' };
  }

  // Validate tutor-student compatibility (teachers help students, students seek teachers)
  const compatibility = validateChatParticipantCompatibility(post.type, post.type);
  if (!compatibility.isCompatible) {
    return { isValid: false, reason: compatibility.reason };
  }

  // Norwegian region compatibility check (optional preference)
  if (initiator.region && post.user.region && initiator.region !== post.user.region) {
    // This is just a warning, not a blocker for Norwegian users
    // Different regions can still communicate
  }

  return { 
    isValid: true, 
    postOwner: post.user
  };
}

/**
 * Get comprehensive chat permissions for a user
 */
export async function getChatPermissions(
  chatId: string,
  userId: string
): Promise<ChatPermissions> {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      participants: {
        where: { userId },
      },
      relatedPost: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  const userParticipant = chat.participants.find(p => p.userId === userId);
  const isParticipant = !!userParticipant && userParticipant.isActive;
  const isPostOwner = chat.relatedPost?.userId === userId;
  const isChatActive = chat.isActive;

  return {
    canSendMessage: isParticipant && isChatActive,
    canAddParticipants: isParticipant && isChatActive,
    canRemoveParticipants: (isPostOwner || isParticipant) && isChatActive,
    canDeleteChat: isPostOwner || isParticipant,
    canModerateChat: isPostOwner,
    canAccessChatHistory: isParticipant,
  };
}

/**
 * Create a new chat room with Norwegian tutoring context
 */
export async function createChatRoom(options: CreateChatRoomOptions): Promise<ChatRoomDetails> {
  const { relatedPostId, participantIds, initialMessage, creatorId, chatType = 'direct' } = options;

  // Add creator to participants if not included
  const allParticipantIds = participantIds.includes(creatorId) 
    ? participantIds 
    : [creatorId, ...participantIds];

  // Validate participant limit
  if (allParticipantIds.length > CHAT_PARTICIPANT_LIMITS.MAX_PARTICIPANTS) {
    throw new BadRequestError(`Maximum ${CHAT_PARTICIPANT_LIMITS.MAX_PARTICIPANTS} participants allowed`);
  }

  // Validate Norwegian tutoring compatibility
  const compatibility = await validateNorwegianTutoringChatCompatibility(creatorId, relatedPostId);
  if (!compatibility.isValid) {
    throw new BadRequestError(compatibility.reason || 'Chat creation not allowed');
  }

  // Verify all participants exist and are active
  const participants = await prisma.user.findMany({
    where: {
      id: { in: allParticipantIds },
      isActive: true,
      emailVerified: true,
    },
    select: {
      id: true,
      name: true,
      profileImage: true,
      isActive: true,
      region: true,
    },
  });

  if (participants.length !== allParticipantIds.length) {
    throw new BadRequestError('One or more participants not found, inactive, or email not verified');
  }

  // Check for existing chat for this post
  if (relatedPostId) {
    const existingChat = await findExistingChatForPost(relatedPostId, allParticipantIds);
    if (existingChat) {
      return await getChatRoomDetails(existingChat.id);
    }
  }

  // Validate initial message if provided
  if (initialMessage) {
    const messageValidation = validateChatMessageContent(initialMessage);
    if (!messageValidation.isValid) {
      throw new BadRequestError(`Message validation failed: ${messageValidation.violations.join(', ')}`);
    }
  }

  // Create chat in transaction
  const newChat = await prisma.$transaction(async (tx) => {
    // Create the chat
    const chat = await tx.chat.create({
      data: {
        relatedPostId,
        isActive: true,
      },
    });

    // Add all participants
    await tx.chatParticipant.createMany({
      data: allParticipantIds.map(participantId => ({
        chatId: chat.id,
        userId: participantId,
        joinedAt: new Date(),
        isActive: true,
        unreadCount: 0,
      })),
    });

    // Send initial message if provided
    if (initialMessage) {
      await tx.message.create({
        data: {
          content: initialMessage,
          type: MessageType.TEXT,
          chatId: chat.id,
          senderId: creatorId,
        },
      });

      // Update chat's last message timestamp
      await tx.chat.update({
        where: { id: chat.id },
        data: { lastMessageAt: new Date() },
      });
    }

    // Add system message for chat creation
    const creator = participants.find(p => p.id === creatorId);
    const postInfo = relatedPostId ? await tx.post.findUnique({
      where: { id: relatedPostId },
      select: { title: true },
    }) : null;

    await tx.message.create({
      data: {
        content: `${creator?.name || 'User'} created this chat${postInfo ? ` for "${postInfo.title}"` : ''}`,
        type: MessageType.SYSTEM_MESSAGE,
        chatId: chat.id,
        senderId: creatorId,
      },
    });

    return chat;
  });

  return await getChatRoomDetails(newChat.id);
}

/**
 * Get detailed chat room information
 */
export async function getChatRoomDetails(chatId: string): Promise<ChatRoomDetails> {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      participants: {
        where: { isActive: true },
      },
      relatedPost: {
        select: {
          id: true,
          title: true,
          type: true,
          subject: true,
          userId: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  const participantCount = chat.participants.length;
  let chatType: 'direct' | 'group' | 'lesson' = 'direct';
  
  if (participantCount > 2) {
    chatType = 'group';
  } else if (chat.relatedPost) {
    chatType = 'lesson'; // Chat related to a tutoring post
  }

  return {
    id: chat.id,
    relatedPostId: chat.relatedPostId,
    isActive: chat.isActive,
    participantCount,
    messageCount: chat._count.messages,
    lastMessageAt: chat.lastMessageAt,
    chatType,
    relatedPost: chat.relatedPost,
  };
}

/**
 * Find existing chat between participants for a specific post
 */
export async function findExistingChatForPost(
  postId: string,
  participantIds: string[]
): Promise<{ id: string } | null> {
  const existingChat = await prisma.chat.findFirst({
    where: {
      relatedPostId: postId,
      isActive: true,
      participants: {
        every: {
          userId: { in: participantIds },
          isActive: true,
        },
      },
    },
    include: {
      participants: {
        where: { isActive: true },
      },
    },
  });

  // Ensure the chat has exactly the same participants
  if (existingChat && existingChat.participants.length === participantIds.length) {
    return { id: existingChat.id };
  }

  return null;
}

/**
 * Get chat participants with Norwegian context
 */
export async function getChatParticipants(chatId: string): Promise<ChatParticipantInfo[]> {
  const participants = await prisma.chatParticipant.findMany({
    where: {
      chatId,
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
          region: true,
          isActive: true,
          lastActive: true,
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  return participants.map(participant => ({
    id: participant.user.id,
    name: participant.user.name,
    profileImage: participant.user.profileImage,
    region: participant.user.region,
    isActive: participant.user.isActive,
    lastActive: participant.user.lastActive,
  }));
}

/**
 * Archive chat with proper Norwegian business logic
 */
export async function archiveChat(chatId: string, userId: string): Promise<void> {
  const permissions = await getChatPermissions(chatId, userId);
  if (!permissions.canDeleteChat) {
    throw new ForbiddenError('You do not have permission to archive this chat');
  }

  await prisma.chatParticipant.update({
    where: {
      chatId_userId: {
        chatId,
        userId,
      },
    },
    data: {
      isActive: false,
      leftAt: new Date(),
    },
  });

  // Add system message
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  await prisma.message.create({
    data: {
      content: `${user?.name || 'User'} archived this chat`,
      type: MessageType.SYSTEM_MESSAGE,
      chatId,
      senderId: userId,
    },
  });

  // Check if chat should be fully deactivated
  const activeParticipants = await prisma.chatParticipant.count({
    where: {
      chatId,
      isActive: true,
    },
  });

  if (activeParticipants === 0) {
    await prisma.chat.update({
      where: { id: chatId },
      data: { isActive: false },
    });
  }
}

/**
 * Generate Norwegian tutoring-specific chat insights
 */
export async function generateChatInsights(
  userId: string,
  timeframe: 'week' | 'month' | 'quarter' = 'month'
): Promise<{
  totalChats: number;
  activeChats: number;
  subjectBreakdown: Record<string, number>;
  regionStats: Record<string, number>;
  tutoringStyle: 'active' | 'moderate' | 'passive';
  recommendations: string[];
}> {
  const now = new Date();
  let startDate: Date;

  switch (timeframe) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
  }

  // Get user's chat statistics
  const userChats = await prisma.chat.findMany({
    where: {
      participants: {
        some: {
          userId,
          isActive: true,
        },
      },
    },
    include: {
      relatedPost: {
        select: {
          subject: true,
        },
      },
      participants: {
        include: {
          user: {
            select: {
              region: true,
            },
          },
        },
      },
      messages: {
        where: {
          sentAt: { gte: startDate },
        },
      },
    },
  });

  const totalChats = userChats.length;
  const activeChats = userChats.filter(chat => 
    chat.lastMessageAt && chat.lastMessageAt >= startDate
  ).length;

  // Subject breakdown
  const subjectBreakdown: Record<string, number> = {};
  userChats.forEach(chat => {
    const subject = chat.relatedPost?.subject || 'OTHER';
    subjectBreakdown[subject] = (subjectBreakdown[subject] || 0) + 1;
  });

  // Region statistics (of chat partners)
  const regionStats: Record<string, number> = {};
  userChats.forEach(chat => {
    chat.participants
      .filter(p => p.userId !== userId)
      .forEach(p => {
        const region = p.user.region || 'UNKNOWN';
        regionStats[region] = (regionStats[region] || 0) + 1;
      });
  });

  // Determine tutoring style
  const totalMessages = userChats.reduce((sum, chat) => sum + chat.messages.length, 0);
  const averageMessagesPerChat = totalChats > 0 ? totalMessages / totalChats : 0;

  let tutoringStyle: 'active' | 'moderate' | 'passive' = 'passive';
  if (averageMessagesPerChat >= 20) {
    tutoringStyle = 'active';
  } else if (averageMessagesPerChat >= 5) {
    tutoringStyle = 'moderate';
  }

  // Generate Norwegian tutoring recommendations
  const recommendations: string[] = [];
  
  if (activeChats === 0) {
    recommendations.push('Vurder å være mer aktiv i chatene dine for å bygge bedre relasjoner.');
  }

  if (Object.keys(subjectBreakdown).length === 1) {
    recommendations.push('Utforsk andre fagområder for å utvide din undervisningsprofil.');
  }

  if (tutoringStyle === 'passive') {
    recommendations.push('Mer kommunikasjon med elevene kan forbedre læringsutbyttet.');
  }

  if (Object.keys(regionStats).length === 1) {
    recommendations.push('Vurder å tilby undervisning til elever fra andre regioner også.');
  }

  return {
    totalChats,
    activeChats,
    subjectBreakdown,
    regionStats,
    tutoringStyle,
    recommendations,
  };
}

/**
 * Validate chat access for Norwegian GDPR compliance
 */
export async function validateChatAccess(
  chatId: string,
  userId: string,
  action: 'read' | 'write' | 'export' | 'delete' = 'read'
): Promise<boolean> {
  const permissions = await getChatPermissions(chatId, userId);

  switch (action) {
    case 'read':
      return permissions.canAccessChatHistory;
    case 'write':
      return permissions.canSendMessage;
    case 'export':
      return permissions.canAccessChatHistory; // Users can export their own data
    case 'delete':
      return permissions.canDeleteChat;
    default:
      return false;
  }
}

/**
 * Export chat data for GDPR compliance
 */
export async function exportChatData(
  chatId: string,
  userId: string,
  format: 'json' | 'csv' | 'txt' = 'json'
): Promise<any> {
  const hasAccess = await validateChatAccess(chatId, userId, 'export');
  if (!hasAccess) {
    throw new ForbiddenError('You do not have permission to export this chat data');
  }

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              region: true,
            },
          },
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { sentAt: 'asc' },
      },
      relatedPost: {
        select: {
          id: true,
          title: true,
          subject: true,
          type: true,
        },
      },
    },
  });

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  const exportData = {
    chatId: chat.id,
    createdAt: chat.createdAt,
    relatedPost: chat.relatedPost,
    participants: chat.participants.map(p => ({
      userId: p.user.id,
      name: p.user.name,
      joinedAt: p.joinedAt,
      region: p.user.region,
    })),
    messages: chat.messages.map(m => ({
      id: m.id,
      content: m.content,
      type: m.type,
      sender: m.sender.name,
      sentAt: m.sentAt,
    })),
    exportedAt: new Date().toISOString(),
    exportedBy: userId,
  };

  switch (format) {
    case 'json':
      return exportData;
    case 'csv':
      // Convert to CSV format (simplified)
      return convertToCSV(exportData.messages);
    case 'txt':
      // Convert to readable text format
      return convertToText(exportData);
    default:
      return exportData;
  }
}

function convertToCSV(messages: any[]): string {
  const headers = ['Date', 'Sender', 'Type', 'Content'];
  const rows = messages.map(m => [
    new Date(m.sentAt).toLocaleDateString('no-NO'),
    m.sender,
    m.type,
    `"${m.content.replace(/"/g, '""')}"` // Escape quotes
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function convertToText(exportData: any): string {
  const lines: string[] = [];
  lines.push('=== CHAT EXPORT ===');
  lines.push(`Chat ID: ${exportData.chatId}`);
  lines.push(`Opprettet: ${new Date(exportData.createdAt).toLocaleDateString('no-NO')}`);
  lines.push(`Eksportert: ${new Date(exportData.exportedAt).toLocaleDateString('no-NO')}`);
  
  if (exportData.relatedPost) {
    lines.push(`Relatert innlegg: ${exportData.relatedPost.title} (${exportData.relatedPost.subject})`);
  }
  
  lines.push('\n=== DELTAKERE ===');
  exportData.participants.forEach((p: any) => {
    lines.push(`${p.name} (${p.region || 'Ukjent region'})`);
  });
  
  lines.push('\n=== MELDINGER ===');
  exportData.messages.forEach((m: any) => {
    lines.push(`${new Date(m.sentAt).toLocaleString('no-NO')} - ${m.sender}: ${m.content}`);
  });
  
  return lines.join('\n');
}