import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/jwt';
import { UnauthorizedError, TokenExpiredError, InvalidTokenError, ForbiddenError } from '@/lib/errors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
 * Authentication middleware for protecting API routes
 */
export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new UnauthorizedError('Authentication token required');
    }

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
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new ForbiddenError('Account has been deactivated');
    }

    // Update last active timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    // Attach user to request (we need to clone the request to add custom properties)
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
    if (error instanceof Error) {
      if (error.message === 'TOKEN_EXPIRED') {
        throw new TokenExpiredError();
      }
      if (error.message === 'INVALID_TOKEN' || error.message.includes('TOKEN_VERIFICATION_FAILED')) {
        throw new InvalidTokenError();
      }
    }
    
    // Re-throw known errors
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
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
 * Helper function to get user role (simplified for now)
 */
async function getUserRole(userId: string): Promise<string> {
  // For now, we'll check if the user is an admin based on email domain or a flag
  // This can be expanded with a proper role system later
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  // Simple admin check - in production, this should be a proper role system
  if (user?.email.includes('@tutorconnect.no') || user?.email.includes('@admin.')) {
    return 'admin';
  }

  return 'user';
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
  
  if (user.id !== resourceUserId) {
    // Check if user is admin
    const userRole = await getUserRole(user.id);
    if (userRole !== 'admin') {
      throw new ForbiddenError(`You can only access your own ${resourceType}`);
    }
  }
}

/**
 * Rate limiting helper for authentication endpoints
 */
export class AuthRateLimiter {
  private static attempts = new Map<string, { count: number; resetTime: number }>();

  static getKey(ip: string, email?: string): string {
    return email ? `${ip}:${email}` : ip;
  }

  static isRateLimited(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

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

  static recordAttempt(key: string, windowMs: number = 15 * 60 * 1000): void {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else {
      attempt.count++;
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
}

/**
 * Get client IP address
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  if (xRealIp) {
    return xRealIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to request IP (may not be accurate behind proxies)
  return request.ip || '127.0.0.1';
}