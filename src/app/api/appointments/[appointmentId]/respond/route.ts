import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/errors';
import { sendAppointmentConfirmationEmail } from '@/lib/email';
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

  console.log(`🔍 [RESPOND] Appointment ID: ${appointmentId}, User: ${user.name} (${user.id})`);
  console.log(`🔍 [RESPOND] Request body:`, body);

  // Validate input
  const { accepted } = respondSchema.parse(body);

  // Get appointment with chat participants (including email info for confirmation emails)
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
                  email: true,
                  emailAppointmentConfirm: true,
                },
              },
            },
          },
          relatedPost: {
            select: {
              id: true,
              title: true,
              subject: true,
            },
          },
        },
      },
    },
  });

  if (!appointment) {
    console.log(`❌ [RESPOND] Appointment not found: ${appointmentId}`);
    throw new NotFoundError('Appointment not found');
  }

  console.log(`🔍 [RESPOND] Found appointment: status=${appointment.status}, dateTime=${appointment.dateTime}`);
  console.log(`🔍 [RESPOND] Chat participants:`, appointment.chat.participants.map(p => `${p.user.name} (${p.userId})`));

  // Check if user is a participant in the chat
  const isParticipant = appointment.chat.participants.some(p => p.userId === user.id);
  if (!isParticipant) {
    console.log(`❌ [RESPOND] User ${user.id} is not a participant`);
    throw new ForbiddenError('You do not have access to this appointment');
  }

  // Check if appointment is still pending
  if (appointment.status !== 'PENDING') {
    console.log(`❌ [RESPOND] Appointment status is ${appointment.status}, not PENDING`);
    throw new BadRequestError('Denne avtalen har allerede blitt besvart.');
  }

  if (accepted) {
    // Accept appointment - update status to CONFIRMED
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CONFIRMED',
      },
    });

    console.log('📧 Appointment is now confirmed, preparing to send confirmation emails...');
    
    // Send confirmation emails to both participants
    for (const participant of appointment.chat.participants) {
      console.log(`🔍 Checking participant: ${participant.user.name} (${participant.user.email})`);
      console.log(`   - emailAppointmentConfirm: ${participant.user.emailAppointmentConfirm}`);
      console.log(`   - has email: ${!!participant.user.email}`);
      
      if (participant.user.emailAppointmentConfirm && participant.user.email) {
        try {
          const otherParticipant = appointment.chat.participants.find(p => p.user.id !== participant.user.id);
          console.log(`📤 Sending confirmation email to: ${participant.user.email}`);
          
          await sendAppointmentConfirmationEmail(
            participant.user.email,
            participant.user.name,
            otherParticipant?.user?.name || 'Other User',
            appointment.dateTime,
            appointment.duration,
            appointment.chat.relatedPost?.subject || 'Ukjent fag',
            appointment.location,
            appointment.chat.id,
            appointment.chat.relatedPost?.title,
            appointment.chat.relatedPost?.id
          );
          console.log(`✅ Sent appointment confirmation email to: ${participant.user.email}`);
        } catch (error) {
          console.error(`❌ Failed to send appointment confirmation email to ${participant.user.email}:`, error);
        }
      } else {
        console.log(`⏭️ Skipping email for ${participant.user.name}: emailAppointmentConfirm=${participant.user.emailAppointmentConfirm}, hasEmail=${!!participant.user.email}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        appointment: updatedAppointment,
        message: 'Appointment confirmed successfully',
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