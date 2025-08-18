/**
 * Encrypted database operations for TutorConnect
 * Provides transparent encryption/decryption for Prisma operations
 */

import { PrismaClient } from '@prisma/client';
import { 
  encrypt, 
  decrypt, 
  encryptObject, 
  decryptObject, 
  generateSearchHash,
  ENCRYPTED_FIELDS,
  type EncryptedData 
} from './encryption';

// Extended Prisma client with encryption middleware
export class EncryptedPrismaClient extends PrismaClient {
  constructor() {
    super();

    // Add middleware for automatic encryption/decryption
    this.$use(async (params, next) => {
      // Encrypt data before database operations
      if (['create', 'update', 'upsert'].includes(params.action)) {
        params.args.data = this.encryptSensitiveFields(params.args.data, params.model);
      }

      // Handle findMany with encrypted search
      if (params.action === 'findMany' && params.args.where) {
        params.args.where = this.transformSearchConditions(params.args.where, params.model);
      }

      // Execute the query
      const result = await next(params);

      // Decrypt data after database operations
      if (result && ['findFirst', 'findUnique', 'create', 'update', 'upsert'].includes(params.action)) {
        return this.decryptSensitiveFields(result, params.model);
      }

      if (result && params.action === 'findMany' && Array.isArray(result)) {
        return result.map(item => this.decryptSensitiveFields(item, params.model));
      }

      return result;
    });
  }

  /**
   * Encrypt sensitive fields based on model configuration
   */
  private encryptSensitiveFields(data: any, model?: string): any {
    if (!data || typeof data !== 'object') return data;

    const modelConfig = this.getModelEncryptionConfig(model);
    if (!modelConfig.length) return data;

    const result = { ...data };

    for (const fieldName of modelConfig) {
      if (result[fieldName] !== null && result[fieldName] !== undefined) {
        const fieldConfig = ENCRYPTED_FIELDS[fieldName as keyof typeof ENCRYPTED_FIELDS];
        const isSearchable = fieldConfig?.searchable || false;

        // Encrypt the field
        const encrypted = encrypt(String(result[fieldName]), fieldName, isSearchable);
        result[fieldName] = JSON.stringify(encrypted);

        // Add search hash for searchable fields
        if (encrypted.searchHash) {
          result[`${fieldName}_search`] = encrypted.searchHash;
        }
      }
    }

    return result;
  }

  /**
   * Decrypt sensitive fields based on model configuration
   */
  private decryptSensitiveFields(data: any, model?: string): any {
    if (!data || typeof data !== 'object') return data;

    const modelConfig = this.getModelEncryptionConfig(model);
    if (!modelConfig.length) return data;

    const result = { ...data };

    for (const fieldName of modelConfig) {
      if (result[fieldName] && typeof result[fieldName] === 'string') {
        try {
          const encryptedData = JSON.parse(result[fieldName]) as EncryptedData;
          result[fieldName] = decrypt(encryptedData);
        } catch (error) {
          console.error(`Failed to decrypt field ${fieldName}:`, error);
          // Keep original value if decryption fails
        }
      }

      // Remove search hash fields from results
      delete result[`${fieldName}_search`];
    }

    return result;
  }

  /**
   * Transform search conditions to use encrypted search hashes
   */
  private transformSearchConditions(where: any, model?: string): any {
    if (!where || typeof where !== 'object') return where;

    const modelConfig = this.getModelEncryptionConfig(model);
    if (!modelConfig.length) return where;

    const result = { ...where };

    for (const fieldName of modelConfig) {
      const fieldConfig = ENCRYPTED_FIELDS[fieldName as keyof typeof ENCRYPTED_FIELDS];
      
      if (fieldConfig?.searchable && result[fieldName]) {
        // Convert direct field search to search hash
        if (typeof result[fieldName] === 'string') {
          const searchValue = result[fieldName];
          delete result[fieldName];
          result[`${fieldName}_search`] = this.generateFieldSearchHash(searchValue, fieldName);
        }

        // Handle contains, startsWith, endsWith operations
        if (typeof result[fieldName] === 'object') {
          const searchConditions = result[fieldName];
          delete result[fieldName];

          // For encrypted fields, we can only do exact matches via search hash
          // Full-text search would require additional indexing solutions
          if (searchConditions.equals || searchConditions.in) {
            const searchValue = searchConditions.equals || searchConditions.in[0];
            result[`${fieldName}_search`] = this.generateFieldSearchHash(searchValue, fieldName);
          }
        }
      }
    }

    return result;
  }

  /**
   * Generate search hash for a specific field
   */
  private generateFieldSearchHash(value: string, fieldName: string): string {
    const crypto = require('crypto');
    const searchKey = `${process.env.ENCRYPTION_KEY}_SEARCH_${fieldName}`;
    return crypto.createHash('sha256')
      .update(value.toLowerCase().trim())
      .update(searchKey)
      .digest('hex');
  }

  /**
   * Get encryption configuration for a model
   */
  private getModelEncryptionConfig(model?: string): string[] {
    const encryptionConfig: Record<string, string[]> = {
      User: ['phoneNumber', 'nationalIdNumber'],
      Message: ['content'], // For future message encryption
      Document: ['documentContent'],
      // Add other models as needed
    };

    return encryptionConfig[model || ''] || [];
  }
}

/**
 * Specialized methods for encrypted operations
 */
export class EncryptedOperations {
  private prisma: EncryptedPrismaClient;

  constructor() {
    this.prisma = new EncryptedPrismaClient();
  }

  /**
   * Search users by encrypted phone number
   */
  async findUserByPhoneNumber(phoneNumber: string) {
    const searchHash = this.generateFieldSearchHash(phoneNumber, 'phoneNumber');
    
    return await this.prisma.user.findFirst({
      where: {
        phoneNumber_search: searchHash
      }
    });
  }

  /**
   * Search messages containing encrypted content
   * Note: This requires a different approach for full-text search on encrypted data
   */
  async searchEncryptedMessages(chatId: string, searchTerm: string) {
    // For exact matches only - full-text search on encrypted data
    // would require client-side decryption or searchable encryption schemes
    const searchHash = this.generateFieldSearchHash(searchTerm, 'content');
    
    return await this.prisma.message.findMany({
      where: {
        chatId,
        content_search: searchHash
      },
      orderBy: {
        sentAt: 'desc'
      }
    });
  }

  /**
   * Bulk encrypt existing plaintext data
   * Used for migrating existing data to encrypted format
   */
  async migrateToEncryptedData(model: string, field: string, batchSize: number = 100) {
    const modelName = model.toLowerCase();
    let skip = 0;
    let processed = 0;

    console.log(`Starting encryption migration for ${model}.${field}`);

    while (true) {
      // @ts-ignore - Dynamic model access
      const records = await this.prisma[modelName].findMany({
        take: batchSize,
        skip,
        where: {
          // Only process records that haven't been encrypted yet
          [field]: {
            not: {
              startsWith: '{'  // JSON-like structure indicates already encrypted
            }
          }
        }
      });

      if (records.length === 0) {
        break;
      }

      // Process batch
      for (const record of records) {
        try {
          const plaintext = record[field];
          if (plaintext && typeof plaintext === 'string') {
            const fieldConfig = ENCRYPTED_FIELDS[field as keyof typeof ENCRYPTED_FIELDS];
            const encrypted = encrypt(plaintext, field, fieldConfig?.searchable || false);
            
            const updateData: any = {
              [field]: JSON.stringify(encrypted)
            };

            // Add search hash if searchable
            if (encrypted.searchHash) {
              updateData[`${field}_search`] = encrypted.searchHash;
            }

            // @ts-ignore - Dynamic model access
            await this.prisma[modelName].update({
              where: { id: record.id },
              data: updateData
            });

            processed++;
          }
        } catch (error) {
          console.error(`Failed to encrypt record ${record.id}:`, error);
        }
      }

      skip += batchSize;
      console.log(`Processed ${processed} records...`);
    }

    console.log(`Encryption migration completed. Total records processed: ${processed}`);
    return processed;
  }

