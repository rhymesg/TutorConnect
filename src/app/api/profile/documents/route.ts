import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, DocumentType, VerificationStatus } from '@prisma/client';
import { authMiddleware, type AuthenticatedRequest, getAuthenticatedUser } from '@/middleware/auth';
import { 
  APIError, 
  ValidationError,
  BadRequestError,
  NotFoundError,
  handlePrismaError,
  createErrorResponse 
} from '@/lib/errors';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const prisma = new PrismaClient();

// Supabase client for file uploads
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration for document uploads');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Document upload configuration
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Document validation schema
const documentUploadSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  fileName: z.string().min(1, 'File name is required'),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
});

/**
 * GET /api/profile/documents - Get user's documents
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    await authMiddleware(request);
    const user = getAuthenticatedUser(request as AuthenticatedRequest);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('type') as DocumentType;
    const status = searchParams.get('status') as VerificationStatus;
    
    // Build where clause
    const whereClause: any = { userId: user.id };
    if (documentType) whereClause.documentType = documentType;
    if (status) whereClause.verificationStatus = status;
    
    // Get user's documents
    const documents = await prisma.document.findMany({
      where: whereClause,
      select: {
        id: true,
        documentType: true,
        fileName: true,
        fileUrl: true,
        fileSize: true,
        mimeType: true,
        verificationStatus: true,
        verifiedAt: true,
        verificationNotes: true,
        uploadedAt: true,
        updatedAt: true,
      },
      orderBy: { uploadedAt: 'desc' }
    });

    // Get document statistics
    const stats = await getDocumentStats(user.id);
    
    // Get verification requirements
    const requirements = getDocumentRequirements();

    return NextResponse.json({
      success: true,
      data: {
        documents,
        stats,
        requirements,
      },
      meta: {
        timestamp: new Date().toISOString(),
        total: documents.length,
      }
    });

  } catch (error) {
    console.error('Documents GET error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        createErrorResponse(error, 'en'),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      createErrorResponse(new Error('Failed to fetch documents'), 'en'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/documents - Upload new document
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    await authMiddleware(request);
    const user = getAuthenticatedUser(request as AuthenticatedRequest);
    
    // Get form data
    const formData = await request.formData();
    const file = formData.get('document') as File;
    const documentType = formData.get('documentType') as DocumentType;
    const description = formData.get('description') as string;
    
    if (!file) {
      throw new BadRequestError('No document file provided');
    }
    
    if (!documentType || !Object.values(DocumentType).includes(documentType)) {
      throw new ValidationError({
        documentType: ['Invalid document type']
      });
    }
    
    // Validate file type
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      throw new ValidationError({
        document: [`Invalid file type. Allowed types: PDF, Word, JPEG, PNG, WebP`]
      });
    }
    
    // Validate file size
    if (file.size > MAX_DOCUMENT_SIZE) {
      throw new ValidationError({
        document: [`File size too large. Maximum size: ${MAX_DOCUMENT_SIZE / (1024 * 1024)}MB`]
      });
    }
    
    // Check if user already has this document type (some types should be unique)
    const uniqueDocumentTypes = [DocumentType.PROFILE_IMAGE, DocumentType.ID_VERIFICATION];
    if (uniqueDocumentTypes.includes(documentType)) {
      const existingDocument = await prisma.document.findFirst({
        where: {
          userId: user.id,
          documentType,
        }
      });
      
      if (existingDocument) {
        throw new ValidationError({
          documentType: [`You already have a ${documentType.toLowerCase().replace('_', ' ')} uploaded`]
        });
      }
    }
    
    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'pdf';
    const fileName = `${documentType.toLowerCase()}-${user.id}-${Date.now()}.${fileExtension}`;
    const filePath = `documents/${fileName}`;
    
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
      throw new APIError('Failed to upload document', 500, 'UPLOAD_FAILED');
    }
    
    // Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);
    
    const documentUrl = publicUrlData.publicUrl;
    
    // Create document record in database
    const newDocument = await prisma.document.create({
      data: {
        userId: user.id,
        documentType,
        fileName: file.name,
        fileUrl: documentUrl,
        fileSize: file.size,
        mimeType: file.type,
        verificationStatus: VerificationStatus.PENDING,
        // verificationNotes: description, // Store description in notes if provided
      },
      select: {
        id: true,
        documentType: true,
        fileName: true,
        fileUrl: true,
        fileSize: true,
        mimeType: true,
        verificationStatus: true,
        uploadedAt: true,
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      data: newDocument,
      meta: {
        timestamp: new Date().toISOString(),
        fileName,
        fileSize: file.size,
      }
    });
    
  } catch (error) {
    console.error('Document upload error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        createErrorResponse(error, 'en'),
        { status: error.statusCode }
      );
    }

    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = handlePrismaError(error);
      return NextResponse.json(
        createErrorResponse(prismaError, 'en'),
        { status: prismaError.statusCode }
      );
    }

    return NextResponse.json(
      createErrorResponse(new Error('Failed to upload document'), 'en'),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/documents?id=documentId - Delete document
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    await authMiddleware(request);
    const user = getAuthenticatedUser(request as AuthenticatedRequest);
    
    // Get document ID from query parameters
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');
    
    if (!documentId) {
      throw new BadRequestError('Document ID is required');
    }
    
    // Find document and verify ownership
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        userId: true,
        fileUrl: true,
        documentType: true,
      }
    });
    
    if (!document) {
      throw new NotFoundError('Document');
    }
    
    if (document.userId !== user.id) {
      throw new APIError('You can only delete your own documents', 403, 'FORBIDDEN');
    }
    
    // Extract file path and delete from Supabase
    const filePath = extractFilePathFromUrl(document.fileUrl);
    if (filePath) {
      const { error: deleteError } = await supabase.storage
        .from('user-uploads')
        .remove([filePath]);
      
      if (deleteError) {
        console.error('Supabase delete error:', deleteError);
        // Continue even if Supabase deletion fails
      }
    }
    
    // Delete document record from database
    await prisma.document.delete({
      where: { id: documentId }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
        deletedDocumentType: document.documentType,
      }
    });
    
  } catch (error) {
    console.error('Document delete error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        createErrorResponse(error, 'en'),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      createErrorResponse(new Error('Failed to delete document'), 'en'),
      { status: 500 }
    );
  }
}

/**
 * Get document statistics for user
 */
