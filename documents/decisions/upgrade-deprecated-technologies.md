# TutorConnect - Deprecated Technologies Upgrade Plan

**Generated**: 2025-08-18  
**Status**: Pending Implementation  
**Priority**: Mixed (Critical to Low)

## Overview
Context7 scan identified multiple deprecated packages, APIs, and patterns that require urgent replacement to maintain security, performance, and long-term maintainability.

## Task List

### 🔥 CRITICAL (즉시 수정 필요)

#### UPGRADE-001: Replace Supabase Auth Helpers
- **Current**: `@supabase/auth-helpers-nextjs@0.8.7` (deprecated)
- **Target**: `@supabase/ssr` package
- **Files**: `/src/lib/supabase.ts`, auth middleware
- **Breaking Changes**: Import patterns, SSR handling
- **Urgency**: CRITICAL - Package is officially deprecated

#### UPGRADE-002: Update bcryptjs for Security
- **Current**: `bcryptjs@2.4.3`
- **Target**: `bcryptjs@3.0.2`
- **Reason**: Security improvements, better hashing algorithms
- **Files**: Authentication APIs, password handling
- **Urgency**: CRITICAL - Security vulnerability

#### UPGRADE-003: Update jose for JWT Security
- **Current**: `jose@5.10.0`
- **Target**: `jose@6.0.12`
- **Reason**: JWT security fixes and improvements
- **Files**: JWT token handling, authentication middleware
- **Urgency**: CRITICAL - Security fixes

### ⚡ HIGH (우선순위 높음)

#### UPGRADE-004: Next.js + React Major Update
- **Current**: `Next.js@14.2.31`, `React@18.3.1`
- **Target**: `Next.js@15.4.6`, `React@19.1.1`
- **Breaking Changes**: New React compiler, App Router improvements
- **Impact**: All components, build process
- **Prerequisite**: Node.js 18+ required

#### UPGRADE-005: Prisma Major Version Upgrade
- **Current**: `Prisma@5.22.0`
- **Target**: `Prisma@6.14.0`
- **Breaking Changes**: Schema syntax, client API changes
- **Impact**: Database operations, schema files
- **Caution**: Requires database backup and migration testing

### 📌 MEDIUM (계획적 업데이트)

#### UPGRADE-006: Next.js Image Configuration
- **Current**: `images: { domains: [...] }` (deprecated)
- **Target**: `images: { remotePatterns: [...] }`
- **Files**: `next.config.js`
- **Impact**: Image optimization, external images

#### UPGRADE-007: TypeScript ESLint Update
- **Current**: `@typescript-eslint/*@6.21.0`
- **Target**: `@typescript-eslint/*@8.39.1`
- **Breaking Changes**: New rules, stricter type checking
- **Impact**: Code linting, development experience

#### UPGRADE-008: ESLint Major Update
- **Current**: `eslint@8.57.1`
- **Target**: `eslint@9.33.0`
- **Breaking Changes**: Flat config format
- **Impact**: Linting configuration, development workflow

#### UPGRADE-009: Tailwind CSS Update
- **Current**: `tailwindcss@3.4.17`
- **Target**: `tailwindcss@4.1.12`
- **Breaking Changes**: New utility classes, color palette changes
- **Impact**: Styling, custom CSS components

### 📝 LOW (개선사항)

#### UPGRADE-010: Remove Build Error Ignores
- **Current**: Build errors ignored in `next.config.js`
- **Target**: Remove `ignoreBuildErrors` and `ignoreDuringBuilds`
- **Reason**: Improve code quality, catch issues early
- **Impact**: Build process, error detection

## Migration Strategy

### Phase 1: Critical Security (Week 1)
1. **UPGRADE-002**: Update bcryptjs
2. **UPGRADE-003**: Update jose
3. **UPGRADE-001**: Replace Supabase auth helpers
4. Test authentication flows thoroughly

### Phase 2: Framework Updates (Week 2-3)
1. **UPGRADE-004**: Update Next.js + React
2. **UPGRADE-005**: Update Prisma (with database backup)
3. Run comprehensive testing suite
4. Update deployment configurations

### Phase 3: Developer Experience (Week 4)
1. **UPGRADE-006**: Fix Next.js image config
2. **UPGRADE-007**: Update TypeScript ESLint
3. **UPGRADE-008**: Update ESLint with flat config
4. **UPGRADE-009**: Update Tailwind CSS
5. **UPGRADE-010**: Remove build ignores

## Prerequisites & Preparation

### Before Starting
- [ ] Create full database backup
- [ ] Ensure Node.js 18+ is installed
- [ ] Update test coverage for critical components
- [ ] Document current authentication flow
- [ ] Set up staging environment for testing

### Risk Mitigation
- [ ] Test each upgrade in isolation
- [ ] Maintain rollback plan for each phase
- [ ] Monitor application performance after updates
- [ ] Validate all authentication flows
- [ ] Check Vercel deployment compatibility

## Success Criteria

### Phase 1 Complete When:
- [ ] All security packages updated
- [ ] No deprecated Supabase auth helpers in use
- [ ] Authentication tests pass
- [ ] No security vulnerabilities in npm audit

### Phase 2 Complete When:
- [ ] Next.js 15 + React 19 running successfully
- [ ] Prisma 6 operational with all queries working
- [ ] Build process stable on Vercel
- [ ] All existing features functional

### Phase 3 Complete When:
- [ ] No deprecated patterns in codebase
- [ ] All linting rules updated and passing
- [ ] Build process runs without ignores
- [ ] Modern best practices implemented

## Notes
- This plan prioritizes security and stability over new features
- Each phase should be completed and tested before moving to the next
- Consider creating feature branches for major updates
- Update documentation as changes are implemented
- Monitor for any new deprecations during the upgrade process

---
**Next Action**: Begin with UPGRADE-001 (Supabase auth helpers) as it has the highest impact on authentication security.