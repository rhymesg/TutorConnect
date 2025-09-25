import { PostStatus } from '@/types/database';
import type { Language } from '@/contexts/LanguageContext';

const DEFAULT_LABEL = 'Unknown';
const DEFAULT_DESCRIPTION = 'Unknown';

export const POST_STATUS_LABELS: Record<Language, Record<PostStatus, string>> = {
  no: {
    AKTIV: 'Aktiv',
    PAUSET: 'Pauset',
  },
  en: {
    AKTIV: 'Active',
    PAUSET: 'Paused',
  },
};

export const POST_STATUS_DESCRIPTIONS: Record<Language, Record<PostStatus, string>> = {
  no: {
    AKTIV: 'Søker aktivt etter lærer/student',
    PAUSET: 'Midlertidig pauset',
  },
  en: {
    AKTIV: 'Actively seeking teacher/student',
    PAUSET: 'Temporarily paused',
  },
};

export const getPostStatusLabelByLanguage = (
  language: Language,
  status: PostStatus | null | undefined,
): string => {
  if (!status) {
    return DEFAULT_LABEL;
  }

  return POST_STATUS_LABELS[language]?.[status] ?? DEFAULT_LABEL;
};

export const getPostStatusDescriptionByLanguage = (
  language: Language,
  status: PostStatus | null | undefined,
): string => {
  if (!status) {
    return DEFAULT_DESCRIPTION;
  }

  return POST_STATUS_DESCRIPTIONS[language]?.[status] ?? DEFAULT_DESCRIPTION;
};

export const getPostStatusLabel = (status: PostStatus | null | undefined): string => (
  getPostStatusLabelByLanguage('no', status)
);

export const getPostStatusDescription = (status: PostStatus | null | undefined): string => (
  getPostStatusDescriptionByLanguage('no', status)
);

export const getPostStatusColor = (status: PostStatus | null | undefined): string => {
  switch (status) {
    case 'AKTIV':
      return 'bg-blue-100 text-blue-800';
    case 'PAUSET':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
