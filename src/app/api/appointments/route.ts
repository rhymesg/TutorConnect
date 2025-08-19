/**
 * Appointments API Routes
 * Main CRUD operations for Norwegian tutoring appointments
 * Integrated with chat system and Norwegian calendar features
 */

import { NextRequest } from 'next/server';
import { createAPIHandler, createSuccessResponse, createPaginatedResponse, APIContext } from '@/lib/api-handler';
import { authMiddleware, requireEmailVerification } from '@/middleware/auth';
import { 
  createAppointmentSchema, 
  listAppointmentsSchema,
  ListAppointmentsInput,
  CreateAppointmentInput 
} from '@/schemas/appointments';
import { 
  createAppointment, 
  getUserAppointments,
  getAppointmentStats,
  AppointmentUtils
} from '@/lib/appointments';
import { BadRequestError, NotFoundError } from '@/lib/errors';
import { handleZodError } from '@/lib/errors';


/**
 * POST /api/appointments - Create new appointment with Norwegian validation
 */
async function handlePOST(request: NextRequest, context: APIContext) {
  const { user, validatedData } = context;
  const appointmentData = validatedData?.body as CreateAppointmentInput;

  try {
    const result = await createAppointment(user!.id, appointmentData);

    // Format response with Norwegian context
    const formattedResult = {
      ...result,
      appointment: {
        ...result.appointment,
        norwegianContext: AppointmentUtils.formatNorwegianDateTime(result.appointment.dateTime),
        userRole: determineUserRole(result.appointment, user!.id),
        otherParticipants: result.appointment.chat.participants
          .filter(p => p.user.id !== user!.id)
          .map(p => ({
            id: p.user.id,
            name: p.user.name,
            region: p.user.region,
          })),
        subject: result.appointment.chat.relatedPost?.subject,
        postTitle: result.appointment.chat.relatedPost?.title,
      },
    };

    return createSuccessResponse(
      formattedResult,
      result.message,
      {
        hasWarnings: result.warnings.length > 0,
        warnings: result.warnings,
        hasRecurring: !!result.recurringAppointments,
        recurringCount: result.recurringAppointments?.length || 0,
        language: context.language,
      },
      201
    );

  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    console.error('Error creating appointment:', error);
    throw new BadRequestError('Failed to create appointment');
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
 * Enhanced validation for query parameters
 */
const validateQuery = (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.getAll('status').filter(Boolean);
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;
  const chatId = searchParams.get('chatId') || undefined;
  const sortBy = (searchParams.get('sortBy') || 'dateTime') as 'dateTime' | 'createdAt' | 'updatedAt';
  const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

  return listAppointmentsSchema.parse({
    page,
    limit,
    status: status.length > 0 ? status : undefined,
    dateFrom,
    dateTo,
    chatId,
    sortBy,
    sortOrder,
  });
};

/**
 * Export route handlers with enhanced Norwegian tutoring features
 */
export const GET = createAPIHandler(async (request: NextRequest, context: APIContext) => {
  // Manual validation for GET request
  const filters = validateQuery(request);
  const { user } = context;

  const result = await getUserAppointments(user!.id, filters);

  // Add Norwegian context to each appointment
  const appointmentsWithContext = result.appointments.map(appointment => {
    const norwegianContext = AppointmentUtils.formatNorwegianDateTime(appointment.dateTime);
    
    // Determine user's role in the appointment
    const currentUserParticipant = appointment.chat.participants.find(p => p.user.id === user!.id);
    const otherParticipants = appointment.chat.participants.filter(p => p.user.id !== user!.id);
    
    // Check if user is tutor or student based on post
    let userRole: 'tutor' | 'student' | 'participant' = 'participant';
    if (appointment.chat.relatedPost) {
      if (appointment.chat.relatedPost.user.id === user!.id) {
        userRole = appointment.chat.relatedPost.type === 'TEACHER' ? 'tutor' : 'student';
      } else {
        userRole = appointment.chat.relatedPost.type === 'TEACHER' ? 'student' : 'tutor';
      }
    }

    return {
      ...appointment,
      norwegianContext,
      userRole,
      otherParticipants: otherParticipants.map(p => ({
        id: p.user.id,
        name: p.user.name,
        region: p.user.region,
      })),
      subject: appointment.chat.relatedPost?.subject,
      postTitle: appointment.chat.relatedPost?.title,
    };
  });

  return createPaginatedResponse(
    appointmentsWithContext,
    result.pagination,
    'Appointments retrieved successfully',
    {
      totalAppointments: result.pagination.total,
      language: context.language,
    }
  );
}, {
  requireAuth: true,
  language: 'no',
});

export const POST = createAPIHandler(handlePOST, {
  requireAuth: true,
  validation: {
    body: createAppointmentSchema,
  },
  language: 'no',
  rateLimit: {
    maxAttempts: 10, // Limit appointment creation to prevent spam
    windowMs: 60 * 1000, // 1 minute window
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