async function getDocumentStats(userId: string) {
  const [total, verified, pending, rejected] = await Promise.all([
    prisma.document.count({ where: { userId } }),
    prisma.document.count({ where: { userId, verificationStatus: VerificationStatus.VERIFIED } }),
    prisma.document.count({ where: { userId, verificationStatus: VerificationStatus.PENDING } }),
    prisma.document.count({ where: { userId, verificationStatus: VerificationStatus.REJECTED } }),
  ]);

  const verificationRate = total > 0 ? Math.round((verified / total) * 100) : 0;

  return {
    total,
    verified,
    pending,
    rejected,
    verificationRate,
  };
}

/**
 * Get document requirements and recommendations
 */
function getDocumentRequirements() {
  return {
    required: {
      [DocumentType.ID_VERIFICATION]: {
        description: 'Government-issued ID for identity verification',
        formats: ['PDF', 'JPEG', 'PNG'],
        maxSize: '10MB',
        required: true,
      }
    },
    recommended: {
      [DocumentType.EDUCATION_CERTIFICATE]: {
        description: 'Educational certificates or diplomas',
        formats: ['PDF', 'JPEG', 'PNG', 'DOC', 'DOCX'],
        maxSize: '10MB',
        required: false,
      },
      [DocumentType.TEACHING_CERTIFICATE]: {
        description: 'Teaching qualifications or certifications',
        formats: ['PDF', 'JPEG', 'PNG', 'DOC', 'DOCX'],
        maxSize: '10MB',
        required: false,
      }
    },
    optional: {
      [DocumentType.OTHER_DOCUMENT]: {
        description: 'Other relevant documents',
        formats: ['PDF', 'JPEG', 'PNG', 'DOC', 'DOCX'],
        maxSize: '10MB',
        required: false,
      }
    }
  };
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