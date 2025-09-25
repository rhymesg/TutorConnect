import { Subject } from '@prisma/client';
import type { Language } from '@/contexts/LanguageContext';

const DEFAULT_LABEL = 'Unknown';

// Subject enum values from Prisma schema
export const SUBJECT_OPTIONS: Record<Subject, string> = {
  [Subject.math]: 'Matematikk',
  [Subject.english]: 'Engelsk',
  [Subject.korean]: 'Koreansk',
  [Subject.norwegian]: 'Norsk',
  [Subject.science]: 'Naturfag',
  [Subject.programming]: 'Programmering',
  [Subject.sports]: 'Sport',
  [Subject.art]: 'Kunst',
  [Subject.music]: 'Musikk',
  [Subject.childcare]: 'Barnepass og aktiviteter',
  [Subject.other]: 'Annet',
};

// Convert to array format for dropdowns
export const getSubjectOptions = () =>
  Object.entries(SUBJECT_OPTIONS).map(([value, label]) => ({
    value,
    label,
  }));

// English subject labels for breadcrumbs and international users
export const SUBJECT_OPTIONS_EN: Record<Subject, string> = {
  [Subject.math]: 'Math',
  [Subject.english]: 'English',
  [Subject.korean]: 'Korean',
  [Subject.norwegian]: 'Norwegian',
  [Subject.science]: 'Science',
  [Subject.programming]: 'Programming',
  [Subject.sports]: 'Sports',
  [Subject.art]: 'Art',
  [Subject.music]: 'Music',
  [Subject.childcare]: 'Childcare',
  [Subject.other]: 'Other',
};

// Get label for a subject value (Norwegian)
export const getSubjectLabel = (subject: string | Subject | null | undefined): string => {
  if (!subject) {
    return DEFAULT_LABEL;
  }
  return SUBJECT_OPTIONS[subject as Subject] ?? DEFAULT_LABEL;
};

export const getSubjectLabelByLanguage = (
  language: Language,
  subject: string | Subject | null | undefined,
): string => (
  language === 'no' ? getSubjectLabel(subject) : getSubjectLabelEN(subject)
);

// String to Subject enum mapping (for URL parameters)
const STRING_TO_SUBJECT_MAP: Record<string, Subject> = {
  'math': Subject.math,
  'matematikk': Subject.math,
  'english': Subject.english,
  'engelsk': Subject.english,
  'korean': Subject.korean,
  'koreansk': Subject.korean,
  'norwegian': Subject.norwegian,
  'norsk': Subject.norwegian,
  'science': Subject.science,
  'naturfag': Subject.science,
  'programming': Subject.programming,
  'programmering': Subject.programming,
  'sports': Subject.sports,
  'sport': Subject.sports,
  'tennis': Subject.sports, // Tennis falls under sports
  'ski': Subject.sports, // Skiing falls under sports
  'art': Subject.art,
  'kunst': Subject.art,
  'music': Subject.music,
  'musikk': Subject.music,
  'childcare': Subject.childcare,
  'barnepass': Subject.childcare,
  'other': Subject.other,
  'annet': Subject.other,
};

// Get English label for a subject value (used in breadcrumbs)
export const getSubjectLabelEN = (subject: string | Subject | null | undefined): string => {
  if (!subject) {
    return DEFAULT_LABEL;
  }

  if (Object.values(Subject).includes(subject as Subject)) {
    return SUBJECT_OPTIONS_EN[subject as Subject] ?? DEFAULT_LABEL;
  }

  const normalized = subject.toLowerCase();
  const mappedSubject = STRING_TO_SUBJECT_MAP[normalized];
  if (mappedSubject) {
    if (normalized === 'tennis') return 'Tennis';
    if (normalized === 'ski') return 'Skiing';
    return SUBJECT_OPTIONS_EN[mappedSubject] ?? DEFAULT_LABEL;
  }

  return DEFAULT_LABEL;
};
