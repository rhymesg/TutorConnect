# Backend Agent Requirements

## Role and Responsibilities
Next.js API Routes-based backend development, database integration, real-time chat, authentication/authorization system implementation

## Technology Stack
**Note: Always use latest stable versions**

- **Framework**: Next.js API Routes
- **ORM**: Prisma
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (jose library) + Supabase Auth
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Email**: Resend or Supabase Auth
- **Validation**: Zod

## API Design Requirements

### 1. Authentication and User Management API

#### `/api/auth/*` - JWT Authentication Based
- **POST /api/auth/register**
  ```typescript
  interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    region: string; // postal code, city
    gender?: 'male' | 'female' | 'not_specified';
    birth_year?: number;
    profile_image?: File;
  }
  ```

- **POST /api/auth/verify-email**
  ```typescript
  interface VerifyEmailRequest {
    token: string;
    email: string;
  }
  ```

- **GET /api/auth/session** - Current user session
- **POST /api/auth/signout** - Logout

#### `/api/users/*` - User Profile Management
- **GET /api/users/profile** - View own profile
- **PUT /api/users/profile** - Update profile
- **POST /api/users/profile/image** - Upload profile image
- **GET /api/users/[id]** - View other user's profile (considering privacy settings)
- **POST /api/users/[id]/request-info** - Request private information
- **PUT /api/users/info-requests/[id]** - Accept/reject information request

#### `/api/documents/*` - Document Management
- **POST /api/documents/upload** - Upload documents
- **GET /api/documents** - List own documents
- **DELETE /api/documents/[id]** - Delete document

### 2. Post Management API

#### `/api/posts/*` - Post CRUD
- **GET /api/posts**
  ```typescript
  interface PostsQuery {
    type: 'teacher' | 'student';
    subject?: string[];
    age_range?: string[];
    location?: string[];
    price_min?: number;
    price_max?: number;
    available_days?: string[];
    search?: string;
    page?: number;
    limit?: number;
  }
  ```

- **POST /api/posts** - Create post
  ```typescript
  interface CreatePostRequest {
    type: 'teacher' | 'student';
    subject: string[];
    age_range: string[];
    available_days: string[];
    available_times: string[];
    location: string;
    hourly_rate?: number; // for teachers
    hourly_rate_range?: { min: number; max: number }; // for students
    title: string;
    description: string;
  }
  ```

- **GET /api/posts/[id]** - Get post details
- **PUT /api/posts/[id]** - Update post
- **DELETE /api/posts/[id]** - Delete post
- **GET /api/posts/my** - Get own posts

### 3. Chat and Messaging API

#### `/api/chats/*` - Chat Management
- **GET /api/chats** - Get own chat rooms
- **POST /api/chats** - Create new chat room
  ```typescript
  interface CreateChatRequest {
    post_id: string;
    message: string;
  }
  ```

- **GET /api/chats/[id]** - Get chat room info
- **DELETE /api/chats/[id]** - Leave chat room

#### `/api/chats/[id]/messages/*` - Message Management
- **GET /api/chats/[id]/messages** - Get messages (pagination)
- **POST /api/chats/[id]/messages** - Send message
- **PUT /api/chats/[id]/messages/read** - Mark messages as read

### 4. Appointment Management API

#### `/api/appointments/*` - Appointment CRUD
- **GET /api/appointments** - Get own appointments
- **POST /api/appointments** - Create appointment
  ```typescript
  interface CreateAppointmentRequest {
    chat_id: string;
    date_time: string; // ISO format
    location: string;
    description?: string;
  }
  ```

- **GET /api/appointments/[id]** - Get appointment details
- **PUT /api/appointments/[id]** - Update appointment
- **DELETE /api/appointments/[id]** - Cancel appointment
- **PUT /api/appointments/[id]/ready** - Update ready status
- **PUT /api/appointments/[id]/complete** - Mark as completed

### 5. Notification and Settings API

#### `/api/notifications/*` - Notification Management
- **GET /api/notifications** - Get notifications
- **PUT /api/notifications/[id]/read** - Mark notification as read
- **POST /api/notifications/settings** - Update notification settings

## Database Schema (Prisma)

