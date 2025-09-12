import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';

/**
 * POST /api/activity - Update user's last active timestamp
 * Used to track user activity on different pages
 */
async function handlePOST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  
  try {
    // Update user's last active timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastActive: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Activity updated',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating user activity:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update activity' 
      },
      { status: 500 }
    );
  }
}

export const POST = apiHandler(async (request: NextRequest) => {
  await authMiddleware(request);
  return handlePOST(request);
});