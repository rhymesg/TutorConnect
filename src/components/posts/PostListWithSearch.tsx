'use client';

import { useState, useEffect } from 'react';
import { Grid, List, ArrowUpDown, Share, ExternalLink } from 'lucide-react';
import PostCard, { PostCardSkeleton } from './PostCard';
import { SearchBar, FilterPanel } from '@/components/search';
import { PostWithDetails, PostFilters, PaginatedPosts } from '@/types/database';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import { useSearch } from '@/hooks/useSearch';

interface PostListWithSearchProps {
  initialPosts?: PaginatedPosts;
  initialFilters?: PostFilters;
  className?: string;
  showUrlSync?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'updatedAt' | 'hourlyRate' | 'rating';
type SortOrder = 'asc' | 'desc';

export default function PostListWithSearch({ 
  initialPosts,
  initialFilters,
  className = '',
  showUrlSync = true
}: PostListWithSearchProps) {
  const { language } = useLanguage();
  const t = useLanguageText();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const labels = {
    searchPlaceholder: t('Søk etter lærere, fag eller område...', 'Search for tutors, subjects or areas...'),
    activeFilters: t('Aktive filtere:', 'Active filters:'),
    clearAll: t('Tøm alle', 'Clear all'),
    loading: t('Laster...', 'Loading...'),
    noResults: t('Ingen resultater funnet', 'No results found'),
    beginSearch: t('Begynn å søke', 'Start searching'),
    adjustFilters: t('Prøv å justere søkeordene eller filtrene dine', 'Try adjusting your keywords or filters'),
    promptSearch: t('Bruk søkefeltet ovenfor for å finne lærere og fag', 'Use the search above to find tutors and subjects'),
    clearFilters: t('Tøm alle filtere', 'Clear all filters'),
    shareSearch: t('Del søk', 'Share search'),
    highestFirst: t('høyest først', 'highest first'),
    lowestFirst: t('lavest først', 'lowest first'),
    gridTitle: t('Rutenettvisning', 'Grid view'),
    listTitle: t('Listevisning', 'List view'),
    loadMore: t('Last flere', 'Load more'),
  };

  const sortLabels: Record<SortOption, string> = {
    updatedAt: t('Dato opprettet', 'Date created'),
    hourlyRate: t('Pris', 'Price'),
    rating: t('Vurdering', 'Rating'),
  };

  const resultsSummary = (count: number) => {
    if (count === 0) {
      return labels.noResults;
    }
    if (language === 'no') {
      return `${count} ${count === 1 ? 'resultat' : 'resultater'} funnet`;
    }
    return `${count} ${count === 1 ? 'result found' : 'results found'}`;
  };

  const shareTitle = t('TutorConnect søk', 'TutorConnect search');


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

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'updatedAt', label: sortLabels.updatedAt },
    { value: 'hourlyRate', label: sortLabels.hourlyRate },
    { value: 'rating', label: sortLabels.rating },
  ];

  // Handle share functionality
  const handleShare = async () => {
    const url = shareSearchUrl();
    const shareIntro = t('Se disse søkeresultatene på TutorConnect', 'Check out these results on TutorConnect');
    const filterSummary = getFilterDisplayText();
    const shareText = filterSummary.length > 0
      ? `${shareIntro}: ${filterSummary.join(', ')}`
      : shareIntro;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
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
            placeholder={labels.searchPlaceholder}
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
              <span className="text-sm text-neutral-600">{labels.activeFilters}</span>
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
                {labels.clearAll}
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
                    {labels.loading}
                  </div>
                ) : (
                  <span>
                    {resultsSummary(pagination.total)}
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
                  {labels.shareSearch}
                </button>
              )}
            </div>

            {/* View and sort controls */}
            <div className="flex items-center space-x-3">
              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={`${filters.sortBy || 'updatedAt'}-${filters.sortOrder || 'desc'}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-') as [SortOption, SortOrder];
                    handleSortChange(sortBy, sortOrder);
                  }}
                  className="appearance-none bg-white border border-neutral-300 rounded-lg px-3 py-2 pr-8 text-sm text-neutral-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  {sortOptions.map(option => [
                    <option key={`${option.value}-desc`} value={`${option.value}-desc`}>
                      {option.label} ({labels.highestFirst})
                    </option>,
                    <option key={`${option.value}-asc`} value={`${option.value}-asc`}>
                      {option.label} ({labels.lowestFirst})
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
                  title={labels.gridTitle}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' 
                    ? 'bg-brand-100 text-brand-600' 
                    : 'bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                  title={labels.listTitle}
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
              {hasActiveSearch() ? labels.noResults : labels.beginSearch}
            </h3>
            <p className="text-neutral-600 mb-4">
              {hasActiveSearch() ? labels.adjustFilters : labels.promptSearch}
            </p>
            {hasActiveSearch() && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
              >
                {labels.clearFilters}
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
                  className={viewMode === 'list' ? 'flex-row' : ''}
                />
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="col-span-full flex justify-center items-center py-8">
                <div className="flex items-center text-neutral-600">
                  <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin mr-2" />
                  {labels.loading}
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
                  {labels.loading}
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {labels.loadMore}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
