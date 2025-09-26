'use client';

import Link from 'next/link';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import { getSubjectLabelByLanguage } from '@/constants/subjects';
import { 
  AcademicCapIcon, 
  UserGroupIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon 
} from '@heroicons/react/24/outline';

interface Post {
  id: string;
  type: string;
  subject: string;
  title: string;
  createdAt: string;
}

interface Props {
  posts: Post[];
}

export function RecentPosts({ posts }: Props) {
  const { language } = useLanguage();
  const t = useLanguageText();

  const formatDate = (value: string | Date) => {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(language === 'no' ? 'nb-NO' : 'en-GB', {
      timeZone: 'Europe/Oslo',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const tutorLabel = t('Tilbyr undervisning', 'Offers tutoring');
  const studentLabel = t('Søker lærer', 'Seeking tutor');
  const createdLabel = t('Opprettet', 'Created');
  const emptyTitle = t('Ingen innlegg enda', 'No posts yet');
  const emptyDescription = t('Dine innlegg vil vises her når du oppretter dem.', 'Your posts will appear here once you create them.');
  const createPostLabel = t('Opprett innlegg', 'Create post');
  const viewPostLabel = t('Se innlegg', 'View post');
  const seeAllLabel = t('Se alle innlegg', 'See all posts');

  const getPostTypeInfo = (type: string) => {
    if (type === 'TUTOR_OFFER') {
      return {
        label: tutorLabel,
        icon: AcademicCapIcon,
        color: 'text-blue-600 bg-blue-100',
      };
    }
    
    return {
      label: studentLabel,
      icon: UserGroupIcon,
      color: 'text-green-600 bg-green-100',
    };
  };

  if (!posts.length) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {emptyTitle}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {emptyDescription}
        </p>
        <div className="mt-6">
          <Link
            href="/posts/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {createPostLabel}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const typeInfo = getPostTypeInfo(post.type);
        const IconComponent = typeInfo.icon;
        
        return (
          <div
            key={post.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {post.title}
                  </h4>
                  <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                    <span>{typeInfo.label}</span>
                    <span>•</span>
                    <span>{getSubjectLabelByLanguage(language, post.subject)}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {createdLabel}: {formatDate(post.createdAt)}
                  </p>
                </div>
              </div>
              
              <Link
                href={`/posts/${post.id}`}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
                title={viewPostLabel}
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        );
      })}
      
      {posts.length >= 5 && (
        <div className="text-center pt-4">
          <Link
            href="/dashboard?tab=posts"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {seeAllLabel} →
          </Link>
        </div>
      )}
    </div>
  );
}
