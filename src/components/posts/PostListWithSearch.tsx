'use client';

import { useState, useEffect } from 'react';
import { Grid, List, ArrowUpDown, Share, ExternalLink } from 'lucide-react';
import PostCard, { PostCardSkeleton } from './PostCard';
import { SearchBar, FilterPanel } from '@/components/search';
import { PostWithDetails, PostFilters, PaginatedPosts } from '@/types/database';
import { actions, messages, posts } from '@/lib/translations';
import { useSearch } from '@/hooks/useSearch';

interface PostListWithSearchProps {
  initialPosts?: PaginatedPosts;
  initialFilters?: PostFilters;
  className?: string;
  onPostContact?: (postId: string) => void;
  showUrlSync?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'createdAt' | 'hourlyRate' | 'rating';
type SortOrder = 'asc' | 'desc';

export default function PostListWithSearch({ 
  initialPosts,
  initialFilters,
  className = '',
  onPostContact,
  showUrlSync = true
}: PostListWithSearchProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Initialize search hook with enhanced features
  const {
    query,
    filters,
    suggestions,
    recentSearches,
    results,
    pagination,
    isLoading,
    isSearching,
    hasSuggestions,
    setQuery,
    setFilters,
    updateFilter,
    removeFilter,
    clearFilters,
    search,
    applyQuickFilter,
    showSuggestions,
    hideSuggestions,
    selectSuggestion,
    selectRecentSearch,
    clearSearchHistory,
    shareSearchUrl,
    getActiveFilterCount,
    getFilterDisplayText,
    hasActiveSearch,
  } = useSearch({
    enableUrlSync: showUrlSync,
    enableHistory: true,
    enableSuggestions: true,
    autoSearch: true,
    initialFilters: initialFilters || {},
  });

  // Handle sorting changes
  const handleSortChange = (sortBy: SortOption, sortOrder?: SortOrder) => {
    updateFilter('sortBy', sortBy);
    updateFilter('sortOrder', sortOrder || (filters.sortOrder === 'asc' ? 'desc' : 'asc'));
  };

  const getSortLabel = (sortBy: SortOption) => {
    switch (sortBy) {
      case 'createdAt': return posts.no.sorting.newest;
      case 'hourlyRate': return posts.no.sorting.price;
      case 'rating': return posts.no.sorting.rating;
      default: return 'Sortering';
    }
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'createdAt', label: posts.no.sorting.created },
    { value: 'hourlyRate', label: posts.no.sorting.price },
    { value: 'rating', label: posts.no.sorting.rating },
  ];

  // Handle share functionality
  const handleShare = async () => {
    const url = shareSearchUrl();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TutorConnect søk',
          text: `Se disse søkeresultatene på TutorConnect${getFilterDisplayText().length > 0 ? ': ' + getFilterDisplayText().join(', ') : ''}`,
          url: url,
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard?.writeText(url);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard?.writeText(url);
    }
  };

  return (
    <div className={`bg-neutral-50 min-h-screen ${className}`}>
      {/* Enhanced Search Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-16 z-30">
        <div className="container mx-auto px-4 py-4">
          {/* Main Search Bar */}
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            suggestions={suggestions}
            recentSearches={recentSearches}
            isLoading={isSearching}
            hasSuggestions={hasSuggestions}
            onSuggestionSelect={selectSuggestion}
            onRecentSearchSelect={selectRecentSearch}
            onFocus={showSuggestions}
            onBlur={hideSuggestions}
            onSearch={() => search()}
            onFilterToggle={() => setShowFilters(!showFilters)}
            onShare={handleShare}
            activeFilterCount={getActiveFilterCount()}
            placeholder="Søk etter lærere, fag eller område..."
          />

          {/* Advanced Filter Panel */}
          <div className="mt-4">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
              resultCount={pagination.total}
            />
          </div>

          {/* Active Filter Tags */}
          {hasActiveSearch() && (
            <div className="mt-4 flex items-center flex-wrap gap-2">
              <span className="text-sm text-neutral-600">Aktive filtere:</span>
              {getFilterDisplayText().map((text, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-sm"
                >
                  {text}
                </span>
              ))}
              <button
                onClick={clearFilters}
                className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors ml-2"
              >
                Tøm alle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Toolbar */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Results count and status */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-neutral-600">
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin mr-2" />
                    {messages.no.loading}
                  </div>
                ) : (
                  <span>
                    {pagination.total > 0 
                      ? `${pagination.total} ${pagination.total === 1 ? 'resultat' : 'resultater'} funnet`
                      : 'Ingen resultater funnet'
                    }
                  </span>
                )}
              </div>

              {/* Share current search */}
              {hasActiveSearch() && (
                <button
                  onClick={handleShare}
                  className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  <Share className="w-4 h-4 mr-1" />
                  Del søk
                </button>
              )}
            </div>

            {/* View and sort controls */}
            <div className="flex items-center space-x-3">
              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-') as [SortOption, SortOrder];
                    handleSortChange(sortBy, sortOrder);
                  }}
                  className="appearance-none bg-white border border-neutral-300 rounded-lg px-3 py-2 pr-8 text-sm text-neutral-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  {sortOptions.map(option => [
                    <option key={`${option.value}-desc`} value={`${option.value}-desc`}>
                      {option.label} ({posts.no.sorting.highest})
                    </option>,
                    <option key={`${option.value}-asc`} value={`${option.value}-asc`}>
                      {option.label} ({posts.no.sorting.lowest})
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
                  title={posts.no.viewModes.grid}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' 
                    ? 'bg-brand-100 text-brand-600' 
                    : 'bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                  title={posts.no.viewModes.list}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Container */}
      <div className="container mx-auto px-4 py-6">
        {results.length === 0 && !isLoading ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Grid className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {hasActiveSearch() ? 'Ingen resultater funnet' : 'Begynn å søke'}
            </h3>
            <p className="text-neutral-600 mb-4">
              {hasActiveSearch() 
                ? 'Prøv å justere søkeordene eller filtrene dine'
                : 'Bruk søkefeltet ovenfor for å finne lærere og fag'
              }
            </p>
            {hasActiveSearch() && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
              >
                Tøm alle filtere
              </button>
            )}
          </div>
        ) : (
          /* Posts Grid/List */
          <div className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
              : 'space-y-4'
            }
          `}>
            {results.map((post) => (
              <div
                key={post.id}
                className={viewMode === 'list' ? 'max-w-4xl' : ''}
              >
                <PostCard
                  post={post}
                  onContactClick={onPostContact}
                  className={viewMode === 'list' ? 'flex-row' : ''}
                />
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="col-span-full flex justify-center items-center py-8">
                <div className="flex items-center text-neutral-600">
                  <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin mr-2" />
                  {messages.no.loading}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading skeletons for initial load */}
        {isLoading && results.length === 0 && (
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

        {/* Load more functionality */}
        {pagination.hasNext && results.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={() => updateFilter('page', (filters.page || 1) + 1)}
              disabled={isLoading}
              className="inline-flex items-center px-6 py-3 border border-neutral-300 rounded-lg text-neutral-700 bg-white hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mr-2" />
                  {messages.no.loading}
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {actions.no.loadMore}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}