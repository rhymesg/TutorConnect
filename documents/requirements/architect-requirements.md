# Architect Agent Requirements

## Role and Responsibilities
Overall system architecture design and technology stack configuration for the TutorConnect platform

## Technology Stack Decisions
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: Supabase (PostgreSQL + Real-time Chat + File Storage)
- **Deployment**: Vercel (Frontend) + Supabase (Backend/DB)
- **Domain**: tutorconnect.no

## Main Design Requirements

### 1. Database Schema Design
- **Users Table**
  - Basic info: email, password, name, region(postal code/city), gender(male/female/not specified), birth_year(optional)
  - Profile: profile_image, school, degree, certifications
  - Authentication: email_verified, verification_token
  - Privacy settings: privacy_settings (individual public/request-based settings for gender, birth year, documents, etc.)

- **Posts Table**
  - Type: type(teacher/student)
  - Subject: subject(math/english/norwegian/science/coding/sports etc.)
  - Target age: age_range(7-12, 13-15, 16-18, adult - multiple selection)
  - Time: available_days, available_times, preferred_schedule
  - Location: location(Norwegian cities)
  - Price: hourly_rate (for teachers) / hourly_rate_range (for students)
  - Content: title, description
  - Metadata: created_at, updated_at, user_id

- **Chats Table**
  - Participants: participants (2 people)
  - Related post: related_post_id
  - Creation time: created_at

- **Messages Table**
  - Content: content, sender_id, chat_id
  - Time: sent_at
  - Status: read_status

- **Appointments Table**
  - Basic info: chat_id, date_time, location
  - Status: status(pending/confirmed/completed/cancelled)
  - Confirmation: teacher_ready, student_ready, both_completed
  - Notification settings: reminder_time(30min/1hour before)

- **Documents Table**
  - File info: user_id, document_type, file_url, file_name
  - Status: verified_status

### 2. API Architecture Design
- **Authentication API**
  - `/api/auth/register` - User registration
  - `/api/auth/login` - Login
  - `/api/auth/verify` - Email verification
  - `/api/auth/profile` - Profile management

- **Posts API**
  - `/api/posts` - Posts CRUD
  - `/api/posts/search` - Post search/filtering
  - `/api/posts/[id]` - Individual post view

- **Chat API**
  - `/api/chats` - Chat room list
  - `/api/chats/[id]/messages` - Messages CRUD
  - `/api/chats/create` - Create new chat room

- **Appointments API**
  - `/api/appointments` - Appointments CRUD
  - `/api/appointments/[id]/status` - Appointment status update

### 3. Real-time Features Design
- **Supabase Realtime** utilization
  - Real-time chat message synchronization
  - Real-time appointment status change notifications
  - Online status display

### 4. File Upload System
- **Supabase Storage** utilization
  - Profile picture upload
  - Document upload (PDF/images)
  - File size limits and security settings

### 5. Security Architecture
- **Authentication/Authorization**
  - JWT token-based authentication
  - Role-based access control (RBAC)
  - API route protection

- **Data Protection**
  - Personal information encryption
  - GDPR compliance design
  - File access permission management

### 6. PWA Setup
- **Service Worker** configuration
- **Manifest.json** setup
- **Offline functionality** considerations

## Performance Optimization Considerations
- **Image optimization**: Utilize Next.js Image component
- **Code splitting**: Utilize dynamic imports
- **Caching strategy**: Utilize SWR/React Query
- **SEO optimization**: Target Norwegian market

## Deployment and Infrastructure
- **Vercel** automatic deployment setup
- **Environment variables** management
- **Domain connection**: tutorconnect.no
- **Monitoring**: Error tracking and performance monitoring

## Scalability Considerations
- **Internationalization** preparation (i18n)
- **Mobile app** expansion possibility (React Native)
- **Payment system** integration preparation
- **Notification system** expansion (push notifications)

## Development Environment Setup
- **TypeScript** strict mode configuration
- **ESLint/Prettier** code style unification
- **Git workflow** definition
- **Testing environment** configuration