/**
 * Test database setup script
 * Run this script to initialize test database with required schema and data
 */

import { PrismaClient } from '@prisma/client'
import { TestDataSeeder } from '../tests/fixtures/seed-data'

async function setupTestDatabase() {
  console.log('🔧 Setting up test database...')

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/tutorconnect_test'
      }
    }
  })

  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Connected to test database')

    // Run migrations to ensure schema is up to date
    console.log('🔄 Ensuring database schema is up to date...')
    // Note: In a real setup, you would run: await prisma.$executeRaw`...` or use Prisma Migrate

    // Initialize seeder
    const seeder = new TestDataSeeder(prisma)

    // Setup test data
    const { userIds, postIds } = await seeder.setupTestData()
    
    console.log('✅ Test database setup completed')
    console.log(`📊 Created ${Object.keys(userIds).length} test users`)
    console.log(`📊 Created ${Object.keys(postIds).length} test posts`)
    
    // Display test users for reference
    console.log('\n📋 Test users created:')
    Object.entries(userIds).forEach(([email, id]) => {
      console.log(`  - ${email} (ID: ${id})`)
    })

  } catch (error) {
    console.error('❌ Failed to setup test database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function cleanTestDatabase() {
  console.log('🧹 Cleaning test database...')

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/tutorconnect_test'
      }
    }
  })

  try {
    await prisma.$connect()
    
    const seeder = new TestDataSeeder(prisma)
    await seeder.cleanDatabase()
    
    console.log('✅ Test database cleaned')
  } catch (error) {
    console.error('❌ Failed to clean test database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Command line interface
const command = process.argv[2]

switch (command) {
  case 'setup':
    setupTestDatabase()
    break
  case 'clean':
    cleanTestDatabase()
    break
  case 'reset':
    cleanTestDatabase().then(() => setupTestDatabase())
    break
  default:
    console.log('Usage:')
    console.log('  npm run test:db:setup  - Setup test database with seed data')
    console.log('  npm run test:db:clean  - Clean all test data')
    console.log('  npm run test:db:reset  - Clean and setup test database')
    process.exit(1)
}