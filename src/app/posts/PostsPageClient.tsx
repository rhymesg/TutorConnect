'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import PostListEnhanced from '@/components/posts/PostListEnhanced';
import { PaginatedPosts, PostFilters, PostType } from '@/types/database';

interface PostsPageClientProps {
  initialPosts: PaginatedPosts | null;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function PostsPageClient({ 
  initialPosts, 
  searchParams 
}: PostsPageClientProps) {
  // Track user activity on posts page
  useActivityTracking();
  
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  
  // Initialize filters from URL search params
  const initializeFilters = (): PostFilters => {
    const filters: PostFilters = {
      page: 1,
      limit: 12,
      sortBy: 'updatedAt',
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
      // Handle both lowercase and uppercase values
      if (type === 'TEACHER' || type === 'teacher') {
        filters.type = 'TEACHER' as PostType;
      } else if (type === 'STUDENT' || type === 'student') {
        filters.type = 'STUDENT' as PostType;
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
      if (sortBy === 'updatedAt' || sortBy === 'hourlyRate' || sortBy === 'rating') {
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

  // Update filters when URL search params change
  useEffect(() => {
    const filters: PostFilters = {
      page: 1,
      limit: 12,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    };

    // Parse URL parameters from useSearchParams hook
    const search = urlSearchParams.get('search');
    if (search) filters.search = search;

    const type = urlSearchParams.get('type');
    if (type === 'TEACHER' || type === 'teacher') {
      filters.type = 'TEACHER' as PostType;
    } else if (type === 'STUDENT' || type === 'student') {
      filters.type = 'STUDENT' as PostType;
    }

    const subject = urlSearchParams.get('subject');
    if (subject) filters.subject = subject as any;

    const location = urlSearchParams.get('location');
    if (location) filters.location = location as any;

    const ageGroups = urlSearchParams.getAll('ageGroups');
    if (ageGroups.length > 0) filters.ageGroups = ageGroups as any[];

    const minRate = urlSearchParams.get('minRate');
    if (minRate) {
      const parsed = parseInt(minRate);
      if (!isNaN(parsed)) filters.minRate = parsed;
    }

    const maxRate = urlSearchParams.get('maxRate');
    if (maxRate) {
      const parsed = parseInt(maxRate);
      if (!isNaN(parsed)) filters.maxRate = parsed;
    }

    const sortBy = urlSearchParams.get('sortBy');
    if (sortBy === 'updatedAt' || sortBy === 'hourlyRate' || sortBy === 'rating') {
      filters.sortBy = sortBy;
    }

    const sortOrder = urlSearchParams.get('sortOrder');
    if (sortOrder === 'asc' || sortOrder === 'desc') {
      filters.sortOrder = sortOrder;
    }

    console.log('PostsPageClient - URL Search Params:', urlSearchParams.toString());
    console.log('PostsPageClient - Parsed filters:', filters);
    setFilters(filters);
  }, [urlSearchParams]);

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
    if (params.get('sortBy') === 'updatedAt' && params.get('sortOrder') === 'desc') {
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

  return (
    <PostListEnhanced
      initialPosts={initialPosts}
      initialFilters={filters}
      onFiltersChange={handleFiltersChange}
      showSearchHistory={true}
      enableOfflineMode={true}
      className="min-h-screen"
    />
  );
}
