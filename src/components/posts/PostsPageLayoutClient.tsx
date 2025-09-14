'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { PostType, PaginatedPosts } from '@/types/database';
import { BreadcrumbItem } from '@/lib/breadcrumbs';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Dynamic import with no SSR to prevent hydration issues
const PostsPageLayout = dynamic(
  () => import('./PostsPageLayout'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
);

interface PostsPageLayoutClientProps {
  type: PostType;
  title: React.ReactNode;
  subtitle: string;
  initialPosts?: PaginatedPosts | null;
  breadcrumbs?: BreadcrumbItem[];
}

export default function PostsPageLayoutClient({ 
  type, 
  title, 
  subtitle, 
  initialPosts,
  breadcrumbs
}: PostsPageLayoutClientProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <PostsPageLayout 
      type={type}
      title={title}
      subtitle={subtitle}
      initialPosts={initialPosts}
      breadcrumbs={breadcrumbs}
    />
  );
}