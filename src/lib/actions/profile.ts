'use server';

import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { updateProfileSchema, UpdateProfileInput } from '@/schemas/profile';
import { verifyAccessToken } from '@/lib/jwt';

const prisma = new PrismaClient();

export type ProfileFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
  profile?: any;
} | null;

/**
 * Get current user from JWT token
 */
async function getCurrentUser() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  
  if (!accessToken) {
    throw new Error('Ikke autorisert. Vennligst logg inn.');
  }

  try {
    const payload = await verifyAccessToken(accessToken);
    return payload;
  } catch (error) {
    throw new Error('Ugyldig autentisering. Vennligst logg inn på nytt.');
  }
}

/**
 * React 19 Server Action for updating profile
 */
export async function updateProfileAction(
  prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  try {
    // Verify authentication
    const user = await getCurrentUser();

    // Extract form data
    const rawData = {
      name: formData.get('name') as string,
      region: formData.get('region') as string,
      postalCode: formData.get('postalCode') as string || undefined,
      gender: formData.get('gender') as string || undefined,
      birthYear: formData.get('birthYear') ? Number(formData.get('birthYear')) : undefined,
      school: formData.get('school') as string || undefined,
      degree: formData.get('degree') as string || undefined,
      certifications: formData.get('certifications') as string || undefined,
      bio: formData.get('bio') as string || undefined,
    };

    // Validate using Zod schema
    const validatedData = updateProfileSchema.parse(rawData);

    // Update profile
    const updatedProfile = await prisma.user.update({
      where: { id: user.userId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        region: true,
        postalCode: true,
        gender: true,
        birthYear: true,
        school: true,
        degree: true,
        certifications: true,
        bio: true,
        profileImage: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Revalidate relevant paths
    revalidatePath('/profile');
    revalidatePath(`/profile/${user.userId}`);

    return {
      success: true,
      profile: updatedProfile,
    };

  } catch (error) {
    console.error('Update profile action error:', error);

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

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('autorisert')) {
      redirect('/auth/login?message=auth-required');
    }

    return {
      error: error instanceof Error ? error.message : 'Det oppstod en feil ved oppdatering av profilen.',
    };
  }
}

/**
 * Server Action for uploading profile image
 */
export async function uploadProfileImageAction(
  prevState: { error?: string; success?: boolean; imageUrl?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; imageUrl?: string }> {
  try {
    // Verify authentication
    const user = await getCurrentUser();

    const image = formData.get('image') as File;
    
    if (!image) {
      return { error: 'Ingen bilde er valgt.' };
    }

    // Validate file size (5MB limit)
    if (image.size > 5 * 1024 * 1024) {
      return { error: 'Bildet må være mindre enn 5MB.' };
    }

    // Validate file type
    if (!image.type.startsWith('image/')) {
      return { error: 'Kun bildefiler er tillatt.' };
    }

    // For now, return a placeholder URL since we're not implementing actual file upload
    // In a real app, this would upload to cloud storage (e.g., Supabase Storage, AWS S3)
    const imageUrl = `/uploads/profiles/${user.userId}_${Date.now()}.${image.name.split('.').pop()}`;

    // Update profile image in database
    await prisma.user.update({
      where: { id: user.userId },
      data: { profileImage: imageUrl }
    });

    // Revalidate relevant paths
    revalidatePath('/profile');
    revalidatePath(`/profile/${user.userId}`);

    return {
      success: true,
      imageUrl,
    };

  } catch (error) {
    console.error('Upload profile image action error:', error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes('autorisert')) {
      redirect('/auth/login?message=auth-required');
    }

    return {
      error: error instanceof Error ? error.message : 'Kunne ikke laste opp bilde. Prøv igjen.',
    };
  }
}