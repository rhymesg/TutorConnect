# TutorConnect Encryption Implementation

## Overview

This document outlines the comprehensive data encryption implementation for TutorConnect, designed to protect sensitive user information while maintaining GDPR compliance and operational functionality.

## Architecture

### Core Components

1. **Encryption Layer** (`/src/lib/encryption.ts`)
   - AES-256-GCM symmetric encryption
   - PBKDF2 key derivation
   - Deterministic search hash generation
   - File encryption support

2. **Database Integration** (`/src/lib/encryptedDb.ts`)
   - Transparent Prisma middleware for encryption/decryption
   - Searchable encrypted field support
   - Migration and key rotation utilities

3. **Service Layer** (`/src/lib/encryptedServices.ts`)
   - Business logic with encryption awareness
   - GDPR compliance integration
   - Audit logging for encrypted operations

4. **Security Monitoring** (`/src/middleware/encryptionSecurity.ts`)
   - Real-time threat detection
   - Anomaly detection for encryption operations
   - Security incident logging

5. **Key Management** (`/src/lib/keyManagement.ts`)
   - Secure key generation and validation
   - Automated key rotation
   - Key lifecycle management

## Encryption Standards

### Algorithm Configuration

```typescript
- Algorithm: AES-256-GCM
- Key Size: 256 bits (32 bytes)
- IV Size: 128 bits (16 bytes)
- Authentication Tag: 128 bits (16 bytes)
- Key Derivation: PBKDF2-SHA256
- Iterations: 100,000 (production) / 10,000 (development)
```

### Security Features

- **Authenticated Encryption**: GCM mode provides confidentiality and authenticity
- **Random IVs**: Each encryption operation uses a unique, random initialization vector
- **Salt-based Key Derivation**: PBKDF2 with unique salts prevents rainbow table attacks
- **Deterministic Search**: Search hashes enable encrypted data queries
- **Key Rotation**: Automated rotation with backward compatibility

## Encrypted Fields

### User Data

| Field | Type | Searchable | Category |
|-------|------|------------|----------|
| `phoneNumber` | String | Yes | Contact Information |
| `nationalIdNumber` | String | Yes | Personal Identity |
| Future payment fields | String | No | Financial |

### Message Data

| Field | Type | Searchable | Category |
|-------|------|------------|----------|
| `content` | String | Yes | Behavioral Data |

### Document Data

| Field | Type | Searchable | Category |
|-------|------|------------|----------|
| `documentContent` | Binary | No | Educational |
| File metadata | JSON | No | Technical |

## Database Schema Changes

### Added Fields

```sql
-- User table additions
ALTER TABLE users ADD COLUMN phoneNumber_search VARCHAR(64);
ALTER TABLE users ADD COLUMN nationalIdNumber_search VARCHAR(64);

-- Message table additions  
ALTER TABLE messages ADD COLUMN content_search VARCHAR(64);

-- Document table additions
ALTER TABLE documents ADD COLUMN encryptionMetadata TEXT;

-- Indexes for search performance
CREATE INDEX idx_users_phone_search ON users(phoneNumber_search);
CREATE INDEX idx_users_national_id_search ON users(nationalIdNumber_search);
CREATE INDEX idx_messages_content_search ON messages(content_search);
```

## Usage Examples

### Basic Encryption/Decryption

```typescript
import { encrypt, decrypt } from '@/lib/encryption';

// Encrypt sensitive data
const phoneNumber = "+47 123 45 678";
const encrypted = encrypt(phoneNumber, 'phoneNumber', true);

// Decrypt data
const decrypted = decrypt(encrypted);
console.log(decrypted); // "+47 123 45 678"
```

### Database Operations

```typescript
import { userService } from '@/lib/encryptedServices';

// Create user with encrypted phone number
const user = await userService.createUser({
  email: "user@example.com",
  name: "John Doe",
  phoneNumber: "+47 123 45 678",
  region: "OSLO"
});

// Search by encrypted phone number
const foundUser = await userService.findUserByPhoneNumber("+47 123 45 678");
```

### File Encryption

