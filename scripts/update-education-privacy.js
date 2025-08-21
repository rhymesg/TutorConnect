const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateEducationPrivacy() {
  try {
    // Update all users to have the new education privacy fields set to PUBLIC
    const result = await prisma.user.updateMany({
      data: {
        privacyMajor: 'PUBLIC',
        privacyCertifications: 'PUBLIC'
      }
    });

    console.log(`Updated ${result.count} users with new education privacy fields`);
    
  } catch (error) {
    console.error('Error updating education privacy fields:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateEducationPrivacy();