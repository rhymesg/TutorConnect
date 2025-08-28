# Git Commit Command

This command handles git commits for TutorConnect project with proper staging and commit message formatting.

## Commit Message Format
- **SINGLE LINE ONLY** - Never use multi-line commit messages
- **NO DETAILED BODY** - Only write the title line, never add detailed explanations
- **Format**: `[CATEGORY, CATEGORY2, ...] Brief description of change`
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
1. **Check git status** for untracked and modified files
2. **Analyze which files need to be staged** - identify the scope of changes and group related files
3. **Verify no files are missed** - ensure all related changes are included in the commit
4. **Stage ALL relevant changed files together** - Don't commit files one by one
5. **EXCLUDE**: temporary files, secret files, .env files, API keys, passwords, example data
6. Respect .gitignore patterns
7. Use `git add .` for all files or selectively add multiple files at once
8. Create descriptive commit message based on all completed changes
9. Never add signatures like "Generated with Claude Code"

### File Staging Process
1. Run `git status` to see all changed files
2. Run `git diff --name-only` to confirm which files have changes
3. **Analyze file changes** using `git diff` to understand what was modified
4. **Generate appropriate commit message** based on the actual changes made
5. Review the scope of changes to ensure completeness
6. Stage all related files in a single commit
7. Double-check no relevant files are left unstaged

### Commit Message Generation
1. **Read the changes**: Use `git diff` to understand what was actually modified
2. **Identify the primary purpose**: Determine if changes are fixes, features, refactoring, etc.
3. **Choose appropriate categories**: Select relevant categories based on the changes made
4. **Write descriptive message**: Create a brief but clear description of what changed
5. **Examples based on changes**:
   - API route fixes → `[API,FIX] Fix chat visibility and message handling`
   - UI component updates → `[UI] Update chat interface styling and layout`
   - Debug cleanup → `[CLEANUP] Remove debug messages from chat components`
   - Documentation → `[DOC] Add debugging workflow guidelines`