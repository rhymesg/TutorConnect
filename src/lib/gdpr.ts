/**
 * GDPR compliance utilities for TutorConnect
 * Implements data protection, privacy rights, and consent management
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Supabase client for file operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && supabaseKey) {
  var supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * GDPR Data Categories
 */
export enum GDPRDataCategory {
  PERSONAL_IDENTITY = 'personal_identity', // Name, email, ID verification
  CONTACT_INFORMATION = 'contact_information', // Phone, address, postal code
  DEMOGRAPHIC = 'demographic', // Age, gender, region
  EDUCATIONAL = 'educational', // School, degrees, certifications
  BEHAVIORAL = 'behavioral', // Posts, messages, activity logs
  TECHNICAL = 'technical', // IP addresses, browser info, session data
  FINANCIAL = 'financial', // Payment info, pricing preferences
}

/**
 * GDPR Legal Basis for processing
 */
export enum GDPRLegalBasis {
  CONSENT = 'consent', // User gave explicit consent
  CONTRACT = 'contract', // Processing is necessary for contract performance
  LEGAL_OBLIGATION = 'legal_obligation', // Required by law
  VITAL_INTERESTS = 'vital_interests', // Necessary to protect vital interests
  PUBLIC_TASK = 'public_task', // Necessary for public task
  LEGITIMATE_INTERESTS = 'legitimate_interests', // Necessary for legitimate interests
}

/**
 * Data Processing Purpose
 */
export enum DataProcessingPurpose {
  ACCOUNT_MANAGEMENT = 'account_management',
  TUTORING_MATCHING = 'tutoring_matching',
  COMMUNICATION = 'communication',
  PAYMENT_PROCESSING = 'payment_processing',
  SAFETY_VERIFICATION = 'safety_verification',
  SERVICE_IMPROVEMENT = 'service_improvement',
  LEGAL_COMPLIANCE = 'legal_compliance',
  MARKETING = 'marketing',
}

/**
 * Data retention periods (in days)
 */
export const DATA_RETENTION_PERIODS = {
  [GDPRDataCategory.PERSONAL_IDENTITY]: 2555, // 7 years (Norwegian requirement for ID verification)
  [GDPRDataCategory.CONTACT_INFORMATION]: 1095, // 3 years
  [GDPRDataCategory.DEMOGRAPHIC]: 1095, // 3 years
  [GDPRDataCategory.EDUCATIONAL]: 2190, // 6 years
  [GDPRDataCategory.BEHAVIORAL]: 730, // 2 years
  [GDPRDataCategory.TECHNICAL]: 365, // 1 year
  [GDPRDataCategory.FINANCIAL]: 2555, // 7 years (Norwegian tax requirement)
} as const;

/**
 * GDPR Data Subject Rights
 */
export interface GDPRRequest {
  id: string;
  userId: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  description?: string;
  response?: string;
}

/**
 * Generate comprehensive user data export (Right to Data Portability - Article 20)
 */
export async function generateUserDataExport(userId: string): Promise<{
  personalData: any;
  exportSize: number;
  generatedAt: Date;
}> {
  try {
    // Get all user data from database
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: {
          include: {
            chats: {
              include: {
                messages: true,
                appointments: true,
              }
            }
          }
        },
        sentMessages: true,
        documents: true,
        sentInfoRequests: true,
        receivedInfoRequests: true,
        chatParticipants: {
          include: {
            chat: {
              include: {
                messages: true,
              }
            }
          }
        }
      }
    });

    if (!userData) {
      throw new Error('User not found');
    }

    // Structure the data export according to GDPR requirements
    const dataExport = {
      exportMetadata: {
        userId: userData.id,
        generatedAt: new Date().toISOString(),
        dataController: 'TutorConnect AS',
        legalBasis: GDPRLegalBasis.CONSENT,
        retentionPolicy: DATA_RETENTION_PERIODS,
      },
      personalIdentity: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        emailVerified: userData.emailVerified,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
      contactInformation: {
        region: userData.region,
        postalCode: userData.postalCode,
      },
      demographicData: {
        gender: userData.gender,
        birthYear: userData.birthYear,
      },
      profileData: {
        profileImage: userData.profileImage,
        bio: userData.bio,
        school: userData.school,
        degree: userData.degree,
        certifications: userData.certifications,
      },
      privacySettings: {
        privacyGender: userData.privacyGender,
        privacyAge: userData.privacyAge,
        privacyDocuments: userData.privacyDocuments,
        privacyContact: userData.privacyContact,
      },
      activityData: {
        lastActive: userData.lastActive,
        isActive: userData.isActive,
      },
      posts: userData.posts.map(post => ({
        id: post.id,
        type: post.type,
        subject: post.subject,
        title: post.title,
        description: post.description,
        location: post.location,
        hourlyRate: post.hourlyRate,
        createdAt: post.createdAt,
        isActive: post.isActive,
      })),
      messages: userData.sentMessages.map(message => ({
        id: message.id,
        content: message.content,
        type: message.type,
        sentAt: message.sentAt,
        isEdited: message.isEdited,
      })),
      documents: userData.documents.map(doc => ({
        id: doc.id,
        documentType: doc.documentType,
        fileName: doc.fileName,
        verificationStatus: doc.verificationStatus,
        uploadedAt: doc.uploadedAt,
      })),
      infoRequests: {
        sent: userData.sentInfoRequests.map(req => ({
          id: req.id,
          requestType: req.requestType,
          status: req.status,
          requestedAt: req.requestedAt,
        })),
        received: userData.receivedInfoRequests.map(req => ({
          id: req.id,
          requestType: req.requestType,
          status: req.status,
          requestedAt: req.requestedAt,
        })),
      }
    };

    const exportSize = JSON.stringify(dataExport).length;

    return {
      personalData: dataExport,
      exportSize,
      generatedAt: new Date(),
    };

  } catch (error) {
    console.error('GDPR data export error:', error);
    throw new Error('Failed to generate user data export');
  }
}

