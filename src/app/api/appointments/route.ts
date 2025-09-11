import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { z } from 'zod';

// Query schema
const appointmentQuerySchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'WAITING_TO_COMPLETE', 'COMPLETED', 'CANCELLED']).nullable().optional(),
  limit: z.string().nullable().optional().transform(val => val ? Math.min(parseInt(val), 100) : 50),
  page: z.string().nullable().optional().transform(val => val ? parseInt(val) : 1),
  chatId: z.string().nullable().optional(),
});

import { updateExpiredAppointments } from '@/lib/appointment-utils';

/**
 * GET /api/appointments - Get user's appointments
 */
async function handleGET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);

  // Update expired appointments first
  await updateExpiredAppointments();

  // Validate query parameters
  const { status, limit, page, chatId } = appointmentQuerySchema.parse({
    status: searchParams.get('status') as any,
    limit: searchParams.get('limit'),
    page: searchParams.get('page'),
    chatId: searchParams.get('chatId'),
  });

  const skip = (page - 1) * limit;

  // Build where clause
  let appointmentWhere: any = {
    chat: {
      participants: {
        some: {
          userId: user.id,
          isActive: true,
        },
      },
    },
  };

  if (status) {
    appointmentWhere.status = status;
  }

  if (chatId) {
    appointmentWhere.chatId = chatId;
  }

  // Get appointments with related data
  const [appointments, totalCount] = await Promise.all([
    prisma.appointment.findMany({
      where: appointmentWhere,
      include: {
        chat: {
          include: {
            participants: {
              where: {
                userId: { not: user.id },
                isActive: true,
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profileImage: true,
                  },
                },
              },
            },
            relatedPost: {
              select: {
                id: true,
                title: true,
                subject: true,
                type: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { dateTime: 'asc' },
      skip,
      take: limit,
    }),
    prisma.appointment.count({
      where: appointmentWhere,
    }),
  ]);

  // Transform appointments for frontend
  const transformedAppointments = appointments.map(appointment => {
    const otherParticipant = appointment.chat.participants[0];
    const relatedPost = appointment.chat.relatedPost;

    return {
      id: appointment.id,
      dateTime: appointment.dateTime,
      duration: appointment.duration,
      location: appointment.location,
      status: appointment.status,
      chatId: appointment.chatId,
      otherUser: otherParticipant?.user || relatedPost?.user || null,
      relatedPost: relatedPost ? {
        id: relatedPost.id,
        title: relatedPost.title,
        subject: relatedPost.subject,
        type: relatedPost.type,
      } : null,
    };
  });

  const totalPages = Math.ceil(totalCount / limit);

  return NextResponse.json({
    success: true,
    data: {
      appointments: transformedAppointments,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    },
  });
}

export const GET = apiHandler(async (request: NextRequest) => {
  await authMiddleware(request);
  return handleGET(request);
});