# ADR-003: API Architecture Design for TutorConnect

**Date**: 2025-08-18  
**Status**: Accepted  
**Author**: tutorconnect-architect  
**Task**: ARCH-002

## Context

TutorConnect requires a comprehensive REST API architecture to support:
- User authentication and profile management
- Post creation and search functionality
- Real-time chat and messaging
- Appointment booking and management
- File uploads and document verification
- Norwegian-specific features (regions, GDPR compliance)

## Decision

### 1. API Architecture Overview

**Base URL Structure**:
```
Production: https://api.tutorconnect.no/v1
Development: http://localhost:3000/api/v1
```

**API Versioning Strategy**:
- URL path versioning (/v1, /v2)
- Maintain backward compatibility for 12 months
- Deprecation headers for outdated endpoints

### 2. Core API Endpoints

#### 2.1 Authentication & Authorization
```
POST   /auth/register              - User registration
POST   /auth/login                 - User login
POST   /auth/logout                - User logout
POST   /auth/refresh               - Refresh access token
POST   /auth/verify-email          - Email verification
POST   /auth/forgot-password       - Password reset request
POST   /auth/reset-password        - Password reset confirmation
GET    /auth/me                    - Get current user profile
```

#### 2.2 User Management
```
GET    /users                      - List users (with filters)
GET    /users/:id                  - Get user profile
PATCH  /users/:id                  - Update user profile
DELETE /users/:id                  - Delete user account
POST   /users/:id/info-request     - Request private information
PATCH  /users/:id/info-request/:requestId - Respond to info request
GET    /users/:id/posts            - Get user's posts
GET    /users/:id/documents        - Get user's documents
```

#### 2.3 Posts Management
```
GET    /posts                      - List posts (with filters/search)
POST   /posts                      - Create new post
GET    /posts/:id                  - Get post details
PATCH  /posts/:id                  - Update post
DELETE /posts/:id                  - Delete post
POST   /posts/:id/chat             - Initiate chat about post
```

#### 2.4 Chat & Messaging
```
GET    /chats                      - List user's chats
POST   /chats                      - Create new chat
GET    /chats/:id                  - Get chat details
PATCH  /chats/:id                  - Update chat settings
DELETE /chats/:id                  - Leave/delete chat
GET    /chats/:id/messages         - Get chat messages (paginated)
POST   /chats/:id/messages         - Send message
PATCH  /chats/:id/messages/:msgId  - Edit message
DELETE /chats/:id/messages/:msgId  - Delete message
POST   /chats/:id/read             - Mark messages as read
```

#### 2.5 Appointments
```
GET    /appointments               - List user's appointments
POST   /appointments               - Create appointment
GET    /appointments/:id           - Get appointment details
PATCH  /appointments/:id           - Update appointment
DELETE /appointments/:id           - Cancel appointment
POST   /appointments/:id/confirm   - Confirm attendance
POST   /appointments/:id/complete  - Mark as completed
```

#### 2.6 File Management
```
POST   /files/upload               - Upload file to storage
DELETE /files/:id                  - Delete file
GET    /files/:id                  - Get file metadata
POST   /documents                  - Upload document for verification
GET    /documents                  - List user documents
PATCH  /documents/:id              - Update document status
DELETE /documents/:id              - Delete document
```

#### 2.7 System Endpoints
```
GET    /health                     - Health check
GET    /version                    - API version info
GET    /regions                    - Norwegian regions list
GET    /subjects                   - Available subjects
GET    /metadata                   - System metadata
```

### 3. Authentication Flow

#### 3.1 Registration Flow
```
1. POST /auth/register
   - Validate email format and Norwegian postal code
   - Hash password using bcrypt
   - Create user record with emailVerified: null
   - Generate verification token
   - Send verification email
   - Return user ID and email (no sensitive data)

2. POST /auth/verify-email
   - Validate token
   - Update emailVerified timestamp
   - Return JWT access token
```

#### 3.2 Login Flow
```
1. POST /auth/login
   - Validate email/password
   - Check if email is verified
   - Generate JWT access token (15 minutes)
   - Generate refresh token (7 days)
   - Update lastActive timestamp
   - Return tokens and user profile
```

#### 3.3 Token Refresh Flow
```
POST /auth/refresh
- Validate refresh token
- Generate new access token
- Optionally rotate refresh token
- Return new tokens
```

### 4. Authorization Patterns

#### 4.1 JWT Token Structure
```javascript
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "user", // or "admin"
  "verified": true,
  "iat": 1692345600,
  "exp": 1692346500,
  "iss": "tutorconnect.no"
}
```

#### 4.2 Authorization Middleware
```javascript
// Role-based access control
const requireAuth = (roles = ['user']) => {
  // JWT validation
  // Role verification
  // Rate limiting
  // GDPR compliance checks
}
```

#### 4.3 Resource-based Authorization
- Users can only access their own data
- Chat participants can access chat messages
- Post authors can modify their posts
- Document owners control access rights

### 5. Real-time Communication Architecture

#### 5.1 WebSocket Implementation
```
Connection: wss://api.tutorconnect.no/ws
Authentication: JWT in connection params
```

#### 5.2 Real-time Events
```javascript
// Chat messages
{
  type: "chat_message",
  event: "INSERT",
  payload: { id, content, senderId, chatId, sentAt }
}

// Appointment updates
{
  type: "appointment",
  event: "UPDATE",
  payload: { id, status, dateTime, chatId }
}

// User status changes
{
  type: "user_status",
  event: "UPDATE",
  payload: { userId, isActive, lastActive }
}
```

#### 5.3 Supabase Real-time Integration
```javascript
// Channel subscription for chat messages
const channel = supabase
  .channel('chat_messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: 'chat_id=in.(user_chat_ids)'
  }, handleNewMessage)
```