/**
 * Anonymize user data (Right to Erasure - Article 17)
 * This performs a "soft delete" to maintain data integrity while removing personal information
 */
export async function anonymizeUserData(userId: string, reason: string = 'User requested deletion'): Promise<{
  success: boolean;
  anonymizedFields: string[];
  retainedData: string[];
}> {
  try {
    const anonymizedFields: string[] = [];
    const retainedData: string[] = [];

    // Generate anonymous identifier
    const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get user data before anonymization for logging
    const originalUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        profileImage: true,
        bio: true,
        school: true,
        degree: true,
        certifications: true,
      }
    });

    if (!originalUser) {
      throw new Error('User not found');
    }

    // Start database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Anonymize user record
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `${anonymousId}@anonymized.tutorconnect.no`,
          name: 'Anonymized User',
          profileImage: null,
          bio: null,
          school: null,
          degree: null,
          certifications: null,
          isActive: false,
          // Keep: region, gender, birthYear, privacy settings for analytics
        }
      });

      // Anonymize messages
      await tx.message.updateMany({
        where: { senderId: userId },
        data: {
          content: '[Message anonymized]',
        }
      });

      // Anonymize posts
      await tx.post.updateMany({
        where: { userId },
        data: {
          title: '[Post anonymized]',
          description: '[Description anonymized]',
          isActive: false,
        }
      });

      // Delete sensitive documents from Supabase Storage
      const documents = await tx.document.findMany({
        where: { userId },
        select: { fileUrl: true, documentType: true }
      });

      for (const doc of documents) {
        if (supabase && doc.documentType !== 'PROFILE_IMAGE') {
          // Delete from Supabase storage
          const filePath = extractFilePathFromUrl(doc.fileUrl);
          if (filePath) {
            await supabase.storage.from('user-uploads').remove([filePath]);
          }
        }
      }

      // Delete document records
      await tx.document.deleteMany({
        where: { userId }
      });

      return { success: true };
    });

    // Log anonymization for audit trail
    console.log('User data anonymized:', {
      userId,
      anonymousId,
      reason,
      timestamp: new Date().toISOString(),
      originalEmail: originalUser.email,
    });

    anonymizedFields.push(
      'email', 'name', 'profileImage', 'bio', 'school', 'degree', 
      'certifications', 'messages', 'posts', 'documents'
    );

    retainedData.push(
      'region', 'gender', 'birthYear', 'privacySettings', 'createdAt',
      'aggregated analytics data'
    );

    return {
      success: result.success,
      anonymizedFields,
      retainedData,
    };

  } catch (error) {
    console.error('GDPR anonymization error:', error);
    throw new Error('Failed to anonymize user data');
  }
}

/**
 * Data Rectification - Allow users to correct their personal data
 */
