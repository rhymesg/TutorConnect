# TutorConnect API Implementation Specifications

**Date**: 2025-08-18  
**Version**: 1.0.0  
**Author**: tutorconnect-architect  
**Task**: ARCH-002

## Overview

This document provides detailed implementation specifications for TutorConnect's REST API, building upon ADR-003. It includes endpoint specifications, middleware configurations, and Norwegian-specific requirements.

## 1. API Middleware Stack

### 1.1 Next.js API Route Middleware Order
```typescript
// /src/middleware/api.ts
export const apiMiddleware = [
  corsMiddleware,        // CORS headers
  helmetMiddleware,      // Security headers
  rateLimitMiddleware,   // Rate limiting
  authMiddleware,        // JWT validation
  validationMiddleware,  // Input validation
  auditMiddleware,      // GDPR audit logging
  errorMiddleware       // Error handling
]
```

### 1.2 CORS Configuration
```typescript
// /src/middleware/cors.ts
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tutorconnect.no', 'https://www.tutorconnect.no']
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept-Language',
    'X-CSRF-Token'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
}
```

### 1.3 Security Headers Configuration
```typescript
// /src/middleware/helmet.ts
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://supabase.co", "https://*.supabase.co"],
      connectSrc: ["'self'", "wss://tutorconnect.no", "https://*.supabase.co"],
      frameSrc: ["'none'"],
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}
```

## 2. Authentication Implementation

### 2.1 JWT Configuration
```typescript
// /src/lib/jwt.ts
const JWT_CONFIG = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '15m',
    algorithm: 'HS256'
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
    algorithm: 'HS256'
  }
}

interface JWTPayload {
  sub: string;      // user ID
  email: string;
  role: 'user' | 'admin';
  verified: boolean;
  iat: number;
  exp: number;
  iss: 'tutorconnect.no';
}
```

### 2.2 Authentication Middleware
```typescript
// /src/middleware/auth.ts
export async function authMiddleware(req: NextRequest, res: NextResponse) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return unauthorizedResponse('Token required');
  }

  try {
    const payload = jwt.verify(token, JWT_CONFIG.accessToken.secret) as JWTPayload;
    
    // Attach user to request
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      verified: payload.verified
    };

    return NextResponse.next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return unauthorizedResponse('Token expired');
    }
    return unauthorizedResponse('Invalid token');
  }
}
```

### 2.3 Role-based Authorization
```typescript
// /src/middleware/rbac.ts
export function requireRole(roles: string[] = ['user']) {
  return (req: AuthenticatedRequest, res: NextResponse) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return forbiddenResponse('Insufficient permissions');
    }
    return NextResponse.next();
  };
}

export function requireVerifiedEmail(req: AuthenticatedRequest, res: NextResponse) {
  if (!req.user?.verified) {
    return forbiddenResponse('Email verification required');
  }
  return NextResponse.next();
}
```

## 3. Input Validation Schemas

### 3.1 User Validation Schemas
```typescript
// /src/schemas/user.ts
import { z } from 'zod';

const norwegianPostalCodeRegex = /^\d{4}$/;
const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const registerUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordStrengthRegex, 'Password must contain uppercase, lowercase, number, and special character'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  region: z.enum(Object.values(NorwegianRegion), {
    errorMap: () => ({ message: 'Valid Norwegian region required' })
  }),
  postalCode: z.string()
    .regex(norwegianPostalCodeRegex, 'Norwegian postal code must be 4 digits')
    .optional(),
  gender: z.enum(['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY']).optional(),
  birthYear: z.number()
    .min(1930, 'Invalid birth year')
    .max(new Date().getFullYear(), 'Birth year cannot be in the future')
    .optional()
});

export const updateUserSchema = registerUserSchema
  .omit({ email: true, password: true })
  .partial()
  .extend({
    school: z.string().max(200).optional(),
    degree: z.string().max(200).optional(),
    certifications: z.string().max(1000).optional(),
    bio: z.string().max(2000).optional(),
    privacyGender: z.enum(['PUBLIC', 'ON_REQUEST', 'PRIVATE']).optional(),
    privacyAge: z.enum(['PUBLIC', 'ON_REQUEST', 'PRIVATE']).optional(),
    privacyDocuments: z.enum(['PUBLIC', 'ON_REQUEST', 'PRIVATE']).optional(),
    privacyContact: z.enum(['PUBLIC', 'ON_REQUEST', 'PRIVATE']).optional()
  });
```

