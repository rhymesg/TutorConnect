import { Suspense } from 'react';
import PostListEnhanced from './PostListEnhanced';
import { PostListLoading } from './LoadingStates';
import PostCardStatic from './PostCardStatic';
import { PostType, PaginatedPosts, PostFilters } from '@/types/database';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { BreadcrumbItem } from '@/lib/breadcrumbs';

interface PostsPageLayoutProps {
  type: PostType;
  title: React.ReactNode;
  subtitle: string;
  initialPosts?: PaginatedPosts | null;
  breadcrumbs?: BreadcrumbItem[];
  filterOverrides?: Partial<PostFilters>;
}

export default function PostsPageLayout({ 
  type, 
  title, 
  subtitle, 
  initialPosts,
  breadcrumbs,
  filterOverrides,
}: PostsPageLayoutProps) {
  // Create initial filters with the specified type
  const initialFilters = {
    page: 1,
    limit: 12,
    sortBy: 'updatedAt' as const,
    sortOrder: 'desc' as const,
    type: type,
    includePaused: false,
    ...filterOverrides,
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
      <Suspense
        fallback={initialPosts?.data?.length ? (
          <div className="bg-neutral-50">
            <div className="container mx-auto px-4 py-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {initialPosts.data.map((post) => (
                  <PostCardStatic key={post.id} post={post} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <PostListLoading />
        )}
      >
        <PostListEnhanced
          initialPosts={initialPosts}
          initialFilters={initialFilters}
          showSearchHistory={true}
          enableOfflineMode={true}
          className=""
        />
      </Suspense>
    </div>
  );
}