```typescript
import { documentService } from '@/lib/encryptedServices';

// Upload encrypted document
const fileBuffer = await file.arrayBuffer();
const document = await documentService.uploadDocument(
  userId,
  Buffer.from(fileBuffer),
  {
    documentType: 'ID_VERIFICATION',
    fileName: 'passport.pdf',
    mimeType: 'application/pdf',
    fileSize: fileBuffer.byteLength
  }
);

// Download and decrypt document
const { fileBuffer: decryptedFile } = await documentService.downloadDocument(
  document.id,
  userId
);
```

## Key Management

### Initial Setup

```bash
# Generate encryption key and setup environment
node scripts/encryption-setup.js setup

# Validate existing key
node scripts/encryption-setup.js validate-key

# Show encryption status
node scripts/encryption-setup.js status
```

### Key Rotation

```typescript
import { keyManager } from '@/lib/keyManagement';

// Check if rotation is needed
const rotationNeeded = keyManager.shouldRotateKey();

// Perform key rotation
if (rotationNeeded) {
  const status = await keyManager.rotateKey();
  console.log('Rotation completed:', status);
}
```

### Environment Variables

```bash
# Primary encryption key (required)
ENCRYPTION_KEY=base64-encoded-256-bit-key

# Previous key for rotation (temporary)
ENCRYPTION_KEY_PREVIOUS=old-base64-encoded-key

# Database connection
DATABASE_URL=postgresql://...

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Security Monitoring

### Threat Detection

The encryption security middleware monitors for:

- **Excessive Decryption Failures**: More than 10 failures per 5-minute window
- **Bulk Data Access**: Unusual patterns of encrypted data access
- **Sensitive Field Enumeration**: Attempts to access multiple sensitive fields
- **Off-Hours Activity**: Encryption operations during unusual hours

### Audit Logging

All encryption operations are logged with:

```typescript
{
  timestamp: Date,
  operation: 'encrypt' | 'decrypt' | 'search',
  fieldName: string,
  userId: string,
  success: boolean,
  ip: string,
  keyVersion: number
}
```

### Alerts and Responses

Suspicious activity triggers:

1. **Immediate Logging**: Security incident recorded
2. **IP Blocking**: Temporary blocks for excessive failures
3. **Alert Generation**: Security team notifications
4. **Audit Trail**: Full activity tracking

## GDPR Compliance

### Data Subject Rights

- **Right to Access**: Encrypted data is decrypted for export
- **Right to Rectification**: Corrections are re-encrypted
- **Right to Erasure**: Secure deletion of encrypted data
- **Data Portability**: Full export includes decrypted sensitive data

### Privacy by Design

- **Data Minimization**: Only necessary fields are encrypted
- **Purpose Limitation**: Encryption keys tied to specific purposes
- **Storage Limitation**: Encrypted data follows retention policies
- **Integrity**: Authenticated encryption ensures data hasn't been tampered

## Performance Considerations

### Optimization Strategies

1. **Lazy Decryption**: Only decrypt when data is actually needed
2. **Search Hash Indexing**: Fast queries on encrypted fields via deterministic hashes
3. **Batch Operations**: Encrypt/decrypt multiple records efficiently
4. **Connection Pooling**: Reuse database connections for bulk operations

### Benchmarks

| Operation | Time (avg) | Memory |
|-----------|------------|---------|
| Encrypt field | <1ms | <1MB |
| Decrypt field | <1ms | <1MB |
| Search hash | <0.1ms | <100KB |
| File encrypt (1MB) | ~50ms | ~2MB |
| Batch process (100 records) | ~100ms | ~5MB |

## Migration Guide

### Existing Data Migration

```bash
# Migrate user phone numbers
node -e "
const { encryptedDb } = require('./src/lib/encryptedDb');
encryptedDb.migrateToEncryptedData('user', 'phoneNumber', 100);
"

