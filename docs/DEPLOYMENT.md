# TutorConnect Deployment Guide

## Encryption Setup (SEC-002)

### Initial Setup

Before deploying TutorConnect, you must configure encryption for sensitive data protection.

#### 1. Generate Encryption Key

```bash
# Generate a new encryption key
npm run encryption:generate-key

# Or use the setup wizard
npm run encryption:setup
```

#### 2. Environment Configuration

Add the encryption key to your environment variables:

```bash
# .env.local (for local development)
ENCRYPTION_KEY=your-base64-encoded-256-bit-key

# Production deployment
# Set this in your hosting platform's environment variables
```

#### 3. Validate Configuration

```bash
# Check encryption configuration
npm run encryption:validate

# View current status
npm run encryption:status
```

### Database Migration

If you have existing data, migrate it to encrypted format:

```bash
# Run database migrations first
npm run db:migrate

# Migrate existing data to encrypted format
npm run encryption:migrate
```

### Security Validation

Run the encryption test suite to ensure everything is working:

```bash
# Run encryption-specific tests
npm run test:encryption

# Run full security test suite
npm run test
```

## Deployment Platforms

### Vercel (Recommended)

1. **Environment Variables**: Set in Vercel dashboard
   ```bash
   ENCRYPTION_KEY=your-generated-key
   ADMIN_API_KEY=your-admin-key
   # ... other required variables
   ```

2. **Database**: Use Supabase or another PostgreSQL provider

3. **Build Settings**:
   ```bash
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm ci
   ```

### Production Security Checklist

- [ ] Encryption key is properly generated and stored
- [ ] Admin API key is set for secure operations  
- [ ] All environment variables are properly configured
- [ ] Database connection is secure (SSL enabled)
- [ ] Rate limiting is configured
- [ ] Security headers are applied
- [ ] GDPR compliance measures are in place
- [ ] Monitoring and logging are configured

### Key Rotation in Production

```bash
# Check if key rotation is needed
npm run encryption:status

# Perform key rotation (requires admin access)
npm run encryption:rotate

# Clean up old keys after rotation
npm run encryption:cleanup
```

### Monitoring

The encryption system includes built-in security monitoring:

- Failed decryption attempts
- Unusual access patterns
- Key rotation status
- Performance metrics

Access monitoring data via the security dashboard or API endpoints.

### Troubleshooting

**Decryption Failures**
1. Verify encryption key is correctly set
2. Check database connection
3. Validate encrypted data integrity
4. Review security logs for suspicious activity

**Performance Issues**
1. Check database indexes on search fields
2. Monitor encryption operation metrics
3. Consider key rotation if needed
4. Review batch operation efficiency

**Security Incidents**
1. Check security logs for anomalies
2. Validate key integrity
3. Consider immediate key rotation if compromised
4. Follow incident response procedures