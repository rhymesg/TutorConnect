import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

/**
 * Get current user from JWT token (either from Authorization header or cookie)
 */
async function getCurrentUser(request: NextRequest) {
  let accessToken: string | undefined;
  
  // First try Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    accessToken = authHeader.substring(7);
  }
  
  // Fallback to cookie
  if (!accessToken) {
    const cookieStore = await cookies();
    accessToken = cookieStore.get('accessToken')?.value;
  }
  
  if (!accessToken) {
    return null;
  }

  try {
    const payload = await verifyAccessToken(accessToken);
    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * PATCH /api/profile/email-notifications
 * Update user's email notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Ikke autorisert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const userId = user.sub || user.userId || user.id;
    
    // Log for debugging
    console.log('Updating email notifications for user:', userId);
    console.log('Request body:', body);

    // Update email notification settings
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        emailNewChat: body.emailNewChat,
        emailNewMessage: body.emailNewMessage,
        emailAppointmentConfirm: body.emailAppointmentConfirm,
        emailAppointmentComplete: body.emailAppointmentComplete,
      },
      select: {
        id: true,
        emailNewChat: true,
        emailNewMessage: true,
        emailAppointmentConfirm: true,
        emailAppointmentComplete: true,
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating email notifications:', error);
    return NextResponse.json(
      { error: 'Noe gikk galt ved oppdatering av e-postvarsler' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profile/email-notifications
 * Get user's current email notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Ikke autoriseret' },
        { status: 401 }
      );
    }

    const userId = user.sub || user.userId || user.id;

    // Get current email notification settings
    const userSettings = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        emailNewChat: true,
        emailNewMessage: true,
        emailAppointmentConfirm: true,
        emailAppointmentComplete: true,
      }
    });

    if (!userSettings) {
      return NextResponse.json(
        { error: 'Bruker ikke funnet' },
        { status: 404 }
      );
    }

    return NextResponse.json(userSettings);
  } catch (error) {
    console.error('Error fetching email notifications:', error);
    return NextResponse.json(
      { error: 'Noe gikk galt ved henting av e-postvarsler' },
      { status: 500 }
    );
  }
}