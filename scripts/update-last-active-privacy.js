const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateLastActivePrivacy() {
  try {
    // Update all users to have the new privacyLastActive field set to PUBLIC
    const result = await prisma.user.updateMany({
      data: {
        privacyLastActive: 'PUBLIC'
      }
    });

    console.log(`Updated ${result.count} users with privacyLastActive field`);
    
  } catch (error) {
    console.error('Error updating privacyLastActive field:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateLastActivePrivacy();