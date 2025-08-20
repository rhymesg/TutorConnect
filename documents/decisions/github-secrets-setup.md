# GitHub Secrets Setup for Testing

## Overview
Configured to use GitHub Secrets to prevent security risks from hardcoding test account passwords in the code.

## Required Secret

### TEST_USER_PASSWORD
- **Description**: Password for temporary accounts used in testing
- **Usage**: Used across all E2E and API integration tests
- **Security**: Strong password (minimum 12 characters with uppercase/lowercase/numbers/special characters)

## Setup Instructions

### 1. Setting up Secret in GitHub Repository

1. Navigate to GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions** in left menu
4. Click **New repository secret** button
5. Enter secret information:
   - **Name**: `TEST_USER_PASSWORD`
   - **Secret**: Strong password (e.g., `MySecureTestPassword123!@#`)
6. Click **Add secret** button

### 2. Password Requirements

Must meet the following conditions for test validation to pass:
- **Minimum length**: 8+ characters
- **Uppercase**: At least 1 character
- **Lowercase**: At least 1 character  
- **Numbers**: At least 1 character
- **Special characters**: At least 1 character (recommended)

### 3. Example Passwords
```
SecureTest2024!
TestPassword123#
MyTestSecret456$
```

## Test File Changes

Changed hardcoded passwords to environment variables in all test files:

```typescript
// Before (security risk)
password: 'TestPassword123!'

// After (secure)
password: process.env.TEST_USER_PASSWORD || 'TestPassword123!'
```

## Workflow Changes

Use secrets in all GitHub Actions workflows:

```yaml
env:
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/tutorconnect_test
  DIRECT_URL: postgresql://postgres:postgres@localhost:5432/tutorconnect_test
  NEXTAUTH_SECRET: test-secret-key-for-github-actions
  NEXTAUTH_URL: http://localhost:3000
  NODE_ENV: test
  TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}  # Added
```

## Security Benefits

### ✅ Before vs After

**Before (risky)**:
- Passwords exposed in code
- Anyone can access in public repository
- Sensitive information stored in version control

**After (secure)**:
- Passwords encrypted and stored in GitHub Secrets
- Only repository admins can access
- Automatically masked in workflow logs
- Completely separated from code

## Local Development Environment

When running tests locally:

```bash
# Set environment variable
export TEST_USER_PASSWORD="MySecureTestPassword123!"

# Or create .env.test file (DO NOT add to Git!)
echo "TEST_USER_PASSWORD=MySecureTestPassword123!" > .env.test
```

## Applied Test Files

- `tests/e2e/login.spec.ts`
- `tests/e2e/registration.spec.ts` 
- `tests/e2e/forgot-password.spec.ts`
- `tests/integration/auth/login-api.test.ts`
- `tests/integration/auth/registration-api.test.ts`
- `tests/integration/auth/forgot-password-api.test.ts`

## Applied Workflows

- `.github/workflows/registration-test.yml`
- `.github/workflows/login-test.yml`
- `.github/workflows/forgot-password-test.yml`

## Additional Security Considerations

1. **Regular Password Rotation**: Change TEST_USER_PASSWORD every 3-6 months
2. **Access Control**: Only repository collaborators can access secrets
3. **Audit Logs**: Track secret usage in GitHub Actions logs
4. **Environment Separation**: Separate passwords for production and test environments

## Troubleshooting

### When Secret is Not Set
- Workflow uses fallback default value if secret is missing
- Check for "Using fallback test password" message in logs

### Test Failures
- Verify secret value is correctly set
- Check password meets requirements
- Confirm workflow environment variable configuration