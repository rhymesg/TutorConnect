# TutorConnect Project Context

## Project Overview
- **Name**: TutorConnect
- **Domain**: tutorconnect.no (purchased)
- **Purpose**: Norwegian tutoring/private lesson connection platform (teacher-student matching)
- **Target**: Norwegian local market (Finn.no, Midttanbud style)
- **Approach**: Web-first development (PWA for app-like experience)
- **Current Status**: Phase 2 Complete - Real testing and bug fixing phase

## Technology Stack
**Always use latest stable versions of all technologies**

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS + React
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: Supabase (PostgreSQL + Real-time Chat + File Storage)
- **UI Components**: Headless UI + Heroicons + Lucide React
- **Form Handling**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS (modern configuration)
- **Authentication**: JWT (jose library) + Supabase Auth
- **Deployment**: Vercel (Frontend) + Supabase (Backend/DB)
- **Domain**: tutorconnect.no (purchased from Domene.no)

## Implementation Status
- ✅ **Phase 1**: MVP Core (auth, profiles, posts, search)
- ✅ **Phase 2**: Chat & Appointments (real-time messaging, scheduling)
- 🧪 **Current**: Manual testing phase - fixing bugs as discovered

## Agent Team Structure
- **Architect**: System design, DB schema
- **Frontend**: Next.js + React components, PWA setup
- **Backend**: API design, authentication/authorization, real-time chat
- **Security**: User data protection, GDPR compliance
- **QA**: Test scenarios, E2E testing

## Development Plan
1. **Requirements phase**: Create requirement documents for each agent
2. **Task Assignment**: Divide small tasks by agent
3. **MVP Implementation**: Basic features (account creation, posts, chat, interactions)

## Documentation Policy
**ALL CODE COMMENTS AND DOCUMENTATION MUST BE WRITTEN IN ENGLISH.**

Each agent continuously records the following in the `documents/decisions/` folder while working:

1. **Architecture Decision Records (ADR)**: Important technical decisions and rationale (keep concise)
2. **Work Log**: Each task execution process and results (brief summary)
3. **Design Documents**: Key design decisions (essential points only)
4. **Issues and Solutions**: Problems encountered and resolution methods (concise notes)

**Note**: All documentation should be concise and to the point. Avoid verbose explanations unless absolutely necessary for understanding.

## Planning Policy
**DO NOT include specific time estimates (e.g., 8h, 6h, 4 weeks) in task planning.**

- Task complexity/effort can be indicated relatively (Small/Medium/Large or Simple/Complex)
- Focus on task dependencies and logical sequence rather than time estimates
- Use relative workload indicators when comparing tasks, not absolute time units

## Agent Working Guidelines
**IMPORTANT: Keep it simple - only do what is explicitly requested.**

- **Context7**: Use context7 for tasks referring to docs and using libraries.
- **Sequential Thinking**: Use sequential-thinking for problem-solving and analyzing tasks.
- **Simple Approach First**: Always use the simplest possible solution that works
- **No Extra Features**: Do not add features, optimizations, or improvements unless specifically asked
- **Minimal Implementation**: Implement only the exact requirements, nothing more
- **Ask Before Adding**: Always ask before adding any functionality not explicitly requested

## Debugging Workflow
**Add debug messages during development, remove before commit.**

- **Debug During Development**: Add console.log messages in related areas when fixing bugs or implementing features
- **Clean Before Commit**: Remove debug messages before committing, keep only essential error logs

## Implementation Principles
**Focus on simplicity and reusability in all implementations.**

- **Simple Solutions**: Use simple approaches for implementing features - avoid complex methods when simpler ones will work
- **Define Once, Use Many**: Define constants, enums, lists, and modules in a centralized location and import them wherever needed to avoid duplication

## Technology Standards and Best Practices
**ALWAYS prioritize latest stable versions and avoid deprecated technologies.**

- **Use context7 MCP tool** to research and identify deprecated packages, APIs, or patterns in the codebase
- **Latest Stable Versions**: Always use the most recent stable versions of libraries and frameworks
- **Modern Alternatives**: Research and suggest modern alternatives to outdated technologies
- **Security Updates**: Prioritize security patches and updates for all dependencies

**Examples of what to avoid:**
- Deprecated React patterns (class components → functional components + hooks)  
- Old Next.js APIs (pages directory → app directory)
- Legacy CSS frameworks and deprecated Node.js APIs
- Outdated testing frameworks and configurations

**Process:** Use context7 to scan dependencies → Check for deprecations → Propose modern solutions

## Task Completion Protocol
**After completing any task, agents must update the completion log.**

1. Update `documents/decisions/completed-tasks.md` with:
   ```markdown
   ### TASK-ID: Task Name ✅
   - **Agent**: [name] | **Date**: [YYYY-MM-DD]
   - **Files**: [key files created]
   - **Unblocks**: [task IDs now ready]
   ```
2. Update "Current & Next" and "Agent Status" sections
3. Update this CLAUDE.md current status if needed

## Project Structure
```
TutorConnect/
├── documents/           # Project documentation
│   ├── requirements/    # Requirements documents
│   ├── decisions/       # ADR and work logs
│   ├── development-task-breakdown.md
│   └── agent-definitions.md
├── src/                 # Source code
├── prisma/             # Database schema
├── public/             # Static files
├── tests/              # Test code
└── .github/            # GitHub Actions
```

## Domain Information
- **Domain**: tutorconnect.no
- **Registrar**: Domene.no
- **Web Hosting**: MJOLNIR.DOMENE.NO server
- **SSL**: Free provision (up to 24 hours for activation)
- **Email**: mail.tutorconnect.no setup available
- **Account**: rhymesg@gmail.com

## Test Account Information
- **Email**: tester@tutorconnect.no
- **Password**: Use `secret.TESTER_PASSWORD`
- **Purpose**: Development testing, E2E tests, manual testing
- **Note**: Password stored in .env.local as TEST_EMAIL and TEST_PASSWORD

## Contact Information
- **Main Contact**: contact@tutorconnect.no (all inquiries)
- **Automated Emails**: noreply@tutorconnect.no (notifications, verification, system emails)
- **Business Type**: Individual/Personal project (not corporation)
- **Legal Entity**: Individual (not AS/corporation)

## Reference Materials
- **Original Plan**: ./documents/TutorConnect - Plan.pdf
- **Reference Apps**: Finn.no, Midttanbud
- **User**: Norwegian permanent resident, local resident
