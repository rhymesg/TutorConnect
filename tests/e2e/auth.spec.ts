import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test at the homepage
    await page.goto('/')
  })

  test('should display login and register buttons for unauthenticated users', async ({ page }) => {
    // Check that the header shows login/register options
    await expect(page.getByText('Logg inn')).toBeVisible()
    await expect(page.getByText('Registrer deg')).toBeVisible()
    
    // Check that authenticated features are not visible
    await expect(page.getByPlaceholder('Søk etter lærere eller studenter...')).not.toBeVisible()
  })

  test('should navigate to login page from header', async ({ page }) => {
    await page.click('text=Logg inn')
    await expect(page).toHaveURL('/auth/login')
    
    // Check that login form is displayed
    await expect(page.getByRole('heading', { name: /logg inn/i })).toBeVisible()
    await expect(page.getByLabel('E-post')).toBeVisible()
    await expect(page.getByLabel('Passord')).toBeVisible()
  })

  test('should navigate to register page from header', async ({ page }) => {
    await page.click('text=Registrer deg')
    await expect(page).toHaveURL('/auth/register')
    
    // Check that registration form is displayed
    await expect(page.getByRole('heading', { name: /registrer/i })).toBeVisible()
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login')
    
    // Fill login form
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL('/dashboard')
    
    // Check that authenticated header is displayed
    await expect(page.getByLabel('Brukermeny')).toBeVisible()
    await expect(page.getByLabel('Vis varsler')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Try to login with invalid credentials
    await page.fill('[name="email"]', 'invalid@example.com')
    await page.fill('[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.getByText(/feil brukernavn eller passord/i)).toBeVisible()
    
    // Should stay on login page
    await expect(page).toHaveURL('/auth/login')
  })

  test('should show validation errors for invalid email format', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Enter invalid email format
    await page.fill('[name="email"]', 'invalid-email')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should show validation error
    await expect(page.getByText(/ugyldig e-postformat/i)).toBeVisible()
  })

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/auth/login')
    
    const passwordInput = page.getByLabel('Passord')
    const toggleButton = page.getByRole('button', { name: /vis passord/i })
    
    // Password should be hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click toggle button
    await toggleButton.click()
    
    // Password should now be visible
    await expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click toggle button again
    await toggleButton.click()
    
    // Password should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should handle remember me checkbox', async ({ page }) => {
    await page.goto('/auth/login')
    
    const rememberCheckbox = page.getByLabel(/husk meg/i)
    
    // Checkbox should not be checked by default
    await expect(rememberCheckbox).not.toBeChecked()
    
    // Check the checkbox
    await rememberCheckbox.check()
    await expect(rememberCheckbox).toBeChecked()
    
    // Fill and submit form
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should successfully login
    await expect(page).toHaveURL('/dashboard')
  })

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
    
    // Open user menu
    await page.click('[aria-label="Brukermeny"]')
    
    // Click logout
    await page.click('text=Logg ut')
    
    // Should redirect to homepage
    await expect(page).toHaveURL('/')
    
    // Should show unauthenticated header
    await expect(page.getByText('Logg inn')).toBeVisible()
    await expect(page.getByText('Registrer deg')).toBeVisible()
  })

  test('should redirect unauthenticated users from protected pages', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard')
    
    // Should redirect to login page
    await expect(page).toHaveURL(/\/auth\/login/)
    
    // Should show message about needing to login
    await expect(page.getByText(/logg inn for å fortsette/i)).toBeVisible()
  })

  test('should persist authentication across page reloads', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
    
    // Reload page
    await page.reload()
    
    // Should still be authenticated
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByLabel('Brukermeny')).toBeVisible()
  })
})