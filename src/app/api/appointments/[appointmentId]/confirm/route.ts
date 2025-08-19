/**
 * Appointment Confirmation Workflow API
 * Handles the confirmation process for Norwegian tutoring appointments
 * Includes both tutor and student confirmation logic
 */

import { NextRequest } from 'next/server';
import { PrismaClient, AppointmentStatus } from '@prisma/client';
import { createAPIHandler, createSuccessResponse, APIContext } from '@/lib/api-handler';
import { authMiddleware } from '@/middleware/auth';
import { 
  updateAppointmentStatusSchema,
  UpdateAppointmentStatusInput
} from '@/schemas/appointments';
import { 
  updateAppointmentStatus,
  AppointmentUtils
} from '@/lib/appointments';
import { BadRequestError, NotFoundError, ForbiddenError } from '@/lib/errors';
import { formatNorwegianDateTime } from '@/lib/norwegian-calendar';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * Route parameters validation
 */
const routeParamsSchema = z.object({
  appointmentId: z.string().cuid('Invalid appointment ID format'),
});

type RouteParams = z.infer<typeof routeParamsSchema>;

/**
 * Confirmation request schema
 */
const confirmationSchema = z.object({
  confirmed: z.boolean(),
  notes: z.string().max(500).optional(),
  reminderTime: z.number().int().min(0).max(10080).optional(), // up to 1 week in minutes
  preparationNotes: z.string().max(1000).optional(),
});

type ConfirmationInput = z.infer<typeof confirmationSchema>;

/**
 * GET /api/appointments/[appointmentId]/confirm - Get confirmation status
 */
async function handleGET(
  request: NextRequest,
  context: APIContext,
  { params }: { params: RouteParams }
) {
  const { user } = context;
  const { appointmentId } = params;

  try {
    // Get appointment with confirmation details
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
                    region: true,
                  },
                },
              },
            },
            relatedPost: {
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
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Check user access
    const hasAccess = appointment.chat.participants.some(p => p.user.id === user!.id);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this appointment');
    }

    // Only pending appointments can be confirmed
    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestError(`Appointment is already ${appointment.status.toLowerCase()}`);
    }

    // Determine user role and current confirmation status
    const userRole = determineUserRole(appointment, user!.id);
    const isTeacher = userRole === 'tutor';
    const currentUserReady = isTeacher ? appointment.teacherReady : appointment.studentReady;
    const otherUserReady = isTeacher ? appointment.studentReady : appointment.teacherReady;

    // Get other participants for display
    const otherParticipants = appointment.chat.participants
      .filter(p => p.user.id !== user!.id)
      .map(p => ({
        id: p.user.id,
        name: p.user.name,
        region: p.user.region,
        role: isTeacher ? 'student' : 'tutor',
      }));

    // Calculate time until appointment
    const norwegianContext = formatNorwegianDateTime(appointment.dateTime);
    const timeUntilAppointment = appointment.dateTime.getTime() - Date.now();
    const hoursUntil = Math.floor(timeUntilAppointment / (1000 * 60 * 60));

    const confirmationStatus = {
      appointmentId: appointment.id,
      status: appointment.status,
      currentUserRole: userRole,
      currentUserReady,
      otherUserReady,
      bothReady: appointment.teacherReady && appointment.studentReady,
      canConfirm: !currentUserReady,
      canCancel: true,
      otherParticipants,
      norwegianContext,
      hoursUntil,
      needsConfirmation: hoursUntil <= 24 && hoursUntil > 0, // Remind to confirm within 24h
      subject: appointment.chat.relatedPost?.subject,
      postTitle: appointment.chat.relatedPost?.title,
      location: appointment.location,
      duration: appointment.duration,
      notes: appointment.notes,
    };

    return createSuccessResponse(
      confirmationStatus,
      'Confirmation status retrieved successfully',
      {
        language: context.language,
        requiresAction: !currentUserReady && timeUntilAppointment > 0,
      }
    );

  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError || error instanceof BadRequestError) {
      throw error;
    }
    console.error('Error getting confirmation status:', error);
    throw new BadRequestError('Failed to get confirmation status');
  }
}

/**
 * POST /api/appointments/[appointmentId]/confirm - Confirm or decline appointment
 */
async function handlePOST(
  request: NextRequest,
  context: APIContext,
  { params }: { params: RouteParams }
) {
  const { user, validatedData } = context;
  const { appointmentId } = params;
  const confirmationData = validatedData?.body as ConfirmationInput;

  try {
    // Get current appointment
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
                    region: true,
                  },
                },
              },
            },
            relatedPost: {
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
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Check user access
    const hasAccess = appointment.chat.participants.some(p => p.user.id === user!.id);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this appointment');
    }

    // Only pending appointments can be confirmed
    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestError(`Appointment is already ${appointment.status.toLowerCase()}`);
    }

    // Determine user role
    const userRole = determineUserRole(appointment, user!.id);
    const isTeacher = userRole === 'tutor';

    if (!confirmationData.confirmed) {
      // User is declining the appointment - cancel it
      const cancelledAppointment = await updateAppointmentStatus(appointmentId, user!.id, {
        status: AppointmentStatus.CANCELLED,
        cancellationReason: confirmationData.notes || `Declined by ${isTeacher ? 'tutor' : 'student'}`,
      });

      // Create notification message
      await createConfirmationMessage(
        appointment.chatId,
        user!.id,
        'declined',
        appointment,
        confirmationData.notes
      );

      return createSuccessResponse(
        {
          appointmentId: cancelledAppointment.id,
          status: cancelledAppointment.status,
          action: 'declined',
          norwegianContext: formatNorwegianDateTime(cancelledAppointment.dateTime),
        },
        'Appointment declined successfully',
        {
          language: context.language,
          declined: true,
        }
      );
    }

    // User is confirming the appointment
    const updateData: UpdateAppointmentStatusInput = {
      status: appointment.status, // Keep status as PENDING initially
      ...(isTeacher ? { teacherReady: true } : { studentReady: true }),
    };

    // Check if both parties will be ready after this confirmation
    const otherUserReady = isTeacher ? appointment.studentReady : appointment.teacherReady;
    const bothWillBeReady = otherUserReady;

    if (bothWillBeReady) {
      // Both parties confirmed - mark as confirmed
      updateData.status = AppointmentStatus.CONFIRMED;
    }

    // Update appointment with confirmation
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        ...updateData,
        ...(confirmationData.reminderTime !== undefined && { reminderTime: confirmationData.reminderTime }),
        ...(confirmationData.notes && { 
          notes: `${appointment.notes || ''}\n\nConfirmation notes: ${confirmationData.notes}`.trim() 
        }),
        ...(confirmationData.preparationNotes && {
          notes: `${appointment.notes || ''}\n\nPreparation: ${confirmationData.preparationNotes}`.trim()
        }),
      },
      include: {
        chat: {
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
            relatedPost: true,
          },
        },
      },
    });

    // Create appropriate system message
    const messageType = bothWillBeReady ? 'fully_confirmed' : 'partially_confirmed';
    await createConfirmationMessage(
      appointment.chatId,
      user!.id,
      messageType,
      updatedAppointment,
      confirmationData.notes
    );

    const result = {
      appointmentId: updatedAppointment.id,
      status: updatedAppointment.status,
      action: 'confirmed',
      userRole,
      bothConfirmed: bothWillBeReady,
      waitingFor: bothWillBeReady ? null : (isTeacher ? 'student' : 'tutor'),
      norwegianContext: formatNorwegianDateTime(updatedAppointment.dateTime),
      nextSteps: generateNextSteps(updatedAppointment, userRole, bothWillBeReady),
    };

    return createSuccessResponse(
      result,
      bothWillBeReady 
        ? 'Appointment fully confirmed by both parties' 
        : 'Your confirmation recorded, waiting for other party',
      {
        language: context.language,
        fullyConfirmed: bothWillBeReady,
        waitingForOther: !bothWillBeReady,
      }
    );

  } catch (error) {
    if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    console.error('Error confirming appointment:', error);
    throw new BadRequestError('Failed to confirm appointment');
  }
}

/**
 * Helper function to determine user role in appointment
 */
