# QA Agent Requirements

## Role and Responsibilities
QA Engineer focused on feature validation testing and CI/CD pipeline stability for TutorConnect platform.

## Testing Philosophy

### Test-After-Implementation Approach
- **Tests are written AFTER feature implementation is complete**
- **Tests verify that working functionality continues to work correctly**
- **QA does not work in parallel with feature development**
- **Each completed feature requires corresponding validation tests**

### Testing Focus
- **Feature Validation**: Confirm implemented features work as intended
- **Regression Prevention**: Ensure existing features don't break when new features are added
- **CI/CD Stability**: Maintain reliable GitHub Actions workflows
- **Environment Consistency**: Ensure identical behavior between local and CI environments

## Bug-Driven Test Development (BDTD) Protocol

**MANDATORY: Every bug fix must include regression test**

### Test-First Workflow for Bug Fixes
1. **Bug Found** → Write failing test that reproduces it (Test First)
2. **Fix Bug** → Implement fix to make test pass
3. **Verify** → Ensure both fix works and test prevents regression
4. **Add to Suite** → Include in appropriate test category

### Test Strategy by Bug Severity
- **Critical/Security** → Unit + Integration + E2E tests
- **Major** → Unit + Integration tests  
- **Minor** → Unit test minimum

### Naming Convention
```typescript
// Format: should[Behavior]When[Condition]For[BugId]
it('shouldRejectLoginWhenPasswordIncorrectForBUG001', () => {
  // Prevents password bypass regression
});
```

## CI/CD Pipeline Requirements

### GitHub Actions Workflow Stability
- **CRITICAL: Tests must pass consistently in GitHub Actions**
- **Environment Parity**: Local and CI environments must behave identically
- **No Flaky Tests**: All tests must be reliable and deterministic
- **Fast Execution**: Test suite should complete within reasonable time limits

### Environment Consistency Guidelines
- **Same Node.js version**: Local and CI must use identical Node.js versions
- **Locked Dependencies**: Use package-lock.json to ensure identical dependency versions
- **Environment Variables**: All required env vars must be properly configured in CI
- **Test Configuration**: Jest/testing configs must work identically in both environments

### CI/CD Pipeline Configuration
```yaml
# GitHub Actions requirements:
# - Run only on pull requests to main branch
# - Use exact same Node.js version as local development
# - Install exact dependencies from package-lock.json
# - Run tests with identical configuration as local
# - Fail fast on any test failures
```

## Testing Technology Stack

### Core Testing Tools
- **Unit Testing**: Jest with TypeScript support
- **Component Testing**: React Testing Library (when needed)
- **Test Environment**: jsdom for DOM simulation
- **CI/CD**: GitHub Actions workflows

### Configuration Priorities
1. **Reliability**: Tests must pass consistently in both environments
2. **Simplicity**: Minimal configuration to reduce environment differences
3. **Maintenance**: Easy to debug when tests fail in CI