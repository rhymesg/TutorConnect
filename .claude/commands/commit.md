# Git Commit Command

This command handles git commits for TutorConnect project with proper staging and commit message formatting.

## Usage
```bash
# Check status and stage files
git status
git add .
git commit -m "[TASK-ID, TASK-ID2, ...] Brief summary

Detailed explanation of changes made."
```

## Commit Message Format
- **One line only** - Keep commit messages concise and to a single line
- **Title**: `[TASK-ID, TASK-ID2, ...] Brief description of change` (multiple task IDs allowed)
- **NO SIGNATURES**: Do not include "Generated with Claude Code" or similar signatures

### Task ID Guidelines
- Use actual task numbers when available (e.g., `E2E-005`, `FRONT-001`, `BACK-004`)
- Multiple task IDs: `[E2E-005, UI-003, FRONT-001] Description`
- If no task ID exists, use category only without dashes and numbers
- Common categories: `DOC`, `FIX`, `E2E`, `FRONT`, `UI`, `BACK`, `SEC`, `PERF`, `TEST`, `CONFIG` (not limited to these)

### Examples
- ✅ Good: `[E2E-005, UI-003] Fix navigation test and update styling`
- ✅ Good: `[BACK-004] Add user authentication middleware`
- ✅ Good: `[UI] Update button styling for consistency`
- ✅ Good: `[REFACTOR] Reorganize component structure`
- ❌ Bad: `[E2E-001] Fix navigation test headings` (when no actual task ID exists)

## Example
```bash
git commit -m "[ARCH-003] Setup Next.js 14 project foundation

- Configured Next.js 14 with App Router and TypeScript
- Set up Tailwind CSS with Norwegian design system
- Created comprehensive folder structure
- Added PWA configuration for mobile experience
- Configured development environment and scripts"
```

## Files to Stage
The command should:
1. Check git status for untracked and modified files
2. Stage relevant project files (exclude temporary files)
3. Respect .gitignore patterns
4. Create descriptive commit message based on completed task
5. Never add signatures like "Generated with Claude Code"