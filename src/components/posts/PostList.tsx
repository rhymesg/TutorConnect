'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Grid, List, ArrowUpDown, Loader2, AlertCircle } from 'lucide-react';
import PostCard, { PostCardSkeleton } from './PostCard';
import SearchAndFilters, { ActiveFilters } from './SearchAndFilters';
import { PostWithDetails, PostFilters, PaginatedPosts } from '@/types/database';
import { actions, messages } from '@/lib/translations';
import { useApiCall } from '@/hooks/useApiCall';

interface PostListProps {
  initialPosts?: PaginatedPosts;
  className?: string;
  onPostContact?: (postId: string) => void;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'createdAt' | 'hourlyRate' | 'rating';
type SortOrder = 'asc' | 'desc';

const POSTS_PER_PAGE = 12;

export default function PostList({ 
  initialPosts,
  className = '',
  onPostContact 
}: PostListProps) {
  const [posts, setPosts] = useState<PostWithDetails[]>(initialPosts?.data || []);
  const [pagination, setPagination] = useState(initialPosts?.pagination || {
    page: 1,
    limit: POSTS_PER_PAGE,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  
  const [filters, setFilters] = useState<PostFilters>({
    page: 1,
    limit: POSTS_PER_PAGE,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const observer = useRef<IntersectionObserver>();
  const lastPostElementRef = useRef<HTMLDivElement>(null);

  const { apiCall, isLoading } = useApiCall();

  // Fetch posts function
  const fetchPosts = useCallback(async (newFilters: PostFilters, append: boolean = false) => {
    try {
      setHasError(false);
      
      const response = await apiCall<PaginatedPosts>({
        method: 'GET',
        endpoint: '/api/posts',
        params: newFilters,
      });

      if (response.success && response.data) {
        if (append) {
          setPosts(prev => [...prev, ...response.data.data]);
        } else {
          setPosts(response.data.data);
        }
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.error || 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setHasError(true);
    }
  }, [apiCall]);

  // Load more posts for infinite scroll
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !pagination.hasNext || isLoading) return;
    
    setIsLoadingMore(true);
    const nextFilters = { ...filters, page: pagination.page + 1 };
    await fetchPosts(nextFilters, true);
    setIsLoadingMore(false);
  }, [filters, pagination, isLoadingMore, isLoading, fetchPosts]);

  // Intersection observer for infinite scroll
  const lastPostRef = useCallback((node: HTMLDivElement) => {
    if (isLoading || isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && pagination.hasNext) {
        loadMorePosts();
      }
    }, { 
      rootMargin: '200px' // Load when 200px away from the element
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, isLoadingMore, pagination.hasNext, loadMorePosts]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: PostFilters) => {
    const updatedFilters = { ...newFilters, page: 1 }; // Reset to first page
    setFilters(updatedFilters);
    fetchPosts(updatedFilters);
  };

  // Handle sorting changes
  const handleSortChange = (sortBy: SortOption, sortOrder?: SortOrder) => {
    const newFilters = {
      ...filters,
      sortBy,
      sortOrder: sortOrder || (filters.sortOrder === 'asc' ? 'desc' : 'asc'),
      page: 1,
    };
    setFilters(newFilters);
    fetchPosts(newFilters);
  };

  // Initial load if no initial posts provided
  useEffect(() => {
    if (!initialPosts) {
      fetchPosts(filters);
    }
  }, []);

  const getSortLabel = (sortBy: SortOption) => {
    switch (sortBy) {
      case 'createdAt': return 'Nyeste først';
      case 'hourlyRate': return 'Pris';
      case 'rating': return 'Vurdering';
      default: return 'Sortering';
    }
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'createdAt', label: 'Dato opprettet' },
    { value: 'hourlyRate', label: 'Pris' },
    { value: 'rating', label: 'Vurdering' },
  ];

  return (
    <div className={`bg-neutral-50 min-h-screen ${className}`}>
      {/* Search and Filters */}
      <div className="bg-white border-b border-neutral-200 sticky top-16 z-30">
        <SearchAndFilters 
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
        <ActiveFilters 
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Results count */}
          <div className="text-sm text-neutral-600">
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {messages.no.loading}
              </div>
            ) : (
              <span>
                {pagination.total > 0 
                  ? `${pagination.total} resultater funnet`
                  : messages.no.noResults
                }
              </span>
            )}
          </div>

          {/* View and sort controls */}
          <div className="flex items-center space-x-3">
            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-') as [SortOption, SortOrder];
                  handleSortChange(sortBy, sortOrder);
                }}
                className="appearance-none bg-white border border-neutral-300 rounded-lg px-3 py-2 pr-8 text-sm text-neutral-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                {sortOptions.map(option => [
                  <option key={`${option.value}-desc`} value={`${option.value}-desc`}>
                    {option.label} (høyest først)
                  </option>,
                  <option key={`${option.value}-asc`} value={`${option.value}-asc`}>
                    {option.label} (lavest først)
                  </option>
                ])}
              </select>
              <ArrowUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* View mode toggle */}
            <div className="flex border border-neutral-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' 
                  ? 'bg-brand-100 text-brand-600' 
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
                title="Rutenettvisning"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' 
                  ? 'bg-brand-100 text-brand-600' 
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
                title="Listevisning"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Container */}
      <div className="container mx-auto px-4 py-6">
        {hasError ? (
          /* Error State */
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {messages.no.error}
            </h3>
            <p className="text-neutral-600 mb-4">
              Kunne ikke laste inn annonser. {messages.no.tryAgain}
            </p>
            <button
              onClick={() => fetchPosts(filters)}
              className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              {actions.no.retry}
            </button>
          </div>
        ) : posts.length === 0 && !isLoading ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Grid className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {messages.no.noResults}
            </h3>
            <p className="text-neutral-600">
              Prøv å justere søkekriteriene eller fjerne noen filtre.
            </p>
          </div>
        ) : (
          /* Posts Grid/List */
          <div className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
              : 'space-y-4'
            }
          `}>
            {posts.map((post, index) => (
              <div
                key={post.id}
                ref={index === posts.length - 1 ? lastPostRef : undefined}
                className={viewMode === 'list' ? 'max-w-4xl' : ''}
              >
                <PostCard
                  post={post}
                  onContactClick={onPostContact}
                  className={viewMode === 'list' ? 'flex-row' : ''}
                />
              </div>
            ))}

            {/* Loading skeletons for infinite scroll */}
            {isLoadingMore && (
              <>
                {Array.from({ length: 4 }).map((_, index) => (
                  <PostCardSkeleton 
                    key={`skeleton-${index}`} 
                    className={viewMode === 'list' ? 'max-w-4xl' : ''}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* Loading skeletons for initial load */}
        {isLoading && posts.length === 0 && (
          <div className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
              : 'space-y-4'
            }
          `}>
            {Array.from({ length: 8 }).map((_, index) => (
              <PostCardSkeleton 
                key={`loading-skeleton-${index}`}
                className={viewMode === 'list' ? 'max-w-4xl' : ''}
              />
            ))}
          </div>
        )}

        {/* Load more trigger for infinite scroll */}
        {pagination.hasNext && !isLoadingMore && posts.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={loadMorePosts}
              className="inline-flex items-center px-6 py-3 border border-neutral-300 rounded-lg text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
            >
              {actions.no.loadMore}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}