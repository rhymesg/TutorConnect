'use client';

import { useState, useEffect } from 'react';
import { Grid, List, ArrowUpDown, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import PostCard, { PostCardSkeleton } from './PostCard';
import SearchAndFilters, { ActiveFilters } from './SearchAndFilters';
import { PostWithDetails, PostFilters, PaginatedPosts } from '@/types/database';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import { usePosts } from '@/hooks/usePosts';

interface PostListProps {
  initialPosts?: PaginatedPosts;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'updatedAt' | 'hourlyRate' | 'rating';
type SortOrder = 'asc' | 'desc';

const POSTS_PER_PAGE = 12;

export default function PostList({ 
  initialPosts,
  className = ''
}: PostListProps) {
  const [filters, setFilters] = useState<PostFilters>({
    page: 1,
    limit: POSTS_PER_PAGE,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { language } = useLanguage();
  const t = useLanguageText();

  const sortOptionMeta: Record<SortOption, { option: [string, string] }> = {
    updatedAt: { option: ['Dato opprettet', 'Date created'] },
    hourlyRate: { option: ['Pris', 'Price'] },
    rating: { option: ['Vurdering', 'Rating'] },
  };

  const sortOrderOptions: SortOption[] = ['updatedAt', 'hourlyRate', 'rating'];

  const sortOptions = sortOrderOptions.map((value) => ({
    value,
    label: t(sortOptionMeta[value].option[0], sortOptionMeta[value].option[1]),
  }));

  const highestFirstLabel = t('høyest først', 'highest first');
  const lowestFirstLabel = t('lavest først', 'lowest first');
  const loadingLabel = t('Laster...', 'Loading...');
  const retryLabel = t('Prøv igjen', 'Try again');
  const noResultsLabel = t('Ingen resultater funnet', 'No results found');
  const adjustFiltersLabel = t(
    'Prøv å justere søkekriteriene eller fjerne noen filtre.',
    'Try adjusting your search criteria or removing some filters.',
  );
  const errorStatusLabel = t('Feil ved lasting', 'Error loading');
  const errorHeading = t('Feil ved lasting av annonser', 'Error loading posts');
  const errorBody = t('Kunne ikke laste inn annonser. Prøv igjen senere.', 'Could not load posts. Please try again later.');
  const loadingMoreLabel = t('Laster flere annonser...', 'Loading more posts...');
  const loadMoreLabel = t('Last flere', 'Load more');
  const gridViewLabel = t('Rutenettvisning', 'Grid view');
  const listViewLabel = t('Listevisning', 'List view');
  const sortLabel = t('Sortering', 'Sorting');

  const formatResultsCount = (count: number) => {
    if (language === 'no') {
      return `${count} ${count === 1 ? 'resultat' : 'resultater'} funnet`;
    }
    return `${count} ${count === 1 ? 'result found' : 'results found'}`;
  };

  const sortSelectOptions = sortOptions.flatMap(({ value, label }) => ([
    { key: `${value}-desc`, value: `${value}-desc`, label: `${label} (${highestFirstLabel})` },
    { key: `${value}-asc`, value: `${value}-asc`, label: `${label} (${lowestFirstLabel})` },
  ]));

  // Use the new usePosts hook
  const {
    posts,
    pagination,
    isLoading,
    isLoadingMore,
    hasError,
    errorMessage: _errorMessage,
    fetchPosts,
    loadMorePosts,
    retry,
    lastPostRef,
  } = usePosts({
    initialPosts,
    enableInfiniteScroll: true,
    enableRetry: true,
    cacheKey: 'postList',
  });

  void _errorMessage;

  // Initialize with filters if not already loaded
  useEffect(() => {
    if (!initialPosts) {
      fetchPosts(filters);
    }
  }, []); // Only run on mount

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
                <LoadingSpinner size="sm" className="mr-2" />
                {loadingLabel}
              </div>
            ) : hasError ? (
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errorStatusLabel}
                <button
                  onClick={retry}
                  className="ml-2 text-brand-600 hover:text-brand-700 underline text-sm"
                >
                  {retryLabel}
                </button>
              </div>
            ) : (
              <span>
                {pagination.total > 0 
                  ? formatResultsCount(pagination.total)
                  : noResultsLabel
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
                aria-label={sortLabel}
                className="appearance-none bg-white border border-neutral-300 rounded-lg px-3 py-2 pr-8 text-sm text-neutral-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                {sortSelectOptions.map((option) => (
                  <option key={option.key} value={option.value}>
                    {option.label}
                  </option>
                ))}
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
                title={gridViewLabel}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' 
                  ? 'bg-brand-100 text-brand-600' 
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
                title={listViewLabel}
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
              {errorHeading}
            </h3>
            <p className="text-neutral-600 mb-4">
              {errorBody}
            </p>
            <button
              onClick={retry}
              className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              {retryLabel}
            </button>
          </div>
        ) : posts.length === 0 && !isLoading ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Grid className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {noResultsLabel}
            </h3>
            <p className="text-neutral-600">
              {adjustFiltersLabel}
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
                  className={viewMode === 'list' ? 'flex-row' : ''}
                />
              </div>
            ))}

            {/* Loading indicator for infinite scroll */}
            {isLoadingMore && (
              <div className="col-span-full flex justify-center items-center py-8">
                <div className="flex items-center text-neutral-600">
                  <LoadingSpinner size="sm" className="mr-2" />
                  {loadingMoreLabel}
                </div>
              </div>
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
              {loadMoreLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
