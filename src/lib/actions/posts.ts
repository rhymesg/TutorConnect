'use server';

import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { CreatePostFormSchema, UpdatePostFormSchema } from '@/schemas/post-form';
import { PostWithDetails } from '@/types/database';
import { verifyAccessToken } from '@/lib/jwt';

const prisma = new PrismaClient();

export type PostFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
  post?: PostWithDetails;
} | null;

/**
 * Get current user from JWT token
 */
async function getCurrentUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  
  console.log('AccessToken exists:', !!accessToken);
  
  if (!accessToken) {
    throw new Error('Ikke autorisert. Vennligst logg inn.');
  }

  try {
    const payload = await verifyAccessToken(accessToken);
    console.log('JWT payload fields:', Object.keys(payload));
    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    throw new Error('Ugyldig autentisering. Vennligst logg inn på nytt.');
  }
}

/**
 * React 19 Server Action for creating posts
 */
/**
 * Get a single post by ID
 */
export async function getPostById(postId: string): Promise<PostWithDetails | null> {
  try {
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
      return null;
    }

    // Convert Decimal to number for client component compatibility
    const serializedPost = {
      ...post,
      hourlyRate: post.hourlyRate ? Number(post.hourlyRate) : null,
      hourlyRateMin: post.hourlyRateMin ? Number(post.hourlyRateMin) : null,
      hourlyRateMax: post.hourlyRateMax ? Number(post.hourlyRateMax) : null,
    };

    return serializedPost as PostWithDetails;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

export async function createPostAction(
  prevState: PostFormState,
  formData: FormData
): Promise<PostFormState> {
  try {
    // Verify authentication
    const user = await getCurrentUser();

    // Extract form data
    const rawData = {
      type: formData.get('type') as string,
      title: formData.get('title') as string,
      subject: formData.get('subject') as string,
      customSubject: formData.get('customSubject') as string || undefined,
      ageGroups: formData.getAll('ageGroups') as string[],
      description: formData.get('description') as string,
      availableDays: formData.getAll('availableDays') as string[],
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      location: formData.get('location') as string,
      postnummer: formData.get('postnummer') as string || undefined,
      hourlyRate: formData.get('hourlyRate') ? Number(formData.get('hourlyRate')) : undefined,
      hourlyRateMin: formData.get('hourlyRateMin') ? Number(formData.get('hourlyRateMin')) : undefined,
      hourlyRateMax: formData.get('hourlyRateMax') ? Number(formData.get('hourlyRateMax')) : undefined,
    };

    // Validate using Zod schema
    const validatedData = CreatePostFormSchema.parse(rawData);

    // Create post
    const post = await prisma.post.create({
      data: {
        ...validatedData,
        userId: user.sub || user.userId, // Try both sub and userId fields
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            region: true,
            profileImage: true,
            isActive: true,
          }
        }
      }
    });

    console.log(`Post created successfully: ID=${post.id}, User=${user.sub}, Type=${post.type}`);

    // Revalidate relevant paths
    revalidatePath('/posts');
    revalidatePath('/dashboard');
    revalidatePath(`/posts/${post.id}`);

    // Redirect to the created post
    redirect(`/posts/${post.id}?created=true`);

  } catch (error) {
    console.error('Create post action error:', error);

    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      const fieldErrors: Record<string, string> = {};
      
      zodError.errors.forEach((err: any) => {
        const field = err.path[0];
        fieldErrors[field] = err.message;
      });

      return {
        fieldErrors,
      };
    }

    // Handle redirect (this is actually success)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error; // Re-throw redirect
    }

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('autorisert')) {
      redirect('/auth/login?message=auth-required');
    }

    return {
      error: error instanceof Error ? error.message : 'Det oppstod en feil ved opprettelse av annonsen.',
    };
  }
}

/**
 * React 19 Server Action for updating posts
 */
