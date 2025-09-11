import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/errors';
import { z } from 'zod';

// Response schema
const respondSchema = z.object({
  accepted: z.boolean(),
});

interface RouteParams {
  appointmentId: string;
}

/**
 * POST /api/appointments/[appointmentId]/respond - Respond to appointment request without sending message
 */
async function handlePOST(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  const user = getAuthenticatedUser(request);
  const { appointmentId } = await params;
  const body = await request.json();

  // Validate input
  const { accepted } = respondSchema.parse(body);

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

  // Check if appointment is still pending
  if (appointment.status !== 'PENDING') {
    throw new BadRequestError('Denne avtalen har allerede blitt besvart.');
  }

  if (accepted) {
    // Accept appointment - update status to CONFIRMED
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CONFIRMED',
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
  } else {
    // Reject appointment - delete from database and clear related messages
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
        message: 'Appointment rejected and deleted',
        chatId: appointment.chat.id,
      },
    });
  }
}

export const POST = apiHandler(async (request: NextRequest, context: any) => {
  await authMiddleware(request);
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const appointmentId = pathSegments[pathSegments.indexOf('appointments') + 1];
  return handlePOST(request, { params: Promise.resolve({ appointmentId }) });
});