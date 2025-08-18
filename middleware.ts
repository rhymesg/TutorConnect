import { NextRequest, NextResponse } from 'next/server';
import { 
  securityMiddleware, 
  corsMiddleware, 
  requestValidationMiddleware,
  securityLoggingMiddleware,
  extractClientIP,
  SlidingWindowRateLimit,
  securityLogger
} from './src/middleware/security';

// Rate limiters for different endpoints
const globalRateLimit = new SlidingWindowRateLimit(60 * 1000, 100); // 100 requests per minute
const authRateLimit = new SlidingWindowRateLimit(15 * 60 * 1000, 10); // 10 requests per 15 minutes
const apiRateLimit = new SlidingWindowRateLimit(60 * 1000, 50); // 50 requests per minute

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = extractClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Apply security logging first
    securityLoggingMiddleware(request);

    // Apply CORS for API routes
    if (pathname.startsWith('/api/')) {
      const corsResponse = corsMiddleware(request);
      if (corsResponse) return corsResponse;
    }

    // Apply rate limiting
    const rateLimitResponse = applyRateLimit(request, ip, pathname);
    if (rateLimitResponse) return rateLimitResponse;

    // Apply request validation for API routes
    if (pathname.startsWith('/api/')) {
      const validationResponse = requestValidationMiddleware(request);
      if (validationResponse) return validationResponse;
    }

    // Apply security headers
    const response = NextResponse.next();
    applySecurityHeaders(response, pathname);

    return response;

  } catch (error) {
    // Log security error
    securityLogger.log({
      ip,
      userAgent,
      method: request.method,
      path: pathname,
      eventType: 'SUSPICIOUS_ACTIVITY',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });

    // Return generic error response
    return NextResponse.json(
      { error: 'Security validation failed' },
      { status: 403 }
    );
  }
}

/**
 * Apply rate limiting based on route type
 */
function applyRateLimit(request: NextRequest, ip: string, pathname: string): NextResponse | null {
  let rateLimit: SlidingWindowRateLimit;
  let rateLimitKey = ip;

  // Determine which rate limiter to use
  if (pathname.startsWith('/api/auth/')) {
    rateLimit = authRateLimit;
    // For auth endpoints, also consider the endpoint type
    rateLimitKey = `${ip}:auth:${pathname}`;
  } else if (pathname.startsWith('/api/')) {
    rateLimit = apiRateLimit;
    rateLimitKey = `${ip}:api`;
  } else {
    rateLimit = globalRateLimit;
  }

  // Check if request is allowed
  if (!rateLimit.isAllowed(rateLimitKey)) {
    const remaining = rateLimit.getRemainingRequests(rateLimitKey);
    const resetTime = rateLimit.getResetTime(rateLimitKey);
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

    // Log rate limit violation
    securityLogger.log({
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      method: request.method,
      path: pathname,
      eventType: 'RATE_LIMIT',
      details: {
        rateLimitKey,
        remaining,
        retryAfter,
      },
    });

    const response = NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter,
      },
      { status: 429 }
    );

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toString());
    response.headers.set('Retry-After', retryAfter.toString());

    return response;
  }

  return null;
}

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse, pathname: string) {
  // Generate CSP nonce
  const nonce = generateNonce();

  // Base security headers
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=(self)',
      'payment=()',
      'usb=()',
      'bluetooth=()',
      'accelerometer=()',
      'gyroscope=()',
      'magnetometer=()',
      'autoplay=()',
      'fullscreen=(self)',
      'picture-in-picture=()',
    ].join(', '),
  };

  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  // Content Security Policy
  const csp = generateCSP(pathname, nonce);
  headers['Content-Security-Policy'] = csp;
  
  // Set nonce for use in components
  headers['X-CSP-Nonce'] = nonce;

  // Apply all headers
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
}

/**
 * Generate Content Security Policy based on route
 */
function generateCSP(pathname: string, nonce: string): string {
  const baseCSP = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      // Allow inline scripts only for specific development needs
      ...(process.env.NODE_ENV === 'development' ? ["'unsafe-eval'"] : []),
      // Trusted domains
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://static.cloudflareinsights.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind CSS
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      // Supabase storage
      process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : '',
    ].filter(Boolean),
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:',
    ],
    'connect-src': [
      "'self'",
      // Supabase API
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      // WebSocket connections
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', 'wss://') || '',
      // Analytics
      'https://www.google-analytics.com',
      'https://analytics.google.com',
    ].filter(Boolean),
    'worker-src': [
      "'self'",
      'blob:',
    ],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  // Add upgrade-insecure-requests for production
  if (process.env.NODE_ENV === 'production') {
    baseCSP['upgrade-insecure-requests'] = [];
  }

  return Object.entries(baseCSP)
    .map(([directive, sources]) => 
      sources.length > 0 
        ? `${directive} ${sources.join(' ')}` 
        : directive
    )
    .join('; ');
}

/**
 * Generate cryptographically secure nonce
 */
function generateNonce(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Middleware matcher configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public|manifest|icons).*)',
  ],
};