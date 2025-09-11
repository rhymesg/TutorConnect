import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';

interface RouteParams {
  chatId: string;
}

/**
 * GET /api/chat/[chatId]/appointments/check?date=YYYY-MM-DD - Check if appointment exists for date
 */
async function handleGET(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  const user = getAuthenticatedUser(request);
  const { chatId } = await params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({
      success: false,
      message: 'Date parameter is required',
    }, { status: 400 });
  }

  // Check if there's already an appointment for this chat on the selected date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      chatId,
      dateTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      // Check for any appointment on this date regardless of status
      // Only exclude CANCELLED appointments as they shouldn't block new appointments
      status: {
        not: 'CANCELLED',
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      hasAppointment: !!existingAppointment,
    },
  });
}

export const GET = apiHandler(async (request: NextRequest, context: any) => {
  await authMiddleware(request);
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const chatIndex = pathSegments.indexOf('chat');
  const chatId = chatIndex >= 0 && chatIndex < pathSegments.length - 1 ? pathSegments[chatIndex + 1] : '';
  
  if (!chatId) {
    return NextResponse.json({ success: false, error: 'Chat ID not found in URL' }, { status: 400 });
  }
  
  return handleGET(request, { params: Promise.resolve({ chatId }) });
});