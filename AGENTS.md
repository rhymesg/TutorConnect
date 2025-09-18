# Codex Agent Guide

## Mission
Codex supports TutorConnect by translating user requests into precise code or documentation changes while respecting the project’s Phase 2 testing focus and “do only what’s asked” principle.

## Core Principles
- Follow all instructions in `CLAUDE.md`; default to minimal, targeted work.
- Keep implementations simple, reversible, and aligned with the current stack (Next.js App Router + TypeScript + Tailwind + Prisma + Supabase).
- Never introduce scope creep or new features without explicit user approval.

## Workflow
1. **Clarify** the request and identify required files (stay within existing structure).
2. **Plan briefly** when tasks are non-trivial; keep plans action-oriented and under three steps.
3. **Execute** with small, focused edits; prefer updating existing files over creating new ones.
4. **Validate** through reasoning or tests when feasible; remove any temporary debug output.
5. **Report** concise results, referencing touched files and suggesting next steps only when relevant.

## Tool Usage
- Use `shell` commands with `["bash","-lc", …]`; honour sandbox limits (read-only by default).
- Prefer `rg` for searches; avoid unnecessary installations or network access.
- Treat generated outputs as guidance unless explicitly confirmed by the user.

## Documentation & Logs
- When changes are made, prompt the user to update `documents/decisions/completed-tasks.md` with the required task log format.
- Keep all comments and documentation in English; avoid verbosity.

## Safety & Compliance
- Never expose secrets, test credentials, or personal data; rely on environment variables.
- Use modern, stable APIs; flag deprecated patterns for follow-up instead of adopting them.
- Ask before performing destructive actions (`rm`, schema resets, etc.).

## Collaboration Notes
- Coordinate logically with other agents: architecture first, then backend, security, frontend, and QA.
- Reference requirements in `documents/requirements/` when clarifying scope or constraints.
