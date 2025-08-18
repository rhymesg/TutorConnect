import { FullConfig } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

/**
 * Global teardown for E2E tests
 * This runs once after all tests
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Running global E2E test teardown...')

  // Clean up test database
  const prisma = new PrismaClient()
  
  try {
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
    
    console.log('✅ Test data cleaned up')
  } catch (error) {
    console.error('❌ Failed to clean up test database:', error)
  } finally {
    await prisma.$disconnect()
  }

  // Clean up auth state file
  try {
    if (fs.existsSync('tests/e2e/auth.json')) {
      fs.unlinkSync('tests/e2e/auth.json')
    }
  } catch (error) {
    console.warn('⚠️  Could not remove auth state file:', error)
  }

  console.log('✅ Global teardown completed')
}

export default globalTeardown