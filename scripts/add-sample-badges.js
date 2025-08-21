const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSampleBadges() {
  try {
    // Find the first user to add sample badge data
    const users = await prisma.user.findMany({
      take: 1
    });

    if (users.length === 0) {
      console.log('No users found');
      return;
    }

    const user = users[0];
    
    // Add sample data to show different badge levels
    const result = await prisma.user.update({
      where: { id: user.id },
      data: {
        teacherSessions: 15,    // This will give Sølv badge (15 sessions >= 10, 3 students >= 2)
        teacherStudents: 3,
        studentSessions: 2,     // This will give Bronse badge (2 sessions >= 1, 1 teacher >= 1)
        studentTeachers: 1
      }
    });

    console.log(`Updated user ${user.email} with sample badge data:`);
    console.log(`- Teacher: ${result.teacherSessions} sessions, ${result.teacherStudents} students`);
    console.log(`- Student: ${result.studentSessions} sessions, ${result.studentTeachers} teachers`);
    console.log('');
    console.log('Badge levels:');
    console.log('- Teacher: Sølv badge (15 sessions >= 10, 3 students >= 2)');
    console.log('- Student: Bronse badge (2 sessions >= 1, 1 teacher >= 1)');
    
  } catch (error) {
    console.error('Error adding sample badges:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleBadges();