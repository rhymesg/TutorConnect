import { NextRequest, NextResponse } from 'next/server';
import { PostStatus } from '@prisma/client';
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
    console.log('Using token from Authorization header');
  }
  
  // Fallback to cookie
  if (!accessToken) {
    const cookieStore = await cookies();
    accessToken = cookieStore.get('accessToken')?.value;
    if (accessToken) {
      console.log('Using token from cookie');
    }
  }
  
  if (!accessToken) {
    console.log('No token found in header or cookie');
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    
    // Verify authentication
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !['AKTIV', 'PAUSET'].includes(status)) {
      return NextResponse.json(
        { error: 'Ugyldig status. Må være AKTIV eller PAUSET' },
        { status: 400 }
      );
    }

    // Find the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Annonsen ble ikke funnet' },
        { status: 404 }
      );
    }

    // Check if user owns the post
    if (post.userId !== (user.sub || user.userId || user.id)) {
      return NextResponse.json(
        { error: 'Du har ikke tilgang til å endre denne annonsen' },
        { status: 403 }
      );
    }

    // Update post status
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { status: status as PostStatus },
      select: {
        id: true,
        status: true,
        title: true
      }
    });

    return NextResponse.json({
      message: `Annonsestatus endret til ${status === 'AKTIV' ? 'aktiv' : 'pauset'}`,
      post: updatedPost
    });

  } catch (error) {
    console.error('Error updating post status:', error);
    return NextResponse.json(
      { error: 'Kunne ikke endre annonsestatus. Prøv igjen senere.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}