  /**
   * Bulk re-encrypt data with new key (for key rotation)
   */
  async rotateEncryptionKey(model: string, field: string, batchSize: number = 100) {
    const modelName = model.toLowerCase();
    let skip = 0;
    let processed = 0;

    console.log(`Starting key rotation for ${model}.${field}`);

    while (true) {
      // @ts-ignore - Dynamic model access
      const records = await this.prisma[modelName].findMany({
        take: batchSize,
        skip,
        where: {
          // Only process encrypted records
          [field]: {
            startsWith: '{'  // JSON-like structure indicates encrypted data
          }
        }
      });

      if (records.length === 0) {
        break;
      }

      // Process batch
      for (const record of records) {
        try {
          const encryptedValue = record[field];
          if (encryptedValue && typeof encryptedValue === 'string') {
            const encryptedData = JSON.parse(encryptedValue) as EncryptedData;
            
            // Decrypt with old key and re-encrypt with new key
            const plaintext = decrypt(encryptedData);
            const fieldConfig = ENCRYPTED_FIELDS[field as keyof typeof ENCRYPTED_FIELDS];
            const reencrypted = encrypt(plaintext, field, fieldConfig?.searchable || false);
            
            const updateData: any = {
              [field]: JSON.stringify(reencrypted)
            };

            // Update search hash if searchable
            if (reencrypted.searchHash) {
              updateData[`${field}_search`] = reencrypted.searchHash;
            }

            // @ts-ignore - Dynamic model access
            await this.prisma[modelName].update({
              where: { id: record.id },
              data: updateData
            });

            processed++;
          }
        } catch (error) {
          console.error(`Failed to re-encrypt record ${record.id}:`, error);
        }
      }

      skip += batchSize;
      console.log(`Re-encrypted ${processed} records...`);
    }

    console.log(`Key rotation completed. Total records processed: ${processed}`);
    return processed;
  }

  /**
   * Validate encryption integrity across database
   */
  async validateEncryptionIntegrity() {
    const results = {
      valid: 0,
      invalid: 0,
      errors: [] as any[]
    };

    const models = ['user', 'message', 'document'] as const;
    const fields = ['phoneNumber', 'content', 'documentContent'] as const;

    for (const model of models) {
      const modelConfig = this.getModelEncryptionConfig(model);
      
      if (modelConfig.length === 0) continue;

      for (const field of modelConfig) {
        try {
          // @ts-ignore - Dynamic model access
          const records = await this.prisma[model].findMany({
            select: { id: true, [field]: true },
            where: {
              [field]: {
                not: null
              }
            },
            take: 1000 // Limit for performance
          });

          for (const record of records) {
            try {
              const encryptedValue = record[field];
              if (encryptedValue && typeof encryptedValue === 'string') {
                const encryptedData = JSON.parse(encryptedValue) as EncryptedData;
                
                // Try to decrypt to validate integrity
                decrypt(encryptedData);
                results.valid++;
              }
            } catch (error) {
              results.invalid++;
              results.errors.push({
                model,
                field,
                recordId: record.id,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
        } catch (error) {
          console.error(`Error validating ${model}.${field}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Generate search hash for field (helper method)
   */
  private generateFieldSearchHash(value: string, fieldName: string): string {
    const crypto = require('crypto');
    const searchKey = `${process.env.ENCRYPTION_KEY}_SEARCH_${fieldName}`;
    return crypto.createHash('sha256')
      .update(value.toLowerCase().trim())
      .update(searchKey)
      .digest('hex');
  }

  /**
   * Get encryption configuration for a model (helper method)
   */
  private getModelEncryptionConfig(model: string): string[] {
    const encryptionConfig: Record<string, string[]> = {
      user: ['phoneNumber', 'nationalIdNumber'],
      message: ['content'],
      document: ['documentContent'],
    };

    return encryptionConfig[model] || [];
  }

  /**
   * Clean up and disconnect
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Export singleton instance
export const encryptedDb = new EncryptedOperations();