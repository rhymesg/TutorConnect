# Email Digest System Implementation

## Overview
Implemented automated email digest system to notify users about unread messages on TutorConnect platform.

## Architecture

### Database Schema
- Added 5 email notification preferences to User model:
  - `emailNewChat`: Boolean - notifications for new chat requests
  - `emailNewMessage`: Boolean - notifications for new messages (digest)
  - `emailAppointmentConfirm`: Boolean - notifications for appointment confirmations
  - `emailAppointmentReminder`: Boolean - notifications for appointment reminders
  - `emailAppointmentComplete`: Boolean - notifications for appointment completion reminders
- Added `lastEmailNotificationAt`: DateTime - tracks last digest sent time

### Components

#### 1. Settings Page (`/src/app/settings/page.tsx`)
- Toggle switches for email notification preferences
- Optimistic UI updates with error handling
- Norwegian language interface
- Real-time saving to database

#### 2. API Endpoints
- `/api/profile/email-notifications` - GET/PATCH for managing user preferences
- `/api/cron/email-digest` - Cron job endpoint for sending digest emails

#### 3. Email Service (`/src/lib/email.ts`)
- Norwegian email templates using Tailwind CSS styles
- Message digest template with chat summaries
- Integration with existing nodemailer setup
- Responsive HTML email design

#### 4. Cron Job Configuration (`vercel.json`)
- Currently: Every 10 minutes for testing (`*/10 * * * *`)
- Production: Will be daily (`0 9 * * *` for 9 AM daily)

## Logic Flow

### Email Digest Process
1. **Cron Trigger**: Vercel cron job hits `/api/cron/email-digest`
2. **Authentication**: Validates `CRON_SECRET` from environment
3. **User Query**: Finds users with `emailNewMessage: true` and active unread chats
4. **Message Check**: Only sends if new messages exist since `lastEmailNotificationAt`
5. **Email Generation**: Creates Norwegian HTML email with chat summaries
6. **Send Email**: Uses nodemailer with SMTP configuration
7. **Update Timestamp**: Records `lastEmailNotificationAt` to prevent duplicates

### Data Structure
```typescript
interface UnreadChatInfo {
  chatId: string;
  otherUserName: string;
  unreadCount: number;
  lastMessage?: {
    content: string;
    senderName: string;
    sentAt: Date;
  };
  postTitle?: string;
}
```

## Configuration

### Environment Variables
```bash
# Email Service
EMAIL_FROM="noreply@tutorconnect.no"
SMTP_HOST="mail.tutorconnect.no"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="noreply@tutorconnect.no"
SMTP_PASS="[password]"

# Cron Security
CRON_SECRET="[secure_random_string]"

# App URLs
NEXTAUTH_URL="https://tutorconnect.no"
```

### SMTP Setup
- Using Domene.no SMTP service
- TLS on port 587
- From address: noreply@tutorconnect.no

## Norwegian Email Template Features
- Professional TutorConnect branding
- Individual chat summaries with unread count
- Last message preview (truncated to 100 chars)
- Related post title information
- Direct links to specific chats
- Settings link for managing preferences
- Responsive design for mobile devices
- Both HTML and plain text versions

## Testing
- Test script: `test-email-digest.js`
- Manual testing endpoint with Bearer token authentication
- Logs email sending attempts for debugging
- Verifies user query logic and data transformation

## Security Considerations
- CRON_SECRET prevents unauthorized access
- JWT token validation for settings API
- Input sanitization and validation
- No sensitive data in email logs
- Secure SMTP with TLS encryption

## Performance
- Batch processing of users
- Efficient database queries with indexes
- Only processes users with unread messages
- Prevents duplicate emails with timestamp tracking
- Error handling with individual user isolation

## Deployment Considerations
- Vercel cron jobs (free tier: up to 100 executions/day)
- Environment variables must be set in Vercel dashboard
- SMTP credentials secured in production
- Database connection pooling for concurrent access
- Change cron schedule to daily in production

## Future Enhancements
- Email delivery status tracking
- Unsubscribe mechanism
- Email template customization
- Analytics for email engagement
- Rate limiting and throttling
- Multiple language support