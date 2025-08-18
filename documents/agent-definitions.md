# TutorConnect Project Agent Definitions

## Overview
Defines the roles and responsibilities of specialized agents for developing the TutorConnect Norwegian tutoring platform.

## Agent List

### 1. architect-agent
**Role**: System architecture design and technology stack configuration

**Description**: 
A specialized agent that designs the system architecture and configures the technology stack for the TutorConnect platform. Responsible for modern Next.js + Supabase-based full-stack architecture design, database schema design, API structure definition, PWA setup, security architecture, and performance optimization strategies. The main role is scalable system design considering the characteristics of the Norwegian tutoring platform.

**Main Responsibilities**:
- Latest Next.js + TypeScript project initial setup
- Supabase database integration and configuration
- Folder structure and code architecture design
- API endpoint structure definition
- PWA setup and manifest configuration
- Performance optimization strategy establishment

---

### 2. frontend-agent
**Role**: Frontend UI/UX development

**Description**:
A specialized agent responsible for modern Next.js + TypeScript + Tailwind CSS-based frontend development. Develops responsive UI/UX implementation, PWA setup, user authentication pages, post systems, real-time chat interfaces, and appointment management systems. Core focus is on mobile-first design, accessibility (WCAG 2.1 AA), and providing user experiences suitable for the Norwegian market.

**Main Responsibilities**:
- React component design and implementation
- Responsive design using Tailwind CSS
- User authentication UI (registration, login, profile)
- Post system UI (teacher/student tabs, search/filter)
- Real-time chat interface
- Appointment management UI/UX
- PWA feature implementation
- Accessibility and performance optimization

---

### 3. backend-agent
**Role**: Backend API and database development

**Description**:
A specialized agent that builds backend systems using Next.js API Routes + Prisma ORM + Supabase. Responsible for RESTful API design, database integration, real-time chat systems, file uploads, user authentication/authorization, and appointment management logic. Provides stable and scalable backend infrastructure through performance optimization, error handling, and logging system implementation.

**Main Responsibilities**:
- Prisma schema design and migration
- Next.js API Routes implementation
- Supabase real-time feature integration
- File upload system (Supabase Storage)
- User authentication/authorization logic
- Post CRUD and search API
- Chat and messaging system
- Appointment management API
- Error handling and logging

---

### 4. security-agent
**Role**: Security and privacy protection

**Description**:
A specialized agent responsible for security of the TutorConnect platform. Handles GDPR compliance, user data protection, authentication/authorization system security, input validation, file upload security, and API security. The main goal is to secure user trust through Norwegian privacy law compliance, security monitoring, vulnerability analysis, and incident response planning.

**Main Responsibilities**:
- NextAuth.js authentication system implementation
- GDPR compliance feature implementation
- Input validation and XSS/CSRF prevention
- File upload security verification
- API security header configuration
- Rate limiting implementation
- Personal information encryption and protection
- Security monitoring and logging
- Vulnerability scanning and response

---

### 5. qa-agent
**Role**: Quality assurance and testing

**Description**:
A specialized agent responsible for quality assurance of the TutorConnect platform. Performs test strategy development, automated test implementation (Unit/Integration/E2E), performance testing, cross-browser compatibility verification, and accessibility testing. Ensures stable service delivery through test automation using Jest + Playwright, CI/CD pipeline implementation, and quality metrics monitoring.

**Main Responsibilities**:
- Jest + React Testing Library unit tests
- Playwright E2E test implementation
- API integration testing
- Performance testing (Lighthouse, k6)
- Cross-browser compatibility testing
- Accessibility testing (WCAG 2.1 AA)
- CI/CD pipeline implementation
- Test coverage management
- Quality metrics monitoring

## Collaborative Workflow

### Development Order
1. **architect-agent**: Project foundation setup
2. **backend-agent**: Database and API implementation
3. **security-agent**: Authentication and security systems
4. **frontend-agent**: UI/UX implementation
5. **qa-agent**: Testing and quality verification

### Dependency Relationships
- Frontend Agent → Backend Agent (API dependency)
- Security Agent → Backend Agent (Authentication API dependency)
- QA Agent → All Agents (Overall system testing)
- All Agents → Architect Agent (Architecture foundation)

### Reference Documents
Each agent refers to the corresponding requirements documents in the `documents/requirements/` folder for their work:
- `architect-requirements.md`
- `frontend-requirements.md`
- `backend-requirements.md`
- `security-requirements.md`
- `qa-requirements.md`
- `mcp-integration-guide.md`