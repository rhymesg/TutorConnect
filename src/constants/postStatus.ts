import { PostStatus } from '@/types/database';

const DEFAULT_LABEL = 'Unknown';
const DEFAULT_DESCRIPTION = 'Unknown';

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  AKTIV: 'Aktiv',
  PAUSET: 'Pauset',
};

export const POST_STATUS_DESCRIPTIONS: Record<PostStatus, string> = {
  AKTIV: 'Søker aktivt etter lærer/student',
  PAUSET: 'Midlertidig pauset',
};

export const getPostStatusLabel = (status: PostStatus | null | undefined): string => {
  if (!status) {
    return DEFAULT_LABEL;
  }
  return POST_STATUS_LABELS[status] ?? DEFAULT_LABEL;
};

export const getPostStatusDescription = (status: PostStatus | null | undefined): string => {
  if (!status) {
    return DEFAULT_DESCRIPTION;
  }
  return POST_STATUS_DESCRIPTIONS[status] ?? DEFAULT_DESCRIPTION;
};

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
