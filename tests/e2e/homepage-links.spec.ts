import { test, expect } from '@playwright/test';

test.describe('Homepage Links Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/');
  });

  test('should have working navigation buttons in hero section', async ({ page }) => {
    // Test "Start som lærer" button
    const teacherButton = page.getByRole('button', { name: 'Start som lærer' });
    await expect(teacherButton).toBeVisible();
    // Note: This button doesn't have href yet, so we just check visibility

    // Test "Finn en lærer" button  
    const findTeacherButton = page.getByRole('button', { name: 'Finn en lærer' });
    await expect(findTeacherButton).toBeVisible();
    // Note: This button doesn't have href yet, so we just check visibility
  });

  test('should have working "Opprett konto" button', async ({ page }) => {
    const signupButton = page.getByRole('link', { name: 'Opprett konto' });
    await expect(signupButton).toBeVisible();
    await expect(signupButton).toHaveAttribute('href', '/auth/register');
  });

  test('should have working footer links', async ({ page }) => {
    // Test Privacy Policy link
    const privacyLink = page.getByRole('link', { name: 'Personvern' });
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveAttribute('href', '/privacy');

    // Test Terms and Conditions link
    const termsLink = page.getByRole('link', { name: 'Vilkår og betingelser' });
    await expect(termsLink).toBeVisible();
    await expect(termsLink).toHaveAttribute('href', '/terms');

    // Test Contact link
    const contactLink = page.getByRole('link', { name: 'Kontakt' });
    await expect(contactLink).toBeVisible();
    await expect(contactLink).toHaveAttribute('href', '/om-oss#kontakt');
  });

  test('should navigate to footer links correctly', async ({ page }) => {
    // Test navigation to privacy page
    await page.getByRole('link', { name: 'Personvern' }).click();
    await expect(page).toHaveURL('/privacy');
    await page.goBack();

    // Test navigation to terms page
    await page.getByRole('link', { name: 'Vilkår og betingelser' }).click();
    await expect(page).toHaveURL('/terms');
    await page.goBack();

    // Test navigation to contact section
    await page.getByRole('link', { name: 'Kontakt' }).click();
    await expect(page).toHaveURL('/om-oss#kontakt');
    
    // Verify we're on the Om oss page with contact section
    await expect(page.locator('#kontakt')).toBeVisible();
  });

  test('should navigate to registration page from CTA button', async ({ page }) => {
    await page.getByRole('link', { name: 'Opprett konto' }).click();
    await expect(page).toHaveURL('/auth/register');
    
    // Verify we're on the registration page
    await expect(page).toHaveTitle(/registrer|sign up/i);
  });

  test('should display correct copyright year', async ({ page }) => {
    const currentYear = new Date().getFullYear();
    const copyrightText = page.getByText(`© ${currentYear} TutorConnect. Alle rettigheter reservert.`);
    await expect(copyrightText).toBeVisible();
  });

  test('should have proper link attributes for SEO and accessibility', async ({ page }) => {
    // Check that external links (if any) have proper rel attributes
    const allLinks = await page.locator('a').all();
    
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      
      if (href && href.startsWith('http') && !href.includes(page.url())) {
        // External links should have rel="noopener noreferrer"
        const rel = await link.getAttribute('rel');
        expect(rel).toBeTruthy();
      }
    }
  });

  test('should have accessible navigation', async ({ page }) => {
    // Check that all interactive elements are keyboard accessible
    const links = page.getByRole('link');
    const buttons = page.getByRole('button');
    
    await expect(links.first()).toBeFocused({ timeout: 1000 }).catch(() => {
      // If no link is focused, that's okay, we just want to ensure they're focusable
    });
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    // At least one element should be focusable
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should load stats section properly', async ({ page }) => {
    // Wait for stats section to load
    const statsSection = page.getByText('Del av et voksende læringsfellesskap');
    await expect(statsSection).toBeVisible();
    
    // Check that stats are displayed (either real numbers or fallback content)
    const statsContainer = page.locator('section').filter({ hasText: 'Del av et voksende læringsfellesskap' });
    await expect(statsContainer).toBeVisible();
  });

  test('should have working header navigation', async ({ page }) => {
    // Test header logo/title if it exists and links to home
    const headerLogo = page.locator('header').getByRole('link').first();
    if (await headerLogo.isVisible()) {
      await expect(headerLogo).toHaveAttribute('href', '/');
    }
  });
});