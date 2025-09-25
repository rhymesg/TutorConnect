import { AgeGroup } from '@prisma/client';
import type { Language } from '@/contexts/LanguageContext';

const DEFAULT_LABEL = 'Unknown';

// AgeGroup enum values from Prisma schema
export const AGE_GROUP_OPTIONS: Record<AgeGroup, string> = {
  [AgeGroup.PRESCHOOL]: '0-5 år',
  [AgeGroup.PRIMARY_LOWER]: '6-9 år',
  [AgeGroup.PRIMARY_UPPER]: '10-12 år',
  [AgeGroup.MIDDLE]: '13-15 år',
  [AgeGroup.SECONDARY]: '16-18 år',
  [AgeGroup.ADULTS]: '19+ år',
};

const AGE_GROUP_OPTIONS_EN: Record<AgeGroup, string> = {
  [AgeGroup.PRESCHOOL]: 'Ages 0-5',
  [AgeGroup.PRIMARY_LOWER]: 'Ages 6-9',
  [AgeGroup.PRIMARY_UPPER]: 'Ages 10-12',
  [AgeGroup.MIDDLE]: 'Ages 13-15',
  [AgeGroup.SECONDARY]: 'Ages 16-18',
  [AgeGroup.ADULTS]: 'Ages 19+',
};

// Convert to array format for dropdowns
export const getAgeGroupOptions = () =>
  Object.entries(AGE_GROUP_OPTIONS).map(([value, label]) => ({
    value,
    label,
  }));

// Get label for an age group value
export const getAgeGroupLabel = (ageGroup: string | AgeGroup | null | undefined): string => {
  if (!ageGroup) {
    return DEFAULT_LABEL;
  }
  return AGE_GROUP_OPTIONS[ageGroup as AgeGroup] ?? DEFAULT_LABEL;
};

export const getAgeGroupLabelByLanguage = (
  language: Language,
  ageGroup: string | AgeGroup | null | undefined,
): string => {
  if (!ageGroup) {
    return DEFAULT_LABEL;
  }

  if (language === 'no') {
    return AGE_GROUP_OPTIONS[ageGroup as AgeGroup] ?? DEFAULT_LABEL;
  }

  return AGE_GROUP_OPTIONS_EN[ageGroup as AgeGroup] ?? DEFAULT_LABEL;
};

// Get labels for multiple age groups
export const getAgeGroupLabels = (ageGroups: (string | AgeGroup)[] = []): string => {
  if (!ageGroups.length) {
    return DEFAULT_LABEL;
  }
  const labels = ageGroups
    .map(group => getAgeGroupLabel(group))
    .filter(Boolean);
  return labels.length ? labels.join(', ') : DEFAULT_LABEL;
};

export const getAgeGroupLabelsByLanguage = (
  language: Language,
  ageGroups: (string | AgeGroup)[] = [],
): string => {
  if (!ageGroups.length) {
    return DEFAULT_LABEL;
  }

  const labels = ageGroups
    .map((group) => getAgeGroupLabelByLanguage(language, group))
    .filter(Boolean);

  return labels.length ? labels.join(', ') : DEFAULT_LABEL;
};