### 6. Error Handling Standards

#### 6.1 Standard Error Response
```javascript
{
  success: false,
  message: "Human-readable error message",
  code: "ERROR_CODE",
  statusCode: 400,
  errors: {
    "field_name": ["Validation error message"]
  },
  meta: {
    timestamp: "2025-08-18T10:30:00Z",
    requestId: "req_123456",
    path: "/api/v1/posts"
  }
}
```

#### 6.2 HTTP Status Code Usage
```
200 - OK (successful GET, PATCH)
201 - Created (successful POST)
204 - No Content (successful DELETE)
400 - Bad Request (validation errors)
401 - Unauthorized (authentication required)
403 - Forbidden (insufficient permissions)
404 - Not Found (resource doesn't exist)
409 - Conflict (duplicate resource)
422 - Unprocessable Entity (business logic error)
429 - Too Many Requests (rate limiting)
500 - Internal Server Error (unexpected errors)
```

#### 6.3 Norwegian-specific Error Messages
```javascript
const errorMessages = {
  no: {
    EMAIL_INVALID: "Ugyldig e-postadresse",
    POSTAL_CODE_INVALID: "Ugyldig postnummer",
    REGION_REQUIRED: "Fylke er påkrevd"
  },
  en: {
    EMAIL_INVALID: "Invalid email address",
    POSTAL_CODE_INVALID: "Invalid postal code",
    REGION_REQUIRED: "Region is required"
  }
}
```

### 7. Security Patterns

#### 7.1 Input Validation
```javascript
// Zod schema validation for all endpoints
const createPostSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(2000),
  subject: z.enum(["MATHEMATICS", "ENGLISH", ...]),
  region: z.enum(["OSLO", "BERGEN", ...]),
  hourlyRate: z.number().min(50).max(2000).optional()
})
```

#### 7.2 Rate Limiting
```javascript
const rateLimits = {
  "/auth/login": { max: 5, window: 900 }, // 5 attempts per 15 minutes
  "/auth/register": { max: 3, window: 3600 }, // 3 per hour
  "/posts": { max: 100, window: 3600 }, // 100 per hour
  "/chats/*/messages": { max: 60, window: 60 } // 60 per minute
}
```

#### 7.3 GDPR Compliance
```javascript
// Data access logging
const logDataAccess = {
  userId: "accessing_user_id",
  targetUserId: "data_subject_id",
  dataType: "profile_data",
  purpose: "tutoring_connection",
  timestamp: new Date(),
  legalBasis: "consent"
}

// Data export endpoint
GET /users/:id/data-export
// Data deletion endpoint
DELETE /users/:id/gdpr-delete
```

### 8. Performance Optimizations

#### 8.1 Caching Strategy
```javascript
// Redis caching for frequently accessed data
const cacheRules = {
  "GET /posts": { ttl: 300, tags: ["posts"] },
  "GET /users/:id": { ttl: 600, tags: ["user"] },
  "GET /regions": { ttl: 86400, tags: ["static"] }
}
```

#### 8.2 Database Query Optimization
```javascript
// Indexed queries for Norwegian regions
const postsQuery = {
  where: {
    location: region,
    isActive: true,
    type: postType
  },
  include: {
    user: {
      select: { id: true, name: true, region: true }
    }
  },
  orderBy: { createdAt: 'desc' }
}
```

#### 8.3 File Upload Optimization
```javascript
// Supabase Storage integration
const uploadConfig = {
  maxFileSize: "10MB",
  allowedTypes: ["image/*", "application/pdf"],
  bucket: "tutorconnect-documents",
  publicAccess: false
}
```

### 9. API Documentation Structure

#### 9.1 OpenAPI Specification
```yaml
openapi: 3.0.0
info:
  title: TutorConnect API
  version: 1.0.0
  description: Norwegian tutoring platform API
servers:
  - url: https://api.tutorconnect.no/v1
    description: Production server
  - url: http://localhost:3000/api/v1
    description: Development server
```

#### 9.2 Interactive Documentation
- Swagger UI for API exploration
- Norwegian language support
- Code examples in TypeScript
- Authentication flow demos

## Implementation Plan

### Phase 1: Core Authentication & Users
- User registration/login endpoints
- JWT token management
- Basic profile management
- Email verification system

### Phase 2: Posts & Search
- Post CRUD operations
- Norwegian region filtering
- Subject-based search
- Price range filtering

### Phase 3: Chat & Real-time
- Chat creation and messaging
- Supabase real-time integration
- WebSocket implementation
- Message history pagination

### Phase 4: Appointments & Files
- Appointment booking system
- File upload to Supabase Storage
- Document verification workflow
- Calendar integration

### Phase 5: Advanced Features
- Info request system
- Advanced search filters
- Analytics and metrics
- GDPR compliance tools

## Alternative Approaches Considered

1. **GraphQL vs REST**: Chose REST for simpler caching and broader client support
2. **Server-Sent Events vs WebSockets**: Using both - SSE for notifications, WS for chat
3. **Custom Auth vs Auth0**: Custom implementation for Norwegian compliance requirements
4. **MongoDB vs PostgreSQL**: PostgreSQL for complex relationships and ACID compliance

## Norwegian Market Considerations

1. **Language Support**: Error messages and responses in Norwegian/English
2. **Regional Filtering**: Efficient filtering by Norwegian regions
3. **GDPR Compliance**: Built-in data protection and user rights
4. **Payment Integration**: Prepared for Vipps integration
5. **Postal Code Validation**: Norwegian postal code format validation

This architecture provides a scalable, secure, and performance-optimized foundation for TutorConnect's Norwegian market requirements.