### 3.2 Post Validation Schemas
```typescript
// /src/schemas/post.ts
export const createPostSchema = z.object({
  type: z.enum(['TEACHER', 'STUDENT'], {
    errorMap: () => ({ message: 'Post type must be TEACHER or STUDENT' })
  }),
  subject: z.enum(Object.values(Subject), {
    errorMap: () => ({ message: 'Valid subject required' })
  }),
  ageGroups: z.array(z.enum(Object.values(AgeGroup)))
    .min(1, 'At least one age group required')
    .max(4, 'Maximum 4 age groups allowed'),
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  availableDays: z.array(z.enum([
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
  ])).min(1, 'At least one available day required'),
  availableTimes: z.array(z.string()).min(1, 'At least one time slot required'),
  preferredSchedule: z.string().max(500).optional(),
  location: z.enum(Object.values(NorwegianRegion)),
  specificLocation: z.string().max(200).optional(),
  hourlyRate: z.number().min(50).max(2000).optional(),
  hourlyRateMin: z.number().min(50).max(2000).optional(),
  hourlyRateMax: z.number().min(50).max(2000).optional()
}).refine(
  data => {
    if (data.hourlyRateMin && data.hourlyRateMax) {
      return data.hourlyRateMin <= data.hourlyRateMax;
    }
    return true;
  },
  { message: 'Minimum rate cannot be higher than maximum rate' }
);
```

### 3.3 Chat and Message Validation
```typescript
// /src/schemas/chat.ts
export const createChatSchema = z.object({
  relatedPostId: z.string().cuid().optional(),
  participantIds: z.array(z.string().cuid())
    .min(1, 'At least one participant required')
    .max(10, 'Maximum 10 participants allowed'),
  initialMessage: z.string().max(1000).optional()
});

export const createMessageSchema = z.object({
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters'),
  type: z.enum(['TEXT', 'APPOINTMENT_REQUEST', 'APPOINTMENT_RESPONSE', 'SYSTEM_MESSAGE'])
    .default('TEXT'),
  appointmentId: z.string().cuid().optional()
});
```

## 4. Error Handling Implementation

### 4.1 Custom Error Classes
```typescript
// /src/lib/errors.ts
export class APIError extends Error {
  statusCode: number;
  code: string;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}

export class ValidationError extends APIError {
  constructor(errors: Record<string, string[]>) {
    super('Validation failed', 422, 'VALIDATION_ERROR', errors);
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends APIError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class RateLimitError extends APIError {
  retryAfter: number;

  constructor(retryAfter: number = 60) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}
```

### 4.2 Error Handler Middleware
```typescript
// /src/middleware/error-handler.ts
export async function errorHandler(
  error: Error,
  req: NextRequest,
  res: NextResponse
) {
  const requestId = req.headers.get('x-request-id') || generateRequestId();
  
  // Log error with context
  console.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    request: {
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers),
      user: req.user?.id
    },
    requestId
  });

  if (error instanceof APIError) {
    return NextResponse.json({
      success: false,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      errors: error.errors,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        path: req.nextUrl.pathname
      }
    }, { status: error.statusCode });
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    return handlePrismaError(error, requestId);
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    return handleZodError(error, requestId);
  }

  // Generic error
  return NextResponse.json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
      path: req.nextUrl.pathname
    }
  }, { status: 500 });
}
```

## 5. Real-time Communication Implementation

### 5.1 WebSocket Handler Setup
```typescript
// /src/app/api/ws/route.ts
import { WebSocketHandler } from '@/lib/websocket';

const wsHandler = new WebSocketHandler();

export async function GET(request: NextRequest) {
  if (!request.headers.get('upgrade')?.includes('websocket')) {
    return new Response('WebSocket upgrade required', { status: 426 });
  }

  const { socket, response } = Deno.upgradeWebSocket(request);
  await wsHandler.handleConnection(socket, request);
  
  return response;
}
```

