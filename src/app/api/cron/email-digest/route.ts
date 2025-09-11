import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMessageDigestEmail, type UnreadChatInfo } from '@/lib/email';

/**
 * GET /api/cron/email-digest
 * Send daily email digest to users with unread messages
 * Runs daily at 7 PM Oslo time via Vercel Cron
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting email digest job at:', new Date().toISOString());
    console.log('[CRON] Environment check:', {
      hasSmtpHost: !!process.env.SMTP_HOST,
      hasSmtpUser: !!process.env.SMTP_USER,
      hasSmtpPass: !!process.env.SMTP_PASS,
      nodeEnv: process.env.NODE_ENV
    });

    // Get users who have email notifications enabled
    const usersWithEmailNotifications = await prisma.user.findMany({
      where: {
        emailNewMessage: true,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastEmailNotificationAt: true,
        chatParticipants: {
          where: {
            isActive: true,
            unreadCount: {
              gt: 0
            }
          },
          include: {
            chat: {
              include: {
                relatedPost: {
                  select: {
                    id: true,
                    title: true
                  }
                },
                teacher: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                student: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                messages: {
                  where: {
                    sentAt: {
                      gt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                    }
                  },
                  orderBy: {
                    sentAt: 'desc'
                  },
                  take: 1,
                  select: {
                    id: true,
                    content: true,
                    sentAt: true,
                    senderId: true,
                    sender: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`[CRON] Found ${usersWithEmailNotifications.length} users with email notifications enabled`);
    
    // Log details for debugging
    usersWithEmailNotifications.forEach(user => {
      const unreadCounts = user.chatParticipants.map(p => p.unreadCount);
      console.log(`[CRON] User ${user.email}: ${user.chatParticipants.length} active chats, unread counts:`, unreadCounts);
    });

    let emailsSent = 0;
    let errors = 0;

    for (const user of usersWithEmailNotifications) {
      try {
        // Check if user has unread messages since last notification
        const hasNewMessages = user.chatParticipants.some(participant => {
          const chat = participant.chat;
          const lastMessage = chat.messages[0];
          
          // If no last notification time, send email
          if (!user.lastEmailNotificationAt) {
            return true;
          }
          
          // Check if there are new messages since last notification
          return lastMessage && lastMessage.sentAt > user.lastEmailNotificationAt;
        });

        if (!hasNewMessages) {
          console.log(`[CRON] Skipping user ${user.email} - no new messages since last notification`);
          continue;
        }

        // Generate email content
        const unreadChats: UnreadChatInfo[] = user.chatParticipants.map(participant => {
          const chat = participant.chat;
          const otherUser = chat.teacher?.id === user.id ? chat.student : chat.teacher;
          const lastMessage = chat.messages[0];
          
          return {
            chatId: chat.id,
            otherUserName: otherUser?.name || 'Ukjent bruker',
            unreadCount: participant.unreadCount,
            lastMessage: lastMessage ? {
              content: lastMessage.content.length > 100 
                ? lastMessage.content.substring(0, 100) + '...' 
                : lastMessage.content,
              senderName: lastMessage.sender.name,
              sentAt: lastMessage.sentAt
            } : undefined,
            postTitle: chat.relatedPost?.title
          };
        });

        const totalUnreadCount = user.chatParticipants.reduce((sum, p) => sum + p.unreadCount, 0);

        // Send email using the actual email service
        console.log(`[CRON] Attempting to send email to ${user.email} with ${totalUnreadCount} unread messages from ${unreadChats.length} chats`);
        await sendMessageDigestEmail(user.email, user.name, unreadChats, totalUnreadCount);
        console.log(`[CRON] ✅ Successfully sent email to ${user.email}`);

        // Update last notification time
        await prisma.user.update({
          where: { id: user.id },
          data: { lastEmailNotificationAt: new Date() }
        });

        emailsSent++;
        console.log(`[CRON] Sent digest email to ${user.email} (${totalUnreadCount} unread messages)`);

      } catch (error) {
        console.error(`[CRON] ❌ Failed to process user ${user.email}:`, error);
        console.error(`[CRON] Error details:`, {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        errors++;
      }
    }

    console.log(`[CRON] Email digest job completed. Sent: ${emailsSent}, Errors: ${errors}`);

    return NextResponse.json({
      success: true,
      emailsSent,
      errors,
      totalUsersProcessed: usersWithEmailNotifications.length
    });

  } catch (error) {
    console.error('[CRON] Email digest job failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

