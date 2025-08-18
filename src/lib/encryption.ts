/**
 * Encryption utilities for TutorConnect
 * Implements AES-256-GCM encryption for sensitive data with key rotation support
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

// Encryption algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits
const KEY_LENGTH = 32; // 256 bits

// Key derivation iterations (increase for production)
const PBKDF2_ITERATIONS = process.env.NODE_ENV === 'production' ? 100000 : 10000;

// Environment variable validation
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ENCRYPTION_KEY_PREVIOUS = process.env.ENCRYPTION_KEY_PREVIOUS; // For key rotation

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

if (ENCRYPTION_KEY.length < 32) {
  throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
}

/**
 * Field-level encryption configuration
 * Defines which fields should be encrypted and their characteristics
 */
export const ENCRYPTED_FIELDS = {
  // Personal identification
  nationalIdNumber: {
    searchable: false,
    format: 'string',
    category: 'personal_identity'
  },
  phoneNumber: {
    searchable: true, // Needs special handling for search
    format: 'string',
    category: 'contact_information'
  },
  // Future payment information
  bankAccountNumber: {
    searchable: false,
    format: 'string',
    category: 'financial'
  },
  // Sensitive documents
  documentContent: {
    searchable: false,
    format: 'binary',
    category: 'educational'
  },
  // Private messages
  messageContent: {
    searchable: true, // For message search functionality
    format: 'string',
    category: 'behavioral'
  }
} as const;

/**
 * Encryption result interface
 */
export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
  keyVersion: number;
  algorithm: string;
  searchHash?: string; // For searchable encrypted fields
}

/**
 * Derive encryption key from master key using PBKDF2
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  const crypto = require('crypto');
  return crypto.pbkdf2Sync(masterKey, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Generate a deterministic search hash for encrypted searchable fields
 * This allows searching encrypted data without decrypting everything
 */
function generateSearchHash(plaintext: string, fieldName: string): string {
  const searchKey = `${ENCRYPTION_KEY}_SEARCH_${fieldName}`;
  return createHash('sha256')
    .update(plaintext.toLowerCase().trim())
    .update(searchKey)
    .digest('hex');
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encrypt(
  plaintext: string | Buffer,
  fieldName?: string,
  isSearchable: boolean = false
): EncryptedData {
  try {
    // Convert string to buffer if needed
    const data = typeof plaintext === 'string' 
      ? Buffer.from(plaintext, 'utf8') 
      : plaintext;

    // Generate random IV and salt
    const iv = randomBytes(IV_LENGTH);
    const salt = randomBytes(SALT_LENGTH);

    // Derive key from master key
    const key = deriveKey(ENCRYPTION_KEY!, salt);

    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv);

    // Encrypt data
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]);

    // Get authentication tag
    const tag = cipher.getAuthTag();

    // Combine salt and ciphertext
    const combined = Buffer.concat([salt, encrypted]);

    // Generate search hash if field is searchable
    let searchHash: string | undefined;
    if (isSearchable && fieldName && typeof plaintext === 'string') {
      searchHash = generateSearchHash(plaintext, fieldName);
    }

    return {
      ciphertext: combined.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      keyVersion: 1,
      algorithm: ALGORITHM,
      searchHash
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data encrypted with AES-256-GCM
 */
export function decrypt(encryptedData: EncryptedData): string | Buffer {
  try {
    // Try current key first
    const decryptionKeys = [
      { key: ENCRYPTION_KEY!, version: 1 },
      ...(ENCRYPTION_KEY_PREVIOUS ? [{ key: ENCRYPTION_KEY_PREVIOUS, version: 0 }] : [])
    ];

    for (const { key } of decryptionKeys) {
      try {
        return decryptWithKey(encryptedData, key);
      } catch (error) {
        // Try next key if available
        continue;
      }
    }

    throw new Error('Failed to decrypt with any available key');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Decrypt with specific key
 */
function decryptWithKey(encryptedData: EncryptedData, masterKey: string): string | Buffer {
  // Decode from base64
  const combined = Buffer.from(encryptedData.ciphertext, 'base64');
  const iv = Buffer.from(encryptedData.iv, 'base64');
  const tag = Buffer.from(encryptedData.tag, 'base64');

  // Extract salt and ciphertext
  const salt = combined.slice(0, SALT_LENGTH);
  const ciphertext = combined.slice(SALT_LENGTH);

  // Derive key
  const key = deriveKey(masterKey, salt);

  // Create decipher
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  // Decrypt data
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);

  // Return as string for text data
  return decrypted.toString('utf8');
}

/**
 * Encrypt an object with multiple fields
 */
export function encryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[]
): T & { _encrypted?: string[] } {
  const result = { ...obj, _encrypted: [] as string[] };

  for (const field of fieldsToEncrypt) {
    if (obj[field] !== null && obj[field] !== undefined) {
      const fieldConfig = ENCRYPTED_FIELDS[field as keyof typeof ENCRYPTED_FIELDS];
      const isSearchable = fieldConfig?.searchable || false;

      const encrypted = encrypt(String(obj[field]), String(field), isSearchable);
      
      // Store encrypted data as JSON string
      result[field] = JSON.stringify(encrypted) as any;
      result._encrypted!.push(String(field));

      // Add search hash field if searchable
      if (encrypted.searchHash) {
        (result as any)[`${String(field)}_search`] = encrypted.searchHash;
      }
    }
  }

  return result;
}

/**
 * Decrypt an object with encrypted fields
 */
export function decryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt?: (keyof T)[]
): T {
  const result = { ...obj };
  const fields = fieldsToDecrypt || obj._encrypted || [];

  for (const field of fields) {
    if (obj[field] && typeof obj[field] === 'string') {
      try {
        // Parse encrypted data
        const encryptedData = JSON.parse(obj[field] as string) as EncryptedData;
        
        // Decrypt field
        result[field] = decrypt(encryptedData) as any;
      } catch (error) {
        console.error(`Failed to decrypt field ${String(field)}:`, error);
        // Keep original value if decryption fails
      }
    }
  }

  // Remove metadata fields
  delete result._encrypted;
  
  // Remove search hash fields
  for (const field of fields) {
    delete result[`${String(field)}_search`];
  }

  return result;
}

