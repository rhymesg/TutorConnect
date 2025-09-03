/**
 * Norwegian Subjects and Curriculum API
 * Provides subject categories, curriculum information, and grade level mappings
 */

import { NextRequest } from 'next/server';
import { createAPIHandler, createSuccessResponse, APIContext } from '@/lib/api-handler';
import { NorwegianSubjectCategories } from '@/schemas/post';
import { NORWEGIAN_SUBJECTS } from '@/lib/search-utils';
import { AGE_GROUP_OPTIONS } from '@/constants/ageGroups';

/**
 * GET /api/posts/subjects - Get Norwegian curriculum subjects and categories
 */
async function handleGetSubjects(
  request: NextRequest,
  context: APIContext
) {
  try {
    const subjects = Object.entries(NORWEGIAN_SUBJECTS).map(([key, config]) => ({
      id: key,
      name: key.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      norwegianName: config.no,
      category: findSubjectCategory(key),
    }));

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
      })),
    };

    return createSuccessResponse(
      response,
      'Norwegian curriculum information retrieved successfully',
      {
        totalSubjects: subjects.length,
        totalCategories: Object.keys(NorwegianSubjectCategories).length,
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


export const GET = createAPIHandler(handleGetSubjects, {
  optionalAuth: true,
  rateLimit: {
    maxAttempts: 50,
    windowMs: 60 * 1000, // 1 minute
  },
});