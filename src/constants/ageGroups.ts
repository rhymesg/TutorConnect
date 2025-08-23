import { AgeGroup } from '@prisma/client';

// AgeGroup enum values from Prisma schema
export const AGE_GROUP_OPTIONS: Record<AgeGroup, string> = {
  [AgeGroup.PRESCHOOL]: '0-5 år',
  [AgeGroup.PRIMARY_LOWER]: '6-9 år',
  [AgeGroup.PRIMARY_UPPER]: '10-12 år',
  [AgeGroup.MIDDLE]: '13-15 år',
  [AgeGroup.SECONDARY]: '16-18 år',
  [AgeGroup.ADULTS]: '19+ år',
};

// Convert to array format for dropdowns
export const getAgeGroupOptions = () => {
  return Object.entries(AGE_GROUP_OPTIONS).map(([value, label]) => ({
    value,
    label,
  }));
};

// Get label for an age group value
export const getAgeGroupLabel = (ageGroup: string | AgeGroup): string => {
  return AGE_GROUP_OPTIONS[ageGroup as AgeGroup] || ageGroup;
};

// Get labels for multiple age groups
export const getAgeGroupLabels = (ageGroups: string[]): string => {
  return ageGroups.map(group => getAgeGroupLabel(group)).join(', ');
};