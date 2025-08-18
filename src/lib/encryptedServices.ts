/**
 * Encrypted services layer for TutorConnect
 * Provides encryption-aware business logic and GDPR-compliant operations
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import {
  encrypt,
  decrypt,
  encryptFile,
  decryptFile,
  hashSensitiveData,
  verifySensitiveData,
  type EncryptedData
} from './encryption';
import { 
  generateUserDataExport,
  anonymizeUserData,
  createGDPRAuditLog
} from './gdpr';

const prisma = new PrismaClient();

// Supabase client for encrypted file operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Encrypted User Service
 * Handles user data with automatic encryption of sensitive fields
 */
export class EncryptedUserService {
  
  /**
   * Create user with encrypted sensitive data
   */
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    region: string;
    phoneNumber?: string;
    nationalIdNumber?: string;
    [key: string]: any;
  }) {
    const encryptedData: any = { ...userData };

    // Encrypt sensitive fields
    if (userData.phoneNumber) {
      const encrypted = encrypt(userData.phoneNumber, 'phoneNumber', true);
      encryptedData.phoneNumber = JSON.stringify(encrypted);
      encryptedData.phoneNumber_search = encrypted.searchHash;
    }

    if (userData.nationalIdNumber) {
      const encrypted = encrypt(userData.nationalIdNumber, 'nationalIdNumber', true);
      encryptedData.nationalIdNumber = JSON.stringify(encrypted);
      encryptedData.nationalIdNumber_search = encrypted.searchHash;
    }

    const user = await prisma.user.create({
      data: encryptedData
    });

    // Log GDPR compliance
    await createGDPRAuditLog('user_creation', user.id, {
      encryptedFields: ['phoneNumber', 'nationalIdNumber'].filter(field => userData[field])
    });

    return this.decryptUserData(user);
  }

  /**
   * Find user by encrypted phone number
   */
  async findUserByPhoneNumber(phoneNumber: string) {
    const searchHash = this.generateSearchHash(phoneNumber, 'phoneNumber');
    
    const user = await prisma.user.findFirst({
      where: {
        phoneNumber_search: searchHash
      }
    });

    return user ? this.decryptUserData(user) : null;
  }

  /**
   * Update user with encryption handling
   */
  async updateUser(userId: string, updates: Record<string, any>) {
    const encryptedUpdates: any = { ...updates };

    // Handle phone number update
    if (updates.phoneNumber) {
      const encrypted = encrypt(updates.phoneNumber, 'phoneNumber', true);
      encryptedUpdates.phoneNumber = JSON.stringify(encrypted);
      encryptedUpdates.phoneNumber_search = encrypted.searchHash;
    }

    // Handle national ID update
    if (updates.nationalIdNumber) {
      const encrypted = encrypt(updates.nationalIdNumber, 'nationalIdNumber', true);
      encryptedUpdates.nationalIdNumber = JSON.stringify(encrypted);
      encryptedUpdates.nationalIdNumber_search = encrypted.searchHash;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...encryptedUpdates,
        updatedAt: new Date()
      }
    });

    // Log GDPR compliance
    await createGDPRAuditLog('user_update', userId, {
      updatedFields: Object.keys(updates),
      encryptedFields: ['phoneNumber', 'nationalIdNumber'].filter(field => updates[field])
    });

    return this.decryptUserData(user);
  }

  /**
   * Get user with decrypted sensitive data
   */
  async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        documents: true
      }
    });

    return user ? this.decryptUserData(user) : null;
  }

  /**
   * Decrypt user data fields
   */
  private decryptUserData(user: any): any {
    const decrypted = { ...user };

    // Decrypt phone number
    if (user.phoneNumber && typeof user.phoneNumber === 'string' && user.phoneNumber.startsWith('{')) {
      try {
        const encryptedData = JSON.parse(user.phoneNumber) as EncryptedData;
        decrypted.phoneNumber = decrypt(encryptedData);
        delete decrypted.phoneNumber_search;
      } catch (error) {
        console.error('Failed to decrypt phone number:', error);
      }
    }

    // Decrypt national ID
    if (user.nationalIdNumber && typeof user.nationalIdNumber === 'string' && user.nationalIdNumber.startsWith('{')) {
      try {
        const encryptedData = JSON.parse(user.nationalIdNumber) as EncryptedData;
        decrypted.nationalIdNumber = decrypt(encryptedData);
        delete decrypted.nationalIdNumber_search;
      } catch (error) {
        console.error('Failed to decrypt national ID:', error);
      }
    }

    return decrypted;
  }

  /**
   * Generate GDPR data export with decrypted sensitive data
   */
  async generateDataExport(userId: string) {
    const export_data = await generateUserDataExport(userId);
    
    // Decrypt sensitive fields in the export
    const user = await this.getUser(userId);
    if (user) {
      export_data.personalData.sensitiveInformation = {
        phoneNumber: user.phoneNumber,
        nationalIdNumber: user.nationalIdNumber
      };
    }

    await createGDPRAuditLog('data_export', userId, {
      exportSize: export_data.exportSize,
      includesSensitiveData: true
    });

    return export_data;
  }

  /**
   * Anonymize user with proper handling of encrypted data
   */
  async anonymizeUser(userId: string, reason: string = 'User requested deletion') {
    // Generate audit trail before anonymization
    const user = await this.getUser(userId);
    
    const result = await anonymizeUserData(userId, reason);

    await createGDPRAuditLog('user_anonymization', userId, {
      reason,
      anonymizedFields: result.anonymizedFields,
      originalData: {
        hasPhoneNumber: !!user?.phoneNumber,
        hasNationalId: !!user?.nationalIdNumber
      }
    });

    return result;
  }

  /**
   * Generate search hash for encrypted fields
   */
  private generateSearchHash(value: string, fieldName: string): string {
    const crypto = require('crypto');
    const searchKey = `${process.env.ENCRYPTION_KEY}_SEARCH_${fieldName}`;
    return crypto.createHash('sha256')
      .update(value.toLowerCase().trim())
      .update(searchKey)
      .digest('hex');
  }
}

/**
 * Encrypted Message Service
 * Handles message encryption for sensitive communications
 */
export class EncryptedMessageService {

  /**
   * Create encrypted message
   */
  async createMessage(messageData: {
    content: string;
    chatId: string;
    senderId: string;
    type?: string;
    appointmentId?: string;
    replyToMessageId?: string;
  }) {
    const encryptedData: any = { ...messageData };

    // Determine if message should be encrypted based on content sensitivity
    const shouldEncrypt = this.shouldEncryptMessage(messageData.content);

    if (shouldEncrypt) {
      const encrypted = encrypt(messageData.content, 'messageContent', true);
      encryptedData.content = JSON.stringify(encrypted);
      encryptedData.content_search = encrypted.searchHash;
    }

    const message = await prisma.message.create({
      data: {
        ...encryptedData,
        sentAt: new Date()
      }
    });

    // Log encryption decision
    if (shouldEncrypt) {
      await createGDPRAuditLog('message_encrypted', messageData.senderId, {
        messageId: message.id,
        chatId: messageData.chatId
      });
    }

    return this.decryptMessageData(message);
  }

  /**
   * Search encrypted messages
   */
  async searchMessages(chatId: string, searchTerm: string, userId: string) {
    const searchHash = this.generateSearchHash(searchTerm, 'messageContent');
    
    const messages = await prisma.message.findMany({
      where: {
        chatId,
        content_search: searchHash
      },
      orderBy: {
        sentAt: 'desc'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      }
    });

    // Log search activity for audit
    await createGDPRAuditLog('message_search', userId, {
      chatId,
      searchTerm: 'REDACTED', // Don't log actual search terms
      resultsCount: messages.length
    });

    return messages.map(message => this.decryptMessageData(message));
  }

  /**
   * Get messages with decryption
   */
  async getMessages(chatId: string, limit: number = 50, offset: number = 0) {
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { sentAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        },
        appointment: true
      }
    });

    return messages.map(message => this.decryptMessageData(message));
  }

  /**
   * Decrypt message data
   */
  private decryptMessageData(message: any): any {
    const decrypted = { ...message };

    if (message.content && typeof message.content === 'string' && message.content.startsWith('{')) {
      try {
        const encryptedData = JSON.parse(message.content) as EncryptedData;
        decrypted.content = decrypt(encryptedData);
        decrypted.isEncrypted = true;
        delete decrypted.content_search;
      } catch (error) {
        console.error('Failed to decrypt message content:', error);
        decrypted.content = '[Decryption failed]';
        decrypted.isEncrypted = true;
      }
    } else {
      decrypted.isEncrypted = false;
    }

    return decrypted;
  }

  /**
   * Determine if message content should be encrypted
   */
  private shouldEncryptMessage(content: string): boolean {
    // Encrypt messages containing sensitive patterns
    const sensitivePatterns = [
      /\b\d{11}\b/,           // Norwegian national ID
      /\b\d{8}\s?\d{3}\b/,    // Norwegian phone numbers
      /\b[\w\.-]+@[\w\.-]+\.\w+\b/, // Email addresses
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card patterns
      /\bbank\b/i,            // Banking references
      /\bpassword\b/i,        // Password references
      /\baddress\b/i          // Address references
    ];

    return sensitivePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Generate search hash for encrypted fields
   */
  private generateSearchHash(value: string, fieldName: string): string {
    const crypto = require('crypto');
    const searchKey = `${process.env.ENCRYPTION_KEY}_SEARCH_${fieldName}`;
    return crypto.createHash('sha256')
      .update(value.toLowerCase().trim())
      .update(searchKey)
      .digest('hex');
  }
}

