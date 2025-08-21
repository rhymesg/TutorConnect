const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEducationData() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        degree: true,
        school: true,
        education: true,
        major: true
      }
    });

    console.log('Current education data:');
    users.forEach(user => {
      console.log(`User: ${user.email}`);
      console.log(`  degree: ${user.degree}`);
      console.log(`  school: ${user.school}`);
      console.log(`  education: ${user.education}`);
      console.log(`  major: ${user.major}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error checking education data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEducationData();