import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { NotFoundError, ForbiddenError } from '@/lib/errors';

interface RouteParams {
  appointmentId: string;
}

/**
 * DELETE /api/appointments/[appointmentId]/delete - Delete appointment from database
 */
async function handleDELETE(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  const user = getAuthenticatedUser(request);
  const { appointmentId } = await params;

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

  // Delete appointment and clear related messages using transaction
  await prisma.$transaction(async (tx) => {
    // Clear appointmentId from messages that reference this appointment
    await tx.message.updateMany({
      where: { appointmentId: appointmentId },
      data: { appointmentId: null },
    });

    // Delete the appointment
    await tx.appointment.delete({
      where: { id: appointmentId },
    });
  });

  return NextResponse.json({
    success: true,
    data: {
      message: 'Appointment deleted successfully',
    },
  });
}

export const DELETE = apiHandler(async (request: NextRequest, context: any) => {
  await authMiddleware(request);
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const appointmentId = pathSegments[pathSegments.indexOf('appointments') + 1];
  return handleDELETE(request, { params: Promise.resolve({ appointmentId }) });
});