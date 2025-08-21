const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'tester@tutorconnect.no' }
    });

    if (existingUser) {
      console.log('Test user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Qmffor1802!', 10);

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'tester@tutorconnect.no',
        password: hashedPassword,
        name: 'Test Bruker',
        region: 'OSLO',
        postalCode: '0150',
        gender: 'PREFER_NOT_TO_SAY',
        birthYear: 1990,
        school: 'Universitetet i Oslo',
        degree: 'Bachelor i informatikk',
        bio: 'Dette er en test bruker for utvikling og testing av TutorConnect plattformen.',
        emailVerified: new Date(),
        isActive: true,
        lastActive: new Date(),
        // Privacy settings - all default to PUBLIC
        privacyGender: 'PUBLIC',
        privacyAge: 'PUBLIC',
        privacyDocuments: 'PUBLIC',
        privacyContact: 'PUBLIC',
        privacyEducation: 'PUBLIC',
        privacyLocation: 'PUBLIC',
        privacyActivity: 'PUBLIC'
      }
    });

    console.log('Test user created successfully:', testUser.email);
    console.log('User ID:', testUser.id);
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();