/**
 * Appointment Rescheduling API
 * Handles rescheduling requests for Norwegian tutoring appointments
 * Includes mutual agreement workflow and availability checking
 */

import { NextRequest } from 'next/server';
import { PrismaClient, AppointmentStatus } from '@prisma/client';
import { createAPIHandler, createSuccessResponse, APIContext } from '@/lib/api-handler';
import { authMiddleware } from '@/middleware/auth';
import { 
  checkUserAvailability,
  AppointmentUtils
} from '@/lib/appointments';
import { BadRequestError, NotFoundError, ForbiddenError } from '@/lib/errors';
import { 
  validateNorwegianTutoringTime, 
  formatNorwegianDateTime,
  getNextAvailableNorwegianSlots 
} from '@/lib/norwegian-calendar';
import { z } from 'zod';
import { parseISO, addDays, isAfter, isBefore, addMinutes } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Route parameters validation
 */
const routeParamsSchema = z.object({
  appointmentId: z.string().cuid('Invalid appointment ID format'),
});

type RouteParams = z.infer<typeof routeParamsSchema>;

/**
 * Reschedule request schema
 */
const rescheduleRequestSchema = z.object({
  newDateTime: z.string().datetime('Invalid date time format'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
  proposedAlternatives: z.array(z.string().datetime()).max(5, 'Maximum 5 alternatives').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

type RescheduleRequestInput = z.infer<typeof rescheduleRequestSchema>;

/**
 * Reschedule response schema
 */
const rescheduleResponseSchema = z.object({
  requestId: z.string().cuid(),
  accepted: z.boolean(),
  counterProposal: z.string().datetime().optional(),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

type RescheduleResponseInput = z.infer<typeof rescheduleResponseSchema>;

/**
 * GET /api/appointments/[appointmentId]/reschedule - Get rescheduling options and pending requests
 */
async function handleGET(
  request: NextRequest,
  context: APIContext,
  { params }: { params: RouteParams }
) {
  const { user } = context;
  const { appointmentId } = params;

  try {
    // Get appointment details
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

    // Check if appointment can be rescheduled
    const canReschedule = await canAppointmentBeRescheduled(appointment, user!.id);
    if (!canReschedule.allowed) {
      throw new BadRequestError(canReschedule.reason || 'Appointment cannot be rescheduled');
    }

    // Get pending reschedule requests for this appointment
    const pendingRequests = await getRescheduleRequests(appointmentId, user!.id);

    // Generate suggested alternative times
    const suggestedTimes = await generateRescheduleSuggestions(
      appointment,
      appointment.chat.participants.map(p => p.user.id)
    );

    // Get Norwegian calendar context
    const norwegianContext = formatNorwegianDateTime(appointment.dateTime);
    const currentTime = new Date();
    const timeUntilAppointment = appointment.dateTime.getTime() - currentTime.getTime();
    const hoursUntil = Math.floor(timeUntilAppointment / (1000 * 60 * 60));

    const rescheduleInfo = {
      appointmentId: appointment.id,
      currentDateTime: appointment.dateTime.toISOString(),
      norwegianContext,
      canReschedule: true,
      hoursUntil,
      urgencyLevel: hoursUntil < 24 ? 'high' : hoursUntil < 72 ? 'medium' : 'low',
      pendingRequests,
      suggestedTimes,
      restrictions: {
            minNoticeHours: 2,
            maxAdvanceDays: 30,
            allowWeekends: true,
            respectNorwegianHolidays: true,
          },
      userRole: determineUserRole(appointment, user!.id),
      otherParticipants: appointment.chat.participants
        .filter(p => p.user.id !== user!.id)
        .map(p => ({
          id: p.user.id,
          name: p.user.name,
          region: p.user.region,
        })),
    };

    return createSuccessResponse(
      rescheduleInfo,
      'Reschedule options retrieved successfully',
      {
        language: context.language,
        hasPendingRequests: pendingRequests.length > 0,
        suggestedCount: suggestedTimes.length,
      }
    );

  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError || error instanceof BadRequestError) {
      throw error;
    }
    console.error('Error getting reschedule options:', error);
    throw new BadRequestError('Failed to get reschedule options');
  }
}

/**
 * POST /api/appointments/[appointmentId]/reschedule - Request appointment reschedule
 */
async function handlePOST(
  request: NextRequest,
  context: APIContext,
  { params }: { params: RouteParams }
) {
  const { user, validatedData } = context;
  const { appointmentId } = params;
  const rescheduleData = validatedData?.body as RescheduleRequestInput;

  try {
    // Get appointment
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
            relatedPost: true,
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

    // Validate reschedule ability
    const canReschedule = await canAppointmentBeRescheduled(appointment, user!.id);
    if (!canReschedule.allowed) {
      throw new BadRequestError(canReschedule.reason || 'Appointment cannot be rescheduled');
    }

    // Validate new time
    const newDateTime = parseISO(rescheduleData.newDateTime);
    const validationResult = await validateRescheduleTime(
      appointment,
      newDateTime,
      appointment.chat.participants.map(p => p.user.id)
    );

    if (!validationResult.isValid) {
      throw new BadRequestError(`Invalid reschedule time: ${validationResult.errors.join(', ')}`);
    }

    // Create reschedule request
    const rescheduleRequest = await createRescheduleRequest(
      appointment,
      user!.id,
      rescheduleData,
      validationResult.warnings
    );

    // Check if this is a mutual agreement (both parties in 2-person appointment)
    const isTwoPersonAppointment = appointment.chat.participants.length === 2;
    const otherParticipant = appointment.chat.participants.find(p => p.user.id !== user!.id);

    if (isTwoPersonAppointment && otherParticipant) {
      // For direct tutoring sessions, we can apply the reschedule immediately
      // and notify the other party, but require their confirmation
      
      // Update appointment with new time (pending confirmation)
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          dateTime: newDateTime,
          notes: `${appointment.notes || ''}\n\nRescheduled by ${user!.name}: ${rescheduleData.reason}`.trim(),
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

      // Create system message
      await createRescheduleMessage(
        appointment.chatId,
        user!.id,
        'rescheduled',
        updatedAppointment,
        rescheduleData.reason
      );

      const result = {
        requestId: rescheduleRequest.id,
        status: 'applied',
        appointmentId: updatedAppointment.id,
        oldDateTime: appointment.dateTime.toISOString(),
        newDateTime: updatedAppointment.dateTime.toISOString(),
        norwegianContext: formatNorwegianDateTime(updatedAppointment.dateTime),
        reason: rescheduleData.reason,
        requiresConfirmation: true,
        notifiedParties: [otherParticipant.user.name],
        warnings: validationResult.warnings,
      };

      return createSuccessResponse(
        result,
        'Appointment rescheduled successfully',
        {
          language: context.language,
          rescheduled: true,
          requiresConfirmation: true,
        }
      );
    }

    // For group appointments or other cases, create a pending request
    const result = {
      requestId: rescheduleRequest.id,
      status: 'pending',
      appointmentId: appointment.id,
      currentDateTime: appointment.dateTime.toISOString(),
      requestedDateTime: newDateTime.toISOString(),
      norwegianContext: formatNorwegianDateTime(newDateTime),
      reason: rescheduleData.reason,
      awaitingResponse: appointment.chat.participants
        .filter(p => p.user.id !== user!.id)
        .map(p => p.user.name),
      warnings: validationResult.warnings,
    };

    return createSuccessResponse(
      result,
      'Reschedule request sent successfully',
      {
        language: context.language,
        requestSent: true,
        awaitingCount: result.awaitingResponse.length,
      },
      201
    );

  } catch (error) {
    if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    console.error('Error requesting reschedule:', error);
    throw new BadRequestError('Failed to request reschedule');
  }
}

/**
 * Helper functions
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

async function canAppointmentBeRescheduled(
  appointment: any,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Can't reschedule completed or cancelled appointments
  if (appointment.status === AppointmentStatus.COMPLETED) {
    return { allowed: false, reason: 'Cannot reschedule completed appointment' };
  }

  if (appointment.status === AppointmentStatus.CANCELLED) {
    return { allowed: false, reason: 'Cannot reschedule cancelled appointment' };
  }

  // Can't reschedule if less than 2 hours away (emergency only)
  const twoHoursFromNow = addMinutes(new Date(), 120);
  if (isBefore(appointment.dateTime, twoHoursFromNow)) {
    return { allowed: false, reason: 'Cannot reschedule appointment less than 2 hours before start time' };
  }

  // Must be a participant
  const hasAccess = appointment.chat.participants.some((p: any) => p.user.id === userId);
  if (!hasAccess) {
    return { allowed: false, reason: 'You do not have access to this appointment' };
  }

  return { allowed: true };
}

async function validateRescheduleTime(
  appointment: any,
  newDateTime: Date,
  participantIds: string[]
): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if in the past
  if (isBefore(newDateTime, new Date())) {
    errors.push('Cannot reschedule to a time in the past');
  }

  // Check minimum advance notice (2 hours)
  const twoHoursFromNow = addMinutes(new Date(), 120);
  if (isBefore(newDateTime, twoHoursFromNow)) {
    errors.push('Minimum 2 hours advance notice required');
  }

  // Check maximum advance booking (30 days)
  const thirtyDaysFromNow = addDays(new Date(), 30);
  if (isAfter(newDateTime, thirtyDaysFromNow)) {
    errors.push('Cannot schedule more than 30 days in advance');
  }

  // Norwegian-specific validation
  const norwegianValidation = validateNorwegianTutoringTime(newDateTime);
  warnings.push(...norwegianValidation.warnings);

  // Check availability for all participants
  for (const participantId of participantIds) {
    const availability = await checkUserAvailability(participantId, newDateTime, appointment.duration);
    if (!availability.isAvailable) {
      errors.push(`Time conflicts with existing appointments for participant`);
      break; // Don't need to check all if one conflicts
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

async function generateRescheduleSuggestions(
  appointment: any,
  participantIds: string[]
): Promise<Array<{
  dateTime: string;
  norwegianContext: any;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}>> {
  const suggestions: Array<{
    dateTime: string;
    norwegianContext: any;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
  }> = [];

  const baseDate = new Date(appointment.dateTime);
  const duration = appointment.duration;

  // Generate suggestions for next 14 days
  for (let daysOffset = 1; daysOffset <= 14 && suggestions.length < 5; daysOffset++) {
    const suggestionDate = addDays(baseDate, daysOffset);
    
    // Try same time first
    suggestionDate.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);
    
    try {
      // Check if all participants are available
      let allAvailable = true;
      for (const participantId of participantIds) {
        const availability = await checkUserAvailability(participantId, suggestionDate, duration);
        if (!availability.isAvailable) {
          allAvailable = false;
          break;
        }
      }

      if (allAvailable) {
        const norwegianValidation = validateNorwegianTutoringTime(suggestionDate);
        
        suggestions.push({
          dateTime: suggestionDate.toISOString(),
          norwegianContext: formatNorwegianDateTime(suggestionDate),
          reason: daysOffset === 1 ? 'Same time tomorrow' : `Same time in ${daysOffset} days`,
          confidence: norwegianValidation.isValid ? 'high' : 'medium',
        });
      }
    } catch (error) {
      // Skip this suggestion if there's an error
      continue;
    }
  }

  return suggestions;
}

async function getRescheduleRequests(
  appointmentId: string,
  userId: string
): Promise<Array<{
  id: string;
  requestedBy: string;
  requestedDateTime: string;
  reason: string;
  status: string;
  createdAt: string;
}>> {
  // This would typically query a reschedule_requests table
  // For now, we'll return an empty array since we don't have this table yet
  // In a full implementation, you'd create a separate table for tracking reschedule requests
  return [];
}

async function createRescheduleRequest(
  appointment: any,
  userId: string,
  rescheduleData: RescheduleRequestInput,
  warnings: string[]
): Promise<{ id: string }> {
  // In a full implementation, you'd insert into a reschedule_requests table
  // For now, we'll just return a mock ID
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Log the reschedule request for debugging
  console.log('Reschedule request created:', {
    requestId,
    appointmentId: appointment.id,
    requestedBy: userId,
    oldDateTime: appointment.dateTime,
    newDateTime: rescheduleData.newDateTime,
    reason: rescheduleData.reason,
    warnings,
  });
  
  return { id: requestId };
}

async function createRescheduleMessage(
  chatId: string,
  userId: string,
  messageType: 'rescheduled' | 'reschedule_requested',
  appointment: any,
  reason: string
): Promise<void> {
  const norwegianDateTime = formatNorwegianDateTime(appointment.dateTime);
  
  let messageContent: string;
  if (messageType === 'rescheduled') {
    messageContent = `📅 Avtalen er flyttet til ${norwegianDateTime.full}\nÅrsak: ${reason}`;
  } else {
    messageContent = `📅 Forespørsel om å flytte avtalen til ${norwegianDateTime.full}\nÅrsak: ${reason}`;
  }

  await prisma.message.create({
    data: {
      chatId,
      senderId: userId,
      content: messageContent,
      type: 'APPOINTMENT_REQUEST',
      appointmentId: appointment.id,
    },
  });
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
    body: rescheduleRequestSchema,
  },
  language: 'no',
  rateLimit: {
    maxAttempts: 5, // Limit reschedule requests to prevent abuse
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