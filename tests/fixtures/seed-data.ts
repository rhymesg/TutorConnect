/**
 * Test data fixtures and seeding utilities
 * Used for consistent test data across unit, integration, and E2E tests
 */

import { PrismaClient, UserType, PostType, AppointmentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

export interface TestUser {
  id?: string
  email: string
  password: string
  name: string
  region: string
  postalCode: string
  userType: UserType
  isActive?: boolean
  emailVerified?: Date | null
}

export interface TestPost {
  id?: string
  title: string
  description: string
  subject: string
  type: PostType
  pricePerHour: number
  location: string
  userId: string
}

export interface TestAppointment {
  id?: string
  postId: string
  teacherId: string
  studentId: string
  scheduledAt: Date
  duration: number
  location: string
  status?: AppointmentStatus
}

/**
 * Base test users for consistent testing
 */
export const TEST_USERS: TestUser[] = [
  {
    email: 'teacher1@test.com',
    password: 'password123',
    name: 'Anna Hansen',
    region: 'Oslo',
    postalCode: '0150',
    userType: 'TEACHER',
    isActive: true,
    emailVerified: new Date('2024-01-01'),
  },
  {
    email: 'teacher2@test.com',
    password: 'password123',
    name: 'Erik Johnsen',
    region: 'Bergen',
    postalCode: '5001',
    userType: 'TEACHER',
    isActive: true,
    emailVerified: new Date('2024-01-01'),
  },
  {
    email: 'student1@test.com',
    password: 'password123',
    name: 'Lise Andersen',
    region: 'Trondheim',
    postalCode: '7001',
    userType: 'STUDENT',
    isActive: true,
    emailVerified: new Date('2024-01-01'),
  },
  {
    email: 'student2@test.com',
    password: 'password123',
    name: 'Magnus Olsen',
    region: 'Stavanger',
    postalCode: '4001',
    userType: 'STUDENT',
    isActive: true,
    emailVerified: new Date('2024-01-01'),
  },
  {
    email: 'inactive@test.com',
    password: 'password123',
    name: 'Inactive User',
    region: 'Oslo',
    postalCode: '0150',
    userType: 'STUDENT',
    isActive: false,
    emailVerified: new Date('2024-01-01'),
  },
  {
    email: 'unverified@test.com',
    password: 'password123',
    name: 'Unverified User',
    region: 'Oslo',
    postalCode: '0150',
    userType: 'STUDENT',
    isActive: true,
    emailVerified: null,
  },
]

/**
 * Base test posts for consistent testing
 */
export const TEST_POSTS: Omit<TestPost, 'userId'>[] = [
  {
    title: 'Matematikk-undervisning for videregående',
    description: 'Erfaren matematikklærer tilbyr undervisning i alle emner på videregående nivå.',
    subject: 'Matematikk',
    type: 'OFFERING',
    pricePerHour: 600,
    location: 'Oslo',
  },
  {
    title: 'Engelsk konversasjon og grammatikk',
    description: 'Native speaker tilbyr engelskundervisning med fokus på muntlig kommunikasjon.',
    subject: 'Engelsk',
    type: 'OFFERING',
    pricePerHour: 500,
    location: 'Bergen',
  },
  {
    title: 'Søker fysikklærer',
    description: 'Trenger hjelp til forberedelse til eksamen i fysikk 1.',
    subject: 'Fysikk',
    type: 'SEEKING',
    pricePerHour: 400,
    location: 'Trondheim',
  },
  {
    title: 'Programmering og informatikk',
    description: 'Lærer Python, JavaScript og webUtvikling for nybegynnere og viderekommende.',
    subject: 'Informatikk',
    type: 'OFFERING',
    pricePerHour: 700,
    location: 'Oslo',
  },
]

/**
 * Database seeding utility class
 */
export class TestDataSeeder {
  constructor(private prisma: PrismaClient) {}

  /**
   * Clean all test data from database
   */
  async cleanDatabase(): Promise<void> {
    // Delete in order to respect foreign key constraints
    await this.prisma.appointment.deleteMany({
      where: {
        chat: {
          participants: {
            some: {
              user: {
                email: {
                  endsWith: '@test.com'
                }
              }
            }
          }
        }
      }
    })

    await this.prisma.chatMessage.deleteMany({
      where: {
        chat: {
          post: {
            user: { email: { endsWith: '@test.com' } }
          }
        }
      }
    })

    await this.prisma.chat.deleteMany({
      where: {
        post: {
          user: { email: { endsWith: '@test.com' } }
        }
      }
    })

    await this.prisma.post.deleteMany({
      where: { user: { email: { endsWith: '@test.com' } } }
    })

    await this.prisma.user.deleteMany({
      where: { email: { endsWith: '@test.com' } }
    })
  }

  /**
   * Seed test users
   */
  async seedUsers(): Promise<Record<string, string>> {
    const userIds: Record<string, string> = {}
    const hashedPassword = await bcrypt.hash('password123', 10)

    for (const userData of TEST_USERS) {
      const user = await this.prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        }
      })
      userIds[userData.email] = user.id
    }

    return userIds
  }

  /**
   * Seed test posts
   */
  async seedPosts(userIds: Record<string, string>): Promise<Record<string, string>> {
    const postIds: Record<string, string> = {}
    const userEmails = Object.keys(userIds)

    for (let i = 0; i < TEST_POSTS.length; i++) {
      const postData = TEST_POSTS[i]
      // Assign posts to different users
      const userEmail = userEmails[i % userEmails.length]
      const userId = userIds[userEmail]

      if (userId) {
        const post = await this.prisma.post.create({
          data: {
            ...postData,
            userId,
          }
        })
        postIds[postData.title] = post.id
      }
    }

    return postIds
  }

  /**
   * Seed test appointments
   */
  async seedAppointments(
    userIds: Record<string, string>, 
    postIds: Record<string, string>
  ): Promise<void> {
    const teacherId = userIds['teacher1@test.com']
    const studentId = userIds['student1@test.com']
    const postId = Object.values(postIds)[0]

    if (teacherId && studentId && postId) {
      await this.prisma.appointment.create({
        data: {
          postId,
          teacherId,
          studentId,
          scheduledAt: new Date('2024-12-25T14:00:00'),
          duration: 60,
          location: 'Online via Zoom',
          status: 'SCHEDULED',
        }
      })

      // Create a completed appointment
      await this.prisma.appointment.create({
        data: {
          postId,
          teacherId,
          studentId,
          scheduledAt: new Date('2024-01-15T10:00:00'),
          duration: 90,
          location: 'Universitetet i Oslo',
          status: 'COMPLETED',
        }
      })
    }
  }

  /**
   * Full database setup for tests
   */
  async setupTestData(): Promise<{
    userIds: Record<string, string>
    postIds: Record<string, string>
  }> {
    await this.cleanDatabase()
    const userIds = await this.seedUsers()
    const postIds = await this.seedPosts(userIds)
    await this.seedAppointments(userIds, postIds)

    return { userIds, postIds }
  }
}

/**
 * Quick access to test user credentials
 */
export const TEST_CREDENTIALS = {
  teacher: {
    email: 'teacher1@test.com',
    password: 'password123',
  },
  student: {
    email: 'student1@test.com',
    password: 'password123',
  },
  inactive: {
    email: 'inactive@test.com',
    password: 'password123',
  },
  unverified: {
    email: 'unverified@test.com',
    password: 'password123',
  },
}

/**
 * Generate a random test user for isolated tests
 */
export function createRandomTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const random = Math.random().toString(36).substring(7)
  return {
    email: `testuser${random}@test.com`,
    password: 'password123',
    name: `Test User ${random}`,
    region: 'Oslo',
    postalCode: '0150',
    userType: 'STUDENT',
    isActive: true,
    emailVerified: new Date(),
    ...overrides,
  }
}

/**
 * Generate a random test post for isolated tests
 */
export function createRandomTestPost(userId: string, overrides: Partial<TestPost> = {}): TestPost {
  const random = Math.random().toString(36).substring(7)
  return {
    title: `Test Post ${random}`,
    description: `Test description for post ${random}`,
    subject: 'Test Subject',
    type: 'OFFERING',
    pricePerHour: 500,
    location: 'Oslo',
    userId,
    ...overrides,
  }
}