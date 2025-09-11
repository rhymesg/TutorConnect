import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/errors';
import { updateUserStatsOnCompletion } from '@/lib/appointment-utils';
import { z } from 'zod';

// Completion schema
const completeSchema = z.object({
  completed: z.boolean(),
});

interface RouteParams {
  appointmentId: string;
}

/**
 * POST /api/appointments/[appointmentId]/complete - Mark appointment completion status
 */
async function handlePOST(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  const user = getAuthenticatedUser(request);
  const { appointmentId } = await params;
  const body = await request.json();

  // Validate input
  const { completed } = completeSchema.parse(body);

  // Get appointment with chat participants
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      chat: {
        include: {
          participants: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          relatedPost: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }

  // Check if user is a participant in the chat
  const isParticipant = appointment.chat.participants.some(p => p.userId === user.id);
  if (!isParticipant) {
    throw new ForbiddenError('You do not have access to this appointment');
  }

  // Check if appointment is in WAITING_TO_COMPLETE status
  if (appointment.status !== 'WAITING_TO_COMPLETE') {
    throw new BadRequestError('이 약속은 완료 확인 대기 상태가 아닙니다.');
  }

  // Determine if user is teacher (post owner)
  const isTeacher = appointment.chat.relatedPost?.userId === user.id;
  
  // If user says "No" (not completed), mark appointment as CANCELLED
  if (!completed) {
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        teacherReady: false,
        studentReady: false,
        bothCompleted: false,
      },
      include: {
        chat: {
          select: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        appointment: updatedAppointment,
      },
    });
  }

  // If user says "Yes" (completed), update their ready status
  const updateData: any = {};
  if (isTeacher) {
    updateData.teacherReady = completed;
  } else {
    updateData.studentReady = completed;
  }
  
  // Check if both parties have confirmed completion
  const otherPartyReady = isTeacher ? appointment.studentReady : appointment.teacherReady;
  if (completed && otherPartyReady) {
    updateData.status = 'COMPLETED';
    updateData.bothCompleted = true;
  }
  
  // Update appointment
  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: updateData,
    include: {
      chat: {
        select: {
          id: true,
        },
      },
    },
  });

  // Send a message to the chat indicating completion confirmation
  try {
    const completionMessage = `${user.name} har bekreftet at undervisningstimen ble gjennomført ✅`;
    
    await prisma.message.create({
      data: {
        content: completionMessage,
        type: 'SYSTEM_MESSAGE',
        chatId: appointment.chat.id,
        senderId: user.id,
      },
    });
    
    // Update chat's lastMessageAt
    await prisma.chat.update({
      where: { id: appointment.chat.id },
      data: { lastMessageAt: new Date() },
    });
  } catch (error) {
    console.error('Failed to send completion message:', error);
    // Continue with the response even if message sending fails
  }

  // Update user statistics if appointment is now completed
  if (updatedAppointment.status === 'COMPLETED') {
    try {
      await updateUserStatsOnCompletion(appointmentId);
    } catch (error) {
      console.error('Failed to update user stats:', error);
      // Continue with the response even if stats update fails
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      appointment: updatedAppointment,
    },
  });
}

export const POST = apiHandler(async (request: NextRequest, context: any) => {
  await authMiddleware(request);
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const appointmentId = pathSegments[pathSegments.indexOf('appointments') + 1];
  return handlePOST(request, { params: Promise.resolve({ appointmentId }) });
});