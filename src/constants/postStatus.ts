import { PostStatus } from '@/types/database';

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  AKTIV: 'Aktiv',
  PAUSET: 'Pauset',
};

export const POST_STATUS_DESCRIPTIONS: Record<PostStatus, string> = {
  AKTIV: 'Søker aktivt etter lærer/student',
  PAUSET: 'Midlertidig pauset',
};

export const getPostStatusLabel = (status: PostStatus): string => {
  return POST_STATUS_LABELS[status] || status;
};

export const getPostStatusDescription = (status: PostStatus): string => {
  return POST_STATUS_DESCRIPTIONS[status] || status;
};

export const getPostStatusColor = (status: PostStatus): string => {
  switch (status) {
    case 'AKTIV':
      return 'bg-blue-100 text-blue-800';
    case 'PAUSET':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};