/**
 * Key management utilities for TutorConnect
 * Handles encryption key rotation, storage, and security operations
 */

import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { encryptedDb } from './encryptedDb';

/**
 * Key management configuration
 */
const KEY_ROTATION_CONFIG = {
  // Rotate keys every 90 days in production
  rotationIntervalDays: process.env.NODE_ENV === 'production' ? 90 : 30,
  
  // Keep previous keys for decryption for 180 days
  retentionPeriodDays: process.env.NODE_ENV === 'production' ? 180 : 60,
  
  // Minimum key strength requirements
  minKeyLength: 32,
  
  // Key derivation iterations
  pbkdf2Iterations: process.env.NODE_ENV === 'production' ? 100000 : 10000
} as const;

/**
 * Key metadata interface
 */
export interface KeyMetadata {
  keyId: string;
  version: number;
  algorithm: string;
  createdAt: Date;
  rotatedAt?: Date;
  expiresAt?: Date;
  status: 'active' | 'rotating' | 'retired' | 'compromised';
  usage: {
    encryptionOperations: number;
    decryptionOperations: number;
  };
}

/**
 * Key rotation status
 */
export interface KeyRotationStatus {
  inProgress: boolean;
  startedAt?: Date;
  completedAt?: Date;
  progress: {
    totalRecords: number;
    processedRecords: number;
    failedRecords: number;
  };
  errors: Array<{
    model: string;
    recordId: string;
    error: string;
  }>;
}

/**
 * Key Management Service
 */
export class KeyManagementService {
  private static instance: KeyManagementService;
  private rotationStatus: KeyRotationStatus = {
    inProgress: false,
    progress: {
      totalRecords: 0,
      processedRecords: 0,
      failedRecords: 0
    },
    errors: []
  };

  private constructor() {}

  static getInstance(): KeyManagementService {
    if (!KeyManagementService.instance) {
      KeyManagementService.instance = new KeyManagementService();
    }
    return KeyManagementService.instance;
  }

  /**
   * Generate a new encryption key with proper entropy
   */
  generateNewKey(): string {
    // Generate 256-bit key using cryptographically secure random bytes
    const keyBytes = randomBytes(32);
    
    // Ensure minimum entropy requirements
    const entropy = this.calculateEntropy(keyBytes);
    if (entropy < 7.5) { // Require high entropy (7.5+ bits per byte)
      console.warn('Generated key has low entropy, regenerating...');
      return this.generateNewKey();
    }

    return keyBytes.toString('base64');
  }

  /**
   * Validate key strength and format
   */
  validateKey(key: string): {
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    issues: string[];
  } {
    const issues: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'strong';

    // Check minimum length
    if (key.length < KEY_ROTATION_CONFIG.minKeyLength) {
      issues.push(`Key too short (minimum ${KEY_ROTATION_CONFIG.minKeyLength} characters)`);
      strength = 'weak';
    }

    // Check for base64 format
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(key)) {
      issues.push('Key must be valid base64 encoded');
      strength = 'weak';
    }

    // Check entropy
    try {
      const keyBytes = Buffer.from(key, 'base64');
      const entropy = this.calculateEntropy(keyBytes);
      
      if (entropy < 6.0) {
        issues.push('Key has insufficient entropy');
        strength = 'weak';
      } else if (entropy < 7.0) {
        strength = 'medium';
      }
    } catch (error) {
      issues.push('Invalid key format');
      strength = 'weak';
    }