export async function updatePostAction(
  postId: string,
  prevState: PostFormState,
  formData: FormData
): Promise<PostFormState> {
  try {
    // Verify authentication
    const user = await getCurrentUser();

    // Check if post exists and user owns it
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true, id: true }
    });

    if (!existingPost) {
      return {
        error: 'Annonsen ble ikke funnet.',
      };
    }

    if (existingPost.userId !== user.userId) {
      return {
        error: 'Du har ikke tilgang til å redigere denne annonsen.',
      };
    }

    // Extract form data
    const rawData = {
      type: formData.get('type') as string,
      title: formData.get('title') as string,
      subject: formData.get('subject') as string,
      customSubject: formData.get('customSubject') as string || undefined,
      ageGroups: formData.getAll('ageGroups') as string[],
      description: formData.get('description') as string,
      availableDays: formData.getAll('availableDays') as string[],
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      location: formData.get('location') as string,
      postnummer: formData.get('postnummer') as string || undefined,
      hourlyRate: formData.get('hourlyRate') ? Number(formData.get('hourlyRate')) : undefined,
      hourlyRateMin: formData.get('hourlyRateMin') ? Number(formData.get('hourlyRateMin')) : undefined,
      hourlyRateMax: formData.get('hourlyRateMax') ? Number(formData.get('hourlyRateMax')) : undefined,
    };

    // Validate using Zod schema
    const validatedData = UpdatePostFormSchema.parse(rawData);

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            region: true,
            profileImage: true,
            isActive: true,
          }
        }
      }
    });

    // Revalidate relevant paths
    revalidatePath('/posts');
    revalidatePath('/dashboard');
    revalidatePath(`/posts/${postId}`);
    revalidatePath(`/posts/${postId}/edit`);

    // Redirect to the updated post
    redirect(`/posts/${postId}?updated=true`);

  } catch (error) {
    console.error('Update post action error:', error);

    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      const fieldErrors: Record<string, string> = {};
      
      zodError.errors.forEach((err: any) => {
        const field = err.path[0];
        fieldErrors[field] = err.message;
      });

      return {
        fieldErrors,
      };
    }

    // Handle redirect (this is actually success)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error; // Re-throw redirect
    }

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('autorisert')) {
      redirect('/auth/login?message=auth-required');
    }

    return {
      error: error instanceof Error ? error.message : 'Det oppstod en feil ved oppdatering av annonsen.',
    };
  }
}

/**
 * Server Action for deleting posts
 */
export async function deletePostAction(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify authentication
    const user = await getCurrentUser();

    // Check if post exists and user owns it
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true, id: true }
    });

    if (!existingPost) {
      return { success: false, error: 'Annonsen ble ikke funnet.' };
    }

    if (existingPost.userId !== user.userId) {
      return { success: false, error: 'Du har ikke tilgang til å slette denne annonsen.' };
    }

    // Delete post
    await prisma.post.delete({
      where: { id: postId }
    });

    // Revalidate relevant paths
    revalidatePath('/posts');
    revalidatePath('/dashboard');
    revalidatePath(`/posts/${postId}`);

    return { success: true };

  } catch (error) {
    console.error('Delete post action error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Det oppstod en feil ved sletting av annonsen.' 
    };
  }
}

/**
 * Server Action for toggling post active status
 */
export async function togglePostActiveAction(
  postId: string, 
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify authentication
    const user = await getCurrentUser();

    // Check if post exists and user owns it
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true, id: true }
    });

    if (!existingPost) {
      return { success: false, error: 'Annonsen ble ikke funnet.' };
    }

    if (existingPost.userId !== user.userId) {
      return { success: false, error: 'Du har ikke tilgang til å endre denne annonsen.' };
    }

    // Update post status
    await prisma.post.update({
      where: { id: postId },
      data: { isActive }
    });

    // Revalidate relevant paths
    revalidatePath('/posts');
    revalidatePath('/dashboard');
    revalidatePath(`/posts/${postId}`);

    return { success: true };

  } catch (error) {
    console.error('Toggle post active action error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Det oppstod en feil ved oppdatering av annonsen.' 
    };
  }
}