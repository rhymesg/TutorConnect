'use client';

import { Suspense } from 'react';
import PostListEnhanced from './PostListEnhanced';
import { PostListLoading } from './LoadingStates';
import { PostType, PaginatedPosts } from '@/types/database';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { BreadcrumbItem } from '@/lib/breadcrumbs';

interface PostsPageLayoutProps {
  type: PostType;
  title: React.ReactNode;
  subtitle: string;
  initialPosts?: PaginatedPosts | null;
  breadcrumbs?: BreadcrumbItem[];
}

export default function PostsPageLayout({ 
  type, 
  title, 
  subtitle, 
  initialPosts,
  breadcrumbs
}: PostsPageLayoutProps) {
  // Create initial filters with the specified type
  const initialFilters = {
    page: 1,
    limit: 12,
    sortBy: 'updatedAt' as const,
    sortOrder: 'desc' as const,
    type: type,
    includePaused: false,
  };

  // Handle post contact
  const handlePostContact = async (postId: string) => {
    try {
      console.log('Contact post:', postId);
      // Navigate to chat or contact logic
    } catch (error) {
      console.error('Error contacting post:', error);
    }
  };

  return (
    <div className="bg-neutral-50">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="bg-white border-b border-neutral-100">
          <div className="container mx-auto px-4 py-3">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>
      )}
      
      {/* Page Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              {title}
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-neutral-600">
              {subtitle}
            </p>
            <p className="mx-auto mt-2 text-sm text-neutral-500">
              Vi tar ingen gebyrer - Betaling skjer direkte mellom dere
            </p>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <Suspense fallback={<PostListLoading />}>
        <PostListEnhanced
          initialPosts={initialPosts}
          initialFilters={initialFilters}
          onPostContact={handlePostContact}
          showSearchHistory={true}
          enableOfflineMode={true}
          className=""
        />
      </Suspense>
    </div>
  );
}
