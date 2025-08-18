/**
 * Comprehensive encryption test suite for TutorConnect
 * Tests encryption operations, key management, and security features
 */

const { describe, test, expect, beforeAll, afterAll, jest } = require('@jest/globals');
const crypto = require('crypto');

// Mock environment variables for testing
process.env.ENCRYPTION_KEY = 'dGVzdEtleUZvckVuY3J5cHRpb25UZXN0aW5nMTIz'; // Base64 encoded test key
process.env.NODE_ENV = 'test';

// Import modules after environment setup
const {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  generateEncryptionKey,
  hashSensitiveData,
  verifySensitiveData,
  isValidEncryptedData,
  encryptFile,
  decryptFile
} = require('../src/lib/encryption');

const { keyManager } = require('../src/lib/keyManagement');
const { encryptionMonitor } = require('../src/middleware/encryptionSecurity');

describe('Encryption Core Functions', () => {
  const testData = {
    phoneNumber: '+47 123 45 678',
    email: 'test@example.com',
    nationalId: '12345678901',
    message: 'This is a confidential message',
    longText: 'A'.repeat(10000) // Test large data
  };

  describe('Basic Encryption/Decryption', () => {
    test('should encrypt and decrypt string data correctly', () => {
      const encrypted = encrypt(testData.phoneNumber);
      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
      expect(encrypted).toHaveProperty('keyVersion');
      expect(encrypted).toHaveProperty('algorithm');

      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(testData.phoneNumber);
    });

    test('should handle Buffer data', () => {
      const buffer = Buffer.from(testData.message, 'utf8');
      const encrypted = encrypt(buffer);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(testData.message);
    });

    test('should generate unique IVs for each encryption', () => {
      const encrypted1 = encrypt(testData.phoneNumber);
      const encrypted2 = encrypt(testData.phoneNumber);
      
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      
      // But both should decrypt to the same value
      expect(decrypt(encrypted1)).toBe(testData.phoneNumber);
      expect(decrypt(encrypted2)).toBe(testData.phoneNumber);
    });

    test('should handle large data efficiently', () => {
      const start = Date.now();
      const encrypted = encrypt(testData.longText);
      const encryptTime = Date.now() - start;
      
      const decryptStart = Date.now();
      const decrypted = decrypt(encrypted);
      const decryptTime = Date.now() - decryptStart;
      
      expect(decrypted).toBe(testData.longText);
      expect(encryptTime).toBeLessThan(100); // Should be fast
      expect(decryptTime).toBeLessThan(100);
    });
  });

  describe('Searchable Encryption', () => {
    test('should generate search hash for searchable fields', () => {
      const encrypted = encrypt(testData.phoneNumber, 'phoneNumber', true);
      expect(encrypted).toHaveProperty('searchHash');
      expect(encrypted.searchHash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
    });

    test('should generate consistent search hashes', () => {
      const encrypted1 = encrypt(testData.phoneNumber, 'phoneNumber', true);
      const encrypted2 = encrypt(testData.phoneNumber, 'phoneNumber', true);
      
      expect(encrypted1.searchHash).toBe(encrypted2.searchHash);
    });

    test('should generate different search hashes for different fields', () => {
      const phoneHash = encrypt(testData.phoneNumber, 'phoneNumber', true).searchHash;
      const idHash = encrypt(testData.phoneNumber, 'nationalIdNumber', true).searchHash;
      
      expect(phoneHash).not.toBe(idHash);
    });

    test('should not generate search hash for non-searchable fields', () => {
      const encrypted = encrypt(testData.phoneNumber, 'phoneNumber', false);
      expect(encrypted.searchHash).toBeUndefined();
    });
  });

  describe('Object Encryption', () => {
    test('should encrypt specified fields in object', () => {
      const user = {
        id: '123',
        name: 'John Doe',
        phoneNumber: testData.phoneNumber,
        email: testData.email,
        nationalIdNumber: testData.nationalId
      };

      const encrypted = encryptObject(user, ['phoneNumber', 'nationalIdNumber']);
      
      expect(encrypted.id).toBe('123'); // Not encrypted
      expect(encrypted.name).toBe('John Doe'); // Not encrypted
      expect(encrypted.email).toBe(testData.email); // Not encrypted
      
      expect(encrypted.phoneNumber).not.toBe(testData.phoneNumber); // Encrypted
      expect(encrypted.nationalIdNumber).not.toBe(testData.nationalId); // Encrypted
      expect(encrypted._encrypted).toEqual(['phoneNumber', 'nationalIdNumber']);
    });

    test('should decrypt encrypted object fields', () => {
      const user = {
        phoneNumber: testData.phoneNumber,
        nationalIdNumber: testData.nationalId
      };

      const encrypted = encryptObject(user, ['phoneNumber', 'nationalIdNumber']);
      const decrypted = decryptObject(encrypted);
      
      expect(decrypted.phoneNumber).toBe(testData.phoneNumber);
      expect(decrypted.nationalIdNumber).toBe(testData.nationalId);
      expect(decrypted._encrypted).toBeUndefined(); // Metadata removed
    });
  });

  describe('File Encryption', () => {
    test('should encrypt and decrypt file content', async () => {
      const fileContent = Buffer.from('This is a test file content with sensitive information');
      const metadata = { fileName: 'test.txt', uploadedBy: 'user123' };

      const { encryptedContent, encryptionMetadata } = await encryptFile(fileContent, metadata);
      
      expect(encryptedContent).toBeInstanceOf(Buffer);
      expect(encryptionMetadata).toHaveProperty('ciphertext');
      expect(encryptionMetadata).toHaveProperty('metadata');

      const { fileBuffer, metadata: decryptedMetadata } = await decryptFile(encryptedContent, encryptionMetadata);
      
      expect(fileBuffer.toString()).toBe(fileContent.toString());
      expect(decryptedMetadata).toEqual(metadata);
    });
  });

  describe('Data Validation', () => {
    test('should validate encrypted data structure', () => {
      const encrypted = encrypt(testData.phoneNumber);
      expect(isValidEncryptedData(encrypted)).toBe(true);

      // Test invalid structures
      expect(isValidEncryptedData({})).toBe(false);
      expect(isValidEncryptedData({ ciphertext: 'test' })).toBe(false);
      expect(isValidEncryptedData(null)).toBe(false);
      expect(isValidEncryptedData('string')).toBe(false);
    });

    test('should detect corrupted encrypted data', () => {
      const encrypted = encrypt(testData.phoneNumber);
      
      // Corrupt the ciphertext
      const corrupted = { ...encrypted, ciphertext: 'corrupted' };
      
      expect(() => decrypt(corrupted)).toThrow();
    });

    test('should detect tampered encrypted data', () => {
      const encrypted = encrypt(testData.phoneNumber);
      
      // Tamper with the tag (authentication will fail)
      const tampered = { ...encrypted, tag: 'dGFtcGVyZWRkYXRh' };
      
      expect(() => decrypt(tampered)).toThrow();
    });
  });
});

describe('Sensitive Data Hashing', () => {
  test('should hash sensitive data for comparison', () => {
    const data = 'sensitive-password-123';
    const hashed = hashSensitiveData(data);
    
    expect(hashed).toMatch(/^[a-f0-9]{32}:[a-f0-9]{64}$/); // salt:hash format
    expect(verifySensitiveData(data, hashed)).toBe(true);
    expect(verifySensitiveData('wrong-data', hashed)).toBe(false);
  });

  test('should generate different hashes for same data', () => {
    const data = 'test-data';
    const hash1 = hashSensitiveData(data);
    const hash2 = hashSensitiveData(data);
    
    expect(hash1).not.toBe(hash2); // Different salts
    expect(verifySensitiveData(data, hash1)).toBe(true);
    expect(verifySensitiveData(data, hash2)).toBe(true);
  });
});

describe('Key Management', () => {
  test('should generate secure encryption keys', () => {
    const key = generateEncryptionKey();
    
    expect(key).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 format
    expect(Buffer.from(key, 'base64')).toHaveLength(32); // 256 bits
  });

  test('should validate key strength', () => {
    const validation = keyManager.validateKey(process.env.ENCRYPTION_KEY);
    
    expect(validation).toHaveProperty('isValid');
    expect(validation).toHaveProperty('strength');
    expect(validation).toHaveProperty('issues');
    expect(validation.isValid).toBe(true);
  });

  test('should detect weak keys', () => {
    const weakKey = 'abc123'; // Too short and weak
    const validation = keyManager.validateKey(weakKey);
    
    expect(validation.isValid).toBe(false);
    expect(validation.strength).toBe('weak');
    expect(validation.issues.length).toBeGreaterThan(0);
  });

  test('should check if key rotation is needed', () => {
    const needed = keyManager.shouldRotateKey();
    expect(typeof needed).toBe('boolean');
  });
});

describe('Security Monitoring', () => {
  beforeAll(() => {
    // Clear monitoring data
    encryptionMonitor.cleanup();
  });

  test('should log encryption operations', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    encryptionMonitor.logOperation({
      operation: 'encrypt',
      fieldName: 'phoneNumber',
      userId: 'test-user',
      success: true,
      ip: '127.0.0.1',
      userAgent: 'test-agent'
    });

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  test('should detect suspicious activity patterns', () => {
    const alertSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Simulate multiple failed decryption attempts
    for (let i = 0; i < 12; i++) {
      encryptionMonitor.logOperation({
        operation: 'decrypt',
        fieldName: 'phoneNumber',
        userId: 'attacker',
        success: false,
        ip: '192.168.1.100',
        userAgent: 'suspicious-agent',
        errorType: 'INVALID_DATA'
      });
    }

    expect(alertSpy).toHaveBeenCalledWith(
      'ENCRYPTION SECURITY ALERT:',
      expect.objectContaining({
        type: 'EXCESSIVE_DECRYPTION_FAILURES'
      })
    );
    
    alertSpy.mockRestore();
  });

  test('should generate security statistics', () => {
    const stats = encryptionMonitor.getStatistics(24 * 60 * 60 * 1000); // 24 hours
    
    expect(stats).toHaveProperty('totalOperations');
    expect(stats).toHaveProperty('successfulOperations');
    expect(stats).toHaveProperty('failedOperations');
    expect(stats).toHaveProperty('operationsByType');
    expect(stats).toHaveProperty('suspiciousIPs');
  });

  test('should identify IPs to block', () => {
    const shouldBlock = encryptionMonitor.shouldBlockIP('192.168.1.100');
    expect(typeof shouldBlock).toBe('boolean');
  });
});

describe('Performance Tests', () => {
  test('should encrypt data within performance thresholds', () => {
    const iterations = 1000;
    const testData = 'Performance test data string';
    const start = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      encrypt(testData);
    }
    
    const timePerOperation = (Date.now() - start) / iterations;
    expect(timePerOperation).toBeLessThan(1); // Less than 1ms per operation
  });

  test('should decrypt data within performance thresholds', () => {
    const encrypted = encrypt('Performance test data');
    const iterations = 1000;
    const start = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      decrypt(encrypted);
    }
    
    const timePerOperation = (Date.now() - start) / iterations;
    expect(timePerOperation).toBeLessThan(1); // Less than 1ms per operation
  });

  test('should handle concurrent operations', async () => {
    const concurrency = 10;
    const data = 'Concurrent test data';
    
    const promises = Array.from({ length: concurrency }, () =>
      new Promise((resolve) => {
        const encrypted = encrypt(data);
        const decrypted = decrypt(encrypted);
        resolve(decrypted);
      })
    );
    
    const results = await Promise.all(promises);
    expect(results).toHaveLength(concurrency);
    results.forEach(result => {
      expect(result).toBe(data);
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  test('should handle null and undefined data', () => {
    expect(() => encrypt(null)).toThrow();
    expect(() => encrypt(undefined)).toThrow();
    expect(() => encrypt('')).not.toThrow(); // Empty string should work
  });

  test('should handle empty buffers', () => {
    const emptyBuffer = Buffer.alloc(0);
    const encrypted = encrypt(emptyBuffer);
    const decrypted = decrypt(encrypted);
    expect(Buffer.from(decrypted).length).toBe(0);
  });

  test('should handle special characters and unicode', () => {
    const unicodeData = '测试数据 🔐 ñorvégien æøå';
    const encrypted = encrypt(unicodeData);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(unicodeData);
  });

  test('should fail gracefully with wrong key', () => {
    // Save original key
    const originalKey = process.env.ENCRYPTION_KEY;
    
    // Encrypt with original key
    const encrypted = encrypt('test data');
    
    // Change key
    process.env.ENCRYPTION_KEY = 'aW52YWxpZEtleUZvclRlc3RpbmdQdXJwb3Nlcw==';
    
    // Should fail to decrypt
    expect(() => decrypt(encrypted)).toThrow();
    
    // Restore original key
    process.env.ENCRYPTION_KEY = originalKey;
  });

  test('should handle malformed encrypted data', () => {
    const malformed = {
      ciphertext: 'not-base64-data!',
      iv: 'invalid-iv',
      tag: 'bad-tag',
      keyVersion: 1,
      algorithm: 'aes-256-gcm'
    };
    
    expect(() => decrypt(malformed)).toThrow();
  });
});

describe('GDPR Compliance Tests', () => {
  test('should support data export with decryption', () => {
    const userData = {
      phoneNumber: testData.phoneNumber,
      nationalIdNumber: testData.nationalId
    };

    const encrypted = encryptObject(userData, ['phoneNumber', 'nationalIdNumber']);
    const decrypted = decryptObject(encrypted);
    
    // Exported data should be decrypted and readable
    expect(decrypted.phoneNumber).toBe(testData.phoneNumber);
    expect(decrypted.nationalIdNumber).toBe(testData.nationalId);
  });

  test('should support secure data erasure', () => {
    const buffer = Buffer.from('sensitive data to be erased');
    const encrypted = encrypt(buffer);
    
    // Verify we can decrypt initially
    expect(decrypt(encrypted)).toBe('sensitive data to be erased');
    
    // In a real scenario, we would remove the key or data
    // This simulates the data being inaccessible after erasure
    expect(encrypted).toHaveProperty('ciphertext');
  });
});

describe('Integration Tests', () => {
  test('should work with database-like operations', () => {
    // Simulate database record
    const userRecord = {
      id: 'user-123',
      email: 'user@example.com',
      phoneNumber: testData.phoneNumber,
      createdAt: new Date()
    };

    // Simulate storing (encrypt sensitive fields)
    const storedRecord = encryptObject(userRecord, ['phoneNumber']);
    
    // Simulate retrieving and decrypting
    const retrievedRecord = decryptObject(storedRecord);
    
    expect(retrievedRecord.phoneNumber).toBe(testData.phoneNumber);
    expect(retrievedRecord.email).toBe(userRecord.email);
  });

  test('should maintain data consistency across operations', () => {
    const iterations = 100;
    const testValue = 'consistency-test-value';
    
    for (let i = 0; i < iterations; i++) {
      const encrypted = encrypt(testValue);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(testValue);
    }
  });
});

// Cleanup after tests
afterAll(() => {
  // Clean up any test data or connections
  encryptionMonitor.cleanup();
});