# ADR-001: Database Schema Design for TutorConnect

**Status**: Accepted  
**Date**: 2025-08-18  
**Decision Makers**: tutorconnect-architect  

## Context

TutorConnect is a Norwegian tutoring/private lesson connection platform that matches teachers and students. The platform's core features are as follows:

- User authentication and profile management
- Teacher/student post system
- Real-time chat and messaging
- Appointment management system
- Personal information protection and GDPR compliance
- File upload and document management

## Decision

We designed a PostgreSQL-based relational database schema using Prisma ORM. The main table structure is as follows:

### Core Table Structure

1. **Users**: User basic information and profile
2. **Posts**: Teacher/student posts
3. **Chat**: Chat rooms
4. **ChatParticipant**: Chat participant relationships
5. **Message**: Messages
6. **Appointment**: Appointments
7. **Document**: Documents
8. **InfoRequest**: Personal information requests

### Main Enum Types

- **Gender**: Gender options
- **PrivacySetting**: Personal information privacy settings
- **PostType**: Teacher/student distinction
- **Subject**: Subjects
- **AgeGroup**: Target age groups
- **NorwegianRegion**: Norwegian regions
- **AppointmentStatus**: Appointment status
- **DocumentType**: Document types
- **VerificationStatus**: Verification status

## Rationale

### 1. Norwegian Localization

- **NorwegianRegion Enum**: Pre-defined major cities for optimized regional search
- **Currency Default**: NOK (Norwegian Krone)
- **PostalCode**: Norwegian postal code system support

### 2. GDPR Compliance

- **PrivacySetting**: Granular privacy controls per data field
- **InfoRequest**: Request-approval system for private information access
- **Soft Delete**: Logical deletion via isActive flags for data retention

### 3. Scalability

- **CUID**: Distributed-safe ID generation
- **JSON Arrays**: Multi-value storage for availableDays, ageGroups
- **Decimal Type**: Precise financial calculations

### 4. Performance

- **Strategic Indexing**: Composite indexes for search patterns
- **Relationship Optimization**: Appropriate SetNull/Cascade usage
- **Read Optimization**: Cache columns (lastMessageAt, unreadCount)

### 5. Real-time Support

- **ChatParticipant**: User state and unread message tracking
- **Message.type**: Support for text, system, appointment messages
- **Appointment**: Detailed status and confirmation workflow

## Alternatives Considered

### 1. NoSQL vs SQL

- **Considered**: MongoDB and other NoSQL databases
- **Decision**: PostgreSQL
- **Reason**: Complex relational data, ACID transactions, Supabase optimization

### 2. Age Storage

- **Option 1**: Full birthdate (Date)
- **Option 2**: Age (Int)
- **Decision**: Birth year (Int)
- **Reason**: Accurate age calculation with privacy minimization

### 3. Location Design

- **Option 1**: Free text input
- **Option 2**: Latitude/longitude coordinates
- **Decision**: Enum + detailed location combination
- **Reason**: Balance between search optimization and user convenience

### 4. Chat vs Message Relationship

- **Option 1**: Single table integration
- **Option 2**: Separate table structure
- **Decision**: Separate structure
- **Reason**: Chat room metadata management and participant control

## Consequences

### Positive

- **Type Safety**: Strong TypeScript and Prisma type system
- **Developer Productivity**: Auto-generated client code
- **Migration Management**: Prisma migration system
- **Norwegian Optimization**: Region-based search and filtering
- **GDPR Compliance**: Built-in privacy protection design
- **Scalability**: Flexible structure for future features

### Negative

- **Complexity**: Initial learning curve from multiple tables and relationships
- **Enum Management**: Maintenance overhead for hardcoded enum values
- **Data Duplication**: Consistency management needed for cache columns

### Risks & Mitigations

1. **Performance Risk**
   - Risk: Performance degradation from complex join queries
   - Mitigation: Proper indexing, query optimization, denormalization when needed

2. **Data Consistency**
   - Risk: Cache data inconsistency (unreadCount, etc.)
   - Mitigation: Transaction usage, periodic consistency verification

3. **Scalability Constraints**
   - Risk: Limited extensibility from hardcoded enum values
   - Mitigation: Migration plan to reference tables when necessary

## Implementation Notes

### Required Environment Setup

```env
DATABASE_URL="postgresql://username:password@localhost:5432/tutorconnect?schema=public"
```

### Migration Commands

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Initial Seed Data

- Korean mapping data for NorwegianRegion
- Default Subject classification data
- Test user and post data

## Future Considerations

1. **Multilingual Support**: Multi-language labels for Subject, AgeGroup
2. **Notification System**: Device token management for push notifications
3. **Payment System**: Payment history and settlement tables
4. **Review System**: Tutor-student rating system
5. **Analytics System**: Usage analytics log tables

---

**Next Steps**: ARCH-002 API Architecture Design 진행