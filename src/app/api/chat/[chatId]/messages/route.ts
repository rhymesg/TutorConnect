import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/errors';
import { updateExpiredAppointments } from '@/lib/appointment-utils';
import { sendNewChatEmail } from '@/lib/email';
import { isUserOnline } from '@/lib/user-utils';
import { z } from 'zod';

// Send message schema
const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(['TEXT', 'APPOINTMENT_REQUEST', 'APPOINTMENT_RESPONSE', 'APPOINTMENT_COMPLETION_RESPONSE', 'SYSTEM_MESSAGE']).optional().default('TEXT'),
  appointmentId: z.string().optional(),
  replyToMessageId: z.string().optional(),
});

// Message query schema
const messageQuerySchema = z.object({
  page: z.string().nullable().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().nullable().optional().transform(val => val ? Math.min(parseInt(val), 100) : 10),
  before: z.string().nullable().optional(), // Message ID for pagination
  after: z.string().nullable().optional(), // Message ID for pagination
  search: z.string().nullable().optional(),
});

interface RouteParams {
  chatId: string;
}

/**
 * Helper function to validate chat access for messaging
 */
async function validateChatMessageAccess(chatId: string, userId: string) {
  const participant = await prisma.chatParticipant.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId,
      },
    },
    include: {
      chat: {
        select: {
          id: true,
          isActive: true,
          relatedPostId: true,
        },
      },
    },
  });

  if (!participant || !participant.isActive) {
    throw new ForbiddenError('You do not have access to this chat');
  }

  if (!participant.chat.isActive) {
    throw new BadRequestError('Cannot send messages to inactive chat');
  }

  return participant;
}


/**
 * GET /api/chat/[chatId]/messages - Get chat messages with pagination
 */
async function handleGET(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  const user = getAuthenticatedUser(request);
  const { chatId } = await params;
  const { searchParams } = new URL(request.url);
  
  // Update expired appointments for this chat
  await updateExpiredAppointments(chatId);

  // Validate access
  await validateChatMessageAccess(chatId, user.id);

  // Validate query parameters
  const { page, limit, before, after, search } = messageQuerySchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
    before: searchParams.get('before'),
    after: searchParams.get('after'),
    search: searchParams.get('search'),
  });

  // Build message query
  let messageWhere: any = { chatId };

  // Add search filter
  if (search) {
    messageWhere.content = {
      contains: search,
      mode: 'insensitive',
    };
  }

  // Handle pagination
  if (before) {
    const beforeMessage = await prisma.message.findUnique({
      where: { id: before },
      select: { sentAt: true },
    });
    if (beforeMessage) {
      messageWhere.sentAt = { lt: beforeMessage.sentAt };
    }
  }

  if (after) {
    const afterMessage = await prisma.message.findUnique({
      where: { id: after },
      select: { sentAt: true },
    });
    if (afterMessage) {
      messageWhere.sentAt = { gt: afterMessage.sentAt };
    }
  }

  const skip = before || after ? 0 : (page - 1) * limit;

  
  // Get messages with sender details
  const [messages, totalCount] = await Promise.all([
    prisma.message.findMany({
      where: messageWhere,
      select: {
        id: true,
        content: true,
        type: true,
        chatId: true,
        senderId: true,
        sentAt: true,
        isEdited: true,
        appointmentId: true,
        replyToMessageId: true,
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            isActive: true,
          },
        },
        appointment: {
          select: {
            id: true,
            dateTime: true,
            location: true,
            status: true,
            duration: true,
            teacherReady: true,
            studentReady: true,
            bothCompleted: true,
            chat: {
              select: {
                id: true,
                relatedPost: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            type: true,
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { sentAt: 'desc' },
      skip,
      take: limit,
    }),
    search ? undefined : prisma.message.count({
      where: { chatId },
    }),
  ]);

  // Get message read status for each message
  const messagesWithReadStatus = await Promise.all(
    messages.map(async (message) => {
      // Get read receipts (participants who have read this message)
      const readBy = await prisma.chatParticipant.findMany({
        where: {
          chatId,
          isActive: true,
          lastReadAt: {
            gte: message.sentAt,
          },
          userId: {
            not: message.senderId, // Exclude sender
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      });

      return {
        ...message,
        readBy: readBy.map(p => p.user),
        isOwnMessage: message.senderId === user.id,
        canEdit: message.senderId === user.id && 
          Date.now() - message.sentAt.getTime() < 15 * 60 * 1000, // 15 minutes
        canDelete: message.senderId === user.id ||
          // Add admin check here if needed
          false,
      };
    })
  );

  const totalPages = totalCount ? Math.ceil(totalCount / limit) : 0;

  return NextResponse.json({
    success: true,
    data: {
      messages: messagesWithReadStatus.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total: totalCount || messages.length,
        totalPages,
        hasMore: messages.length === limit,
        oldestMessageId: messages.length > 0 ? messages[messages.length - 1].id : null,
        newestMessageId: messages.length > 0 ? messages[0].id : null,
      },
    },
  });
}

/**
 * POST /api/chat/[chatId]/messages - Send a new message
 */
async function handlePOST(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  const user = getAuthenticatedUser(request);
  const { chatId } = await params;
  // console.log('📝 POST /api/chat/[chatId]/messages called for chatId:', chatId, 'by user:', user.name);
  const body = await request.json();

  // Validate access
  const participant = await validateChatMessageAccess(chatId, user.id);

  // Validate input
  const { content, type, appointmentId, replyToMessageId } = sendMessageSchema.parse(body);


  if (appointmentId) {
    // Verify appointment exists and is related to this chat
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        chatId: true,
        status: true,
      },
    });

    if (!appointment || appointment.chatId !== chatId) {
      throw new BadRequestError('Invalid appointment for this chat');
    }
  }

  if (replyToMessageId) {
    // Verify the message being replied to exists in this chat
    const replyToMessage = await prisma.message.findUnique({
      where: { id: replyToMessageId },
      select: {
        id: true,
        chatId: true,
      },
    });

    if (!replyToMessage || replyToMessage.chatId !== chatId) {
      throw new BadRequestError('Invalid message to reply to');
    }
  }

  // Rate limiting: Check recent messages from this user
  const recentMessageCount = await prisma.message.count({
    where: {
      chatId,
      senderId: user.id,
      sentAt: {
        gte: new Date(Date.now() - 60 * 1000), // Last minute
      },
    },
  });

  if (recentMessageCount >= 10) {
    throw new BadRequestError('Too many messages sent recently. Please wait before sending more.');
  }

  // Content filtering for Norwegian context (basic)
  const bannedWords = ['spam', 'scam', 'fake']; // Extend with Norwegian words
  const containsBannedContent = bannedWords.some(word => 
    content.toLowerCase().includes(word.toLowerCase())
  );

  if (containsBannedContent) {
    throw new BadRequestError('Message contains inappropriate content');
  }

  // Handle appointment messages
  let createdAppointmentId = appointmentId;
  
  if (type === 'APPOINTMENT_REQUEST') {
    // Parse appointment data from content
    const appointmentData = JSON.parse(content);
    
    // Calculate duration from start and end times
    const startTime = appointmentData.startTime; // e.g., "15:14"
    const endTime = appointmentData.endTime; // e.g., "16:14"
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const duration = endTotalMinutes - startTotalMinutes;
    
    // Use the original dateTime from the request (which includes the correct local time)
    const appointmentDateTime = new Date(appointmentData.dateTime);
    
    // Check if there's already an appointment for this chat on the same date
    const startOfDay = new Date(appointmentDateTime);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(appointmentDateTime);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        chatId,
        dateTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });
    
    if (existingAppointment) {
      throw new BadRequestError('Det finnes allerede en avtale for denne chatten på den valgte datoen.');
    }
    
    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        chatId,
        dateTime: appointmentDateTime,
        location: appointmentData.location ? appointmentData.location : '', // Use provided location or default to empty string
        duration: duration, // Calculated duration in minutes
        status: 'PENDING',
      }
    });
    
    createdAppointmentId = appointment.id;
  } else if (type === 'APPOINTMENT_RESPONSE') {
    // Parse response data
    const responseData = JSON.parse(content);
    const originalMessage = await prisma.message.findUnique({
      where: { id: responseData.originalMessageId },
      include: { appointment: true }
    });
    
    if (originalMessage?.appointment) {
      // Check if appointment is still in PENDING status
      if (originalMessage.appointment.status !== 'PENDING') {
        throw new BadRequestError('Denne avtalen har allerede blitt besvart.');
      }
      
      // Update appointment status
      await prisma.appointment.update({
        where: { id: originalMessage.appointment.id },
        data: {
          status: responseData.accepted ? 'CONFIRMED' : 'CANCELLED',
        }
      });
      
      createdAppointmentId = originalMessage.appointment.id;
    }
  } else if (type === 'APPOINTMENT_COMPLETION_RESPONSE') {
    // Parse completion response data
    const responseData = JSON.parse(content);
    
    if (appointmentId) {
      // Get the appointment
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          chat: {
            include: {
              participants: {
                where: { isActive: true }
              }
            }
          }
        }
      });
      
      if (!appointment) {
        throw new BadRequestError('Appointment not found');
      }
      
      if (appointment.status !== 'WAITING_TO_COMPLETE') {
        throw new BadRequestError('이 약속은 완료 확인 대기 상태가 아닙니다.');
      }
      
      // Determine which user is responding
      const isTeacher = appointment.chat.participants.some(p => 
        p.userId === user.id && appointment.chat.teacherId === user.id
      );
      
      const updateData: any = {};
      if (isTeacher) {
        updateData.teacherReady = responseData.completed;
      } else {
        updateData.studentReady = responseData.completed;
      }
      
      // If both parties have responded positively, mark as completed
      const otherPartyReady = isTeacher ? appointment.studentReady : appointment.teacherReady;
      if (responseData.completed && otherPartyReady) {
        updateData.status = 'COMPLETED';
        updateData.bothCompleted = true;
      }
      
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: updateData
      });
      
      createdAppointmentId = appointmentId;
    }
  }

  // Create message in transaction
  const newMessage = await prisma.$transaction(async (tx) => {
    // Create the message
    const message = await tx.message.create({
      data: {
        content,
        type,
        chatId,
        senderId: user.id,
        appointmentId: createdAppointmentId,
        replyToMessageId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        appointment: {
          select: {
            id: true,
            dateTime: true,
            location: true,
            status: true,
            duration: true,
            teacherReady: true,
            studentReady: true,
            bothCompleted: true,
            chat: {
              select: {
                id: true,
                relatedPost: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            type: true,
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Update chat's last message timestamp
    await tx.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: new Date() },
    });

    // Update unread counts for other participants
    await tx.chatParticipant.updateMany({
      where: {
        chatId,
        userId: { not: user.id },
        isActive: true,
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    // Reset sender's unread count and update last read time
    await tx.chatParticipant.update({
      where: {
        chatId_userId: {
          chatId,
          userId: user.id,
        },
      },
      data: {
        lastReadAt: new Date(),
        unreadCount: 0,
      },
    });

    return message;
  });

  // Check if this is the first message in the chat and send email notification
  try {
    const messageCount = await prisma.message.count({
      where: { chatId },
    });

    // console.log(`🔔 [EMAIL DEBUG] Chat ${chatId} - Message count: ${messageCount}`);

    // Send email only for the first message in the chat
    if (messageCount === 1) {
      console.log(`[DEBUG] Processing email notification for chat ${chatId} (first message)`);
      
      // Get other participants
      const otherParticipants = await prisma.chatParticipant.findMany({
        where: {
          chatId,
          userId: { not: user.id },
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              emailNewChat: true,
              isActive: true,
            },
          },
        },
      });

      console.log(`[DEBUG] Found ${otherParticipants.length} other participants`);

      // Get chat info including related post if exists
      const chatInfo = await prisma.chat.findUnique({
        where: { id: chatId },
        select: {
          id: true,
          relatedPost: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      console.log(`[DEBUG] Chat info:`, { 
        chatId: chatInfo?.id, 
        hasRelatedPost: !!chatInfo?.relatedPost,
        postTitle: chatInfo?.relatedPost?.title 
      });

      // Send email to each participant who has email notifications enabled and is not active
      for (const participant of otherParticipants) {
        const receiver = participant.user;
        
        const userIsOnline = isUserOnline(receiver.lastActive);
        
        console.log(`[DEBUG] Checking participant ${receiver.name}:`, {
          email: receiver.email,
          isOnline: userIsOnline,
          emailNewChat: receiver.emailNewChat,
          willSendEmail: !userIsOnline && receiver.emailNewChat
        });
        
        // Check conditions: not online, email notifications enabled
        if (!userIsOnline && receiver.emailNewChat) {
          console.log(`🔔 [EMAIL DEBUG] Sending new chat email to ${receiver.email}`);
          try {
            await sendNewChatEmail(
              receiver.email,
              receiver.name,
              user.name || 'En TutorConnect bruker',
              chatInfo?.relatedPost?.title
            );
            console.log(`✅ [EMAIL DEBUG] Successfully sent new chat email to ${receiver.email}`);
          } catch (emailError) {
            // Log email error but don't fail message sending (same as registration)
            console.error('Failed to send new chat email:', emailError);
          }
        } else {
          console.log(`[DEBUG] Skipping email for ${receiver.email} - conditions not met (isOnline: ${userIsOnline}, emailNewChat: ${receiver.emailNewChat})`);
        }
      }
    } else {
      console.log(`[DEBUG] Skipping email notification - message count is ${messageCount}`);
    }
  } catch (error) {
    console.error('Error checking/sending new chat email:', error);
    // Don't throw error - email failure shouldn't prevent message sending
  }

  // Trigger real-time notification (handled by Supabase realtime)
  // This would be where you'd emit to the real-time channel

  return NextResponse.json({
    success: true,
    data: {
      message: {
        ...newMessage,
        readBy: [], // New message hasn't been read by others yet
        isOwnMessage: true,
        canEdit: true,
        canDelete: true,
      },
    },
  });
}

export const GET = apiHandler(async (request: NextRequest, context: any) => {
  await authMiddleware(request);
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const chatIndex = pathSegments.indexOf('chat');
  const chatId = chatIndex >= 0 && chatIndex < pathSegments.length - 1 ? pathSegments[chatIndex + 1] : '';
  
  if (!chatId) {
    return NextResponse.json({ success: false, error: 'Chat ID not found in URL' }, { status: 400 });
  }
  
  return handleGET(request, { params: Promise.resolve({ chatId }) });
});

export const POST = apiHandler(async (request: NextRequest, context: any) => {
  await authMiddleware(request);
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const chatIndex = pathSegments.indexOf('chat');
  const chatId = chatIndex >= 0 && chatIndex < pathSegments.length - 1 ? pathSegments[chatIndex + 1] : '';
  
  if (!chatId) {
    return NextResponse.json({ success: false, error: 'Chat ID not found in URL' }, { status: 400 });
  }
  
  return handlePOST(request, { params: Promise.resolve({ chatId }) });
});