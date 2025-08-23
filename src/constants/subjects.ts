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

// Get label for a subject value
export const getSubjectLabel = (subject: string | Subject): string => {
  return SUBJECT_OPTIONS[subject as Subject] || subject;
};