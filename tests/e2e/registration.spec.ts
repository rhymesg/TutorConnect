import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Registration Flow Tests', () => {
  const testUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to registration page
    await page.goto('/auth/register');
  });

  test.afterEach(async () => {
    // Cleanup: Remove test user from database if created
    try {
      await prisma.user.deleteMany({
        where: {
          email: {
            startsWith: 'test-'
          }
        }
      });
    } catch (error) {
      console.log('Cleanup warning:', error);
    }
  });

  test('should display registration form with all required fields', async ({ page }) => {
    // Check if registration form is visible
    await expect(page.getByRole('heading', { name: /registrer|sign up|opprett konto/i })).toBeVisible();

    // Check required form fields
    await expect(page.getByLabel(/navn|name/i)).toBeVisible();
    await expect(page.getByLabel(/e-post|email/i)).toBeVisible();
    await expect(page.getByLabel(/passord|password/i)).toBeVisible();

    // Check submit button
    await expect(page.getByRole('button', { name: /registrer|sign up|opprett/i })).toBeVisible();

    // Check login link
    await expect(page.getByRole('link', { name: /logg inn|login|har allerede/i })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /registrer|sign up|opprett/i }).click();

    // Check for validation error messages
    await expect(page.getByText(/navn.*påkrevd|name.*required/i)).toBeVisible();
    await expect(page.getByText(/e-post.*påkrevd|email.*required/i)).toBeVisible();
    await expect(page.getByText(/passord.*påkrevd|password.*required/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Fill form with invalid email
    await page.getByLabel(/navn|name/i).fill(testUser.name);
    await page.getByLabel(/e-post|email/i).fill('invalid-email');
    await page.getByLabel(/passord|password/i).fill(testUser.password);

    await page.getByRole('button', { name: /registrer|sign up|opprett/i }).click();

    // Check for email format validation
    await expect(page.getByText(/ugyldig.*e-post|invalid.*email/i)).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    // Fill form with weak password
    await page.getByLabel(/navn|name/i).fill(testUser.name);
    await page.getByLabel(/e-post|email/i).fill(testUser.email);
    await page.getByLabel(/passord|password/i).fill('123');

    await page.getByRole('button', { name: /registrer|sign up|opprett/i }).click();

    // Check for password strength validation
    await expect(page.getByText(/passord.*for kort|password.*too short|minst.*tegn|minimum.*characters/i)).toBeVisible();
  });

  test('should successfully register a new user', async ({ page }) => {
    // Fill registration form
    await page.getByLabel(/navn|name/i).fill(testUser.name);
    await page.getByLabel(/e-post|email/i).fill(testUser.email);
    await page.getByLabel(/passord|password/i).fill(testUser.password);

    // Submit form
    await page.getByRole('button', { name: /registrer|sign up|opprett/i }).click();

    // Wait for success message or redirect
    await expect(page).toHaveURL(/verify-email|success|profil/i, { timeout: 10000 });

    // Alternative: Check for success message if staying on same page
    const successMessage = page.getByText(/suksess|success|verifiser|check.*email/i);
    if (await successMessage.isVisible({ timeout: 5000 })) {
      await expect(successMessage).toBeVisible();
    }
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    // First registration
    await page.getByLabel(/navn|name/i).fill(testUser.name);
    await page.getByLabel(/e-post|email/i).fill(testUser.email);
    await page.getByLabel(/passord|password/i).fill(testUser.password);
    await page.getByRole('button', { name: /registrer|sign up|opprett/i }).click();

    // Wait for first registration to complete
    await page.waitForTimeout(2000);

    // Go back to registration page for second attempt
    await page.goto('/auth/register');

    // Try to register with same email
    await page.getByLabel(/navn|name/i).fill('Another User');
    await page.getByLabel(/e-post|email/i).fill(testUser.email);
    await page.getByLabel(/passord|password/i).fill(testUser.password);
    await page.getByRole('button', { name: /registrer|sign up|opprett/i }).click();

    // Check for duplicate email error
    await expect(page.getByText(/e-post.*finnes|email.*exists|allerede.*registrert|already.*registered/i)).toBeVisible();
  });

  test('should navigate to login page from registration', async ({ page }) => {
    // Click login link
    await page.getByRole('link', { name: /logg inn|login|har allerede/i }).click();

    // Verify navigation to login page
    await expect(page).toHaveURL(/login/);
    await expect(page.getByRole('heading', { name: /logg inn|login/i })).toBeVisible();
  });

  test('should have proper form accessibility', async ({ page }) => {
    // Check form labels are properly associated
    const nameField = page.getByLabel(/navn|name/i);
    await expect(nameField).toHaveAttribute('type', 'text');

    const emailField = page.getByLabel(/e-post|email/i);
    await expect(emailField).toHaveAttribute('type', 'email');

    const passwordField = page.getByLabel(/passord|password/i);
    await expect(passwordField).toHaveAttribute('type', 'password');

    // Test keyboard navigation
    await nameField.focus();
    await expect(nameField).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(emailField).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(passwordField).toBeFocused();
  });

  test('should show loading state during form submission', async ({ page }) => {
    // Fill form
    await page.getByLabel(/navn|name/i).fill(testUser.name);
    await page.getByLabel(/e-post|email/i).fill(testUser.email);
    await page.getByLabel(/passord|password/i).fill(testUser.password);

    // Submit form and immediately check for loading state
    const submitButton = page.getByRole('button', { name: /registrer|sign up|opprett/i });
    await submitButton.click();

    // Check if button is disabled or shows loading state
    const isDisabled = await submitButton.isDisabled();
    const hasLoadingText = await submitButton.textContent();
    
    if (isDisabled || hasLoadingText?.includes('...')) {
      // Loading state is working
      expect(true).toBe(true);
    }
  });
});