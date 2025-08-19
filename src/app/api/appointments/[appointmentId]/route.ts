/**
 * Individual Appointment API Routes
 * Operations for specific appointments: GET, PATCH, DELETE
 * Includes Norwegian tutoring-specific features and validations
 */

import { NextRequest } from 'next/server';
import { PrismaClient, AppointmentStatus } from '@prisma/client';
import { createAPIHandler, createSuccessResponse, APIContext } from '@/lib/api-handler';
import { authMiddleware } from '@/middleware/auth';
import { 
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
  UpdateAppointmentInput,
  UpdateAppointmentStatusInput
} from '@/schemas/appointments';
import { 
  updateAppointment,
  updateAppointmentStatus,
  checkUserAvailability,
  AppointmentUtils
} from '@/lib/appointments';
import { BadRequestError, NotFoundError, ForbiddenError } from '@/lib/errors';
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
 * GET /api/appointments/[appointmentId] - Get specific appointment details
 */
async function handleGET(
  request: NextRequest, 
  context: APIContext, 
  { params }: { params: RouteParams }
) {
  const { user } = context;
  const { appointmentId } = params;

  try {
    // Get appointment with full details
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
                    region: true,
                    profileImage: true,
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
        messages: {
          where: {
            appointmentId,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
          orderBy: { sentAt: 'desc' },
          take: 10,
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

    // Add Norwegian context and user-specific data
    const norwegianContext = AppointmentUtils.formatNorwegianDateTime(appointment.dateTime);
    const userRole = determineUserRole(appointment, user!.id);
    const otherParticipants = appointment.chat.participants
      .filter(p => p.user.id !== user!.id)
      .map(p => ({
        id: p.user.id,
        name: p.user.name,
        email: p.user.email,
        region: p.user.region,
        profileImage: p.user.profileImage,
      }));

    // Check if user can modify this appointment
    const canModify = canUserModifyAppointment(appointment, user!.id);
    const canCancel = canUserCancelAppointment(appointment, user!.id);

    // Get availability context for rescheduling suggestions
    const availabilityContext = appointment.status === AppointmentStatus.PENDING 
      ? await getAvailabilityContext(user!.id, appointment.dateTime, appointment.duration)
      : null;

    const formattedAppointment = {
      ...appointment,
      norwegianContext,
      userRole,
      otherParticipants,
      subject: appointment.chat.relatedPost?.subject,
      postTitle: appointment.chat.relatedPost?.title,
      canModify,
      canCancel,
      recentMessages: appointment.messages,
      availabilityContext,
    };

    return createSuccessResponse(
      formattedAppointment,
      'Appointment details retrieved successfully',
      {
        language: context.language,
        hasMessages: appointment.messages.length > 0,
        participantCount: appointment.chat.participants.length,
      }
    );

  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    console.error('Error fetching appointment:', error);
    throw new BadRequestError('Failed to fetch appointment details');
  }
}

/**
 * PATCH /api/appointments/[appointmentId] - Update appointment details
 */
async function handlePATCH(
  request: NextRequest,
  context: APIContext,
  { params }: { params: RouteParams }
) {
  const { user, validatedData } = context;
  const { appointmentId } = params;
  const updateData = validatedData?.body as UpdateAppointmentInput;

  try {
    const updatedAppointment = await updateAppointment(appointmentId, user!.id, updateData);

    const formattedAppointment = {
      ...updatedAppointment,
      norwegianContext: AppointmentUtils.formatNorwegianDateTime(updatedAppointment.dateTime),
      userRole: determineUserRole(updatedAppointment, user!.id),
      otherParticipants: updatedAppointment.chat.participants
        .filter(p => p.user.id !== user!.id)
        .map(p => ({
          id: p.user.id,
          name: p.user.name,
          region: p.user.region,
        })),
      subject: updatedAppointment.chat.relatedPost?.subject,
      postTitle: updatedAppointment.chat.relatedPost?.title,
    };

    return createSuccessResponse(
      formattedAppointment,
      'Appointment updated successfully',
      {
        language: context.language,
        updated: true,
      }
    );

  } catch (error) {
    if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    console.error('Error updating appointment:', error);
    throw new BadRequestError('Failed to update appointment');
  }
}

/**
 * DELETE /api/appointments/[appointmentId] - Cancel appointment
 */
async function handleDELETE(
  request: NextRequest,
  context: APIContext,
  { params }: { params: RouteParams }
) {
  const { user } = context;
  const { appointmentId } = params;

  try {
    // Get cancellation reason from query params or body
    const url = new URL(request.url);
    const reason = url.searchParams.get('reason') || 'Cancelled by user';

    const cancelledAppointment = await updateAppointmentStatus(appointmentId, user!.id, {
      status: AppointmentStatus.CANCELLED,
      cancellationReason: reason,
    });

    return createSuccessResponse(
      {
        id: cancelledAppointment.id,
        status: cancelledAppointment.status,
        cancellationReason: cancelledAppointment.cancellationReason,
        norwegianContext: AppointmentUtils.formatNorwegianDateTime(cancelledAppointment.dateTime),
      },
      'Appointment cancelled successfully',
      {
        language: context.language,
        cancelled: true,
      }
    );

  } catch (error) {
    if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    console.error('Error cancelling appointment:', error);
    throw new BadRequestError('Failed to cancel appointment');
  }
}

/**
 * Helper function to determine user role in appointment
 */
function determineUserRole(
  appointment: any,
  userId: string
): 'tutor' | 'student' | 'participant' {
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
 * Check if user can modify appointment
 */
function canUserModifyAppointment(appointment: any, userId: string): boolean {
  // Can't modify completed or cancelled appointments
  if (appointment.status === AppointmentStatus.COMPLETED || 
      appointment.status === AppointmentStatus.CANCELLED) {
    return false;
  }

  // Can't modify if less than 2 hours before start time
  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
  if (appointment.dateTime < twoHoursFromNow && 
      appointment.status === AppointmentStatus.CONFIRMED) {
    return false;
  }

  // Must be a participant
  return appointment.chat.participants.some((p: any) => p.user.id === userId);
}

/**
 * Check if user can cancel appointment
 */
function canUserCancelAppointment(appointment: any, userId: string): boolean {
  // Can't cancel completed appointments
  if (appointment.status === AppointmentStatus.COMPLETED || 
      appointment.status === AppointmentStatus.CANCELLED) {
    return false;
  }

  // Must be a participant
  return appointment.chat.participants.some((p: any) => p.user.id === userId);
}

/**
 * Get availability context for rescheduling suggestions
 */
async function getAvailabilityContext(
  userId: string,
  currentDateTime: Date,
  duration: number
): Promise<{
  hasConflicts: boolean;
  nearbyAvailableSlots: Array<{
    dateTime: string;
    norwegianFormat: any;
  }>;
}> {
  try {
    const availability = await checkUserAvailability(userId, currentDateTime, duration);
    
    // Generate nearby available slots if there are conflicts
    let nearbyAvailableSlots: Array<{ dateTime: string; norwegianFormat: any }> = [];
    
    if (!availability.isAvailable) {
      // Suggest alternative times within next 7 days
      const suggestions = [];
      const baseDate = new Date(currentDateTime);
      
      for (let days = 1; days <= 7; days++) {
        const suggestionDate = new Date(baseDate);
        suggestionDate.setDate(baseDate.getDate() + days);
        
        // Keep same time
        const availability = await checkUserAvailability(userId, suggestionDate, duration);
        if (availability.isAvailable) {
          suggestions.push({
            dateTime: suggestionDate.toISOString(),
            norwegianFormat: AppointmentUtils.formatNorwegianDateTime(suggestionDate),
          });
          
          if (suggestions.length >= 3) break; // Limit to 3 suggestions
        }
      }
      
      nearbyAvailableSlots = suggestions;
    }

    return {
      hasConflicts: !availability.isAvailable,
      nearbyAvailableSlots,
    };
  } catch (error) {
    console.error('Error getting availability context:', error);
    return {
      hasConflicts: false,
      nearbyAvailableSlots: [],
    };
  }
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

export const PATCH = createAPIHandler(handlePATCH, {
  requireAuth: true,
  validation: {
    params: routeParamsSchema,
    body: updateAppointmentSchema,
  },
  language: 'no',
  rateLimit: {
    maxAttempts: 20, // Allow more updates than creation
    windowMs: 60 * 1000,
  },
});

export const DELETE = createAPIHandler(handleDELETE, {
  requireAuth: true,
  validation: {
    params: routeParamsSchema,
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
      'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}