### 5.2 WebSocket Handler Implementation
```typescript
// /src/lib/websocket.ts
export class WebSocketHandler {
  private connections = new Map<string, WebSocket>();
  private userSockets = new Map<string, Set<string>>();

  async handleConnection(socket: WebSocket, request: NextRequest) {
    const token = new URL(request.url).searchParams.get('token');
    
    try {
      const user = await this.authenticateWebSocket(token);
      const connectionId = generateConnectionId();
      
      this.connections.set(connectionId, socket);
      
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)?.add(connectionId);

      socket.addEventListener('message', (event) => {
        this.handleMessage(user, connectionId, event.data);
      });

      socket.addEventListener('close', () => {
        this.handleDisconnection(user.id, connectionId);
      });

      // Send connection confirmation
      this.sendToSocket(connectionId, {
        type: 'connection_confirmed',
        payload: { userId: user.id, connectionId }
      });

    } catch (error) {
      socket.close(1008, 'Authentication failed');
    }
  }

  private async handleMessage(user: any, connectionId: string, data: string) {
    try {
      const message = JSON.parse(data) as WebSocketMessage;
      
      switch (message.type) {
        case 'join_chat':
          await this.handleJoinChat(user, message.payload);
          break;
        case 'leave_chat':
          await this.handleLeaveChat(user, message.payload);
          break;
        case 'typing_start':
          await this.handleTypingStatus(user, message.payload, true);
          break;
        case 'typing_stop':
          await this.handleTypingStatus(user, message.payload, false);
          break;
        default:
          this.sendError(connectionId, 'Unknown message type');
      }
    } catch (error) {
      this.sendError(connectionId, 'Invalid message format');
    }
  }

  public broadcastToChat(chatId: string, message: RealtimeEvent, excludeUserId?: string) {
    // Get chat participants
    // Send message to all connected users in chat
    // Exclude sender if specified
  }

  public sendToUser(userId: string, message: RealtimeEvent) {
    const userConnections = this.userSockets.get(userId);
    if (userConnections) {
      userConnections.forEach(connectionId => {
        this.sendToSocket(connectionId, message);
      });
    }
  }
}
```

### 5.3 Supabase Real-time Integration
```typescript
// /src/lib/realtime.ts
export class RealtimeManager {
  private supabase: SupabaseClient;
  private wsHandler: WebSocketHandler;

  constructor(supabase: SupabaseClient, wsHandler: WebSocketHandler) {
    this.supabase = supabase;
    this.wsHandler = wsHandler;
    this.setupRealtimeSubscriptions();
  }

  private setupRealtimeSubscriptions() {
    // Subscribe to message changes
    this.supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        this.handleMessageInsert(payload.new);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public', 
        table: 'messages'
      }, (payload) => {
        this.handleMessageUpdate(payload.new);
      })
      .subscribe();

    // Subscribe to appointment changes
    this.supabase
      .channel('appointments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments'
      }, (payload) => {
        this.handleAppointmentChange(payload);
      })
      .subscribe();

    // Subscribe to user status changes
    this.supabase
      .channel('user_status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: 'last_active=neq.null'
      }, (payload) => {
        this.handleUserStatusChange(payload.new);
      })
      .subscribe();
  }

  private handleMessageInsert(message: any) {
    const event: ChatMessageEvent = {
      type: 'chat_message',
      event: 'INSERT',
      payload: {
        id: message.id,
        content: message.content,
        senderId: message.sender_id,
        chatId: message.chat_id,
        sentAt: message.sent_at,
        type: message.type
      },
      timestamp: new Date().toISOString(),
      chatId: message.chat_id
    };

    this.wsHandler.broadcastToChat(message.chat_id, event, message.sender_id);
  }

  private handleAppointmentChange(payload: any) {
    const event: AppointmentEvent = {
      type: 'appointment',
      event: payload.eventType,
      payload: {
        id: payload.new.id,
        chatId: payload.new.chat_id,
        dateTime: payload.new.date_time,
        status: payload.new.status,
        createdAt: payload.new.created_at
      },
      timestamp: new Date().toISOString(),
      chatId: payload.new.chat_id
    };

    this.wsHandler.broadcastToChat(payload.new.chat_id, event);
  }
}
```

## 6. Rate Limiting Implementation

