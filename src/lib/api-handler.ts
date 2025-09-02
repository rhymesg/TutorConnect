/**
 * API Handler utilities for TutorConnect
 * Provides standardized request/response handling, validation, and error management
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { 
  APIError, 
  ValidationError,
  RateLimitError,
  handleZodError, 
  createErrorResponse,
  getLocalizedErrorMessage 
} from './errors';
import { authMiddleware, optionalAuthMiddleware, type AuthenticatedRequest } from '@/middleware/auth';
import { getClientIP, AuthRateLimiter } from '@/middleware/auth';

/**
 * API Route Handler Options
 */
export interface APIHandlerOptions {
  requireAuth?: boolean;
  optionalAuth?: boolean;
  validation?: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
  };
  rateLimit?: {
    maxAttempts: number;
    windowMs: number;
    keyGenerator?: (req: NextRequest) => string;
  };
  cors?: {
    origin?: string | string[];
    methods?: string[];
    allowedHeaders?: string[];
  };
  language?: 'en' | 'no';
  permissions?: string[];
}

/**
 * API Handler Context
 */
export interface APIContext {
  user?: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    region: string;
    emailVerified: boolean;
  };
  validatedData?: {
    body?: any;
    query?: any;
    params?: any;
  };
  ip: string;
  language: 'en' | 'no';
  requestId: string;
}

/**
 * API Route Handler Function Type
 */
export type APIHandler = (
  request: NextRequest,
  context: APIContext,
  params?: any
) => Promise<NextResponse>;

/**
 * Create standardized API route handler
 */
export function createAPIHandler(
  handler: APIHandler,
  options: APIHandlerOptions = {}
) {
  return async (request: NextRequest, routeParams?: any) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const ip = getClientIP(request);
    const language = options.language || 'en';

    try {
      // Apply CORS if configured
      if (options.cors) {
        const corsResponse = applyCORS(request, options.cors);
        if (corsResponse) return corsResponse;
      }

      // Apply rate limiting if configured
      if (options.rateLimit) {
        await applyRateLimit(request, options.rateLimit, ip);
      }

      // Apply authentication
      let user;
      if (options.requireAuth) {
        await authMiddleware(request);
        user = (request as AuthenticatedRequest).user;
      } else if (options.optionalAuth) {
        await optionalAuthMiddleware(request);
        user = (request as AuthenticatedRequest).user;
      }

      // Validate request data
      const validatedData = await validateRequest(request, options.validation, routeParams);

      // Create context
      const context: APIContext = {
        user,
        validatedData,
        ip,
        language,
        requestId,
      };

      // Log request
      logAPIRequest(request, context, startTime);

      // Execute handler
      const response = await handler(request, context, routeParams);

      // Log successful response
      const duration = Date.now() - startTime;
      // console.log(`API Success: ${request.method} ${request.url} - ${duration}ms - ${response.status}`);

      // Add standard headers
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Response-Time', `${duration}ms`);

      return response;

    } catch (error) {
      return handleAPIError(error, request, requestId, language, startTime);
    }
  };
}

/**
 * Apply CORS headers
 */
function applyCORS(request: NextRequest, corsOptions: NonNullable<APIHandlerOptions['cors']>): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    
    response.headers.set('Access-Control-Allow-Origin', 
      Array.isArray(corsOptions.origin) ? corsOptions.origin.join(',') : corsOptions.origin || '*'
    );
    response.headers.set('Access-Control-Allow-Methods', 
      corsOptions.methods?.join(',') || 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    );
    response.headers.set('Access-Control-Allow-Headers', 
      corsOptions.allowedHeaders?.join(',') || 'Content-Type,Authorization'
    );
    response.headers.set('Access-Control-Max-Age', '86400');
    
    return response;
  }
  return null;
}

/**
 * Apply rate limiting
 */
async function applyRateLimit(
  request: NextRequest,
  rateLimitOptions: NonNullable<APIHandlerOptions['rateLimit']>,
  ip: string
): Promise<void> {
  const key = rateLimitOptions.keyGenerator 
    ? rateLimitOptions.keyGenerator(request)
    : ip;

  if (AuthRateLimiter.isRateLimited(key, rateLimitOptions.maxAttempts, rateLimitOptions.windowMs)) {
    const remainingTime = AuthRateLimiter.getRemainingTime(key);
    throw new RateLimitError(Math.ceil(remainingTime / 1000));
  }

  AuthRateLimiter.recordAttempt(key, rateLimitOptions.windowMs);
}

/**
 * Validate request data using Zod schemas
 */
