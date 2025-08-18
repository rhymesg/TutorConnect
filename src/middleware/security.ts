import { NextRequest, NextResponse } from 'next/server';
import { APIError } from '@/lib/errors';

/**
 * Security headers configuration
 */
const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // XSS Protection (legacy but still useful)
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy (feature policy)
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
  
  // HSTS (for production HTTPS)
  ...(process.env.NODE_ENV === 'production' ? {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  } : {}),
  
  // CSP will be set dynamically based on route
} as const;

/**
 * Content Security Policy configuration
 */
export function getCSPHeader(nonce?: string): string {
  const baseCSP = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-eval'", // Required for Next.js development
      nonce ? `'nonce-${nonce}'` : '',
      // Trusted domains for analytics/monitoring
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://static.cloudflareinsights.com',
    ].filter(Boolean),
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
      // WebSocket connections for realtime
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
    'upgrade-insecure-requests': [], // Enable for HTTPS
  };

  return Object.entries(baseCSP)
    .map(([directive, sources]) => 
      sources.length > 0 
        ? `${directive} ${sources.join(' ')}` 
        : directive
    )
    .join('; ');
}

/**
 * Security middleware to apply security headers
 */
export function securityMiddleware(request: NextRequest): NextResponse | null {
  // Generate CSP nonce for inline scripts
  const nonce = generateNonce();
  
  // Apply security headers to response
  const response = NextResponse.next();
  
  // Set all security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Set Content Security Policy
  response.headers.set('Content-Security-Policy', getCSPHeader(nonce));
  
  // Store nonce for use in components if needed
  response.headers.set('X-CSP-Nonce', nonce);
  
  return null; // Continue processing
}

/**
 * CORS middleware for API routes
 */
export function corsMiddleware(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://tutorconnect.no',
    'https://www.tutorconnect.no',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : [])
  ];

  // Check if it's a preflight request
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-CSRF-Token',
      'X-API-Key',
    ].join(', '));
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    
    return response;
  }

  // For actual requests, just set CORS headers
  if (origin && allowedOrigins.includes(origin)) {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    return response;
  }

  return null; // Continue processing
}

/**
 * Request validation middleware
 */
export function requestValidationMiddleware(request: NextRequest): NextResponse | null {
  // Validate Content-Type for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type');
    
    if (!contentType) {
      return NextResponse.json(
        { error: 'Content-Type header is required' },
        { status: 400 }
      );
    }
    
    // Allow JSON and form data
    const allowedContentTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
    ];
    
    if (!allowedContentTypes.some(type => contentType.includes(type))) {
      return NextResponse.json(
        { error: 'Unsupported Content-Type. Use application/json or multipart/form-data' },
        { status: 415 }
      );
    }
  }

  // Validate request size (basic check)
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    
    if (size > maxSize) {
      return NextResponse.json(
        { error: 'Request payload too large' },
        { status: 413 }
      );
    }
  }

  return null; // Continue processing
}

/**
 * API key validation middleware (for admin routes)
 */
export function apiKeyMiddleware(request: NextRequest): NextResponse | null {
  const apiKey = request.headers.get('x-api-key');
  const expectedApiKey = process.env.ADMIN_API_KEY;

  if (!expectedApiKey) {
    return null; // Skip if no API key configured
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    return NextResponse.json(
      { error: 'Valid API key required' },
      { status: 401 }
    );
  }

  return null; // Continue processing
}

/**
 * Generate cryptographically secure nonce
 */
function generateNonce(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('base64');
}

/**
 * IP address extraction and validation
 */
export function extractClientIP(request: NextRequest): string {
  // Check various headers for the real IP (in order of preference)
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'x-client-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded',
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // Handle comma-separated IPs (take the first one)
      const ip = value.split(',')[0].trim();
      if (isValidIP(ip)) {
        return ip;
      }
    }
  }

  // Fallback to request IP
  return request.ip || '127.0.0.1';
}

/**
 * Validate IP address format
 */
function isValidIP(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Advanced rate limiting with sliding window
 */
export class SlidingWindowRateLimit {
  private windows = new Map<string, number[]>();
  private readonly windowSize: number;
  private readonly maxRequests: number;

  constructor(windowSizeMs: number, maxRequests: number) {
    this.windowSize = windowSizeMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const window = this.windows.get(key) || [];
    
    // Remove expired timestamps
    const validTimestamps = window.filter(timestamp => 
      now - timestamp < this.windowSize
    );
    
    // Update window
    this.windows.set(key, validTimestamps);
    
    // Check if request is allowed
    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }
    
    // Add current timestamp
    validTimestamps.push(now);
    this.windows.set(key, validTimestamps);
    
    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const window = this.windows.get(key) || [];
    const validTimestamps = window.filter(timestamp => 
      now - timestamp < this.windowSize
    );
    
    return Math.max(0, this.maxRequests - validTimestamps.length);
  }

  getResetTime(key: string): number {
    const window = this.windows.get(key) || [];
    if (window.length === 0) return 0;
    
    const oldestTimestamp = Math.min(...window);
    return oldestTimestamp + this.windowSize;
  }
}

/**
 * Security audit logging
 */
export interface SecurityLogEntry {
  timestamp: Date;
  ip: string;
  userAgent: string;
  method: string;
  path: string;
  statusCode?: number;
  userId?: string;
  eventType: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'RATE_LIMIT' | 'SUSPICIOUS_ACTIVITY' | 'API_ACCESS';
  details?: Record<string, any>;
}

class SecurityLogger {
  private logs: SecurityLogEntry[] = [];
  private readonly maxLogs = 10000; // Keep last 10k logs in memory

  log(entry: Omit<SecurityLogEntry, 'timestamp'>): void {
    const logEntry: SecurityLogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLogService(logEntry);
    }

    console.log('SECURITY_LOG:', JSON.stringify(logEntry));
  }

  private sendToLogService(entry: SecurityLogEntry): void {
    // Implementation for external logging service
    // (DataDog, Splunk, AWS CloudWatch, etc.)
  }

  getLogs(filters?: {
    startDate?: Date;
    endDate?: Date;
    eventType?: SecurityLogEntry['eventType'];
    userId?: string;
    ip?: string;
  }): SecurityLogEntry[] {
    let filteredLogs = this.logs;

    if (filters) {
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
      }
      if (filters.eventType) {
        filteredLogs = filteredLogs.filter(log => log.eventType === filters.eventType);
      }
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      if (filters.ip) {
        filteredLogs = filteredLogs.filter(log => log.ip === filters.ip);
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const securityLogger = new SecurityLogger();

/**
 * Middleware to log security events
 */
export function securityLoggingMiddleware(request: NextRequest): NextResponse | null {
  const ip = extractClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Log API access
  securityLogger.log({
    ip,
    userAgent,
    method: request.method,
    path: request.nextUrl.pathname,
    eventType: 'API_ACCESS',
  });

  return null; // Continue processing
}