```prisma
// Users table
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password_hash String
  name          String
  region        String
  gender        Gender?
  birth_year    Int?
  profile_image String?
  school        String?
  degree        String?
  certifications String?
  email_verified Boolean  @default(false)
  verification_token String?
  privacy_settings Json?
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  
  // Relations
  posts         Post[]
  documents     Document[]
  chat_participants ChatParticipant[]
  messages      Message[]
  appointments  Appointment[]
  sent_requests InfoRequest[] @relation("RequestSender")
  received_requests InfoRequest[] @relation("RequestReceiver")
}

enum Gender {
  MALE
  FEMALE
  NOT_SPECIFIED
}

// Posts table
model Post {
  id              String   @id @default(cuid())
  type            PostType
  subject         String[]
  age_range       String[]
  available_days  String[]
  available_times String[]
  location        String
  hourly_rate     Float?
  hourly_rate_min Float?
  hourly_rate_max Float?
  title           String
  description     String
  user_id         String
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  // Relations
  user            User @relation(fields: [user_id], references: [id])
  chats           Chat[]
}

enum PostType {
  TEACHER
  STUDENT
}

// Chats table
model Chat {
  id         String   @id @default(cuid())
  post_id    String?
  created_at DateTime @default(now())
  
  // Relations
  post         Post? @relation(fields: [post_id], references: [id])
  participants ChatParticipant[]
  messages     Message[]
  appointments Appointment[]
}

model ChatParticipant {
  id      String @id @default(cuid())
  chat_id String
  user_id String
  
  // Relations
  chat Chat @relation(fields: [chat_id], references: [id])
  user User @relation(fields: [user_id], references: [id])
  
  @@unique([chat_id, user_id])
}

// Messages table
model Message {
  id        String   @id @default(cuid())
  content   String
  chat_id   String
  sender_id String
  sent_at   DateTime @default(now())
  read_at   DateTime?
  
  // Relations
  chat   Chat @relation(fields: [chat_id], references: [id])
  sender User @relation(fields: [sender_id], references: [id])
}

// Appointments table
model Appointment {
  id              String            @id @default(cuid())
  chat_id         String
  date_time       DateTime
  location        String
  description     String?
  status          AppointmentStatus @default(PENDING)
  teacher_ready   Boolean          @default(false)
  student_ready   Boolean          @default(false)
  teacher_completed Boolean        @default(false)
  student_completed Boolean        @default(false)
  reminder_time   Int              @default(30) // minutes
  created_at      DateTime         @default(now())
  updated_at      DateTime         @updatedAt
  
  // Relations
  chat Chat @relation(fields: [chat_id], references: [id])
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}

// Documents table
model Document {
  id            String @id @default(cuid())
  user_id       String
  document_type String
  file_name     String
  file_url      String
  verified      Boolean @default(false)
  uploaded_at   DateTime @default(now())
  
  // Relations
  user User @relation(fields: [user_id], references: [id])
}

// Info Requests table
model InfoRequest {
  id          String            @id @default(cuid())
  sender_id   String
  receiver_id String
  status      InfoRequestStatus @default(PENDING)
  created_at  DateTime         @default(now())
  updated_at  DateTime         @updatedAt
  
  // Relations
  sender   User @relation("RequestSender", fields: [sender_id], references: [id])
  receiver User @relation("RequestReceiver", fields: [receiver_id], references: [id])
}

enum InfoRequestStatus {
  PENDING
  ACCEPTED
  REJECTED
}
```

## Real-time Feature Implementation

### 1. Supabase Realtime Setup
- **Chat messages** real-time synchronization
- **Appointment status changes** real-time notifications
- **Online status** display

### 2. WebSocket Events
```typescript
// Client subscription setup
const messageSubscription = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'Message',
    filter: `chat_id=eq.${chatId}`
  }, handleNewMessage)
  .subscribe();
```

## File Upload System

### 1. Supabase Storage Setup
- **Profile images**: `profiles/` bucket
- **Supporting documents**: `documents/` bucket
- **File size limit**: 10MB
- **Allowed formats**: JPG, PNG, PDF

### 2. File Upload API
```typescript
// POST /api/upload
interface FileUploadRequest {
  file: File;
  type: 'profile' | 'document';
  document_type?: string;
}
```

## Security and Authentication

### 1. Authentication Middleware
```typescript
export function withAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = session.user;
    return handler(req, res);
  };
}
```

### 2. Authorization Checks
- **Post modification/deletion**: Only by author
- **Chat access**: Only by participants
- **Appointment management**: Only by related users

### 3. Data Validation
```typescript
// Zod schema example
const CreatePostSchema = z.object({
  type: z.enum(['teacher', 'student']),
  subject: z.array(z.string()).min(1),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  hourly_rate: z.number().positive().optional(),
});
```

## Email System

### 1. Email Verification
- **Registration** verification email sent
- **Token-based** email confirmation

### 2. Notification Emails
- **New message** notifications (based on settings)
- **Appointment reminders** (30 minutes/1 hour before)

## Error Handling and Logging

### 1. Error Handling
```typescript
export function withErrorHandler(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      return await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
```

### 2. Logging
- **API request/response** logs
- **Error tracking** (Sentry etc.)
- **Performance monitoring**

## Performance Optimization

### 1. Database Optimization
- **Index setup**: Search query optimization
- **Connection pooling**: Prisma connection management
- **Query optimization**: N+1 problem prevention

### 2. Caching Strategy
- **Redis cache** (optional)
- **SWR cache** utilization
- **Static data** caching

## Testing Requirements

### 1. Unit Tests
- **API endpoints** testing
- **Business logic** testing
- **Utility functions** testing

### 2. Integration Tests
- **Database integration** testing
- **Authentication flow** testing
- **File upload** testing

### 3. E2E Tests
- **Complete user flow** testing
- **Real-time features** testing