async function validateRequest(
  request: NextRequest,
  validation?: APIHandlerOptions['validation'],
  routeParams?: any
): Promise<{ body?: any; query?: any; params?: any }> {
  const validatedData: { body?: any; query?: any; params?: any } = {};

  if (validation?.body) {
    try {
      const body = await request.json();
      validatedData.body = validation.body.parse(body);
    } catch (error) {
      throw handleZodError(error);
    }
  }

  if (validation?.query) {
    try {
      const { searchParams } = new URL(request.url);
      const queryObject: Record<string, any> = {};
      
      // Handle query parameters, including arrays for duplicate keys
      for (const [key, value] of searchParams.entries()) {
        if (queryObject[key]) {
          // If key already exists, convert to array or add to existing array
          if (Array.isArray(queryObject[key])) {
            queryObject[key].push(value);
          } else {
            queryObject[key] = [queryObject[key], value];
          }
        } else {
          // Check if there are multiple values for this key
          const allValues = searchParams.getAll(key);
          if (allValues.length > 1) {
            queryObject[key] = allValues;
          } else {
            queryObject[key] = value;
          }
        }
      }
      
      validatedData.query = validation.query.parse(queryObject);
    } catch (error) {
      throw handleZodError(error);
    }
  }

  if (validation?.params && routeParams) {
    try {
      validatedData.params = validation.params.parse(routeParams.params || routeParams);
    } catch (error) {
      throw handleZodError(error);
    }
  }

  return validatedData;
}

/**
 * Handle API errors with standardized formatting
 */
function handleAPIError(
  error: any,
  request: NextRequest,
  requestId: string,
  language: 'en' | 'no',
  startTime: number
): NextResponse {
  const duration = Date.now() - startTime;
  
  // Log error
  console.error(`API Error: ${request.method} ${request.url} - ${duration}ms`, {
    error: error.message,
    stack: error.stack,
    requestId,
  });

  // Handle specific error types
  if (error instanceof APIError) {
    const response = NextResponse.json(
      createErrorResponse(error, language, requestId),
      { status: error.statusCode }
    );

    if (error instanceof RateLimitError) {
      response.headers.set('Retry-After', error.retryAfter.toString());
      response.headers.set('X-RateLimit-Remaining', '0');
    }

    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Response-Time', `${duration}ms`);
    return response;
  }

  // Handle Zod validation errors
  if (error && error.name === 'ZodError') {
    const validationError = handleZodError(error);
    const response = NextResponse.json(
      createErrorResponse(validationError, language, requestId),
      { status: validationError.statusCode }
    );
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Response-Time', `${duration}ms`);
    return response;
  }

  // Generic error
  const genericError = new APIError('Internal server error', 500, 'INTERNAL_ERROR');
  const response = NextResponse.json(
    createErrorResponse(genericError, language, requestId),
    { status: 500 }
  );
  response.headers.set('X-Request-ID', requestId);
  response.headers.set('X-Response-Time', `${duration}ms`);
  return response;
}

/**
 * Create success response helper
 */
export function createSuccessResponse(
  data: any,
  message?: string,
  meta?: any,
  status: number = 200
): NextResponse {
  return NextResponse.json({
    success: true,
    message,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    }
  }, { status });
}

/**
 * Create paginated response helper
 */
export function createPaginatedResponse(
  data: any[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  },
  message?: string,
  meta?: any
): NextResponse {
  return NextResponse.json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: pagination.page,
      perPage: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.hasNext,
      hasPrev: pagination.hasPrev,
    },
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    }
  });
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log API request
 */
function logAPIRequest(request: NextRequest, context: APIContext, startTime: number): void {
  // console.log(`API Request: ${request.method} ${request.url}`, {
  //   ip: context.ip,
  //   userId: context.user?.id,
  //   requestId: context.requestId,
  //   userAgent: request.headers.get('user-agent'),
  //   timestamp: new Date().toISOString(),
  // });
}

/**
 * Pagination helpers
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10')));
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

  return { page, limit, sortBy, sortOrder };
}

export function calculatePagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const skip = (page - 1) * limit;

  return {
    skip,
    take: limit,
    hasNext,
    hasPrev,
    totalPages,
  };
}

/**
 * File upload helpers
 */
export interface FileValidationOptions {
  maxSize: number;
  allowedTypes: string[];
  maxFiles?: number;
}

export function validateUploadedFile(file: File, options: FileValidationOptions): void {
  if (!file) {
    throw new ValidationError({ file: ['No file provided'] });
  }

  if (file.size > options.maxSize) {
    throw new ValidationError({
      file: [`File size exceeds maximum of ${options.maxSize / (1024 * 1024)}MB`]
    });
  }

  if (!options.allowedTypes.includes(file.type)) {
    throw new ValidationError({
      file: [`Invalid file type. Allowed types: ${options.allowedTypes.join(', ')}`]
    });
  }
}

/**
 * Search and filtering helpers
 */
export interface SearchParams {
  q?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function parseSearchParams(searchParams: URLSearchParams): SearchParams {
  const q = searchParams.get('q') || undefined;
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
  
  const filters: Record<string, any> = {};
  for (const [key, value] of searchParams.entries()) {
    if (!['q', 'sortBy', 'sortOrder', 'page', 'limit'].includes(key)) {
      filters[key] = value;
    }
  }

  return { q, filters, sortBy, sortOrder };
}

/**
 * Response caching helpers
 */
export function addCacheHeaders(response: NextResponse, maxAge: number = 300): NextResponse {
  response.headers.set('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}`);
  response.headers.set('ETag', `"${Date.now()}"`);
  return response;
}

export function addNoCacheHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}
// Simple API handler alias
export const apiHandler = createAPIHandler;
