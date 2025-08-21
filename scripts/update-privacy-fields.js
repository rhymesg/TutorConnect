const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updatePrivacyFields() {
  try {
    // Update all users to have the new privacy fields set to PUBLIC
    const result = await prisma.user.updateMany({
      data: {
        privacyPostalCode: 'PUBLIC',
        privacyMemberSince: 'PUBLIC'
      }
    });

    console.log(`Updated ${result.count} users with new privacy fields`);
    
  } catch (error) {
    console.error('Error updating privacy fields:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePrivacyFields();