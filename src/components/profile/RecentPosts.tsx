'use client';

import Link from 'next/link';
import { formatters, education } from '@/lib/translations';
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
  const getPostTypeInfo = (type: string) => {
    if (type === 'TUTOR_OFFER') {
      return {
        label: 'Tilbyr undervisning',
        icon: AcademicCapIcon,
        color: 'text-blue-600 bg-blue-100',
      };
    }
    
    return {
      label: 'Søker lærer',
      icon: UserGroupIcon,
      color: 'text-green-600 bg-green-100',
    };
  };

  const getSubjectLabel = (subject: string) => {
    // Convert database enum to display label
    const subjectMap: Record<string, string> = {
      MATH: 'Matematikk',
      NORWEGIAN: 'Norsk',
      ENGLISH: 'Engelsk',
      SCIENCE: 'Naturfag',
      PHYSICS: 'Fysikk',
      CHEMISTRY: 'Kjemi',
      BIOLOGY: 'Biologi',
      HISTORY: 'Historie',
      GEOGRAPHY: 'Geografi',
      SOCIAL_STUDIES: 'Samfunnsfag',
      RELIGION: 'Religion og etikk',
      MUSIC: 'Musikk',
      ART: 'Kunst og håndverk',
      PROGRAMMING: 'Programmering',
      ECONOMICS: 'Økonomi',
    };
    
    return subjectMap[subject] || subject;
  };

  if (!posts.length) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Ingen innlegg enda
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Dine innlegg vil vises her når du oppretter dem.
        </p>
        <div className="mt-6">
          <Link
            href="/posts/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Opprett innlegg
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
                    <span>{getSubjectLabel(post.subject)}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Opprettet: {formatters.date(new Date(post.createdAt))}
                  </p>
                </div>
              </div>
              
              <Link
                href={`/posts/${post.id}`}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
                title="Se innlegg"
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
            Se alle innlegg →
          </Link>
        </div>
      )}
    </div>
  );
}