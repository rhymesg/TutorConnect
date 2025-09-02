/**
 * Norwegian Subjects and Curriculum API
 * Provides subject categories, curriculum information, and grade level mappings
 */

import { NextRequest } from 'next/server';
import { createAPIHandler, createSuccessResponse, APIContext } from '@/lib/api-handler';
import { NorwegianSubjectCategories, AgeGroupToGrades } from '@/schemas/post';
import { NORWEGIAN_SUBJECTS } from '@/lib/search-utils';
import { AGE_GROUP_OPTIONS } from '@/constants/ageGroups';

/**
 * GET /api/posts/subjects - Get Norwegian curriculum subjects and categories
 */
async function handleGetSubjects(
  request: NextRequest,
  context: APIContext
) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const ageGroup = searchParams.get('ageGroup');
  const includeDescriptions = searchParams.get('includeDescriptions') === 'true';

  try {
    let subjects = Object.entries(NORWEGIAN_SUBJECTS).map(([key, config]) => ({
      id: key,
      name: key.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      norwegianName: config.no,
      category: findSubjectCategory(key),
    }));

    // Filter by category if specified
    if (category && NorwegianSubjectCategories[category as keyof typeof NorwegianSubjectCategories]) {
      const categorySubjects = NorwegianSubjectCategories[category as keyof typeof NorwegianSubjectCategories];
      subjects = subjects.filter(subject => categorySubjects.includes(subject.id as any));
    }

    // Add age group relevance if specified
    if (ageGroup) {
      subjects = subjects.map(subject => ({
        ...subject,
        relevantForAgeGroup: isSubjectRelevantForAgeGroup(subject.id, ageGroup),
        recommendedGrades: getRecommendedGradesForSubject(subject.id, ageGroup),
      }));
    }

    // Add detailed descriptions if requested
    if (includeDescriptions) {
      subjects = subjects.map(subject => ({
        ...subject,
        description: getSubjectDescription(subject.id),
        curriculumLevel: getCurriculumLevel(subject.id),
        prerequisites: getSubjectPrerequisites(subject.id),
        typicalHourlyRate: getTypicalHourlyRate(subject.id),
      }));
    }

    const response = {
      subjects,
      categories: Object.entries(NorwegianSubjectCategories).map(([key, subjects]) => ({
        id: key,
        name: formatCategoryName(key),
        subjectCount: subjects.length,
        subjects: subjects,
      })),
      ageGroups: Object.entries(AGE_GROUP_OPTIONS).map(([key, norwegianName]) => ({
        id: key,
        name: key.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        norwegianName,
        grades: AgeGroupToGrades[key as keyof typeof AgeGroupToGrades],
        typicalSubjects: getTypicalSubjectsForAgeGroup(key),
      })),
      gradeSystem: {
        elementary: {
          name: 'Grunnskole',
          grades: ['1', '2', '3', '4', '5', '6', '7'],
          ageRange: '6-13 years',
          description: 'Primary education in Norway',
        },
        lowerSecondary: {
          name: 'Ungdomsskole',
          grades: ['8', '9', '10'],
          ageRange: '13-16 years',
          description: 'Lower secondary education',
        },
        upperSecondary: {
          name: 'Videregående skole',
          grades: ['VG1', 'VG2', 'VG3'],
          ageRange: '16-19 years',
          description: 'Upper secondary education',
        },
        higher: {
          name: 'Høyere utdanning',
          grades: ['University', 'Adult Education'],
          ageRange: '19+ years',
          description: 'Higher education and adult learning',
        },
      },
    };

    return createSuccessResponse(
      response,
      'Norwegian curriculum information retrieved successfully',
      {
        totalSubjects: subjects.length,
        totalCategories: Object.keys(NorwegianSubjectCategories).length,
        filters: { category, ageGroup, includeDescriptions },
      }
    );
  } catch (error) {
    console.error('Error retrieving subjects:', error);
    throw new Error('Failed to retrieve curriculum information');
  }
}

