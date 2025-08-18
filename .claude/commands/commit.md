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
- **Title**: `[TASK-ID, TASK-ID2, ...] Brief summary`
- **Body**: Detailed explanation (optional)
- **NO SIGNATURES**: Do not include "Generated with Claude Code" or similar signatures

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