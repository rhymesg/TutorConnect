import { NextRequest, NextResponse } from 'next/server';
import { PostStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import { authMiddleware, getAuthenticatedUser } from '@/middleware/auth';
import { NotFoundError, ForbiddenError, BadRequestError } from '@/lib/errors';

async function handlePATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const user = getAuthenticatedUser(request);
  const { postId } = await params;
  
  // Get request body
  const body = await request.json();
  const { status } = body;

  // Validate status
  if (!status || !['AKTIV', 'PAUSET'].includes(status)) {
    throw new BadRequestError('Ugyldig status. Må være AKTIV eller PAUSET');
  }

  // Find the post
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true }
  });

  if (!post) {
    throw new NotFoundError('Annonsen ble ikke funnet');
  }

  // Check if user owns the post
  if (post.userId !== user.id) {
    throw new ForbiddenError('Du har ikke tilgang til å endre denne annonsen');
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
    success: true,
    message: `Annonsestatus endret til ${status === 'AKTIV' ? 'aktiv' : 'pauset'}`,
    data: {
      post: updatedPost
    }
  });
}

export const PATCH = apiHandler(async (request: NextRequest, context: any) => {
  await authMiddleware(request);
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const postsIndex = pathSegments.indexOf('posts');
  const postId = postsIndex >= 0 && postsIndex < pathSegments.length - 1 ? pathSegments[postsIndex + 1] : '';
  
  if (!postId) {
    return NextResponse.json({ success: false, error: 'Post ID not found in URL' }, { status: 400 });
  }
  
  return handlePATCH(request, { params: Promise.resolve({ postId }) });
});