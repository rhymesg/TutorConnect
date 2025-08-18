# TutorConnect Project Context

## Project Overview
- **Name**: TutorConnect
- **Domain**: tutorconnect.no (purchased)
- **Purpose**: Norwegian tutoring/private lesson connection platform (teacher-student matching)
- **Target**: Norwegian local market (Finn.no, Midttanbud style)
- **Approach**: Web-first development (PWA for app-like experience)

## Technology Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: Supabase (PostgreSQL + Real-time Chat + File Storage)
- **Deployment**: Vercel (Frontend) + Supabase (Backend/DB)
- **Domain**: tutorconnect.no (purchased from Domene.no)

## Main Features
- User authentication (email + password, email verification)
- Profile management (personal info, education/certifications, document uploads)
- Post system (teacher/student tabs, subject/time/price/region filters)
- Real-time chat (post-based conversations, appointment booking feature)
- Appointment management (time/location setting, notifications, completion confirmation)

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

## Current Status
- ✅ PDF plan analysis completed
- ✅ Technology stack decision completed
- ✅ tutorconnect.no domain purchase completed
- ✅ MCP servers installation completed (Context7, Sequential, Magic, Playwright)
- ✅ Agent-specific requirement documents completed
- ✅ Agent creation completed (tutorconnect-architect, frontend-ui-developer, backend-api-developer, security-privacy-guardian, qa-test-engineer)
- ✅ Development task analysis and 13-week roadmap establishment completed
- 🔄 Currently in progress: ARCH-001 Database schema design

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
**All agents should actively use sequential-thinking and context7 MCP tools to find the best approaches.**

- Leverage sequential-thinking for complex problem-solving and step-by-step analysis
- Use context7 to understand existing codebase patterns and maintain consistency
- **Proactively ask questions** to the user about design concepts and development directions
- **Make suggestions** when better alternatives or improvements are identified
- Challenge assumptions and propose optimizations when appropriate
- Engage in collaborative decision-making rather than just following instructions

## Technology Standards and Best Practices
**ALWAYS prioritize latest stable versions and avoid deprecated technologies.**

- **Use context7 MCP tool** to research and identify deprecated packages, APIs, or patterns in the codebase
- **Latest Stable Versions**: Always use the most recent stable versions of libraries and frameworks
- **Modern Alternatives**: Research and suggest modern alternatives to outdated technologies
- **Security Updates**: Prioritize security patches and updates for all dependencies

**Examples of what to avoid:**
- Deprecated React patterns (class components → functional components + hooks)  
- Old Next.js APIs (pages directory → app directory)
- Outdated authentication methods (custom JWT → NextAuth.js/Auth.js)
- Legacy CSS frameworks and deprecated Node.js APIs

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

## Reference Materials
- **Original Plan**: ./documents/TutorConnect - Plan.pdf
- **Reference Apps**: Finn.no, Midttanbud
- **User**: Norwegian permanent resident, local resident