### 6.1 Redis-based Rate Limiting
```typescript
// /src/middleware/rate-limit.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

interface RateLimitRule {
  max: number;
  window: number; // seconds
  keyGenerator: (req: NextRequest) => string;
}

const rateLimitRules: Record<string, RateLimitRule> = {
  '/api/v1/auth/login': {
    max: 5,
    window: 900, // 15 minutes
    keyGenerator: (req) => `login:${getClientIP(req)}`
  },
  '/api/v1/auth/register': {
    max: 3,
    window: 3600, // 1 hour
    keyGenerator: (req) => `register:${getClientIP(req)}`
  },
  '/api/v1/posts': {
    max: 100,
    window: 3600, // 1 hour
    keyGenerator: (req) => `posts:${req.user?.id || getClientIP(req)}`
  },
  '/api/v1/chats/*/messages': {
    max: 60,
    window: 60, // 1 minute
    keyGenerator: (req) => `messages:${req.user?.id}`
  }
};

export async function rateLimitMiddleware(
  req: NextRequest,
  res: NextResponse
): Promise<NextResponse | null> {
  const rule = findMatchingRule(req.nextUrl.pathname);
  
  if (!rule) {
    return null; // No rate limiting for this endpoint
  }

  const key = rule.keyGenerator(req);
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, rule.window);
  }

  const ttl = await redis.ttl(key);
  
  // Add rate limit headers
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', rule.max.toString());
  headers.set('X-RateLimit-Remaining', Math.max(0, rule.max - current).toString());
  headers.set('X-RateLimit-Reset', (Date.now() + (ttl * 1000)).toString());

  if (current > rule.max) {
    headers.set('Retry-After', ttl.toString());
    
    return NextResponse.json({
      success: false,
      message: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      retryAfter: ttl,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers.get('x-request-id'),
        path: req.nextUrl.pathname
      }
    }, { status: 429, headers });
  }

  // Add headers to successful response
  return NextResponse.next({ headers });
}
```

## 7. GDPR Compliance Implementation

### 7.1 Audit Logging
```typescript
// /src/middleware/audit.ts
export interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  dataAccessed?: string[];
  legalBasis: 'consent' | 'contract' | 'legitimate_interest';
  purpose: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

export async function auditMiddleware(
  req: NextRequest,
  res: NextResponse
): Promise<NextResponse | null> {
  if (!req.user) {
    return null; // No audit for unauthenticated requests
  }

  const auditData: Partial<AuditLog> = {
    userId: req.user.id,
    action: req.method,
    resource: req.nextUrl.pathname,
    timestamp: new Date(),
    ipAddress: getClientIP(req),
    userAgent: req.headers.get('user-agent') || 'unknown'
  };

  // Determine what data is being accessed
  if (req.method === 'GET' && req.nextUrl.pathname.includes('/users/')) {
    auditData.dataAccessed = ['profile_data', 'contact_info'];
    auditData.legalBasis = 'legitimate_interest';
    auditData.purpose = 'tutoring_platform_service';
  }

  // Store audit log
  await prisma.auditLog.create({
    data: auditData as AuditLog
  });

  return null;
}
```

### 7.2 Data Export Endpoint
```typescript
// /src/app/api/v1/users/[id]/data-export/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const user = await requireAuth(req);
  
  // Users can only export their own data
  if (user.id !== params.id && user.role !== 'admin') {
    throw new ForbiddenError('Can only export your own data');
  }

  const userData = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      posts: true,
      sentMessages: true,
      chatParticipants: {
        include: { chat: true }
      },
      documents: true,
      sentInfoRequests: true,
      receivedInfoRequests: true
    }
  });

  if (!userData) {
    throw new NotFoundError('User');
  }

  const exportData = {
    personalData: {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      region: userData.region,
      postalCode: userData.postalCode,
      gender: userData.gender,
      birthYear: userData.birthYear,
      profileImage: userData.profileImage,
      school: userData.school,
      degree: userData.degree,
      certifications: userData.certifications,
      bio: userData.bio,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    },
    privacySettings: {
      privacyGender: userData.privacyGender,
      privacyAge: userData.privacyAge,
      privacyDocuments: userData.privacyDocuments,
      privacyContact: userData.privacyContact
    },
    posts: userData.posts,
    messages: userData.sentMessages,
    chats: userData.chatParticipants,
    documents: userData.documents.map(doc => ({
      ...doc,
      fileUrl: '[REDACTED - Contact support to access files]'
    })),
    infoRequests: {
      sent: userData.sentInfoRequests,
      received: userData.receivedInfoRequests
    },
    exportDate: new Date().toISOString(),
    dataRetentionPolicy: 'Data is retained as long as your account is active or as required by law',
    rights: {
      rectification: 'You can update your data through the profile settings',
      erasure: 'You can request account deletion through the settings or by contacting support',
      portability: 'This export provides all your data in a structured format',
      objection: 'You can object to data processing by contacting our support team'
    }
  };

  // Log the data export
  await logAuditEvent({
    userId: user.id,
    action: 'DATA_EXPORT',
    resource: 'user_data',
    resourceId: params.id,
    legalBasis: 'gdpr_compliance',
    purpose: 'data_portability_request'
  });

  return NextResponse.json({
    success: true,
    data: exportData,
    message: 'User data exported successfully'
  });
}
```

