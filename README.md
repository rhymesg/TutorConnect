# TutorConnect


A Norwegian tutoring platform that connects teachers and students for private lessons.

## About

TutorConnect is a web-based platform designed for the Norwegian market, enabling tutors and students to connect, communicate, and schedule lessons. The platform features user profiles, post creation, real-time chat, and appointment management.

## Technology Stack

- **Frontend**: Next.js 15.4.6 + TypeScript 5.3.3
- **Styling**: Tailwind CSS 4.1.12
- **Backend**: Next.js API Routes + Prisma ORM 6.14.0
- **Database**: Supabase
- **Authentication**: JWT (jose 6.0.12) + Supabase Auth
- **Deployment**: Vercel + Supabase

## Development

This project was developed solo using AI-powered development methodologies, demonstrating how one developer can effectively plan, build, and launch a full-scale platform with AI assistance.

### Development Journey

#### 1. Planning & Architecture
- Designed multi-agent system with 5 specialized AI agents (Architect, Frontend, Backend, Security, QA)
- Created comprehensive task breakdown with 50+ tasks mapped to agent expertise

#### 2. Multi-Agent MVP Development
- Used AI agents for initial draft implementation across all domains
- Achieved rapid prototype with core features: authentication, posts, search, chat

#### 3. Orchestration & Refactoring
- Transitioned to single-developer orchestration model
- Systematically centralized common patterns and shared modules
- Established consistent coding standards across the codebase

#### 4. Test-Driven Iteration
- Implemented comprehensive E2E tests with Playwright
- Integrated tests into GitHub Actions for CI/CD workflow
- Each feature followed: plan → implement → test → refine cycle

#### 5. Launch Strategy & SEO
- Implemented SEO optimization with metadata, structured data, and sitemaps
- Developed "teacher-first" marketplace strategy for Norwegian market
- Deployed to production at tutorconnect.no with monitoring

### Key Learnings
- AI agents excel at initial implementation but require human orchestration for coherent systems
- E2E tests in CI/CD workflows catch issues early and prevent accumulation of technical debt
- Continuous refactoring and centralization are crucial for maintainability
- Single developer with AI assistance can achieve what traditionally required a full team