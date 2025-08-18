import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, type AuthenticatedRequest, getAuthenticatedUser } from '@/middleware/auth';
import { profileImageUploadSchema } from '@/schemas/profile';
import { 
  APIError, 
  ValidationError,
  BadRequestError,
  handleZodError,
  createErrorResponse 
} from '@/lib/errors';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Supabase client for file uploads
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for server-side uploads

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration for file uploads');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// File upload configuration
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 2048; // Max width/height in pixels

/**
 * POST /api/profile/image - Upload profile image
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    await authMiddleware(request);
    const user = getAuthenticatedUser(request as AuthenticatedRequest);
    
    // Get form data
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      throw new BadRequestError('No image file provided');
    }
    
    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new ValidationError({
        image: [`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`]
      });
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError({
        image: [`File size too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`]
      });
    }
    
    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `profile-${user.id}-${Date.now()}.${fileExtension}`;
    const filePath = `profiles/${fileName}`;
    
    // Convert File to Buffer for Supabase upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new APIError('Failed to upload image', 500, 'UPLOAD_FAILED');
    }
    
    // Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);
    
    const imageUrl = publicUrlData.publicUrl;
    
    // Remove old profile image if exists
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { profileImage: true }
    });
    
    if (currentUser?.profileImage) {
      // Extract file path from old URL and delete from Supabase
      try {
        const oldFilePath = extractFilePathFromUrl(currentUser.profileImage);
        if (oldFilePath) {
          await supabase.storage
            .from('user-uploads')
            .remove([oldFilePath]);
        }
      } catch (error) {
        console.warn('Failed to delete old profile image:', error);
        // Continue even if old image deletion fails
      }
    }
    
    // Update user profile with new image URL
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        profileImage: imageUrl,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        profileImage: true,
        updatedAt: true,
      }
    });
    
    // Also create a document record for the profile image
    await prisma.document.create({
      data: {
        userId: user.id,
        documentType: 'PROFILE_IMAGE',
        fileName: fileName,
        fileUrl: imageUrl,
        fileSize: file.size,
        mimeType: file.type,
        verificationStatus: 'VERIFIED', // Profile images are auto-verified
        verifiedAt: new Date(),
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        imageUrl: updatedUser.profileImage,
        uploadedAt: updatedUser.updatedAt,
      },
      meta: {
        timestamp: new Date().toISOString(),
        fileName,
        fileSize: file.size,
      }
    });
    
  } catch (error) {
    console.error('Profile image upload error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = handleZodError(error);
      return NextResponse.json(
        createErrorResponse(validationError, 'en'),
        { status: validationError.statusCode }
      );
    }
    
    if (error instanceof APIError) {
      return NextResponse.json(
        createErrorResponse(error, 'en'),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      createErrorResponse(new Error('Failed to upload profile image'), 'en'),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/image - Remove profile image
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    await authMiddleware(request);
    const user = getAuthenticatedUser(request as AuthenticatedRequest);
    
    // Get current profile image
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { profileImage: true }
    });
    
    if (!currentUser?.profileImage) {
      throw new BadRequestError('No profile image to delete');
    }
    
    // Extract file path and delete from Supabase
    const filePath = extractFilePathFromUrl(currentUser.profileImage);
    if (filePath) {
      const { error: deleteError } = await supabase.storage
        .from('user-uploads')
        .remove([filePath]);
      
      if (deleteError) {
        console.error('Supabase delete error:', deleteError);
        // Continue even if Supabase deletion fails
      }
    }
    
    // Update user profile to remove image URL
    await prisma.user.update({
      where: { id: user.id },
      data: {
        profileImage: null,
        updatedAt: new Date(),
      }
    });
    
    // Also remove the document record
    await prisma.document.deleteMany({
      where: {
        userId: user.id,
        documentType: 'PROFILE_IMAGE',
        fileUrl: currentUser.profileImage,
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Profile image removed successfully',
      meta: {
        timestamp: new Date().toISOString(),
      }
    });
    
  } catch (error) {
    console.error('Profile image delete error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        createErrorResponse(error, 'en'),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      createErrorResponse(new Error('Failed to remove profile image'), 'en'),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile/image - Update profile image via URL (alternative to file upload)
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    await authMiddleware(request);
    const user = getAuthenticatedUser(request as AuthenticatedRequest);
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = profileImageUploadSchema.parse(body);
    
    // Validate that the URL is from our Supabase storage
    if (!validatedData.imageUrl.includes(supabaseUrl!)) {
      throw new ValidationError({
        imageUrl: ['Image URL must be from TutorConnect storage']
      });
    }
    
    // Update user profile with new image URL
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        profileImage: validatedData.imageUrl,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        profileImage: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Profile image updated successfully',
      data: {
        imageUrl: updatedUser.profileImage,
        updatedAt: updatedUser.updatedAt,
      },
      meta: {
        timestamp: new Date().toISOString(),
      }
    });
    
  } catch (error) {
    console.error('Profile image update error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = handleZodError(error);
      return NextResponse.json(
        createErrorResponse(validationError, 'en'),
        { status: validationError.statusCode }
      );
    }
    
    if (error instanceof APIError) {
      return NextResponse.json(
        createErrorResponse(error, 'en'),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      createErrorResponse(new Error('Failed to update profile image'), 'en'),
      { status: 500 }
    );
  }
}

/**
 * Extract file path from Supabase public URL
 */
function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlParts = url.split('/');
    const storageIndex = urlParts.findIndex(part => part === 'user-uploads');
    if (storageIndex !== -1 && storageIndex < urlParts.length - 1) {
      return urlParts.slice(storageIndex + 1).join('/');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate image dimensions (if needed in the future)
 */
async function validateImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Invalid image file'));
    };
    img.src = URL.createObjectURL(file);
  });
}