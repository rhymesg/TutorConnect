'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PostListEnhanced from '@/components/posts/PostListEnhanced';
import { PaginatedPosts, PostFilters } from '@/types/database';

interface PostsPageClientProps {
  initialPosts: PaginatedPosts | null;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function PostsPageClient({ 
  initialPosts, 
  searchParams 
}: PostsPageClientProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  
  // Initialize filters from URL search params
  const initializeFilters = (): PostFilters => {
    const filters: PostFilters = {
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    // Parse URL parameters
    if (searchParams.search) {
      filters.search = Array.isArray(searchParams.search) 
        ? searchParams.search[0] 
        : searchParams.search;
    }

    if (searchParams.type) {
      const type = Array.isArray(searchParams.type) ? searchParams.type[0] : searchParams.type;
      if (type === 'TEACHER' || type === 'STUDENT') {
        filters.type = type as PostType;
      }
    }

    if (searchParams.subject) {
      const subject = Array.isArray(searchParams.subject) ? searchParams.subject[0] : searchParams.subject;
      filters.subject = subject as any;
    }

    if (searchParams.location) {
      const location = Array.isArray(searchParams.location) ? searchParams.location[0] : searchParams.location;
      filters.location = location as any;
    }

    if (searchParams.ageGroups) {
      const ageGroups = Array.isArray(searchParams.ageGroups) 
        ? searchParams.ageGroups 
        : [searchParams.ageGroups];
      filters.ageGroups = ageGroups as any[];
    }

    if (searchParams.minRate) {
      const minRate = Array.isArray(searchParams.minRate) ? searchParams.minRate[0] : searchParams.minRate;
      const parsed = parseInt(minRate);
      if (!isNaN(parsed)) filters.minRate = parsed;
    }

    if (searchParams.maxRate) {
      const maxRate = Array.isArray(searchParams.maxRate) ? searchParams.maxRate[0] : searchParams.maxRate;
      const parsed = parseInt(maxRate);
      if (!isNaN(parsed)) filters.maxRate = parsed;
    }

    if (searchParams.sortBy) {
      const sortBy = Array.isArray(searchParams.sortBy) ? searchParams.sortBy[0] : searchParams.sortBy;
      if (sortBy === 'createdAt' || sortBy === 'hourlyRate' || sortBy === 'rating') {
        filters.sortBy = sortBy;
      }
    }

    if (searchParams.sortOrder) {
      const sortOrder = Array.isArray(searchParams.sortOrder) ? searchParams.sortOrder[0] : searchParams.sortOrder;
      if (sortOrder === 'asc' || sortOrder === 'desc') {
        filters.sortOrder = sortOrder;
      }
    }

    return filters;
  };

  const [filters, setFilters] = useState<PostFilters>(initializeFilters);

  // Update URL when filters change
  const updateURL = useCallback((newFilters: PostFilters) => {
    const params = new URLSearchParams();

    // Add non-empty filter values to URL
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          value.forEach(v => params.append(key, v.toString()));
        } else if (!Array.isArray(value)) {
          params.set(key, value.toString());
        }
      }
    });

    // Remove page parameter if it's 1 (default)
    if (params.get('page') === '1') {
      params.delete('page');
    }

    // Remove default sort parameters
    if (params.get('sortBy') === 'createdAt' && params.get('sortOrder') === 'desc') {
      params.delete('sortBy');
      params.delete('sortOrder');
    }

    // Update URL without causing a page reload
    const newURL = params.toString() ? `/posts?${params.toString()}` : '/posts';
    router.replace(newURL, { scroll: false });
  }, [router]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: PostFilters) => {
    setFilters(newFilters);
    updateURL(newFilters);
  };

  // Handle post contact (navigate to chat or show modal)
  const handlePostContact = async (postId: string) => {
    try {
      // In a real app, this would:
      // 1. Check if user is authenticated
      // 2. Create a chat if it doesn't exist
      // 3. Navigate to chat or show contact modal
      
      console.log('Contact post:', postId);
      
      // For now, just navigate to a placeholder
      router.push(`/chat?post=${postId}`);
    } catch (error) {
      console.error('Error contacting post:', error);
      // Show error toast or modal
    }
  };

  return (
    <PostListEnhanced
      initialPosts={initialPosts}
      onPostContact={handlePostContact}
      showSearchHistory={true}
      enableOfflineMode={true}
      className="min-h-screen"
    />
  );
}