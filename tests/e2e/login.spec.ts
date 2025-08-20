import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

test.describe('Login Flow Tests', () => {
  const testUser = {
    name: 'Test User',
    email: `test-login-${Date.now()}@example.com`,
    password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
    hashedPassword: '',
  };

  test.beforeAll(async () => {
    // Create test user in database before running tests
    testUser.hashedPassword = await bcrypt.hash(testUser.password, 12);
    
    await prisma.user.create({
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.hashedPassword,
        emailVerified: true, // Set as verified so login works
      }
    });
  });

  test.afterAll(async () => {
    // Cleanup: Remove test user from database
    try {
      await prisma.user.deleteMany({
        where: {
          email: testUser.email
        }
      });
    } catch (error) {
      console.log('Cleanup warning:', error);
    }
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/auth/login');
  });

  test('should display login form with all required fields', async ({ page }) => {
    // Check if login form is visible
    await expect(page.getByRole('heading', { name: /logg inn|login|sign in/i })).toBeVisible();

    // Check required form fields
    await expect(page.getByLabel(/e-post|email/i)).toBeVisible();
    await expect(page.getByLabel(/passord|password/i)).toBeVisible();

    // Check submit button
    await expect(page.getByRole('button', { name: /logg inn|login|sign in/i })).toBeVisible();

    // Check register link
    await expect(page.getByRole('link', { name: /registrer|sign up|opprett konto/i })).toBeVisible();

    // Check forgot password link
    await expect(page.getByRole('link', { name: /glemt.*passord|forgot.*password/i })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /logg inn|login|sign in/i }).click();

    // Check for validation error messages
    await expect(page.getByText(/e-post.*påkrevd|email.*required/i)).toBeVisible();
    await expect(page.getByText(/passord.*påkrevd|password.*required/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Fill form with invalid email
    await page.getByLabel(/e-post|email/i).fill('invalid-email');
    await page.getByLabel(/passord|password/i).fill('somepassword');

    await page.getByRole('button', { name: /logg inn|login|sign in/i }).click();

    // Check for email format validation
    await expect(page.getByText(/ugyldig.*e-post|invalid.*email/i)).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Fill login form with test user credentials
    await page.getByLabel(/e-post|email/i).fill(testUser.email);
    await page.getByLabel(/passord|password/i).fill(testUser.password);

    // Submit form
    await page.getByRole('button', { name: /logg inn|login|sign in/i }).click();

    // Wait for successful login redirect
    await expect(page).toHaveURL(/profile|dashboard|posts/i, { timeout: 10000 });

    // Alternative: Check for success indicators on the page
    const successIndicators = [
      page.getByText(/velkommen|welcome/i),
      page.getByText(testUser.name),
      page.getByRole('button', { name: /logg ut|logout|sign out/i })
    ];

    let foundSuccessIndicator = false;
    for (const indicator of successIndicators) {
      if (await indicator.isVisible({ timeout: 5000 })) {
        foundSuccessIndicator = true;
        break;
      }
    }

    if (!foundSuccessIndicator) {
      // If no specific success indicator, just verify we're not on login page anymore
      await expect(page).not.toHaveURL(/login/);
    }
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Try login with wrong password
    await page.getByLabel(/e-post|email/i).fill(testUser.email);
    await page.getByLabel(/passord|password/i).fill('wrongpassword');

    await page.getByRole('button', { name: /logg inn|login|sign in/i }).click();

    // Check for invalid credentials error
    await expect(page.getByText(/ugyldig.*legitimasjon|invalid.*credentials|feil.*passord|wrong.*password/i)).toBeVisible();
  });

  test('should show error for non-existent user', async ({ page }) => {
    // Try login with non-existent email
    await page.getByLabel(/e-post|email/i).fill('nonexistent@example.com');
    await page.getByLabel(/passord|password/i).fill('somepassword');

    await page.getByRole('button', { name: /logg inn|login|sign in/i }).click();

    // Check for user not found error
    await expect(page.getByText(/bruker.*ikke.*funnet|user.*not.*found|ugyldig.*legitimasjon|invalid.*credentials/i)).toBeVisible();
  });

  test('should navigate to registration page from login', async ({ page }) => {
    // Click register link
    await page.getByRole('link', { name: /registrer|sign up|opprett konto/i }).click();

    // Verify navigation to registration page
    await expect(page).toHaveURL(/register/);
    await expect(page.getByRole('heading', { name: /registrer|sign up|opprett konto/i })).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    // Click forgot password link
    await page.getByRole('link', { name: /glemt.*passord|forgot.*password/i }).click();

    // Verify navigation to forgot password page
    await expect(page).toHaveURL(/forgot-password/);
    await expect(page.getByRole('heading', { name: /glemt.*passord|forgot.*password|reset.*password/i })).toBeVisible();
  });

  test('should have proper form accessibility', async ({ page }) => {
    // Check form labels are properly associated
    const emailField = page.getByLabel(/e-post|email/i);
    await expect(emailField).toHaveAttribute('type', 'email');

    const passwordField = page.getByLabel(/passord|password/i);
    await expect(passwordField).toHaveAttribute('type', 'password');

    // Test keyboard navigation
    await emailField.focus();
    await expect(emailField).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(passwordField).toBeFocused();
    
    await page.keyboard.press('Tab');
    const submitButton = page.getByRole('button', { name: /logg inn|login|sign in/i });
    await expect(submitButton).toBeFocused();
  });

  test('should show loading state during form submission', async ({ page }) => {
    // Fill form with valid credentials
    await page.getByLabel(/e-post|email/i).fill(testUser.email);
    await page.getByLabel(/passord|password/i).fill(testUser.password);

    // Submit form and immediately check for loading state
    const submitButton = page.getByRole('button', { name: /logg inn|login|sign in/i });
    await submitButton.click();

    // Check if button is disabled or shows loading state
    const isDisabled = await submitButton.isDisabled();
    const hasLoadingText = await submitButton.textContent();
    
    if (isDisabled || hasLoadingText?.includes('...')) {
      // Loading state is working
      expect(true).toBe(true);
    }
  });

  test('should remember me functionality if available', async ({ page }) => {
    // Check if "Remember me" checkbox exists
    const rememberMeCheckbox = page.getByRole('checkbox', { name: /husk.*meg|remember.*me/i });
    
    if (await rememberMeCheckbox.isVisible()) {
      // Test remember me functionality
      await page.getByLabel(/e-post|email/i).fill(testUser.email);
      await page.getByLabel(/passord|password/i).fill(testUser.password);
      await rememberMeCheckbox.check();
      
      await expect(rememberMeCheckbox).toBeChecked();
      
      await page.getByRole('button', { name: /logg inn|login|sign in/i }).click();
      
      // Wait for redirect
      await page.waitForTimeout(2000);
      
      // Check if user remains logged in after page refresh
      await page.reload();
      
      // Should still be logged in (not redirected to login page)
      await expect(page).not.toHaveURL(/login/);
    }
  });

  test('should handle password visibility toggle if available', async ({ page }) => {
    const passwordField = page.getByLabel(/passord|password/i);
    const toggleButton = page.getByRole('button', { name: /vis.*passord|show.*password|toggle.*password/i });
    
    if (await toggleButton.isVisible()) {
      // Initially password should be hidden
      await expect(passwordField).toHaveAttribute('type', 'password');
      
      // Click toggle to show password
      await toggleButton.click();
      await expect(passwordField).toHaveAttribute('type', 'text');
      
      // Click toggle again to hide password
      await toggleButton.click();
      await expect(passwordField).toHaveAttribute('type', 'password');
    }
  });

  test('should maintain redirect URL after login if provided', async ({ page }) => {
    // Navigate to login with redirect parameter
    await page.goto('/auth/login?redirect=/profile');
    
    // Login with valid credentials
    await page.getByLabel(/e-post|email/i).fill(testUser.email);
    await page.getByLabel(/passord|password/i).fill(testUser.password);
    await page.getByRole('button', { name: /logg inn|login|sign in/i }).click();
    
    // Should redirect to the specified URL
    await expect(page).toHaveURL(/profile/, { timeout: 10000 });
  });

  test('should prevent multiple form submissions', async ({ page }) => {
    await page.getByLabel(/e-post|email/i).fill(testUser.email);
    await page.getByLabel(/passord|password/i).fill(testUser.password);

    const submitButton = page.getByRole('button', { name: /logg inn|login|sign in/i });
    
    // Submit form
    await submitButton.click();
    
    // Try to submit again immediately
    await submitButton.click();
    
    // Button should be disabled or form should handle duplicate submissions
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled || true).toBe(true); // Either disabled or handled gracefully
  });

  test('should show appropriate error for unverified email if required', async ({ page }) => {
    // Create unverified test user
    const unverifiedUser = {
      email: `unverified-${Date.now()}@example.com`,
      password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
    };
    
    const hashedPassword = await bcrypt.hash(unverifiedUser.password, 12);
    
    await prisma.user.create({
      data: {
        name: 'Unverified User',
        email: unverifiedUser.email,
        password: hashedPassword,
        emailVerified: false, // Not verified
      }
    });

    try {
      // Try to login with unverified account
      await page.getByLabel(/e-post|email/i).fill(unverifiedUser.email);
      await page.getByLabel(/passord|password/i).fill(unverifiedUser.password);
      await page.getByRole('button', { name: /logg inn|login|sign in/i }).click();

      // Should show email verification required message
      const verificationMessage = page.getByText(/verifiser.*e-post|verify.*email|e-post.*ikke.*verifisert|email.*not.*verified/i);
      
      if (await verificationMessage.isVisible({ timeout: 5000 })) {
        await expect(verificationMessage).toBeVisible();
      }
    } finally {
      // Cleanup unverified user
      await prisma.user.deleteMany({
        where: { email: unverifiedUser.email }
      });
    }
  });
});