/**
 * Encrypted Document Service
 * Handles document encryption for file uploads
 */
export class EncryptedDocumentService {

  /**
   * Upload encrypted document
   */
  async uploadDocument(
    userId: string,
    file: Buffer,
    metadata: {
      documentType: string;
      fileName: string;
      mimeType: string;
      fileSize: number;
    }
  ) {
    if (!supabase) {
      throw new Error('Supabase client not configured');
    }

    // Encrypt file content
    const { encryptedContent, encryptionMetadata } = await encryptFile(file, {
      originalFileName: metadata.fileName,
      mimeType: metadata.mimeType,
      uploadedBy: userId
    });

    // Generate unique file path
    const filePath = `encrypted/${userId}/${Date.now()}_${metadata.fileName}`;

    // Upload encrypted file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-documents')
      .upload(filePath, encryptedContent, {
        contentType: 'application/octet-stream', // Store as binary
        metadata: {
          encrypted: 'true',
          originalType: metadata.mimeType
        }
      });

    if (uploadError) {
      throw new Error(`File upload failed: ${uploadError.message}`);
    }

    // Create document record with encryption metadata
    const document = await prisma.document.create({
      data: {
        userId,
        documentType: metadata.documentType as any,
        fileName: metadata.fileName,
        fileUrl: uploadData.path,
        fileSize: metadata.fileSize,
        mimeType: metadata.mimeType,
        encryptionMetadata: JSON.stringify(encryptionMetadata)
      }
    });

    // Log encrypted document upload
    await createGDPRAuditLog('document_upload', userId, {
      documentId: document.id,
      documentType: metadata.documentType,
      encrypted: true,
      fileSize: metadata.fileSize
    });

    return document;
  }

  /**
   * Download and decrypt document
   */
  async downloadDocument(documentId: string, userId: string) {
    if (!supabase) {
      throw new Error('Supabase client not configured');
    }

    // Get document record
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId // Ensure user owns the document
      }
    });

    if (!document) {
      throw new Error('Document not found or access denied');
    }

    // Download encrypted file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('user-documents')
      .download(document.fileUrl);

    if (downloadError) {
      throw new Error(`File download failed: ${downloadError.message}`);
    }

    // If not encrypted, return as is
    if (!document.encryptionMetadata) {
      const arrayBuffer = await fileData.arrayBuffer();
      return {
        fileBuffer: Buffer.from(arrayBuffer),
        fileName: document.fileName,
        mimeType: document.mimeType,
        metadata: null
      };
    }

    // Decrypt file
    const encryptionMetadata = JSON.parse(document.encryptionMetadata) as EncryptedData;
    const arrayBuffer = await fileData.arrayBuffer();
    const encryptedBuffer = Buffer.from(arrayBuffer);

    const { fileBuffer, metadata } = await decryptFile(encryptedBuffer, encryptionMetadata);

    // Log document access
    await createGDPRAuditLog('document_access', userId, {
      documentId: document.id,
      documentType: document.documentType,
      decrypted: true
    });

    return {
      fileBuffer,
      fileName: document.fileName,
      mimeType: document.mimeType,
      metadata
    };
  }

  /**
   * Delete encrypted document
   */
  async deleteDocument(documentId: string, userId: string) {
    if (!supabase) {
      throw new Error('Supabase client not configured');
    }

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId
      }
    });

    if (!document) {
      throw new Error('Document not found or access denied');
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('user-documents')
      .remove([document.fileUrl]);

    if (deleteError) {
      console.error('Failed to delete file from storage:', deleteError);
    }

    // Delete database record
    await prisma.document.delete({
      where: { id: documentId }
    });

    // Log document deletion
    await createGDPRAuditLog('document_deletion', userId, {
      documentId: document.id,
      documentType: document.documentType,
      wasEncrypted: !!document.encryptionMetadata
    });

    return { success: true };
  }
}

// Export service instances
export const userService = new EncryptedUserService();
export const messageService = new EncryptedMessageService();
export const documentService = new EncryptedDocumentService();