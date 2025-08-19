# Pull Request Command

This command creates a pull request for the current branch.

## Steps

### 1. Check Current Branch
```bash
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "❌ Error: You are currently on the main branch."
  echo "Please switch to a feature branch before creating a pull request."
  exit 1
fi
```

### 2. Push to Upstream
```bash
git push -u origin $CURRENT_BRANCH
```

### 3. Create Pull Request
```bash
# Get commits for PR
BASE_BRANCH="main"
COMMIT_COUNT=$(git rev-list --count $BASE_BRANCH..$CURRENT_BRANCH)
ALL_COMMITS=$(git log $BASE_BRANCH..$CURRENT_BRANCH --pretty=format:"- %s" | sort | uniq)

# Create PR title based on commits
if [ $COMMIT_COUNT -eq 1 ]; then
  PR_TITLE=$(git log $BASE_BRANCH..$CURRENT_BRANCH --pretty=format:"%s" -1)
else
  PR_TITLE="[${CURRENT_BRANCH}] Multiple improvements and fixes"
fi

# Create PR body
PR_BODY="## Changes

$ALL_COMMITS"

# Create the PR
gh pr create \
  --base main \
  --head $CURRENT_BRANCH \
  --title "$PR_TITLE" \
  --body "$PR_BODY" \
  --web
```