/**
 * Re-encrypt data with new key (for key rotation)
 */
export async function reencryptWithNewKey(
  encryptedData: EncryptedData,
  fieldName?: string,
  isSearchable: boolean = false
): Promise<EncryptedData> {
  try {
    // Decrypt with old key
    const plaintext = decrypt(encryptedData);
    
    // Re-encrypt with new key
    return encrypt(plaintext, fieldName, isSearchable);
  } catch (error) {
    console.error('Re-encryption error:', error);
    throw new Error('Failed to re-encrypt data');
  }
}

/**
 * Generate encryption key for initial setup
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('base64');
}

/**
 * Hash sensitive data for comparison without storing plaintext
 * Used for data that needs to be compared but not retrieved
 */
export function hashSensitiveData(data: string, salt?: string): string {
  const actualSalt = salt || randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(data)
    .update(actualSalt)
    .update(ENCRYPTION_KEY!)
    .digest('hex');
  
  return `${actualSalt}:${hash}`;
}

/**
 * Verify hashed sensitive data
 */
export function verifySensitiveData(data: string, hashedValue: string): boolean {
  const [salt, originalHash] = hashedValue.split(':');
  if (!salt || !originalHash) return false;

  const newHash = createHash('sha256')
    .update(data)
    .update(salt)
    .update(ENCRYPTION_KEY!)
    .digest('hex');

  return newHash === originalHash;
}

/**
 * Encrypt file content with streaming support for large files
 */
export async function encryptFile(
  fileBuffer: Buffer,
  metadata?: Record<string, any>
): Promise<{
  encryptedContent: Buffer;
  encryptionMetadata: EncryptedData;
}> {
  const encrypted = encrypt(fileBuffer, 'file_content', false);
  
  // Encrypt metadata separately if provided
  const encryptedMetadata = metadata 
    ? encrypt(JSON.stringify(metadata), 'file_metadata', false)
    : null;

  return {
    encryptedContent: Buffer.from(encrypted.ciphertext, 'base64'),
    encryptionMetadata: {
      ...encrypted,
      metadata: encryptedMetadata ? JSON.stringify(encryptedMetadata) : undefined
    } as EncryptedData
  };
}

/**
 * Decrypt file content
 */
export async function decryptFile(
  encryptedContent: Buffer,
  encryptionMetadata: EncryptedData
): Promise<{
  fileBuffer: Buffer;
  metadata?: Record<string, any>;
}> {
  // Prepare encrypted data object
  const encryptedData: EncryptedData = {
    ...encryptionMetadata,
    ciphertext: encryptedContent.toString('base64')
  };

  const fileBuffer = decrypt(encryptedData) as Buffer;

  // Decrypt metadata if present
  let metadata: Record<string, any> | undefined;
  if (encryptionMetadata.metadata) {
    const encryptedMetadata = JSON.parse(encryptionMetadata.metadata) as EncryptedData;
    metadata = JSON.parse(decrypt(encryptedMetadata) as string);
  }

  return { fileBuffer, metadata };
}

/**
 * Generate deterministic encryption for data deduplication
 * Used for identifying duplicate encrypted content without decrypting
 */
export function generateDeterministicHash(data: string | Buffer): string {
  const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  
  return createHash('sha256')
    .update(dataBuffer)
    .update(ENCRYPTION_KEY!)
    .update('DEDUP')
    .digest('hex');
}

/**
 * Secure data deletion by overwriting memory
 * Important for sensitive data handling
 */
export function secureDelete(data: Buffer | string): void {
  if (typeof data === 'string') {
    // For strings, we can't directly overwrite memory in JavaScript
    // This is a limitation - consider using Buffer for sensitive data
    return;
  }

  // Overwrite buffer with random data
  if (Buffer.isBuffer(data)) {
    randomBytes(data.length).copy(data);
    data.fill(0);
  }
}

/**
 * Validate encrypted data structure
 */
export function isValidEncryptedData(data: any): data is EncryptedData {
  return (
    typeof data === 'object' &&
    typeof data.ciphertext === 'string' &&
    typeof data.iv === 'string' &&
    typeof data.tag === 'string' &&
    typeof data.keyVersion === 'number' &&
    typeof data.algorithm === 'string'
  );
}

/**
 * Export encryption metrics for monitoring
 */
export function getEncryptionMetrics(): {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
  iterations: number;
} {
  return {
    algorithm: ALGORITHM,
    keyLength: KEY_LENGTH * 8, // Convert to bits
    ivLength: IV_LENGTH * 8,
    tagLength: TAG_LENGTH * 8,
    iterations: PBKDF2_ITERATIONS
  };
}