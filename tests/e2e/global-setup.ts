import { chromium, FullConfig } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

/**
 * Global setup for E2E tests
 * This runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('🔧 Running global E2E test setup...')

  // Initialize test database
  const prisma = new PrismaClient()
  
  try {
    // Clean up test data from previous runs
    await cleanupTestData(prisma)
    
    // Create test users and base data
    await seedTestData(prisma)
    
    console.log('✅ Test database initialized')
  } catch (error) {
    console.error('❌ Failed to initialize test database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }

  // Create authenticated browser context for tests that need it
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  // Login as test user and save auth state
  await page.goto('/auth/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  // Wait for successful login
  await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {
    console.warn('⚠️  Could not login test user - auth-required tests may fail')
  })

  // Save authenticated state
  await page.context().storageState({ path: 'tests/e2e/auth.json' })
  
  await browser.close()
  console.log('✅ Global setup completed')
}

/**
 * Clean up test data from previous runs
 */
async function cleanupTestData(prisma: PrismaClient) {
  // Delete test data in correct order to respect foreign key constraints
  await prisma.appointment.deleteMany({
    where: {
      OR: [
        { teacher: { email: { contains: 'test' } } },
        { student: { email: { contains: 'test' } } },
      ]
    }
  })
  
  await prisma.chatMessage.deleteMany({
    where: { 
      chat: { 
        post: { 
          user: { email: { contains: 'test' } } 
        } 
      } 
    }
  })
  
  await prisma.chat.deleteMany({
    where: { 
      post: { 
        user: { email: { contains: 'test' } } 
      } 
    }
  })
  
  await prisma.post.deleteMany({
    where: { user: { email: { contains: 'test' } } }
  })
  
  await prisma.user.deleteMany({
    where: { email: { contains: 'test' } }
  })
}

/**
 * Seed test data for E2E tests
 */
async function seedTestData(prisma: PrismaClient) {
  const bcrypt = await import('bcryptjs')
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create test users
  const testTeacher = await prisma.user.create({
    data: {
      email: 'test-teacher@example.com',
      password: hashedPassword,
      name: 'Test Teacher',
      region: 'Oslo',
      postalCode: '0150',
      isActive: true,
      emailVerified: new Date(),
      userType: 'TEACHER',
    }
  })

  const testStudent = await prisma.user.create({
    data: {
      email: 'test-student@example.com',
      password: hashedPassword,
      name: 'Test Student',
      region: 'Bergen',
      postalCode: '5001',
      isActive: true,
      emailVerified: new Date(),
      userType: 'STUDENT',
    }
  })

  // Create general test user
  await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      region: 'Trondheim',
      postalCode: '7001',
      isActive: true,
      emailVerified: new Date(),
      userType: 'TEACHER',
    }
  })

  // Create test posts
  await prisma.post.create({
    data: {
      title: 'Math Tutoring Available - E2E Test',
      description: 'Experienced mathematics tutor available for students',
      subject: 'Mathematics',
      type: 'OFFERING',
      pricePerHour: 500,
      location: 'Oslo',
      userId: testTeacher.id,
    }
  })

  await prisma.post.create({
    data: {
      title: 'Looking for English Teacher - E2E Test',
      description: 'Need help with English grammar and writing',
      subject: 'English',
      type: 'SEEKING',
      pricePerHour: 400,
      location: 'Bergen',
      userId: testStudent.id,
    }
  })

  console.log('✅ Test data seeded')
}

export default globalSetup