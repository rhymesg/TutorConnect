import { Subject } from '@prisma/client';

// Subject enum values from Prisma schema
export const SUBJECT_OPTIONS: Record<Subject, string> = {
  [Subject.math]: 'Matematikk',
  [Subject.english]: 'Engelsk',
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
export const getSubjectOptions = () => {
  return Object.entries(SUBJECT_OPTIONS).map(([value, label]) => ({
    value,
    label,
  }));
};

// English subject labels for breadcrumbs and international users
export const SUBJECT_OPTIONS_EN: Record<Subject, string> = {
  [Subject.math]: 'Math',
  [Subject.english]: 'English',
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
export const getSubjectLabel = (subject: string | Subject): string => {
  return SUBJECT_OPTIONS[subject as Subject] || subject;
};

// String to Subject enum mapping (for URL parameters)
const STRING_TO_SUBJECT_MAP: Record<string, Subject> = {
  'math': Subject.math,
  'matematikk': Subject.math,
  'english': Subject.english,
  'engelsk': Subject.english,
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
export const getSubjectLabelEN = (subject: string | Subject): string => {
  // If it's already a Subject enum, use it directly
  if (Object.values(Subject).includes(subject as Subject)) {
    return SUBJECT_OPTIONS_EN[subject as Subject] || subject;
  }
  
  // If it's a string, map it to Subject enum first
  const mappedSubject = STRING_TO_SUBJECT_MAP[subject.toLowerCase()];
  if (mappedSubject) {
    // Special cases for specific strings
    if (subject.toLowerCase() === 'tennis') return 'Tennis';
    if (subject.toLowerCase() === 'ski') return 'Skiing';
    
    return SUBJECT_OPTIONS_EN[mappedSubject];
  }
  
  // Fallback to original string with proper capitalization
  return subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase();
};