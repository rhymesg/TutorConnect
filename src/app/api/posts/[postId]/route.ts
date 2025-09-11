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

/**
 * GET /api/posts/[postId]
 * Fetch a single post for editing (owner check included)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { postId } = await params;
    
    // Verify authentication
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Ikke autorisert' },
        { status: 401 }
      );
    }

    // Fetch the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            isActive: true,
            region: true,
            teacherSessions: true,
            teacherStudents: true,
            studentSessions: true,
            studentTeachers: true,
          },
        },
        _count: {
          select: {
            chats: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Annonsen ble ikke funnet' },
        { status: 404 }
      );
    }

    // Check if user is the owner of the post
    if (post.userId !== (user.sub || user.userId || user.id)) {
      return NextResponse.json(
        { error: 'Du har ikke tilgang til å redigere denne annonsen' },
        { status: 403 }
      );
    }

    // Convert Decimal to number for client component compatibility
    const serializedPost = {
      ...post,
      hourlyRate: post.hourlyRate ? Number(post.hourlyRate) : null,
      hourlyRateMin: post.hourlyRateMin ? Number(post.hourlyRateMin) : null,
      hourlyRateMax: post.hourlyRateMax ? Number(post.hourlyRateMax) : null,
    };

    return NextResponse.json(serializedPost);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Noe gikk galt ved henting av annonsen' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/posts/[postId] - Update a post
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { postId } = await params;
    
    // Verify authentication
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Ikke autorisert' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();

    // Check if user owns the post
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true }
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Annonsen ble ikke funnet' },
        { status: 404 }
      );
    }

    if (existingPost.userId !== (user.sub || user.userId || user.id)) {
      return NextResponse.json(
        { error: 'Du har ikke tilgang til å redigere denne annonsen' },
        { status: 403 }
      );
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title: body.title,
        description: body.description,
        subject: body.subject,
        customSubject: body.customSubject,
        ageGroups: body.ageGroups,
        location: body.location,
        postnummer: body.postnummer,
        hourlyRate: body.hourlyRate ? parseFloat(body.hourlyRate) : null,
        hourlyRateMin: body.hourlyRateMin ? parseFloat(body.hourlyRateMin) : null,
        hourlyRateMax: body.hourlyRateMax ? parseFloat(body.hourlyRateMax) : null,
        currency: body.currency || 'NOK',
        availableDays: body.availableDays,
        startTime: body.startTime,
        endTime: body.endTime,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            isActive: true,
            region: true,
            teacherSessions: true,
            teacherStudents: true,
            studentSessions: true,
            studentTeachers: true,
          },
        },
        _count: {
          select: {
            chats: true,
          },
        },
      },
    });

    // Convert Decimal to number for client component compatibility
    const serializedPost = {
      ...updatedPost,
      hourlyRate: updatedPost.hourlyRate ? Number(updatedPost.hourlyRate) : null,
      hourlyRateMin: updatedPost.hourlyRateMin ? Number(updatedPost.hourlyRateMin) : null,
      hourlyRateMax: updatedPost.hourlyRateMax ? Number(updatedPost.hourlyRateMax) : null,
    };

    return NextResponse.json(serializedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Noe gikk galt ved oppdatering av annonsen' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[postId] - Delete a post
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { postId } = await params;
    
    // Verify authentication
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Ikke autorisert' },
        { status: 401 }
      );
    }

    // Check if user owns the post
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true }
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Annonsen ble ikke funnet' },
        { status: 404 }
      );
    }

    if (existingPost.userId !== (user.sub || user.userId || user.id)) {
      return NextResponse.json(
        { error: 'Du har ikke tilgang til å slette denne annonsen' },
        { status: 403 }
      );
    }

    // Delete the post using a transaction to handle related data
    await prisma.$transaction(async (tx) => {
      // Delete related chats and their messages first
      const chats = await tx.chat.findMany({
        where: { relatedPostId: postId },
        select: { id: true }
      });

      for (const chat of chats) {
        // Delete messages in this chat
        await tx.message.deleteMany({
          where: { chatId: chat.id }
        });
        
        // Delete the chat
        await tx.chat.delete({
          where: { id: chat.id }
        });
      }
      
      // Finally delete the post
      await tx.post.delete({
        where: { id: postId }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Noe gikk galt ved sletting av annonsen' },
      { status: 500 }
    );
  }
}