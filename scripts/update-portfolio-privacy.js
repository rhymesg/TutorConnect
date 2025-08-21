const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updatePortfolioPrivacy() {
  try {
    // Update all users to have the new privacyPortfolio field set to PUBLIC
    const result = await prisma.user.updateMany({
      data: {
        privacyPortfolio: 'PUBLIC'
      }
    });

    console.log(`Updated ${result.count} users with privacyPortfolio field`);
    
  } catch (error) {
    console.error('Error updating privacyPortfolio field:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePortfolioPrivacy();