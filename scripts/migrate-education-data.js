const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateEducationData() {
  try {
    // Get all users with degree or school data
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { degree: { not: null } },
          { school: { not: null } }
        ]
      },
      select: {
        id: true,
        degree: true,
        school: true,
        education: true
      }
    });

    console.log(`Found ${users.length} users with education data to migrate`);

    for (const user of users) {
      let newDegree = null;
      let newEducation = null;

      // If education field is already populated, skip
      if (user.education) {
        continue;
      }

      // Parse existing degree field
      if (user.degree) {
        const degreeText = user.degree.toLowerCase();
        
        // Try to extract degree type
        if (degreeText.includes('bachelor')) {
          newDegree = 'BACHELOR';
          newEducation = user.degree.replace(/bachelor\s*i?\s*/i, '').trim();
        } else if (degreeText.includes('master')) {
          newDegree = 'MASTER';
          newEducation = user.degree.replace(/master\s*i?\s*/i, '').trim();
        } else if (degreeText.includes('phd') || degreeText.includes('doktor')) {
          newDegree = 'PHD';
          newEducation = user.degree.replace(/(phd|doktor)\s*i?\s*/i, '').trim();
        } else {
          // If we can't parse it, put everything in education field
          newEducation = user.degree;
        }
      }

      // Add school info if available
      if (user.school) {
        if (newEducation) {
          newEducation = `${user.school} ${newEducation}`;
        } else {
          newEducation = user.school;
        }
      }

      // Update the user
      if (newDegree || newEducation) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            degree: newDegree,
            education: newEducation
          }
        });
        console.log(`Migrated user ${user.id}: degree="${newDegree}", education="${newEducation}"`);
      }
    }

    console.log('Migration completed successfully');
    
  } catch (error) {
    console.error('Error migrating education data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateEducationData();