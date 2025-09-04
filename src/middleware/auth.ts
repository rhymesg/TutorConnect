import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader, validateTokenStructure, generateTokenFingerprint } from '@/lib/jwt';
import { UnauthorizedError, TokenExpiredError, InvalidTokenError, ForbiddenError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { securityLogger } from './security';
import { extractClientIP } from './security';

/**
 * Extended request interface with user data
 */
export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    region: string;
    emailVerified: boolean;
  };
}

/**
 * Enhanced authentication middleware for protecting API routes
 */
export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const ip = extractClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  let tokenFingerprint: string | undefined;

  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      securityLogger.log({
        ip,
        userAgent,
        method: request.method,
        path: request.nextUrl.pathname,
        eventType: 'AUTH_FAILURE',
        details: { reason: 'No token provided' },
      });
      throw new UnauthorizedError('Authentication token required');
    }

    // Validate token structure first (fast check)
    const structureValidation = validateTokenStructure(token);
    if (!structureValidation.isValid) {
      securityLogger.log({
        ip,
        userAgent,
        method: request.method,
        path: request.nextUrl.pathname,
        eventType: 'AUTH_FAILURE',
        details: { reason: 'Invalid token structure', error: structureValidation.error },
      });
      throw new InvalidTokenError();
    }

    tokenFingerprint = generateTokenFingerprint(token);

    // Verify the token
    const payload = await verifyAccessToken(token);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        region: true,
        emailVerified: true,
        lastActive: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      securityLogger.log({
        ip,
        userAgent,
        method: request.method,
        path: request.nextUrl.pathname,
        eventType: 'AUTH_FAILURE',
        details: { reason: 'User not found', tokenFingerprint },
      });
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      securityLogger.log({
        ip,
        userAgent,
        method: request.method,
        path: request.nextUrl.pathname,
        eventType: 'AUTH_FAILURE',
        userId: user.id,
        details: { reason: 'Account deactivated', tokenFingerprint },
      });
      throw new ForbiddenError('Account has been deactivated');
    }

    // Check if account is temporarily locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      securityLogger.log({
        ip,
        userAgent,
        method: request.method,
        path: request.nextUrl.pathname,
        eventType: 'AUTH_FAILURE',
        userId: user.id,
        details: { reason: 'Account temporarily locked', lockedUntil: user.lockedUntil, tokenFingerprint },
      });
      throw new ForbiddenError(`Account is temporarily locked until ${user.lockedUntil.toISOString()}`);
    }

    // Detect suspicious activity (rapid requests from different IPs)
    const timeSinceLastActive = user.lastActive ? Date.now() - user.lastActive.getTime() : Infinity;
    if (user.lastActive && timeSinceLastActive < 1000) { // Less than 1 second
      // This could indicate token sharing or brute force
      securityLogger.log({
        ip,
        userAgent,
        method: request.method,
        path: request.nextUrl.pathname,
        eventType: 'SUSPICIOUS_ACTIVITY',
        userId: user.id,
        details: { reason: 'Rapid consecutive requests', timeSinceLastActive, tokenFingerprint },
      });
    }

    // Update last active timestamp and reset failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastActive: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Log successful authentication
    securityLogger.log({
      ip,
      userAgent,
      method: request.method,
      path: request.nextUrl.pathname,
      eventType: 'AUTH_SUCCESS',
      userId: user.id,
      details: { tokenFingerprint },
    });

    // Attach user to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      region: user.region,
      emailVerified: !!user.emailVerified,
    };

    return null; // Continue to next middleware/handler
  } catch (error) {
    // Log authentication failure
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (!(error instanceof UnauthorizedError || error instanceof ForbiddenError || error instanceof InvalidTokenError || error instanceof TokenExpiredError)) {
      securityLogger.log({
        ip,
        userAgent,
        method: request.method,
        path: request.nextUrl.pathname,
        eventType: 'AUTH_FAILURE',
        details: { reason: 'Authentication error', error: errorMessage, tokenFingerprint },
      });
    }

    if (error instanceof Error) {
      if (error.message === 'TOKEN_EXPIRED') {
        throw new TokenExpiredError();
      }
      if (error.message === 'INVALID_TOKEN' || error.message.includes('TOKEN_VERIFICATION_FAILED')) {
        throw new InvalidTokenError();
      }
    }
    
    // Re-throw known errors
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError || error instanceof TokenExpiredError || error instanceof InvalidTokenError) {
      throw error;
    }

    // Generic authentication error
    throw new UnauthorizedError('Authentication failed');
  }
}

/**
 * Optional authentication middleware - does not throw if token is missing
 */
export async function optionalAuthMiddleware(request: NextRequest): Promise<NextResponse | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return null; // No token provided, continue without authentication
    }

    // If token is provided, verify it
    return await authMiddleware(request);
  } catch (error) {
    // If authentication fails with optional auth, just continue without user
    return null;
  }
}

/**
 * Require email verification middleware
 */
export function requireEmailVerification(request: AuthenticatedRequest): NextResponse | null {
  if (!request.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (!request.user.emailVerified) {
    throw new ForbiddenError('Email verification required');
  }

  return null;
}

/**
 * Role-based authorization middleware
 */
export function requireRole(roles: string[] = ['user']) {
  return async (request: AuthenticatedRequest): Promise<NextResponse | null> => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // For now, we'll implement a simple user/admin system
    // In the future, this can be expanded with proper role-based access control
    const userRole = await getUserRole(request.user.id);
    
    if (!roles.includes(userRole)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    return null;
  };
}

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Helper function to get user role (enhanced security)
 */
async function getUserRole(userId: string): Promise<string> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        email: true,
        isActive: true,
        emailVerified: true,
        // Add role field when implementing proper RBAC
        // role: true,
      },
    });

    if (!user || !user.isActive || !user.emailVerified) {
      return 'none';
    }

    // Enhanced admin check with multiple criteria
    const adminDomains = ['@tutorconnect.no', '@admin.tutorconnect.no'];
    const isAdminEmail = adminDomains.some(domain => user.email.includes(domain));
    
    // In production, replace with proper role-based access control
    if (isAdminEmail) {
      // Additional security check for admin users
      const adminUser = await prisma.user.findFirst({
        where: {
          id: userId,
          email: { in: process.env.ADMIN_EMAILS?.split(',') || [] },
        },
      });
      
      if (adminUser) {
        return 'admin';
      }
    }

    return 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user'; // Default to user role on error
  }
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware(...middlewares: Array<(req: AuthenticatedRequest) => Promise<NextResponse | null> | NextResponse | null>) {
  return async (request: AuthenticatedRequest): Promise<NextResponse | null> => {
    for (const middleware of middlewares) {
      const result = await middleware(request);
      if (result) {
        return result; // If middleware returns a response, stop execution
      }
    }
    return null;
  };
}

/**
 * Extract user from authenticated request
 */
export function getAuthenticatedUser(request: AuthenticatedRequest) {
  if (!request.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  return request.user;
}

/**
 * Check if current user owns a resource
 */
export async function requireResourceOwnership(
  request: AuthenticatedRequest,
  resourceUserId: string,
  resourceType: string = 'resource'
): Promise<void> {
  const user = getAuthenticatedUser(request);
  const ip = extractClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  if (user.id !== resourceUserId) {
    // Check if user is admin
    const userRole = await getUserRole(user.id);
    if (userRole !== 'admin') {
      // Log unauthorized access attempt
      securityLogger.log({
        ip,
        userAgent,
        method: request.method,
        path: request.nextUrl.pathname,
        eventType: 'SUSPICIOUS_ACTIVITY',
        userId: user.id,
        details: {
          reason: 'Unauthorized resource access attempt',
          resourceType,
          targetUserId: resourceUserId,
        },
      });
      
      throw new ForbiddenError(`You can only access your own ${resourceType}`);
    }
  }
}

/**
 * Enhanced rate limiting helper for authentication endpoints
 */
export class AuthRateLimiter {
  private static attempts = new Map<string, { count: number; resetTime: number; suspiciousActivity?: boolean }>();
  private static blacklistedIPs = new Set<string>();

  static getKey(ip: string, email?: string): string {
    return email ? `${ip}:${email}` : ip;
  }

  static isRateLimited(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    // Check if IP is blacklisted
    const ip = key.split(':')[0];
    if (this.blacklistedIPs.has(ip)) {
      return true;
    }

    if (!attempt) {
      return false;
    }

    // Reset if window has passed
    if (now > attempt.resetTime) {
      this.attempts.delete(key);
      return false;
    }

    return attempt.count >= maxAttempts;
  }

  static recordAttempt(key: string, windowMs: number = 15 * 60 * 1000, suspicious: boolean = false): void {
    const now = Date.now();
    const attempt = this.attempts.get(key);
    const ip = key.split(':')[0];

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, {
        count: 1,
        resetTime: now + windowMs,
        suspiciousActivity: suspicious,
      });
    } else {
      attempt.count++;
      if (suspicious) {
        attempt.suspiciousActivity = true;
      }
    }

    // Blacklist IP if too many suspicious attempts
    const currentAttempt = this.attempts.get(key);
    if (currentAttempt && currentAttempt.count >= 20) {
      this.blacklistedIPs.add(ip);
      
      // Remove from blacklist after 24 hours
      setTimeout(() => {
        this.blacklistedIPs.delete(ip);
      }, 24 * 60 * 60 * 1000);
    }
  }

  static getRemainingTime(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return 0;
    
    return Math.max(0, attempt.resetTime - Date.now());
  }

  static clearAttempts(key: string): void {
    this.attempts.delete(key);
  }

  static isBlacklisted(ip: string): boolean {
    return this.blacklistedIPs.has(ip);
  }

  static getAttemptInfo(key: string): { count: number; suspicious: boolean } | null {
    const attempt = this.attempts.get(key);
    if (!attempt) return null;
    
    return {
      count: attempt.count,
      suspicious: attempt.suspiciousActivity || false,
    };
  }
}

/**
 * Get client IP address (deprecated - use extractClientIP from security middleware)
 */
export function getClientIP(request: NextRequest): string {
  return extractClientIP(request);
}

/**
 * Validate session security
 */
export async function validateSessionSecurity(
  request: NextRequest,
  userId: string
): Promise<{ valid: boolean; reason?: string }> {
  const ip = extractClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const currentTime = new Date();

  try {
    // Get recent session data
    const recentSessions = await prisma.userSession.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Check for suspicious patterns
    if (recentSessions.length > 0) {
      const latestSession = recentSessions[0];
      
      // Check for rapid IP changes
      const uniqueIPs = new Set(recentSessions.map(s => s.ipAddress));
      if (uniqueIPs.size > 5) {
        return { valid: false, reason: 'Too many different IP addresses' };
      }

      // Check for unusual user agent changes
      const uniqueUserAgents = new Set(recentSessions.map(s => s.userAgent));
      if (uniqueUserAgents.size > 3) {
        return { valid: false, reason: 'Too many different user agents' };
      }

      // Check for geographic anomalies (simplified)
      // In production, you'd use a GeoIP service
      if (latestSession.ipAddress !== ip) {
        // Log IP change for monitoring
        securityLogger.log({
          ip,
          userAgent,
          method: request.method,
          path: request.nextUrl.pathname,
          eventType: 'SUSPICIOUS_ACTIVITY',
          userId,
          details: {
            reason: 'IP address change',
            previousIP: latestSession.ipAddress,
            newIP: ip,
          },
        });
      }
    }

    // Create/update session record
    await prisma.userSession.upsert({
      where: {
        userId_ipAddress: {
          userId,
          ipAddress: ip,
        },
      },
      update: {
        userAgent,
        lastActivity: currentTime,
        requestCount: {
          increment: 1,
        },
      },
      create: {
        userId,
        ipAddress: ip,
        userAgent,
        createdAt: currentTime,
        lastActivity: currentTime,
        requestCount: 1,
      },
    });

    return { valid: true };
  } catch (error) {
    console.error('Session validation error:', error);
    return { valid: true }; // Default to allowing access to avoid breaking functionality
  }
}