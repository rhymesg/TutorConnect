# Git Commit Command

This command handles git commits for TutorConnect project with proper staging and commit message formatting.

## Commit Message Format
- **One line only** - Keep commit messages concise and to a single line
- **Title**: `[CATEGORY, CATEGORY2, ...] Brief description of change` (multiple categories allowed)
- **NO SIGNATURES**: Do not include "Generated with Claude Code" or similar signatures

### Task ID Guidelines
- **NEVER USE TASK NUMBERS** - Do not create task IDs with numbers (e.g., DOC-001, TEST-003)
- Use category prefixes only: `[DOC]`, `[FIX]`, `[E2E]`, `[TEST]`, etc.
- Multiple categories allowed: `[UI, FIX] Description`
- Common categories: `DOC`, `FIX`, `E2E`, `FRONT`, `UI`, `BACK`, `SEC`, `PERF`, `TEST`, `CONFIG` (not limited to these)

### Examples
- ✅ Good: `[UI] Update button styling for consistency`
- ✅ Good: `[E2E] Add profile functionality tests`
- ✅ Good: `[FIX, UI] Correct navigation issues and update styling`
- ✅ Good: `[REFACTOR] Reorganize component structure`
- ❌ Bad: `[E2E-001] Fix navigation test headings` (never use numbers)
- ❌ Bad: `[TEST-003] Add profile tests` (never use numbers)

## Example
```bash
git commit -m "[ARCH] Setup Next.js 14 project foundation"
```

## Files to Stage
The command should:
1. Check git status for untracked and modified files
2. Stage relevant project files
3. **EXCLUDE**: temporary files, secret files, .env files, API keys, passwords
4. Respect .gitignore patterns
5. Create descriptive commit message based on completed task
6. Never add signatures like "Generated with Claude Code"