    return {
      isValid: issues.length === 0,
      strength,
      issues
    };
  }

  /**
   * Get current key metadata
   */
  getCurrentKeyMetadata(): KeyMetadata {
    const currentKey = process.env.ENCRYPTION_KEY;
    if (!currentKey) {
      throw new Error('No encryption key configured');
    }

    // In production, this would be stored in a secure key management system
    return {
      keyId: this.generateKeyId(currentKey),
      version: 1,
      algorithm: 'AES-256-GCM',
      createdAt: new Date(), // Would be stored in key management system
      status: 'active',
      usage: {
        encryptionOperations: 0, // Would be tracked in key management system
        decryptionOperations: 0
      }
    };
  }

  /**
   * Check if key rotation is needed
   */
  shouldRotateKey(): boolean {
    const metadata = this.getCurrentKeyMetadata();
    const daysSinceCreation = Math.floor(
      (Date.now() - metadata.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      daysSinceCreation >= KEY_ROTATION_CONFIG.rotationIntervalDays ||
      metadata.usage.encryptionOperations > 1000000 || // Max operations limit
      metadata.status === 'compromised'
    );
  }

  /**
   * Initiate key rotation process
   */
  async rotateKey(newKey?: string): Promise<KeyRotationStatus> {
    if (this.rotationStatus.inProgress) {
      throw new Error('Key rotation already in progress');
    }

    // Generate new key if not provided
    const rotationKey = newKey || this.generateNewKey();
    
    // Validate new key
    const validation = this.validateKey(rotationKey);
    if (!validation.isValid) {
      throw new Error(`Invalid rotation key: ${validation.issues.join(', ')}`);
    }

    this.rotationStatus = {
      inProgress: true,
      startedAt: new Date(),
      progress: {
        totalRecords: 0,
        processedRecords: 0,
        failedRecords: 0
      },
      errors: []
    };

    try {
      console.log('Starting key rotation process...');

      // Step 1: Count total records to process
      await this.countEncryptedRecords();

      // Step 2: Set new key as secondary key
      const previousKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY_PREVIOUS = previousKey;
      process.env.ENCRYPTION_KEY = rotationKey;

      // Step 3: Re-encrypt all data with new key
      await this.reencryptAllData();

      // Step 4: Validate rotation success
      const validationResult = await encryptedDb.validateEncryptionIntegrity();
      if (validationResult.invalid > 0) {
        throw new Error(`Rotation validation failed: ${validationResult.invalid} records could not be decrypted`);
      }

      // Step 5: Complete rotation
      this.rotationStatus.completedAt = new Date();
      this.rotationStatus.inProgress = false;

      console.log('Key rotation completed successfully');
      console.log(`Processed ${this.rotationStatus.progress.processedRecords} records`);
      console.log(`Failed: ${this.rotationStatus.progress.failedRecords} records`);

      return { ...this.rotationStatus };

    } catch (error) {
      console.error('Key rotation failed:', error);
      
      // Rollback on failure
      if (process.env.ENCRYPTION_KEY_PREVIOUS) {
        process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY_PREVIOUS;
        delete process.env.ENCRYPTION_KEY_PREVIOUS;
      }

      this.rotationStatus.inProgress = false;
      throw error;
    }
  }

  /**
   * Get rotation status
   */
  getRotationStatus(): KeyRotationStatus {
    return { ...this.rotationStatus };
  }

  /**
   * Emergency key revocation (marks key as compromised)
   */
  async revokeKey(reason: string): Promise<void> {
    console.log(`SECURITY ALERT: Revoking encryption key - ${reason}`);
    
    // In production, this would:
    // 1. Mark key as compromised in key management system
    // 2. Trigger immediate key rotation
    // 3. Alert security team
    // 4. Log security incident

    // For now, trigger immediate rotation
    await this.rotateKey();
  }

  /**
   * Secure key backup creation
   */
  createKeyBackup(): {
    encryptedBackup: string;
    backupId: string;
    createdAt: Date;
  } {
    const currentKey = process.env.ENCRYPTION_KEY;
    if (!currentKey) {
      throw new Error('No key to backup');
    }

    // Create backup with additional encryption layer
    const backupKey = randomBytes(32);
    const backupId = randomBytes(16).toString('hex');
    
    // In production, this would use HSM or key vault
    const crypto = require('crypto');
    const cipher = crypto.createCipher('aes-256-cbc', backupKey);
    let encryptedBackup = cipher.update(currentKey, 'utf8', 'hex');
    encryptedBackup += cipher.final('hex');

    return {
      encryptedBackup,
      backupId,
      createdAt: new Date()
    };
  }

  /**
   * Count encrypted records across all models
   */
  private async countEncryptedRecords(): Promise<void> {
    let totalCount = 0;

    // Count users with encrypted fields
    const userCount = await encryptedDb.prisma.user.count({
      where: {
        OR: [
          { phoneNumber: { startsWith: '{' } },
          { nationalIdNumber: { startsWith: '{' } }
        ]
      }
    });
    totalCount += userCount;

    // Count encrypted messages
    const messageCount = await encryptedDb.prisma.message.count({
      where: {
        content: { startsWith: '{' }
      }
    });
    totalCount += messageCount;

    // Count encrypted documents
    const documentCount = await encryptedDb.prisma.document.count({
      where: {
        encryptionMetadata: { not: null }
      }
    });
    totalCount += documentCount;

    this.rotationStatus.progress.totalRecords = totalCount;
  }

  /**
   * Re-encrypt all data with new key
   */
  private async reencryptAllData(): Promise<void> {
    // Re-encrypt user data
    await this.reencryptModel('user', 'phoneNumber');
    await this.reencryptModel('user', 'nationalIdNumber');
    
    // Re-encrypt message data
    await this.reencryptModel('message', 'content');
    
    // Documents would require special handling for file content
    console.log('Document re-encryption would be handled separately for file content');
  }

  /**
   * Re-encrypt specific model field
   */
  private async reencryptModel(model: string, field: string): Promise<void> {
    const batchSize = 100;
    let processed = 0;

    while (true) {
      try {
        const count = await encryptedDb.rotateEncryptionKey(model, field, batchSize);
        if (count === 0) break;
        
        processed += count;
        this.rotationStatus.progress.processedRecords += count;
        
        console.log(`Re-encrypted ${processed} ${model}.${field} records`);
      } catch (error) {
        this.rotationStatus.progress.failedRecords++;
        this.rotationStatus.errors.push({
          model,
          recordId: 'batch',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`Failed to re-encrypt ${model}.${field}:`, error);
        break;
      }
    }
  }

  /**
   * Calculate entropy of key material
   */
  private calculateEntropy(data: Buffer): number {
    const frequency: number[] = new Array(256).fill(0);
    
    // Count byte frequencies
    for (const byte of data) {
      frequency[byte]++;
    }

    // Calculate Shannon entropy
    let entropy = 0;
    const length = data.length;

    for (const freq of frequency) {
      if (freq > 0) {
        const p = freq / length;
        entropy -= p * Math.log2(p);
      }
    }

    return entropy;
  }

  /**
   * Generate deterministic key ID for tracking
   */
  private generateKeyId(key: string): string {
    return createHash('sha256')
      .update(key)
      .update('KEY_ID')
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Clean up expired keys and metadata
   */
  async cleanupExpiredKeys(): Promise<{
    removedKeys: number;
    retainedKeys: number;
  }> {
    // In production, this would:
    // 1. Query key management system for expired keys
    // 2. Verify no data still requires old keys
    // 3. Securely delete expired keys
    // 4. Update key status tracking

    console.log('Key cleanup would remove keys older than retention period');
    
    return {
      removedKeys: 0,
      retainedKeys: 1
    };
  }
}

// Export singleton instance
export const keyManager = KeyManagementService.getInstance();

/**
 * Key rotation CLI utility functions
 */
export const keyRotationUtils = {
  /**
   * Generate new encryption key for environment setup
   */
  generateKey(): string {
    return keyManager.generateNewKey();
  },

  /**
   * Validate existing key configuration
   */
  validateCurrentKey(): void {
    const currentKey = process.env.ENCRYPTION_KEY;
    if (!currentKey) {
      throw new Error('ENCRYPTION_KEY environment variable not set');
    }

    const validation = keyManager.validateKey(currentKey);
    if (!validation.isValid) {
      throw new Error(`Current key validation failed: ${validation.issues.join(', ')}`);
    }

    console.log(`Key validation passed (strength: ${validation.strength})`);
  },

  /**
   * Check if rotation is needed
   */
  checkRotationNeeded(): void {
    const needed = keyManager.shouldRotateKey();
    console.log(`Key rotation needed: ${needed}`);
    
    if (needed) {
      const metadata = keyManager.getCurrentKeyMetadata();
      console.log('Rotation reasons:', {
        keyAge: `${Math.floor((Date.now() - metadata.createdAt.getTime()) / (1000 * 60 * 60 * 24))} days`,
        maxAge: `${KEY_ROTATION_CONFIG.rotationIntervalDays} days`,
        status: metadata.status
      });
    }
  },

  /**
   * Perform key rotation
   */
  async performRotation(newKey?: string): Promise<void> {
    try {
      const status = await keyManager.rotateKey(newKey);
      console.log('Key rotation completed:', {
        duration: status.completedAt && status.startedAt 
          ? `${Math.round((status.completedAt.getTime() - status.startedAt.getTime()) / 1000)}s`
          : 'unknown',
        recordsProcessed: status.progress.processedRecords,
        failures: status.progress.failedRecords
      });
    } catch (error) {
      console.error('Key rotation failed:', error);
      throw error;
    }
  }
};

/**
 * Export key configuration for monitoring
 */
export const keyConfig = {
  rotationInterval: KEY_ROTATION_CONFIG.rotationIntervalDays,
  retentionPeriod: KEY_ROTATION_CONFIG.retentionPeriodDays,
  minKeyLength: KEY_ROTATION_CONFIG.minKeyLength,
  algorithm: 'AES-256-GCM'
};