export async function rectifyUserData(
  userId: string,
  corrections: Record<string, any>,
  requestId?: string
): Promise<{ success: boolean; correctedFields: string[] }> {
  try {
    const allowedFields = [
      'name', 'region', 'postalCode', 'gender', 'birthYear', 
      'school', 'degree', 'certifications', 'bio'
    ];

    const correctedFields: string[] = [];
    const validCorrections: Record<string, any> = {};

    // Validate corrections
    Object.keys(corrections).forEach(field => {
      if (allowedFields.includes(field)) {
        validCorrections[field] = corrections[field];
        correctedFields.push(field);
      }
    });

    if (Object.keys(validCorrections).length === 0) {
      throw new Error('No valid fields provided for correction');
    }

    // Apply corrections
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...validCorrections,
        updatedAt: new Date(),
      }
    });

    // Log rectification
    console.log('Data rectification completed:', {
      userId,
      requestId,
      correctedFields,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      correctedFields,
    };

  } catch (error) {
    console.error('GDPR rectification error:', error);
    throw new Error('Failed to rectify user data');
  }
}

/**
 * Check data retention and schedule cleanup
 */
export async function checkDataRetention(userId?: string): Promise<{
  usersToCleanup: string[];
  documentsToDelete: string[];
  messagestoAnonymize: string[];
}> {
  const now = new Date();
  const usersToCleanup: string[] = [];
  const documentsToDelete: string[] = [];
  const messagestoAnonymize: string[] = [];

  try {
    // Find inactive users beyond retention period
    const inactiveUsers = await prisma.user.findMany({
      where: {
        isActive: false,
        updatedAt: {
          lt: new Date(now.getTime() - DATA_RETENTION_PERIODS[GDPRDataCategory.PERSONAL_IDENTITY] * 24 * 60 * 60 * 1000)
        }
      },
      select: { id: true, email: true, updatedAt: true }
    });

    usersToCleanup.push(...inactiveUsers.map(user => user.id));

    // Find old documents to delete
    const oldDocuments = await prisma.document.findMany({
      where: {
        uploadedAt: {
          lt: new Date(now.getTime() - DATA_RETENTION_PERIODS[GDPRDataCategory.EDUCATIONAL] * 24 * 60 * 60 * 1000)
        }
      },
      select: { id: true, userId: true }
    });

    documentsToDelete.push(...oldDocuments.map(doc => doc.id));

    // Find old messages to anonymize
    const oldMessages = await prisma.message.findMany({
      where: {
        sentAt: {
          lt: new Date(now.getTime() - DATA_RETENTION_PERIODS[GDPRDataCategory.BEHAVIORAL] * 24 * 60 * 60 * 1000)
        },
        content: {
          not: '[Message anonymized]'
        }
      },
      select: { id: true }
    });

    messagestoAnonymize.push(...oldMessages.map(msg => msg.id));

    return {
      usersToCleanup,
      documentsToDelete,
      messagestoAnonymize,
    };

  } catch (error) {
    console.error('Data retention check error:', error);
    return { usersToCleanup: [], documentsToDelete: [], messagestoAnonymize: [] };
  }
}

/**
 * Generate GDPR compliance report
 */
export async function generateComplianceReport(): Promise<{
  totalUsers: number;
  activeUsers: number;
  dataExportRequests: number;
  deletionRequests: number;
  retentionStatus: any;
}> {
  try {
    const [
      totalUsers,
      activeUsers,
      retentionCheck
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      checkDataRetention()
    ]);

    return {
      totalUsers,
      activeUsers,
      dataExportRequests: 0, // Would come from GDPR request tracking
      deletionRequests: 0, // Would come from GDPR request tracking
      retentionStatus: {
        usersRequiringCleanup: retentionCheck.usersToCleanup.length,
        documentsToDelete: retentionCheck.documentsToDelete.length,
        messagesToAnonymize: retentionCheck.messagestoAnonymize.length,
      }
    };

  } catch (error) {
    console.error('Compliance report error:', error);
    throw new Error('Failed to generate compliance report');
  }
}

/**
 * Helper function to extract file path from URL
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
 * Create audit log entry for GDPR operations
 */
export async function createGDPRAuditLog(
  operation: string,
  userId: string,
  details: any,
  requestId?: string
) {
  try {
    // In production, this would be stored in a dedicated audit table
    console.log('GDPR Audit Log:', {
      operation,
      userId,
      requestId,
      details: JSON.stringify(details),
      timestamp: new Date().toISOString(),
      ipAddress: 'server', // Would capture actual IP in real request
    });

    // TODO: Store in database audit table
    // await prisma.auditLog.create({
    //   data: {
    //     operation,
    //     userId,
    //     requestId,
    //     details: JSON.stringify(details),
    //     timestamp: new Date(),
    //   }
    // });

  } catch (error) {
    console.error('GDPR audit log error:', error);
  }
}