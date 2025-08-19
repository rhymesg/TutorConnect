# Pull Request Command

This command creates a pull request for the current branch.

## Steps

### 1. Check Current Branch
```bash
# Get current branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# If on main branch, exit with message
if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "❌ Error: You are currently on the main branch."
  echo "Please create a feature branch and commit your changes before creating a pull request."
  exit 1
else
  BRANCH_NAME="$CURRENT_BRANCH"
  echo "Using current branch: $BRANCH_NAME"
fi
```

### 2. Push to Upstream
```bash
# Push branch with upstream tracking
git push -u origin "$BRANCH_NAME"
```

### 3. Create Pull Request
```bash
# Get commits for PR
BASE_BRANCH="main"
COMMIT_COUNT=$(git rev-list --count $BASE_BRANCH..$BRANCH_NAME)
ALL_COMMITS=$(git log $BASE_BRANCH..$BRANCH_NAME --pretty=format:"- %s" | sort | uniq)

# Extract unique task IDs from all commits
TASK_IDS=$(git log $BASE_BRANCH..$BRANCH_NAME --pretty=format:"%s" | grep -oE '\[[^]]+\]' | tr -d '[]' | tr ',' '\n' | sed 's/^ *//;s/ *$//' | sort | uniq | paste -sd, -)

# Create PR title based on commits
if [ $COMMIT_COUNT -eq 1 ]; then
  PR_TITLE=$(git log $BASE_BRANCH..$BRANCH_NAME --pretty=format:"%s" -1)
else
  # Get the most common theme from commit messages
  SUMMARY=$(git log $BASE_BRANCH..$BRANCH_NAME --pretty=format:"%s" | sed 's/\[[^]]*\] //' | head -1)
  if [ -n "$TASK_IDS" ]; then
    PR_TITLE="[$TASK_IDS] $SUMMARY"
  else
    PR_TITLE="Multiple improvements and fixes"
  fi
fi

# Create PR body
PR_BODY="## Changes

$ALL_COMMITS"

# Create the PR
gh pr create \
  --base main \
  --head $BRANCH_NAME \
  --title "$PR_TITLE" \
  --body "$PR_BODY"
```