## 8. Norwegian-specific Features

### 8.1 Postal Code Validation Service
```typescript
// /src/services/norwegian-postal.ts
interface PostalCodeInfo {
  postalCode: string;
  city: string;
  municipality: string;
  county: string;
  region: NorwegianRegion;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export class NorwegianPostalService {
  private static postalCodes: Map<string, PostalCodeInfo> = new Map();

  static async validatePostalCode(postalCode: string): Promise<PostalCodeInfo | null> {
    if (!postalCode.match(/^\d{4}$/)) {
      return null;
    }

    // Check cache first
    if (this.postalCodes.has(postalCode)) {
      return this.postalCodes.get(postalCode)!;
    }

    // Fetch from Norwegian postal service API or local database
    const postalInfo = await this.fetchPostalCodeInfo(postalCode);
    
    if (postalInfo) {
      this.postalCodes.set(postalCode, postalInfo);
    }

    return postalInfo;
  }

  private static async fetchPostalCodeInfo(postalCode: string): Promise<PostalCodeInfo | null> {
    // Implementation would fetch from Norwegian postal code database
    // For now, return mock data structure
    return {
      postalCode,
      city: 'Oslo',
      municipality: 'Oslo',
      county: 'Oslo',
      region: NorwegianRegion.OSLO
    };
  }

  static getRegionFromPostalCode(postalCode: string): NorwegianRegion | null {
    const code = parseInt(postalCode);
    
    // Norwegian postal code region mapping
    if (code >= 0000 && code <= 1299) return NorwegianRegion.OSLO;
    if (code >= 1300 && code <= 1999) return NorwegianRegion.AKERSHUS;
    if (code >= 2000 && code <= 2999) return NorwegianRegion.OESTFOLD;
    if (code >= 3000 && code <= 3999) return NorwegianRegion.BUSKERUD;
    if (code >= 4000 && code <= 4999) return NorwegianRegion.VESTFOLD;
    if (code >= 5000 && code <= 5999) return NorwegianRegion.BERGEN;
    // ... additional mappings
    
    return null;
  }
}
```

### 8.2 Norwegian Language Support
```typescript
// /src/services/localization.ts
export interface LocalizedErrorMessages {
  no: Record<string, string>;
  en: Record<string, string>;
}

export const errorMessages: LocalizedErrorMessages = {
  no: {
    'VALIDATION_ERROR': 'Valideringsfeil',
    'EMAIL_INVALID': 'Ugyldig e-postadresse',
    'POSTAL_CODE_INVALID': 'Ugyldig postnummer',
    'REGION_REQUIRED': 'Fylke er påkrevd',
    'PASSWORD_WEAK': 'Passordet er for svakt',
    'EMAIL_ALREADY_EXISTS': 'E-postadressen er allerede registrert',
    'NOT_FOUND': 'Ressursen ble ikke funnet',
    'UNAUTHORIZED': 'Du må logge inn for å få tilgang',
    'FORBIDDEN': 'Du har ikke tilgang til denne ressursen',
    'RATE_LIMIT_EXCEEDED': 'For mange forespørsler. Prøv igjen senere.',
  },
  en: {
    'VALIDATION_ERROR': 'Validation error',
    'EMAIL_INVALID': 'Invalid email address',
    'POSTAL_CODE_INVALID': 'Invalid postal code',
    'REGION_REQUIRED': 'Region is required',
    'PASSWORD_WEAK': 'Password is too weak',
    'EMAIL_ALREADY_EXISTS': 'Email address already registered',
    'NOT_FOUND': 'Resource not found',
    'UNAUTHORIZED': 'Authentication required',
    'FORBIDDEN': 'Access denied',
    'RATE_LIMIT_EXCEEDED': 'Too many requests. Please try again later.',
  }
};

export function getLocalizedErrorMessage(
  code: string,
  language: 'no' | 'en' = 'no'
): string {
  return errorMessages[language][code] || errorMessages.en[code] || 'Unknown error';
}
```

This comprehensive implementation specification provides the development team with detailed guidance for implementing the TutorConnect API according to Norwegian market requirements and modern web standards.