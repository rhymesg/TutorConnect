import { SignJWT, jwtVerify } from 'jose';
import type { AccessTokenPayload, RefreshTokenPayload } from '@/types/auth';

// Environment variables validation
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets are not configured. Check JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables.');
}

// Security validation for JWT secrets
if (JWT_ACCESS_SECRET.length < 32) {
  throw new Error('JWT_ACCESS_SECRET must be at least 32 characters long for security.');
}

if (JWT_REFRESH_SECRET.length < 32) {
  throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long for security.');
}

if (JWT_ACCESS_SECRET === JWT_REFRESH_SECRET) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.');
}

// Convert secrets to Uint8Array for jose library
const accessSecretKey = new TextEncoder().encode(JWT_ACCESS_SECRET);
const refreshSecretKey = new TextEncoder().encode(JWT_REFRESH_SECRET);

// JWT Configuration
export const JWT_CONFIG = {
  accessToken: {
    expiresIn: '2h', // 2 hours
    algorithm: 'HS256' as const,
  },
  refreshToken: {
    expiresIn: '7d', // 7 days
    algorithm: 'HS256' as const,
  },
  issuer: 'tutorconnect.no',
} as const;

/**
 * Generate access token with user data
 */
export async function generateAccessToken(payload: {
  userId: string;
  email: string;
  name: string;
  isActive: boolean;
  region: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (2 * 60 * 60); // 2 hours from now

  const tokenPayload: AccessTokenPayload = {
    sub: payload.userId,
    email: payload.email,
    name: payload.name,
    isActive: payload.isActive,
    region: payload.region,
    type: 'access',
    iat: now,
    exp: exp,
  };

  return await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: JWT_CONFIG.accessToken.algorithm })
    .setIssuer(JWT_CONFIG.issuer)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(accessSecretKey);
}

/**
 * Generate refresh token with minimal data
 */
export async function generateRefreshToken(payload: {
  userId: string;
  email: string;
  name: string;
  version: number;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (7 * 24 * 60 * 60); // 7 days from now

  const tokenPayload: RefreshTokenPayload = {
    sub: payload.userId,
    email: payload.email,
    name: payload.name,
    version: payload.version,
    type: 'refresh',
    iat: now,
    exp: exp,
  };

  return await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: JWT_CONFIG.refreshToken.algorithm })
    .setIssuer(JWT_CONFIG.issuer)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(refreshSecretKey);
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(userData: {
  userId: string;
  email: string;
  name: string;
  isActive: boolean;
  region: string;
  tokenVersion?: number;
}) {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken({
      userId: userData.userId,
      email: userData.email,
      name: userData.name,
      isActive: userData.isActive,
      region: userData.region,
    }),
    generateRefreshToken({
      userId: userData.userId,
      email: userData.email,
      name: userData.name,
      version: userData.tokenVersion || 1,
    }),
  ]);

  return { accessToken, refreshToken };
}

/**
 * Verify access token
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, accessSecretKey, {
      issuer: JWT_CONFIG.issuer,
    });

    // Validate payload structure
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.name !== 'string' ||
      typeof payload.isActive !== 'boolean' ||
      typeof payload.region !== 'string' ||
      payload.type !== 'access'
    ) {
      throw new Error('Invalid token payload structure');
    }

    return payload as AccessTokenPayload;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        throw new Error('TOKEN_EXPIRED');
      }
      if (error.message.includes('invalid')) {
        throw new Error('INVALID_TOKEN');
      }
    }
    throw new Error('TOKEN_VERIFICATION_FAILED');
  }
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, refreshSecretKey, {
      issuer: JWT_CONFIG.issuer,
    });

    // Validate payload structure
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.name !== 'string' ||
      typeof payload.version !== 'number' ||
      payload.type !== 'refresh'
    ) {
      throw new Error('Invalid refresh token payload structure');
    }

    return payload as RefreshTokenPayload;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        throw new Error('REFRESH_TOKEN_EXPIRED');
      }
      if (error.message.includes('invalid')) {
        throw new Error('INVALID_REFRESH_TOKEN');
      }
    }
    throw new Error('REFRESH_TOKEN_VERIFICATION_FAILED');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove "Bearer " prefix
}

/**
 * Generate email verification token (shorter-lived)
 */
export async function generateEmailVerificationToken(payload: {
  userId: string;
  email: string;
  nonce?: string; // Optional nonce for single-use tokens
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (24 * 60 * 60); // 24 hours from now

  const tokenPayload = {
    sub: payload.userId,
    email: payload.email,
    type: 'email_verification',
    iat: now,
    exp: exp,
    nonce: payload.nonce || generateNonce(),
  };

  return await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: JWT_CONFIG.accessToken.algorithm })
    .setIssuer(JWT_CONFIG.issuer)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(accessSecretKey);
}

/**
 * Verify email verification token
 */
export async function verifyEmailVerificationToken(token: string): Promise<{
  userId: string;
  email: string;
}> {
  try {
    const { payload } = await jwtVerify(token, accessSecretKey, {
      issuer: JWT_CONFIG.issuer,
    });

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      payload.type !== 'email_verification'
    ) {
      throw new Error('Invalid email verification token payload');
    }

    return {
      userId: payload.sub,
      email: payload.email as string,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        throw new Error('EMAIL_VERIFICATION_TOKEN_EXPIRED');
      }
    }
    throw new Error('INVALID_EMAIL_VERIFICATION_TOKEN');
  }
}

/**
 * Generate password reset token (shorter-lived)
 */
export async function generatePasswordResetToken(payload: {
  userId: string;
  email: string;
  nonce?: string; // Optional nonce for single-use tokens
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (60 * 60); // 1 hour from now

  const tokenPayload = {
    sub: payload.userId,
    email: payload.email,
    type: 'password_reset',
    iat: now,
    exp: exp,
    nonce: payload.nonce || generateNonce(),
  };

  return await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: JWT_CONFIG.accessToken.algorithm })
    .setIssuer(JWT_CONFIG.issuer)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(accessSecretKey);
}

/**
 * Generate cryptographically secure nonce
 */
function generateNonce(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<{
  userId: string;
  email: string;
}> {
  try {
    const { payload } = await jwtVerify(token, accessSecretKey, {
      issuer: JWT_CONFIG.issuer,
    });

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      payload.type !== 'password_reset'
    ) {
      throw new Error('Invalid password reset token payload');
    }

    return {
      userId: payload.sub,
      email: payload.email as string,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        throw new Error('PASSWORD_RESET_TOKEN_EXPIRED');
      }
    }
    throw new Error('INVALID_PASSWORD_RESET_TOKEN');
  }
}

/**
 * Check if token is expired without throwing
 */
export function isTokenExpired(token: string): boolean {
  try {
    // Validate token format
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const [, payloadBase64] = parts;
    if (!payloadBase64) return true;

    const payload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    );

    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true;
  }
}

/**
 * Validate JWT token structure without verification
 */
export function validateTokenStructure(token: string): { isValid: boolean; error?: string } {
  try {
    if (typeof token !== 'string' || !token) {
      return { isValid: false, error: 'Token must be a non-empty string' };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, error: 'Token must have 3 parts separated by dots' };
    }

    const [header, payload] = parts;
    if (!header || !payload) {
      return { isValid: false, error: 'Token header and payload cannot be empty' };
    }

    // Try to decode base64url parts
    JSON.parse(Buffer.from(header, 'base64url').toString('utf-8'));
    JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid token structure' };
  }
}

/**
 * Extract token payload without verification (for debugging only)
 */
export function extractTokenPayload(token: string): any {
  try {
    const [, payloadBase64] = token.split('.');
    if (!payloadBase64) return null;

    return JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    );
  } catch {
    return null;
  }
}

/**
 * Generate secure token fingerprint for logging (non-reversible)
 */
export function generateTokenFingerprint(token: string): string {
  try {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
  } catch {
    return 'unknown';
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const [, payloadBase64] = token.split('.');
    if (!payloadBase64) return null;

    const payload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    );

    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
}
// Alias for compatibility
export const verifyJWT = verifyAccessToken;
