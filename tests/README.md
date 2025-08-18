# TutorConnect Testing Guide

This document provides comprehensive guidelines for testing the TutorConnect platform. Our testing strategy covers unit tests, integration tests, and end-to-end tests to ensure a high-quality, reliable application for Norwegian tutors and students.

## Testing Framework Overview

### Technology Stack
- **Unit & Integration Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
- **Database**: PostgreSQL (separate test database)
- **CI/CD**: GitHub Actions
- **Coverage**: Built-in Jest coverage reports

### Test Structure
```
tests/
├── unit/                 # Component and function unit tests
├── integration/          # API and service integration tests
├── e2e/                 # End-to-end user journey tests
├── fixtures/            # Test data and utilities
└── utils/               # Test helper functions
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Environment variables configured

### Installation
```bash
# Install dependencies (already done during project setup)
npm install

# Setup test database
npm run test:db:setup

# Install Playwright browsers (if not already installed)
npx playwright install
```

### Running Tests

```bash
# Run all unit tests
npm run test:unit

# Run all integration tests
npm run test:integration

# Run all E2E tests
npm run test:e2e

# Run all tests
npm run test:all

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# E2E tests with UI (for debugging)
npm run test:e2e:ui
```

## Unit Testing

### Guidelines
- **Focus**: Individual components and functions
- **Isolation**: Mock external dependencies
- **Coverage**: Aim for >80% coverage on business logic
- **Speed**: Tests should run quickly (< 1s each)

### Example Unit Test
```typescript
import { render, screen } from '../../utils/test-utils'
import Header from '../../../src/components/layout/Header'

describe('Header Component', () => {
  it('renders logo and navigation', () => {
    render(<Header onMenuClick={jest.fn()} />)
    
    expect(screen.getByText('TutorConnect')).toBeInTheDocument()
    expect(screen.getByLabelText('Hovednavigasjon')).toBeInTheDocument()
  })
})
```

### What to Test
- Component rendering
- User interactions
- Conditional rendering
- Accessibility features
- Error handling
- Props validation

### Test Utilities
Use the custom `render` function from `tests/utils/test-utils.tsx` which includes:
- User event setup
- Common providers
- Mock data generators

## Integration Testing

### Guidelines
- **Focus**: API endpoints and service interactions
- **Database**: Use test database with seeded data
- **Mocking**: Mock external services (email, file storage)
- **Authentication**: Test both authenticated and unauthenticated flows

### Example Integration Test
```typescript
import { POST } from '../../../../src/app/api/auth/login/route'
import { createMockUser } from '../../utils/test-utils'

describe('/api/auth/login', () => {
  it('should authenticate valid user', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.accessToken).toBeDefined()
  })
})
```

### Database Testing
- Use `TestDataSeeder` for consistent test data
- Clean database between test suites
- Use transactions where possible for isolation

## End-to-End Testing

### Guidelines
- **Focus**: Complete user journeys
- **Real Browser**: Tests run in actual browser environments
- **Data**: Uses seeded test data in isolated database
- **Cross-browser**: Tests run on Chrome, Firefox, Safari

### Example E2E Test
```typescript
import { test, expect } from '@playwright/test'

test('user can complete tutoring booking flow', async ({ page }) => {
  // Login as student
  await page.goto('/auth/login')
  await page.fill('[name="email"]', 'student@test.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  // Search for math tutor
  await page.goto('/posts')
  await page.fill('[name="search"]', 'matematikk')
  await page.click('button[type="submit"]')

  // Book appointment
  await page.click('.post-card:first-child .book-button')
  await page.selectOption('[name="time"]', '2024-12-25T14:00:00')
  await page.click('button:has-text("Bekreft booking")')

  // Verify confirmation
  await expect(page.getByText('Booking bekreftet')).toBeVisible()
})
```

### Test Data Management
- Global setup seeds test data
- Each test suite can add specific data
- Global teardown cleans up all test data

### Page Object Pattern
For complex E2E tests, consider using page objects:

```typescript
class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email)
    await this.page.fill('[name="password"]', password)
    await this.page.click('button[type="submit"]')
  }
}
```

## Testing Best Practices

### General Principles
1. **Test Behavior, Not Implementation**: Focus on what the user sees and does
2. **Write Tests First**: TDD approach for new features
3. **Keep Tests Simple**: One assertion per test when possible
4. **Use Descriptive Names**: Test names should explain the scenario
5. **Arrange-Act-Assert**: Structure tests clearly

### Norwegian-Specific Considerations
- Test Norwegian language content and characters (æ, ø, å)
- Validate Norwegian address and postal code formats
- Test timezone handling (CET/CEST)
- Verify GDPR compliance in data handling

### Accessibility Testing
- Always include accessibility assertions
- Test keyboard navigation
- Verify ARIA labels and roles
- Test screen reader compatibility

### Error Scenarios
- Always test error conditions
- Verify error messages are user-friendly and in Norwegian
- Test network failures and timeouts
- Validate form validation errors

## Continuous Integration

### GitHub Actions
Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Nightly builds (for E2E stability)

### Test Stages
1. **Lint & Type Check**: Code quality validation
2. **Unit Tests**: Fast feedback on component logic
3. **Integration Tests**: API and service validation
4. **Build Check**: Ensure application builds successfully
5. **E2E Tests**: Full user journey validation
6. **Security Audit**: Dependency vulnerability scanning

### Coverage Requirements
- **Minimum**: 70% coverage for all metrics
- **Target**: 80%+ coverage for business logic
- **Critical Paths**: 100% coverage for authentication and payment flows

### Failure Handling
- Unit/Integration test failures block deployment
- E2E test failures trigger alerts but don't block (due to potential flakiness)
- Coverage drops below threshold block deployment

## Test Data Management

### Fixtures
Use `tests/fixtures/seed-data.ts` for:
- Consistent test users
- Standard post templates  
- Common appointment scenarios

### Database Seeding
```bash
# Setup fresh test data
npm run test:db:reset

# Clean test data only
npm run test:db:clean
```

### Mock Services
- Email service (uses Ethereal for testing)
- File uploads (mocked in unit tests)
- External APIs (rate limiting, payment processing)

## Debugging Tests

### Unit Tests
```bash
# Debug specific test file
npm run test:watch -- tests/unit/components/Header.test.tsx

# Debug with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### E2E Tests
```bash
# Run with browser visible
npm run test:e2e:headed

# Run with Playwright UI
npm run test:e2e:ui

# Debug specific test
npx playwright test --debug tests/e2e/auth.spec.ts
```

### Common Issues
- **Path Resolution**: Ensure `@/` alias is properly configured
- **Module Mocking**: Mock external dependencies early in test setup
- **Async Operations**: Always await async operations and use proper timeouts
- **Database State**: Ensure proper cleanup between tests

## Performance Testing

### Load Testing
While not in the current setup, consider adding k6 for:
- API endpoint performance
- Database query optimization
- Real-time features (chat, notifications)

### Bundle Analysis
```bash
npm run analyze
```

## Maintenance

### Regular Tasks
- Update test snapshots when UI changes
- Review and update test data periodically
- Monitor flaky tests and address root causes
- Update browser versions for E2E tests

### Code Reviews
- All test changes require peer review
- New features require corresponding tests
- Coverage reports reviewed in PRs
- E2E tests should be reviewed by QA team

## Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)

### Team Contacts
- QA Lead: Responsible for testing strategy
- Backend Team: API integration test support
- Frontend Team: Component testing guidance
- Security Team: Security testing requirements

---

For questions or issues with testing, please refer to this guide first, then reach out to the development team through our established communication channels.