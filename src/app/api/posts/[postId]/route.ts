import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

const prisma = new PrismaClient();

/**
 * Get current user from JWT token
 */
async function getCurrentUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  
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
 * GET /api/posts/[postId]
 * Fetch a single post for editing (owner check included)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Ikke autorisert' },
        { status: 401 }
      );
    }

    // Fetch the post
    const post = await prisma.post.findUnique({
      where: { id: params.postId },
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