function determineUserRole(appointment: any, userId: string): 'tutor' | 'student' | 'participant' {
  if (!appointment.chat.relatedPost) {
    return 'participant';
  }

  if (appointment.chat.relatedPost.user.id === userId) {
    return appointment.chat.relatedPost.type === 'TEACHER' ? 'tutor' : 'student';
  } else {
    return appointment.chat.relatedPost.type === 'TEACHER' ? 'student' : 'tutor';
  }
}

/**
 * Create system message for confirmation events
 */
async function createConfirmationMessage(
  chatId: string,
  userId: string,
  messageType: 'partially_confirmed' | 'fully_confirmed' | 'declined',
  appointment: any,
  userNotes?: string
): Promise<void> {
  const norwegianDateTime = formatNorwegianDateTime(appointment.dateTime);
  const userRole = determineUserRole(appointment, userId);
  
  let messageContent: string;
  
  switch (messageType) {
    case 'partially_confirmed':
      const roleLabel = userRole === 'tutor' ? 'lærer' : 'elev';
      messageContent = `✅ ${roleLabel} har bekreftet avtalen for ${norwegianDateTime.full}. Venter på bekreftelse fra ${userRole === 'tutor' ? 'elev' : 'lærer'}.`;
      break;
      
    case 'fully_confirmed':
      messageContent = `🎉 Avtalen er bekreftet av begge parter for ${norwegianDateTime.full}!`;
      break;
      
    case 'declined':
      const declinerLabel = userRole === 'tutor' ? 'lærer' : 'elev';
      messageContent = `❌ ${declinerLabel} har avslått avtalen for ${norwegianDateTime.full}.`;
      if (userNotes) {
        messageContent += `\nÅrsak: ${userNotes}`;
      }
      break;
      
    default:
      messageContent = `📅 Avtale ${messageType} for ${norwegianDateTime.full}`;
  }

  await prisma.message.create({
    data: {
      chatId,
      senderId: userId,
      content: messageContent,
      type: 'APPOINTMENT_RESPONSE',
      appointmentId: appointment.id,
    },
  });
}

/**
 * Generate next steps based on appointment status
 */
function generateNextSteps(
  appointment: any,
  userRole: string,
  bothConfirmed: boolean
): string[] {
  const steps: string[] = [];
  const norwegianContext = formatNorwegianDateTime(appointment.dateTime);

  if (bothConfirmed) {
    steps.push('Avtalen er bekreftet - møt opp til avtalt tid');
    steps.push(`Sted: ${appointment.location}`);
    
    if (appointment.duration) {
      steps.push(`Varighet: ${appointment.duration} minutter`);
    }
    
    if (userRole === 'tutor') {
      steps.push('Forbered undervisningsmateriell');
      steps.push('Vurder å sende påminnelse til eleven');
    } else {
      steps.push('Forbered spørsmål og materiell');
      steps.push('Gjør deg kjent med stedet hvis det er første gang');
    }
  } else {
    steps.push(`Venter på bekreftelse fra ${userRole === 'tutor' ? 'eleven' : 'læreren'}`);
    steps.push('Du vil få beskjed når avtalen er fullstendig bekreftet');
    steps.push('Du kan legge til forberedelsesnotater mens du venter');
  }

  // Add Norwegian-specific reminders
  const timeUntil = appointment.dateTime.getTime() - Date.now();
  const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
  
  if (hoursUntil <= 24 && hoursUntil > 2) {
    steps.push('Husk å sjekke værmelding og transportmuligheter');
  }
  
  if (hoursUntil <= 2 && hoursUntil > 0) {
    steps.push('Avtalen starter snart - forbered deg på å møte opp');
  }

  return steps;
}

/**
 * Export route handlers
 */
export const GET = createAPIHandler(handleGET, {
  requireAuth: true,
  validation: {
    params: routeParamsSchema,
  },
  language: 'no',
});

export const POST = createAPIHandler(handlePOST, {
  requireAuth: true,
  validation: {
    params: routeParamsSchema,
    body: confirmationSchema,
  },
  language: 'no',
  rateLimit: {
    maxAttempts: 10,
    windowMs: 60 * 1000,
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}