# Migrate message content (sensitive messages only)
node -e "
const { encryptedDb } = require('./src/lib/encryptedDb');
encryptedDb.migrateToEncryptedData('message', 'content', 100);
"
```

### Zero-Downtime Migration

1. **Phase 1**: Deploy encryption code without enforcing
2. **Phase 2**: Encrypt new data, maintain backward compatibility
3. **Phase 3**: Migrate existing data in batches
4. **Phase 4**: Enforce encryption for all operations

## Security Best Practices

### Key Security

- ✅ Use 256-bit keys with high entropy
- ✅ Store keys in environment variables or secure key management systems
- ✅ Rotate keys every 90 days
- ✅ Never log or expose encryption keys
- ✅ Use different keys for different environments

### Operational Security

- ✅ Monitor encryption operations for anomalies
- ✅ Implement rate limiting on encryption endpoints
- ✅ Log all key operations and access attempts
- ✅ Regular security audits and penetration testing
- ✅ Incident response procedures for key compromise

### Development Security

- ✅ Use weaker settings in development (fewer PBKDF2 iterations)
- ✅ Never commit encryption keys to version control
- ✅ Test encryption/decryption in CI/CD pipeline
- ✅ Validate key strength and entropy
- ✅ Code review all encryption-related changes

## Troubleshooting

### Common Issues

**Decryption Fails**
```bash
# Check key configuration
node scripts/encryption-setup.js validate-key

# Verify environment variables
echo $ENCRYPTION_KEY | base64 -d | wc -c  # Should output 32
```

**Search Not Working**
```bash
# Verify search hashes are generated
SELECT phoneNumber_search FROM users WHERE phoneNumber IS NOT NULL LIMIT 5;

# Regenerate search hashes if needed
UPDATE users SET phoneNumber_search = NULL WHERE phoneNumber_search IS NULL;
```

**Performance Issues**
```bash
# Check database indexes
\d+ users;  -- Should show indexes on search fields

# Monitor query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE phoneNumber_search = 'hash';
```

### Emergency Procedures

**Key Compromise**
1. Generate new key immediately
2. Rotate all encrypted data
3. Revoke access for compromised period
4. Notify users if required by law
5. Document incident for audit

**Data Corruption**
1. Stop all encryption operations
2. Restore from backup if available
3. Validate data integrity
4. Re-encrypt corrupted records
5. Update monitoring to prevent recurrence

## API Integration

### REST API Usage

```typescript
// API endpoint with encryption
app.post('/api/users', async (req, res) => {
  const { phoneNumber, ...userData } = req.body;
  
  const user = await userService.createUser({
    ...userData,
    phoneNumber // Automatically encrypted by service
  });
  
  res.json(user); // Returns decrypted data
});
```

### GraphQL Integration

```typescript
// GraphQL resolver with encryption
const resolvers = {
  Mutation: {
    updateUser: async (_, { id, input }, { userId }) => {
      return await userService.updateUser(userId, input);
    }
  },
  Query: {
    searchUsersByPhone: async (_, { phoneNumber }) => {
      return await userService.findUserByPhoneNumber(phoneNumber);
    }
  }
};
```

## Monitoring and Alerting

### Key Metrics

- Encryption operations per second
- Decryption failure rate
- Key rotation status
- Search performance
- Security incidents

### Dashboard Queries

```sql
-- Daily encryption operations
SELECT DATE(created_at), COUNT(*) 
FROM security_logs 
WHERE event_type = 'ENCRYPTION_ACCESS' 
GROUP BY DATE(created_at);

-- Failed decryption attempts by IP
SELECT ip, COUNT(*) as failures
FROM security_logs 
WHERE event_type = 'DATA_BREACH_ATTEMPT'
AND timestamp > NOW() - INTERVAL '1 day'
GROUP BY ip
ORDER BY failures DESC;
```

## Compliance Documentation

### Security Controls

- **SC-28**: Protection of Information at Rest (NIST 800-53)
- **SC-8**: Transmission Confidentiality and Integrity
- **IA-7**: Cryptographic Module Authentication
- **SC-12**: Cryptographic Key Establishment and Management

### Audit Trail

All encryption operations maintain:
- User identification
- Timestamp
- Operation type
- Success/failure status
- Key version used
- IP address and user agent

This implementation provides enterprise-grade encryption while maintaining usability and performance for the TutorConnect platform.