// Helper functions
function findSubjectCategory(subjectId: string): string {
  for (const [category, subjects] of Object.entries(NorwegianSubjectCategories)) {
    if (subjects.includes(subjectId as any)) {
      return category;
    }
  }
  return 'OTHER';
}

function formatCategoryName(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function isSubjectRelevantForAgeGroup(subjectId: string, ageGroup: string): boolean {
  const relevanceMap: Record<string, string[]> = {
    MATHEMATICS: ['PRIMARY_LOWER', 'PRIMARY_UPPER', 'MIDDLE', 'SECONDARY', 'ADULTS'],
    ENGLISH: ['PRIMARY_LOWER', 'PRIMARY_UPPER', 'MIDDLE', 'SECONDARY', 'ADULTS'],
    NORWEGIAN: ['PRIMARY_LOWER', 'PRIMARY_UPPER', 'MIDDLE', 'SECONDARY', 'ADULTS'],
    SCIENCE: ['PRIMARY_LOWER', 'PRIMARY_UPPER', 'MIDDLE'],
    PHYSICS: ['MIDDLE', 'SECONDARY'],
    CHEMISTRY: ['MIDDLE', 'SECONDARY'],
    BIOLOGY: ['MIDDLE', 'SECONDARY'],
    HISTORY: ['MIDDLE', 'SECONDARY', 'ADULTS'],
    GEOGRAPHY: ['MIDDLE', 'SECONDARY'],
    PROGRAMMING: ['MIDDLE', 'SECONDARY', 'ADULTS'],
    SPORTS: ['PRESCHOOL', 'PRIMARY_LOWER', 'PRIMARY_UPPER', 'MIDDLE', 'SECONDARY'],
    MUSIC: ['PRESCHOOL', 'PRIMARY_LOWER', 'PRIMARY_UPPER', 'MIDDLE', 'SECONDARY', 'ADULTS'],
    ART: ['PRESCHOOL', 'PRIMARY_LOWER', 'PRIMARY_UPPER', 'MIDDLE', 'SECONDARY', 'ADULTS'],
    OTHER: ['PRESCHOOL', 'PRIMARY_LOWER', 'PRIMARY_UPPER', 'MIDDLE', 'SECONDARY', 'ADULTS'],
  };

  return relevanceMap[subjectId]?.includes(ageGroup) || false;
}

function getRecommendedGradesForSubject(subjectId: string, ageGroup: string): string[] {
  const gradeMap: Record<string, Record<string, string[]>> = {
    MATHEMATICS: {
      PRIMARY_LOWER: ['1', '2', '3'],
      PRIMARY_UPPER: ['4', '5', '6', '7'],
      MIDDLE: ['8', '9', '10'],
      SECONDARY: ['VG1', 'VG2', 'VG3'],
      ADULTS: ['University'],
    },
    PHYSICS: {
      MIDDLE: ['9', '10'],
      SECONDARY: ['VG1', 'VG2', 'VG3'],
    },
    PROGRAMMING: {
      MIDDLE: ['9', '10'],
      SECONDARY: ['VG1', 'VG2', 'VG3'],
      ADULTS: ['University', 'Adult Education'],
    },
  };

  return gradeMap[subjectId]?.[ageGroup] || [];
}

function getSubjectDescription(subjectId: string): string {
  const descriptions: Record<string, string> = {
    MATHEMATICS: 'Core mathematical concepts including arithmetic, algebra, geometry, and calculus',
    ENGLISH: 'English language learning, literature, and communication skills',
    NORWEGIAN: 'Norwegian language, literature, and written/oral communication',
    SCIENCE: 'General science concepts including basic physics, chemistry, and biology',
    PHYSICS: 'Physical sciences covering mechanics, thermodynamics, electricity, and modern physics',
    CHEMISTRY: 'Chemical principles, reactions, and laboratory techniques',
    BIOLOGY: 'Life sciences including ecology, genetics, and human biology',
    HISTORY: 'Norwegian and world history, critical thinking, and source analysis',
    GEOGRAPHY: 'Physical and human geography, environmental studies',
    PROGRAMMING: 'Computer programming, algorithms, and software development',
    SPORTS: 'Physical education, team sports, and health promotion',
    MUSIC: 'Musical theory, performance, and appreciation',
    ART: 'Visual arts, crafts, and creative expression',
    OTHER: 'Various specialized subjects and skills',
  };

  return descriptions[subjectId] || 'Subject description not available';
}

function getCurriculumLevel(subjectId: string): string {
  const coreSubjects = ['MATHEMATICS', 'ENGLISH', 'NORWEGIAN'];
  const specializedSubjects = ['PHYSICS', 'CHEMISTRY', 'PROGRAMMING'];
  
  if (coreSubjects.includes(subjectId)) return 'core';
  if (specializedSubjects.includes(subjectId)) return 'specialized';
  return 'elective';
}

function getSubjectPrerequisites(subjectId: string): string[] {
  const prerequisites: Record<string, string[]> = {
    PHYSICS: ['Basic Mathematics', 'Science fundamentals'],
    CHEMISTRY: ['Basic Mathematics', 'Science fundamentals'],
    BIOLOGY: ['Science fundamentals'],
    PROGRAMMING: ['Basic Mathematics', 'Problem-solving skills'],
    HISTORY: ['Reading comprehension'],
    GEOGRAPHY: ['Basic Mathematics'],
  };

  return prerequisites[subjectId] || [];
}

function getTypicalHourlyRate(subjectId: string): { min: number; max: number; currency: string } {
  const rates: Record<string, { min: number; max: number }> = {
    MATHEMATICS: { min: 300, max: 800 },
    ENGLISH: { min: 250, max: 600 },
    NORWEGIAN: { min: 250, max: 600 },
    SCIENCE: { min: 300, max: 700 },
    PHYSICS: { min: 400, max: 900 },
    CHEMISTRY: { min: 400, max: 900 },
    BIOLOGY: { min: 350, max: 750 },
    HISTORY: { min: 250, max: 550 },
    GEOGRAPHY: { min: 250, max: 550 },
    PROGRAMMING: { min: 500, max: 1200 },
    SPORTS: { min: 200, max: 500 },
    MUSIC: { min: 300, max: 800 },
    ART: { min: 250, max: 600 },
    OTHER: { min: 200, max: 600 },
  };

  return {
    ...rates[subjectId] || { min: 250, max: 600 },
    currency: 'NOK',
  };
}

function getTypicalSubjectsForAgeGroup(ageGroup: string): string[] {
  const typicalSubjects: Record<string, string[]> = {
    PRESCHOOL: ['MUSIC', 'ART', 'SPORTS'],
    PRIMARY_LOWER: ['MATHEMATICS', 'NORWEGIAN', 'ENGLISH', 'SCIENCE', 'SPORTS', 'MUSIC', 'ART'],
    PRIMARY_UPPER: ['MATHEMATICS', 'NORWEGIAN', 'ENGLISH', 'SCIENCE', 'SPORTS', 'MUSIC', 'ART'],
    MIDDLE: ['MATHEMATICS', 'NORWEGIAN', 'ENGLISH', 'SCIENCE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'HISTORY', 'GEOGRAPHY'],
    SECONDARY: ['MATHEMATICS', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'HISTORY', 'ENGLISH', 'PROGRAMMING'],
    ADULTS: ['MATHEMATICS', 'ENGLISH', 'PROGRAMMING', 'OTHER'],
  };

  return typicalSubjects[ageGroup] || [];
}

export const GET = createAPIHandler(handleGetSubjects, {
  optionalAuth: true,
  rateLimit: {
    maxAttempts: 50,
    windowMs: 60 * 1000, // 1 minute
  },
});