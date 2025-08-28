import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/errors';
import { MessageType } from "@prisma/client";
import { z } from 'zod';

const prisma = new PrismaClient();

// Initiate chat schema
const initiateChatSchema = z.object({
  message: z.string().min(1).max(1000).optional(), // Make message optional
  includeProfile: z.boolean().optional().default(false),
});

interface RouteParams {
  postId: string;
}

/**
 * Helper function to validate post access for chat initiation
 */
async function validatePostChatAccess(postId: string, userId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profileImage: true,
          isActive: true,
          privacyContact: true,
        },
      },
    },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  if (!post.isActive) {
    throw new BadRequestError('Cannot initiate chat for inactive post');
  }

  if (!post.user.isActive) {
    throw new BadRequestError('Post owner is inactive');
  }

  if (post.userId === userId) {
    throw new BadRequestError('Cannot initiate chat with your own post');
  }

  // Check privacy settings
  if (post.user.privacyContact === 'PRIVATE') {
    throw new ForbiddenError('Post owner does not allow direct contact');
  }

  return post;
}

/**
 * Helper function to check if users can communicate based on post type
 */
function validatePostTypeCompatibility(postType: string, initiatorType: 'TEACHER' | 'STUDENT') {
  // TutorConnect allows flexible roles - anyone can teach or learn
  // Users can be both teachers and students depending on the subject
  return { compatible: true };
}

/**
 * POST /api/posts/[postId]/chat - Initiate chat with post owner
 */
async function handlePOST(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  // Apply authentication middleware first
  await authMiddleware(request);
  const user = getAuthenticatedUser(request);
  const { postId } = await params;
  const body = await request.json();

  // Validate post access
  const post = await validatePostChatAccess(postId, user.id);

  // Validate input
  const { message, includeProfile } = initiateChatSchema.parse(body);

  // Get initiator's most recent post to determine their type
  const initiatorRecentPost = await prisma.post.findFirst({
    where: {
      userId: user.id,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      type: true,
    },
  });

  // TutorConnect supports flexible learning/teaching roles - anyone can contact anyone
  // Users can be both teachers and students depending on the subject

  // Check for existing chat between these users for this post
  const existingChat = await prisma.chat.findFirst({
    where: {
      relatedPostId: postId,
      isActive: true,
      participants: {
        every: {
          userId: { in: [user.id, post.userId] },
          isActive: true,
        },
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });


  // If chat exists and both users are participants, return existing chat
  if (existingChat && existingChat.participants.length === 2) {
    const userParticipant = existingChat.participants.find(p => p.userId === user.id);
    
    // If user left the chat, reactivate their participation
    if (userParticipant && !userParticipant.isActive) {
      await prisma.chatParticipant.update({
        where: {
          chatId_userId: {
            chatId: existingChat.id,
            userId: user.id,
          },
        },
        data: {
          isActive: true,
          joinedAt: new Date(),
          leftAt: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        chatId: existingChat.id,
        message: 'Chat already exists',
        existing: true,
      },
    });
  }

  // Rate limiting: Check recent chat initiations by this user
  const recentChatCount = await prisma.chat.count({
    where: {
      participants: {
        some: {
          userId: user.id,
        },
      },
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      },
    },
  });

  if (recentChatCount >= 10) {
    throw new BadRequestError('Too many chat requests in the last hour. Please wait before initiating more chats.');
  }

  // Content filtering for initial message (only if message exists)
  if (message) {
    const bannedWords = ['spam', 'scam', 'fake', 'money transfer', 'urgent payment'];
    const containsBannedContent = bannedWords.some(word => 
      message.toLowerCase().includes(word.toLowerCase())
    );

    if (containsBannedContent) {
      throw new BadRequestError('Message contains inappropriate content');
    }
  }

  // Create chat and send initial message in transaction
  const newChat = await prisma.$transaction(async (tx) => {
    // Determine teacher and student IDs based on post type
    const teacherId = post.type === 'TEACHER' ? post.userId : user.id;
    const studentId = post.type === 'TEACHER' ? user.id : post.userId;

    // Create the chat
    const chat = await tx.chat.create({
      data: {
        relatedPostId: postId,
        teacherId: teacherId,
        studentId: studentId,
        isActive: true,
      },
    });

    // Add both participants
    const participantData = [
      {
        chatId: chat.id,
        userId: user.id,
        joinedAt: new Date(),
        isActive: true,
        unreadCount: 0,
      },
      {
        chatId: chat.id,
        userId: post.userId,
        joinedAt: new Date(),
        isActive: true,
        unreadCount: message ? 1 : 0, // Post owner has unread count only if message was sent
      },
    ];
    
    await tx.chatParticipant.createMany({
      data: participantData,
    });

    // Send initial message if provided
    if (message) {
      await tx.message.create({
        data: {
          content: message,
          type: MessageType.TEXT,
          chatId: chat.id,
          senderId: user.id,
        },
      });
    }

    // Add system message about chat creation
    await tx.message.create({
      data: {
        content: `${user.name} started a conversation about "${post.title}"`,
        type: MessageType.SYSTEM_MESSAGE,
        chatId: chat.id,
        senderId: user.id,
      },
    });

    // If profile sharing is requested, add profile information
    if (includeProfile) {
      const userProfile = await tx.user.findUnique({
        where: { id: user.id },
        select: {
          name: true,
          school: true,
          degree: true,
          bio: true,
          region: true,
        },
      });

      if (userProfile && userProfile.bio) {
        await tx.message.create({
          data: {
            content: `About me: ${userProfile.bio}${userProfile.school ? ` | School: ${userProfile.school}` : ''}${userProfile.degree ? ` | Education: ${userProfile.degree}` : ''}`,
            type: MessageType.TEXT,
            chatId: chat.id,
            senderId: user.id,
          },
        });

        // Update unread count for additional message
        await tx.chatParticipant.update({
          where: {
            chatId_userId: {
              chatId: chat.id,
              userId: post.userId,
            },
          },
          data: {
            unreadCount: { increment: 1 },
          },
        });
      }
    }

    // Update chat's last message timestamp
    await tx.chat.update({
      where: { id: chat.id },
      data: { lastMessageAt: new Date() },
    });

    return chat;
  });

  // Get chat with full details to return
  const chatWithDetails = await prisma.chat.findUnique({
    where: { id: newChat.id },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          profileImage: true,
          isActive: true,
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          profileImage: true,
          isActive: true,
        },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              isActive: true,
            },
          },
        },
      },
      relatedPost: {
        select: {
          id: true,
          title: true,
          type: true,
          subject: true,
        },
      },
      messages: {
        take: 3, // Get initial messages
        orderBy: { sentAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });

  // Create notification for post owner (this would integrate with notification system)

  return NextResponse.json({
    success: true,
    data: {
      chat: {
        ...chatWithDetails,
        messages: chatWithDetails?.messages.reverse(), // Chronological order
        otherParticipant: chatWithDetails?.participants.find(p => p.userId !== user.id),
        teacherId: chatWithDetails?.teacherId,
        studentId: chatWithDetails?.studentId,
        teacher: chatWithDetails?.teacher,
        student: chatWithDetails?.student,
      },
      message: 'Chat initiated successfully',
    },
  });
}

/**
 * GET /api/posts/[postId]/chat - Get existing chat for this post
 */
async function handleGET(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  // Apply authentication middleware first
  await authMiddleware(request);
  const user = getAuthenticatedUser(request);
  const { postId } = await params;

  // Validate post exists
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      title: true,
      userId: true,
      isActive: true,
    },
  });

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Find existing chat between current user and post owner for this post
  const existingChat = await prisma.chat.findFirst({
    where: {
      relatedPostId: postId,
      participants: {
        some: {
          userId: user.id,
          isActive: true,
        },
      },
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          profileImage: true,
          isActive: true,
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          profileImage: true,
          isActive: true,
        },
      },
      participants: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              isActive: true,
            },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { sentAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      },
      relatedPost: {
        select: {
          id: true,
          title: true,
          type: true,
          subject: true,
        },
      },
    },
  });

  if (!existingChat) {
    return NextResponse.json({
      success: true,
      data: {
        hasExistingChat: false,
        post: {
          id: post.id,
          title: post.title,
          canInitiateChat: post.userId !== user.id && post.isActive,
        },
      },
    });
  }

  // Get unread count for current user
  const userParticipant = existingChat.participants.find(p => p.userId === user.id);
  const unreadCount = userParticipant ? await prisma.message.count({
    where: {
      chatId: existingChat.id,
      sentAt: {
        gt: userParticipant.lastReadAt || userParticipant.joinedAt,
      },
      senderId: {
        not: user.id,
      },
    },
  }) : 0;

  return NextResponse.json({
    success: true,
    data: {
      hasExistingChat: true,
      chat: {
        ...existingChat,
        unreadCount,
        lastMessage: existingChat.messages[0] || null,
        otherParticipant: existingChat.participants.find(p => p.userId !== user.id),
        teacherId: existingChat.teacherId,
        studentId: existingChat.studentId,
        teacher: existingChat.teacher,
        student: existingChat.student,
      },
    },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  try {
    return await handleGET(request, { params });
  } catch (error) {
    console.error('GET /api/posts/[postId]/chat error:', error);
    
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  try {
    return await handlePOST(request, { params });
  } catch (error) {
    console.error('POST /api/posts/[postId]/chat error:', error);
    
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}