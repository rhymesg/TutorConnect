import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  isTokenExpired,
  validateTokenStructure,
  extractTokenPayload,
  generateTokenFingerprint,
  getTokenExpiration,
  JWT_CONFIG,
} from './jwt';

// Mock environment variables
const mockEnv = {
  JWT_ACCESS_SECRET: 'test-access-secret-that-is-at-least-32-characters-long',
  JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-at-least-32-characters-long-and-different',
};

Object.assign(process.env, mockEnv);

describe('JWT Library', () => {
  const mockUserData = {
    userId: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    isActive: true,
    region: 'oslo',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', async () => {
      const token = await generateAccessToken(mockUserData);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload in access token', async () => {
      const token = await generateAccessToken(mockUserData);
      const payload = extractTokenPayload(token);
      
      expect(payload.sub).toBe(mockUserData.userId);
      expect(payload.email).toBe(mockUserData.email);
      expect(payload.name).toBe(mockUserData.name);
      expect(payload.isActive).toBe(mockUserData.isActive);
      expect(payload.region).toBe(mockUserData.region);
      expect(payload.type).toBe('access');
    });

    it('should set correct expiration time', async () => {
      const beforeTime = Math.floor(Date.now() / 1000);
      const token = await generateAccessToken(mockUserData);
      const payload = extractTokenPayload(token);
      const afterTime = Math.floor(Date.now() / 1000);
      
      expect(payload.exp).toBeGreaterThan(beforeTime + 14 * 60); // At least 14 minutes
      expect(payload.exp).toBeLessThan(afterTime + 16 * 60); // At most 16 minutes
    });
  });

  describe('generateRefreshToken', () => {
    const refreshData = {
      userId: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      version: 1,
    };

    it('should generate a valid refresh token', async () => {
      const token = await generateRefreshToken(refreshData);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload in refresh token', async () => {
      const token = await generateRefreshToken(refreshData);
      const payload = extractTokenPayload(token);
      
      expect(payload.sub).toBe(refreshData.userId);
      expect(payload.email).toBe(refreshData.email);
      expect(payload.name).toBe(refreshData.name);
      expect(payload.version).toBe(refreshData.version);
      expect(payload.type).toBe('refresh');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', async () => {
      const { accessToken, refreshToken } = await generateTokenPair(mockUserData);
      
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
      expect(accessToken).not.toBe(refreshToken);
    });

    it('should use default version for refresh token when not provided', async () => {
      const { refreshToken } = await generateTokenPair(mockUserData);
      const payload = extractTokenPayload(refreshToken);
      
      expect(payload.version).toBe(1);
    });

    it('should use provided token version', async () => {
      const { refreshToken } = await generateTokenPair({
        ...mockUserData,
        tokenVersion: 5,
      });
      const payload = extractTokenPayload(refreshToken);
      
      expect(payload.version).toBe(5);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', async () => {
      const token = await generateAccessToken(mockUserData);
      const payload = await verifyAccessToken(token);
      
      expect(payload.sub).toBe(mockUserData.userId);
      expect(payload.email).toBe(mockUserData.email);
      expect(payload.type).toBe('access');
    });

    it('should throw error for invalid token', async () => {
      await expect(verifyAccessToken('invalid-token')).rejects.toThrow('TOKEN_VERIFICATION_FAILED');
    });

    it('should throw error for malformed token', async () => {
      await expect(verifyAccessToken('not.a.token')).rejects.toThrow('TOKEN_VERIFICATION_FAILED');
    });

    it('should detect expired tokens', async () => {
      // Create a token that's already expired
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = await generateAccessToken({
        ...mockUserData,
      });
      
      // Mock the token to be expired by manipulating the payload
      const [header, , signature] = expiredToken.split('.');
      const expiredPayload = {
        ...extractTokenPayload(expiredToken),
        exp: pastTime,
      };
      const expiredPayloadBase64 = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
      const mockExpiredToken = `${header}.${expiredPayloadBase64}.${signature}`;
      
      await expect(verifyAccessToken(mockExpiredToken)).rejects.toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', async () => {
      const refreshData = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        version: 1,
      };
      
      const token = await generateRefreshToken(refreshData);
      const payload = await verifyRefreshToken(token);
      
      expect(payload.sub).toBe(refreshData.userId);
      expect(payload.email).toBe(refreshData.email);
      expect(payload.type).toBe('refresh');
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(verifyRefreshToken('invalid-token')).rejects.toThrow('REFRESH_TOKEN_VERIFICATION_FAILED');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'valid.jwt.token';
      const header = `Bearer ${token}`;
      
      expect(extractTokenFromHeader(header)).toBe(token);
    });

    it('should return null for header without Bearer prefix', () => {
      expect(extractTokenFromHeader('valid.jwt.token')).toBeNull();
    });

    it('should return null for null header', () => {
      expect(extractTokenFromHeader(null)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(extractTokenFromHeader('')).toBeNull();
    });

    it('should return null for malformed Bearer header', () => {
      expect(extractTokenFromHeader('Bearer')).toBe('');
    });
  });

  describe('generateEmailVerificationToken', () => {
    const emailData = {
      userId: 'user-123',
      email: 'test@example.com',
    };

    it('should generate a valid email verification token', async () => {
      const token = await generateEmailVerificationToken(emailData);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload', async () => {
      const token = await generateEmailVerificationToken(emailData);
      const payload = extractTokenPayload(token);
      
      expect(payload.sub).toBe(emailData.userId);
      expect(payload.email).toBe(emailData.email);
      expect(payload.type).toBe('email_verification');
      expect(payload.nonce).toBeDefined();
    });
  });

  describe('verifyEmailVerificationToken', () => {
    it('should verify a valid email verification token', async () => {
      const emailData = {
        userId: 'user-123',
        email: 'test@example.com',
      };
      
      const token = await generateEmailVerificationToken(emailData);
      const result = await verifyEmailVerificationToken(token);
      
      expect(result.userId).toBe(emailData.userId);
      expect(result.email).toBe(emailData.email);
    });

    it('should throw error for invalid email verification token', async () => {
      await expect(verifyEmailVerificationToken('invalid-token')).rejects.toThrow('INVALID_EMAIL_VERIFICATION_TOKEN');
    });
  });

  describe('generatePasswordResetToken', () => {
    const resetData = {
      userId: 'user-123',
      email: 'test@example.com',
    };

    it('should generate a valid password reset token', async () => {
      const token = await generatePasswordResetToken(resetData);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload', async () => {
      const token = await generatePasswordResetToken(resetData);
      const payload = extractTokenPayload(token);
      
      expect(payload.sub).toBe(resetData.userId);
      expect(payload.email).toBe(resetData.email);
      expect(payload.type).toBe('password_reset');
      expect(payload.nonce).toBeDefined();
    });
  });

  describe('verifyPasswordResetToken', () => {
    it('should verify a valid password reset token', async () => {
      const resetData = {
        userId: 'user-123',
        email: 'test@example.com',
      };
      
      const token = await generatePasswordResetToken(resetData);
      const result = await verifyPasswordResetToken(token);
      
      expect(result.userId).toBe(resetData.userId);
      expect(result.email).toBe(resetData.email);
    });

    it('should throw error for invalid password reset token', async () => {
      await expect(verifyPasswordResetToken('invalid-token')).rejects.toThrow('INVALID_PASSWORD_RESET_TOKEN');
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid non-expired token', async () => {
      const token = await generateAccessToken(mockUserData);
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for malformed token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
    });

    it('should return true for token with only two parts', () => {
      expect(isTokenExpired('header.payload')).toBe(true);
    });

    it('should return true for empty token', () => {
      expect(isTokenExpired('')).toBe(true);
    });

    it('should return true for expired token', () => {
      const expiredPayload = {
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };
      const expiredToken = `header.${Buffer.from(JSON.stringify(expiredPayload)).toString('base64url')}.signature`;
      
      expect(isTokenExpired(expiredToken)).toBe(true);
    });
  });

  describe('validateTokenStructure', () => {
    it('should validate correct token structure', async () => {
      const token = await generateAccessToken(mockUserData);
      const result = validateTokenStructure(token);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-string tokens', () => {
      const result = validateTokenStructure(123 as any);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token must be a non-empty string');
    });

    it('should reject empty tokens', () => {
      const result = validateTokenStructure('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token must be a non-empty string');
    });

    it('should reject tokens with wrong number of parts', () => {
      const result = validateTokenStructure('header.payload');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token must have 3 parts separated by dots');
    });

    it('should reject tokens with empty parts', () => {
      const result = validateTokenStructure('.payload.signature');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token header and payload cannot be empty');
    });

    it('should reject tokens with invalid base64url encoding', () => {
      const result = validateTokenStructure('invalid-base64.invalid-base64.signature');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid token structure');
    });
  });

  describe('extractTokenPayload', () => {
    it('should extract payload from valid token', async () => {
      const token = await generateAccessToken(mockUserData);
      const payload = extractTokenPayload(token);
      
      expect(payload).toBeDefined();
      expect(payload.sub).toBe(mockUserData.userId);
      expect(payload.email).toBe(mockUserData.email);
    });

    it('should return null for invalid token', () => {
      const payload = extractTokenPayload('invalid-token');
      expect(payload).toBeNull();
    });

    it('should return null for token with empty payload', () => {
      const payload = extractTokenPayload('header..signature');
      expect(payload).toBeNull();
    });
  });

  describe('generateTokenFingerprint', () => {
    it('should generate consistent fingerprint for same token', async () => {
      const token = await generateAccessToken(mockUserData);
      const fingerprint1 = generateTokenFingerprint(token);
      const fingerprint2 = generateTokenFingerprint(token);
      
      expect(fingerprint1).toBe(fingerprint2);
      expect(typeof fingerprint1).toBe('string');
      expect(fingerprint1.length).toBe(16);
    });

    it('should generate different fingerprints for different tokens', async () => {
      const token1 = await generateAccessToken(mockUserData);
      const token2 = await generateAccessToken({
        ...mockUserData,
        userId: 'different-user',
      });
      
      const fingerprint1 = generateTokenFingerprint(token1);
      const fingerprint2 = generateTokenFingerprint(token2);
      
      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it('should return "unknown" for invalid input', () => {
      // Mock crypto to throw error
      const originalCrypto = require('crypto');
      jest.doMock('crypto', () => ({
        createHash: () => {
          throw new Error('Crypto error');
        },
      }));
      
      const fingerprint = generateTokenFingerprint('any-token');
      expect(fingerprint).toBe('unknown');
      
      // Restore crypto
      jest.dontMock('crypto');
    });
  });

  describe('getTokenExpiration', () => {
    it('should return correct expiration date for valid token', async () => {
      const token = await generateAccessToken(mockUserData);
      const expiration = getTokenExpiration(token);
      
      expect(expiration).toBeInstanceOf(Date);
      expect(expiration!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return null for invalid token', () => {
      const expiration = getTokenExpiration('invalid-token');
      expect(expiration).toBeNull();
    });

    it('should return null for token with empty payload', () => {
      const expiration = getTokenExpiration('header..signature');
      expect(expiration).toBeNull();
    });
  });

  describe('JWT_CONFIG', () => {
    it('should have correct configuration values', () => {
      expect(JWT_CONFIG.accessToken.expiresIn).toBe('15m');
      expect(JWT_CONFIG.refreshToken.expiresIn).toBe('7d');
      expect(JWT_CONFIG.issuer).toBe('tutorconnect.no');
      expect(JWT_CONFIG.accessToken.algorithm).toBe('HS256');
      expect(JWT_CONFIG.refreshToken.algorithm).toBe('HS256');
    });
  });
});