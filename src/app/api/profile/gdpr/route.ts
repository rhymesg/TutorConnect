import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, type AuthenticatedRequest, getAuthenticatedUser } from '@/middleware/auth';
import { 
  generateUserDataExport,
  anonymizeUserData,
  rectifyUserData,
  createGDPRAuditLog 
} from '@/lib/gdpr';
import { 
  APIError, 
  ValidationError,
  BadRequestError,
  handleZodError,
  createErrorResponse 
} from '@/lib/errors';
import { z } from 'zod';

const prisma = new PrismaClient();

// GDPR request validation schemas
const dataExportRequestSchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  includeDeleted: z.boolean().default(false),
});

const dataRectificationSchema = z.object({
  corrections: z.record(z.any()),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must not exceed 500 characters'),
});

const dataErasureSchema = z.object({
  confirmEmail: z.string().email('Invalid email format'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must not exceed 500 characters'),
  confirmText: z.literal('DELETE MY DATA', { 
    errorMap: () => ({ message: 'You must type exactly "DELETE MY DATA" to confirm' })
  }),
});

/**
 * POST /api/profile/gdpr - Handle GDPR data requests
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    await authMiddleware(request);
    const user = getAuthenticatedUser(request as AuthenticatedRequest);
    
    // Parse request body
    const body = await request.json();
    const { requestType } = body;

    if (!requestType) {
      throw new BadRequestError('Request type is required');
    }

    switch (requestType) {
      case 'data_export':
        return await handleDataExportRequest(user.id, body);
      
      case 'data_rectification':
        return await handleDataRectificationRequest(user.id, body);
      
      case 'data_erasure':
        return await handleDataErasureRequest(user.id, user.email, body);
      
      default:
        throw new BadRequestError(`Unsupported GDPR request type: ${requestType}`);
    }

  } catch (error) {
    console.error('GDPR request error:', error);
    
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
      createErrorResponse(new Error('Failed to process GDPR request'), 'en'),
      { status: 500 }
    );
  }
}

/**
 * GET /api/profile/gdpr - Get GDPR information and user rights
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    await authMiddleware(request);
    const user = getAuthenticatedUser(request as AuthenticatedRequest);

    // Get user's GDPR-related information
    const gdprInfo = await getGDPRInformation(user.id);

    return NextResponse.json({
      success: true,
      data: {
        userRights: {
          rightToAccess: {
            description: 'You have the right to access your personal data and information about how it is processed.',
            available: true,
            lastUsed: null, // Would track from GDPR requests table
          },
          rightToRectification: {
            description: 'You have the right to correct inaccurate or incomplete personal data.',
            available: true,
            lastUsed: null,
          },
          rightToErasure: {
            description: 'You have the right to request deletion of your personal data under certain circumstances.',
            available: true,
            lastUsed: null,
          },
          rightToPortability: {
            description: 'You have the right to receive your personal data in a structured, commonly used format.',
            available: true,
            lastUsed: null,
          },
          rightToRestrict: {
            description: 'You have the right to restrict processing of your personal data in certain situations.',
            available: false, // Not implemented in this version
            lastUsed: null,
          },
          rightToObject: {
            description: 'You have the right to object to processing of your personal data for certain purposes.',
            available: false, // Not implemented in this version
            lastUsed: null,
          },
        },
        dataProcessing: {
          legalBasis: 'consent',
          purposes: [
            'Account management and authentication',
            'Tutoring service matching',
            'Communication between users',
            'Safety and verification',
            'Service improvement and analytics',
          ],
          retentionPeriods: {
            personalData: '3-7 years depending on data type',
            messages: '2 years',
            documents: '6 years',
            analytics: '1 year',
          },
        },
        currentData: gdprInfo,
      },
      meta: {
        timestamp: new Date().toISOString(),
        complianceFramework: 'GDPR (EU General Data Protection Regulation)',
        dataController: 'TutorConnect AS',
        contactEmail: 'privacy@tutorconnect.no',
      }
    });

  } catch (error) {
    console.error('GDPR info GET error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        createErrorResponse(error, 'en'),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      createErrorResponse(new Error('Failed to fetch GDPR information'), 'en'),
      { status: 500 }
    );
  }
}

/**
 * Handle data export request (Right to Access & Data Portability)
 */
async function handleDataExportRequest(userId: string, body: any) {
  const validatedData = dataExportRequestSchema.parse(body);
  
  // Generate comprehensive data export
  const dataExport = await generateUserDataExport(userId);
  
  // Create audit log
  await createGDPRAuditLog('data_export_request', userId, {
    format: validatedData.format,
    includeDeleted: validatedData.includeDeleted,
    exportSize: dataExport.exportSize,
  });

  return NextResponse.json({
    success: true,
    message: 'Data export generated successfully',
    data: {
      export: dataExport.personalData,
      metadata: {
        generatedAt: dataExport.generatedAt,
        exportSize: dataExport.exportSize,
        format: validatedData.format,
        downloadUrl: null, // In production, this would be a secure download link
      }
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestType: 'data_export',
    }
  });
}

/**
 * Handle data rectification request (Right to Rectification)
 */
async function handleDataRectificationRequest(userId: string, body: any) {
  const validatedData = dataRectificationSchema.parse(body);
  
  // Apply data corrections
  const rectificationResult = await rectifyUserData(
    userId, 
    validatedData.corrections
  );
  
  // Create audit log
  await createGDPRAuditLog('data_rectification_request', userId, {
    corrections: validatedData.corrections,
    reason: validatedData.reason,
    correctedFields: rectificationResult.correctedFields,
  });

  return NextResponse.json({
    success: true,
    message: 'Data rectification completed successfully',
    data: {
      correctedFields: rectificationResult.correctedFields,
      reason: validatedData.reason,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestType: 'data_rectification',
    }
  });
}

/**
 * Handle data erasure request (Right to Erasure)
 */
async function handleDataErasureRequest(userId: string, userEmail: string, body: any) {
  const validatedData = dataErasureSchema.parse(body);
  
  // Verify email confirmation
  if (validatedData.confirmEmail !== userEmail) {
    throw new ValidationError({
      confirmEmail: ['Email confirmation does not match your account email']
    });
  }

  // Anonymize user data
  const erasureResult = await anonymizeUserData(userId, validatedData.reason);
  
  // Create audit log (before anonymization completes)
  await createGDPRAuditLog('data_erasure_request', userId, {
    reason: validatedData.reason,
    anonymizedFields: erasureResult.anonymizedFields,
    retainedData: erasureResult.retainedData,
  });

  return NextResponse.json({
    success: true,
    message: 'Data erasure completed successfully',
    data: {
      anonymizedFields: erasureResult.anonymizedFields,
      retainedData: erasureResult.retainedData,
      reason: validatedData.reason,
      notice: 'Your account has been deactivated and personal data has been anonymized. Some data may be retained for legal compliance purposes.',
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestType: 'data_erasure',
    }
  });
}

/**
 * Get GDPR-related information for user
 */
async function getGDPRInformation(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      lastActive: true,
      isActive: true,
      privacyGender: true,
      privacyAge: true,
      privacyDocuments: true,
      privacyContact: true,
      _count: {
        select: {
          posts: true,
          sentMessages: true,
          documents: true,
          sentInfoRequests: true,
          receivedInfoRequests: true,
        }
      }
    }
  });

  if (!user) {
    throw new APIError('User not found', 404, 'USER_NOT_FOUND');
  }

  return {
    accountInfo: {
      accountId: user.id,
      email: user.email,
      name: user.name,
      accountCreated: user.createdAt,
      lastUpdated: user.updatedAt,
      lastActive: user.lastActive,
      accountStatus: user.isActive ? 'active' : 'inactive',
    },
    privacySettings: {
      gender: user.privacyGender,
      age: user.privacyAge,
      documents: user.privacyDocuments,
      contact: user.privacyContact,
    },
    dataFootprint: {
      postsCreated: user._count.posts,
      messagesSent: user._count.sentMessages,
      documentsUploaded: user._count.documents,
      infoRequestsSent: user._count.sentInfoRequests,
      infoRequestsReceived: user._count.receivedInfoRequests,
    },
    dataProcessingConsent: {
      essential: true, // Required for service operation
      analytics: true, // Could be made optional
      marketing: false, // Not implemented yet
      thirdPartySharing: false, // Not applicable for TutorConnect
    },
  };
}