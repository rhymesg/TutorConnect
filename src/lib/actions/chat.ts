'use server';

import { PrismaClient, MessageType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import { z } from 'zod';

const prisma = new PrismaClient();

export type ChatMessageState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
  message?: any;
} | null;

/**
 * Get current user from JWT token
 */
async function getCurrentUser() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  
  if (!accessToken) {
    throw new Error('Ikke autorisert. Vennligst logg inn.');
  }

  try {
    const payload = await verifyAccessToken(accessToken);
    return payload;
  } catch (error) {
    throw new Error('Ugyldig autentisering. Vennligst logg inn på nytt.');
  }
}

/**
 * Message schema validation
 */
const sendMessageSchema = z.object({
  chatId: z.string().cuid('Invalid chat ID format'),
  content: z.string().min(1, 'Melding kan ikke være tom').max(2000, 'Melding for lang'),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'APPOINTMENT_REQUEST', 'APPOINTMENT_RESPONSE', 'SYSTEM']).optional().default('TEXT'),
  appointmentId: z.string().cuid().optional(),
  parentMessageId: z.string().cuid().optional(),
});

type SendMessageInput = z.infer<typeof sendMessageSchema>;

/**
 * React 19 Server Action for sending messages
 */
export async function sendMessageAction(
  prevState: ChatMessageState,
  formData: FormData
): Promise<ChatMessageState> {
  try {
    // Verify authentication
    const user = await getCurrentUser();

    // Extract form data
    const rawData = {
      chatId: formData.get('chatId') as string,
      content: formData.get('content') as string,
      type: (formData.get('type') as MessageType) || 'TEXT',
      appointmentId: formData.get('appointmentId') as string || undefined,
      parentMessageId: formData.get('parentMessageId') as string || undefined,
    };

    // Validate using Zod schema
    const validatedData = sendMessageSchema.parse(rawData);

    // Check if user is a participant in this chat
    const chatParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: validatedData.chatId,
        userId: user.userId,
        isActive: true,
      }
    });

    if (!chatParticipant) {
      return {
        error: 'Du har ikke tilgang til denne samtalen.',
      };
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        chatId: validatedData.chatId,
        senderId: user.userId,
        content: validatedData.content,
        type: validatedData.type,
        appointmentId: validatedData.appointmentId,
        parentMessageId: validatedData.parentMessageId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          }
        },
        appointment: validatedData.appointmentId ? {
          select: {
            id: true,
            dateTime: true,
            location: true,
            duration: true,
            status: true,
          }
        } : false,
        parentMessage: validatedData.parentMessageId ? {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                name: true,
              }
            }
          }
        } : false,
      }
    });

    // Update chat's last activity
    await prisma.chat.update({
      where: { id: validatedData.chatId },
      data: { 
        lastActivityAt: new Date(),
        lastMessageId: message.id,
      }
    });

    // Update participant's last read message
    await prisma.chatParticipant.update({
      where: { id: chatParticipant.id },
      data: { 
        lastReadAt: new Date(),
        lastReadMessageId: message.id,
      }
    });

    // Revalidate relevant paths
    revalidatePath('/chat');
    revalidatePath(`/chat/${validatedData.chatId}`);

    return {
      success: true,
      message,
    };

  } catch (error) {
    console.error('Send message action error:', error);

    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      const fieldErrors: Record<string, string> = {};
      
      zodError.errors.forEach((err: any) => {
        const field = err.path[0];
        fieldErrors[field] = err.message;
      });

      return {
        fieldErrors,
      };
    }

    return {
      error: error instanceof Error ? error.message : 'Det oppstod en feil ved sending av melding.',
    };
  }
}

/**
 * Server Action for quick message templates
 */
export async function sendQuickMessageAction(
  chatId: string,
  template: string
): Promise<{ success: boolean; error?: string; message?: any }> {
  try {
    // Verify authentication
    const user = await getCurrentUser();

    // Check if user is a participant in this chat
    const chatParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId: user.userId,
        isActive: true,
      }
    });

    if (!chatParticipant) {
      return { success: false, error: 'Du har ikke tilgang til denne samtalen.' };
    }

    // Create message with template content
    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: user.userId,
        content: template,
        type: 'TEXT',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          }
        }
      }
    });

    // Update chat's last activity
    await prisma.chat.update({
      where: { id: chatId },
      data: { 
        lastActivityAt: new Date(),
        lastMessageId: message.id,
      }
    });

    // Update participant's last read message
    await prisma.chatParticipant.update({
      where: { id: chatParticipant.id },
      data: { 
        lastReadAt: new Date(),
        lastReadMessageId: message.id,
      }
    });

    // Revalidate relevant paths
    revalidatePath('/chat');
    revalidatePath(`/chat/${chatId}`);

    return { success: true, message };

  } catch (error) {
    console.error('Send quick message action error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Det oppstod en feil ved sending av melding.' 
    };
  }
}

/**
 * Server Action for updating typing status
 */
export async function updateTypingStatusAction(
  chatId: string,
  isTyping: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify authentication
    const user = await getCurrentUser();

    // Check if user is a participant in this chat
    const chatParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId: user.userId,
        isActive: true,
      }
    });

    if (!chatParticipant) {
      return { success: false, error: 'Du har ikke tilgang til denne samtalen.' };
    }

    // Update typing status
    await prisma.chatParticipant.update({
      where: { id: chatParticipant.id },
      data: { 
        isTyping,
        lastTypingAt: isTyping ? new Date() : null,
      }
    });

    return { success: true };

  } catch (error) {
    console.error('Update typing status action error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Kunne ikke oppdatere skrive-status.' 
    };
  }
}