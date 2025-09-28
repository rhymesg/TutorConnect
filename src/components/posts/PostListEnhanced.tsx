'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Grid, List, ArrowUpDown, Loader2, AlertCircle, Eye, EyeOff, RefreshCw, WifiOff } from 'lucide-react';

import PostCard, { PostCardSkeleton } from './PostCard';
import AdsterraBanner from '@/components/ads/AdsterraBanner';
import SearchAndFiltersEnhanced from './SearchAndFiltersEnhanced';
import ActiveFiltersEnhanced from './ActiveFiltersEnhanced';
import { PostWithDetails, PostFilters, PaginatedPosts } from '@/types/database';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import { useApiCall } from '@/hooks/useApiCall';

interface PostListEnhancedProps {
  initialPosts?: PaginatedPosts;
  initialFilters?: PostFilters;
  onFiltersChange?: (filters: PostFilters) => void;
  className?: string;
  showSearchHistory?: boolean;
  enableOfflineMode?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'updatedAt' | 'hourlyRate' | 'rating';
type SortOrder = 'asc' | 'desc';

const POSTS_PER_PAGE = 12;
const SEARCH_HISTORY_KEY = 'tutorconnect_search_history';
const MAX_SEARCH_HISTORY = 10;

export default function PostListEnhanced({ 
  initialPosts,
  initialFilters,
  onFiltersChange: externalOnFiltersChange,
  className = '',
  showSearchHistory = true,
  enableOfflineMode = true,
}: PostListEnhancedProps) {
  const { language } = useLanguage();
  const t = useLanguageText();
  const [posts, setPosts] = useState<PostWithDetails[]>(() => {
    const initialData = initialPosts?.data || [];
    return initialData;
  });
  const [pagination, setPagination] = useState(initialPosts?.pagination || {
    page: 1,
    limit: POSTS_PER_PAGE,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  
  const [filters, setFilters] = useState<PostFilters>(initialFilters || {
    page: 1,
    limit: POSTS_PER_PAGE,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  // Update filters when initialFilters change
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [compactMode, setCompactMode] = useState(false);
  const [showDesktopFilters, setShowDesktopFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isMobileAd, setIsMobileAd] = useState(false);
  
  const observer = useRef<IntersectionObserver>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const { execute: apiCall, isLoading } = useApiCall();

  const labels = {
    loading: t('Laster...', 'Loading...'),
    loadingPosts: t('Laster flere annonser...', 'Loading more posts...'),
    loadMore: t('Last flere', 'Load more'),
    retry: t('Prøv igjen', 'Retry'),
    errorShort: t('Feil ved lasting', 'Error loading'),
    postsErrorTitle: t('Feil ved lasting av annonser', 'Error loading posts'),
    postsErrorBody: t('Kunne ikke laste inn annonser. Prøv igjen senere.', 'Could not load posts. Please try again later.'),
    networkErrorTitle: t('Ingen nettverkstilkobling', 'No network connection'),
    networkErrorBody: t('Sjekk internettforbindelsen din og prøv igjen.', 'Check your internet connection and try again.'),
    offlineBanner: t('Du er offline. Noen funksjoner kan være begrenset.', 'You are offline. Some features may be limited.'),
    emptyTitle: t('Ingen annonser funnet', 'No listings found'),
    emptyBody: t('Prøv å justere søkekriteriene eller fjerne noen filtre.', 'Try adjusting your search or removing some filters.'),
    gridViewTitle: t('Rutenettvisning', 'Grid view'),
    listViewTitle: t('Listevisning', 'List view'),
    compactTitle: t('Kompakt visning', 'Compact view'),
    normalTitle: t('Normal visning', 'Normal view'),
    endOfResults: t('Du har sett alle {count} annonser', 'You have viewed all {count} posts'),
  };

  const sortOptionLabels: Record<SortOption, string> = {
    updatedAt: t('Sist oppdatert', 'Recently updated'),
    hourlyRate: t('Pris', 'Price'),
    rating: t('Vurdering', 'Rating'),
  };

  const sortOrderSuffix = {
    desc: t('nyeste først', 'newest first'),
    asc: t('eldste først', 'oldest first'),
  };

  const formatResultsCount = (count: number) => {
    if (language === 'no') {
      return `${count} ${count === 1 ? 'resultat funnet' : 'resultater funnet'}`;
    }
    return `${count} ${count === 1 ? 'result found' : 'results found'}`;
  };

  // Load search history from localStorage
  useEffect(() => {
    if (showSearchHistory) {
      try {
        const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
        if (stored) {
          setSearchHistory(JSON.parse(stored));
        }
      } catch (error) {
        console.warn('Failed to load search history:', error);
      }
    }
  }, [showSearchHistory]);

  useEffect(() => {
    const updateAdBreakpoint = () => {
      if (typeof window === 'undefined') return;
      setIsMobileAd(window.innerWidth < 768);
    };
    updateAdBreakpoint();
    window.addEventListener('resize', updateAdBreakpoint);
    return () => window.removeEventListener('resize', updateAdBreakpoint);
  }, []);

  // Online/offline detection
  useEffect(() => {
    if (!enableOfflineMode) return;

    const handleOnline = () => {
      setIsOnline(true);
      // Don't automatically refetch on reconnect to avoid loops
      // Let user manually retry if needed
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableOfflineMode]); // Simplified dependencies

  // Fetch posts function with retry logic
  const fetchPosts = useCallback(async (newFilters: PostFilters, append: boolean = false) => {
    try {
      setHasError(false);
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // Handle arrays (like ageGroups) as multiple parameters
          if (Array.isArray(value)) {
            value.forEach(item => queryParams.append(key, item.toString()));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
      
      const url = `/api/posts?${queryParams.toString()}`;
      const response = await apiCall(url, { method: 'GET' });

      if (response) {
        // Check if response is already the posts array
        let postsData: PostWithDetails[] = [];
        let paginationData: any = {};
        
        if (Array.isArray(response)) {
          postsData = response;
        } else if (response && typeof response === 'object') {
          if (response.data && Array.isArray(response.data)) {
            postsData = response.data;
            paginationData = response.pagination;
          } else if (response.success && response.data) {
            postsData = Array.isArray(response.data) ? response.data : [];
            paginationData = response.pagination || {};
          } else {
            postsData = [];
          }
        } else {
          postsData = [];
        }
        
        if (append) {
          setPosts(prev => [...(prev || []), ...postsData]);
        } else {
          setPosts(postsData);
          // Scroll to top when filters change
          if (typeof window !== 'undefined') {
            const smoothScrollToTop = (element: HTMLElement | null) => {
              if (!element) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
              }

              try {
                element.scrollTo({ top: 0, behavior: 'smooth' });
              } catch (error) {
                const start = element.scrollTop;
                const duration = 400;
                const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

                const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

                const step = (currentTime: number) => {
                  const elapsed = currentTime - startTime;
                  const progress = Math.min(elapsed / duration, 1);
                  element.scrollTop = start * (1 - easeOutCubic(progress));
                  if (progress < 1) {
                    requestAnimationFrame(step);
                  }
                };

                requestAnimationFrame(step);
              }
            };

            const scrollContainer = document.getElementById('main-content');
            smoothScrollToTop(scrollContainer);
          }
        }
        setPagination(paginationData || {
          page: 1,
          limit: POSTS_PER_PAGE,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        });
        setRetryCount(0);
      } else {
        throw new Error('Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setHasError(true);
      
      // Retry logic
      if (retryCount < 3 && isOnline) {
        const timeout = Math.pow(2, retryCount) * 1000; // Exponential backoff
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchPosts(newFilters, append);
        }, timeout);
      }
    }
  }, [apiCall, isOnline]); // Removed retryCount to prevent unnecessary recreations

  // Load more posts for infinite scroll
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !pagination?.hasNext || isLoading || hasError) return;
    
    setIsLoadingMore(true);
    const nextFilters = { ...filters, page: (pagination?.page || 1) + 1 };
    await fetchPosts(nextFilters, true);
    setIsLoadingMore(false);
  }, [filters, pagination, isLoadingMore, isLoading, hasError, fetchPosts]);

  // Intersection observer for infinite scroll
  const lastPostRef = useCallback((node: HTMLDivElement) => {
    if (isLoading || isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && pagination?.hasNext && !hasError) {
        loadMorePosts();
      }
    }, { 
      rootMargin: '100px' // Load when 100px away from the element
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, isLoadingMore, pagination?.hasNext, loadMorePosts, hasError]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: PostFilters) => {
    const updatedFilters = { ...newFilters, page: 1 }; // Reset to first page
    setFilters(updatedFilters);
    // Don't call fetchPosts here - let the useEffect handle it
    
    // Call external filter change handler if provided
    if (externalOnFiltersChange) {
      externalOnFiltersChange(updatedFilters);
    }
  }, [externalOnFiltersChange]);

  // Handle sorting changes
  const handleSortChange = (sortBy: SortOption, sortOrder?: SortOrder) => {
    const newFilters = {
      ...filters,
      sortBy,
      sortOrder: sortOrder || (filters.sortOrder === 'asc' ? 'desc' : 'asc'),
      page: 1,
    };
    setFilters(newFilters);
    // Don't call fetchPosts here - let the useEffect handle it
    
    // Call external filter change handler if provided
    if (externalOnFiltersChange) {
      externalOnFiltersChange(newFilters);
    }
  };

  // Search history management
  const handleSearchHistoryAdd = (search: string) => {
    if (!showSearchHistory || search.length < 3) return;
    
    try {
      const updated = [search, ...searchHistory.filter(s => s !== search)].slice(0, MAX_SEARCH_HISTORY);
      setSearchHistory(updated);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  };

  const handleSearchHistoryRemove = (search: string) => {
    try {
      const updated = searchHistory.filter(s => s !== search);
      setSearchHistory(updated);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to update search history:', error);
    }
  };

  // Manual retry
  const handleRetry = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setRetryCount(0);
    setHasError(false);
    // Force a re-fetch by updating the filters slightly
    setFilters(prev => ({ ...prev, page: 1 }));
  };


  // Fetch posts when filters change
  useEffect(() => {
    if (filters.type) { // Only fetch if we have a type filter (from route)
      fetchPosts(filters);
    } else if (!initialPosts && !initialFilters) {
      // Only fetch with default filters if no initialFilters will be provided
      fetchPosts(filters);
    }
  }, [filters.type, filters.subject, filters.ageGroups, filters.location, filters.minRate, filters.maxRate, filters.search, filters.sortBy, filters.sortOrder, filters.includePaused]); // Only specific filter dependencies

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'updatedAt', label: sortOptionLabels.updatedAt },
    { value: 'hourlyRate', label: sortOptionLabels.hourlyRate },
    { value: 'rating', label: sortOptionLabels.rating },
  ];

  return (
    <div className={`bg-neutral-50 ${className}`}>
      
      {/* Offline indicator */}
      {enableOfflineMode && !isOnline && (
        <div className="bg-orange-100 border-b border-orange-200 px-4 py-2">
          <div className="flex items-center justify-center text-sm text-orange-800">
            <WifiOff className="w-4 h-4 mr-2" />
            {labels.offlineBanner}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <SearchAndFiltersEnhanced 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          showRecentSearches={showSearchHistory}
          searchHistory={searchHistory}
          onSearchHistoryAdd={handleSearchHistoryAdd}
          onSearchHistoryRemove={handleSearchHistoryRemove}
          showDesktopFilters={showDesktopFilters}
          setShowDesktopFilters={setShowDesktopFilters}
          setShowMobileFilters={setShowMobileFilters}
        />
        <ActiveFiltersEnhanced 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          showDesktopFilters={showDesktopFilters}
          setShowDesktopFilters={setShowDesktopFilters}
          setShowMobileFilters={setShowMobileFilters}
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Results count */}
          <div className="text-sm text-neutral-600">
            {isLoading && (posts?.length || 0) === 0 ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {labels.loading}
              </div>
            ) : hasError ? (
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                {labels.errorShort}
                <button
                  onClick={handleRetry}
                  className="ml-2 text-brand-600 hover:text-brand-700 underline"
                >
                  {labels.retry}
                </button>
              </div>
            ) : (
              <span>
                {(pagination?.total || 0) > 0
                  ? formatResultsCount(pagination?.total || 0)
                  : ''}
              </span>
            )}
          </div>

          {/* View and sort controls */}
          <div className="flex items-center space-x-3">
            {/* Compact mode toggle (mobile only) */}
            <button
              onClick={() => setCompactMode(!compactMode)}
              className="sm:hidden p-2 text-neutral-600 hover:text-neutral-800 rounded-lg hover:bg-neutral-100"
              title={compactMode ? labels.normalTitle : labels.compactTitle}
            >
              {compactMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

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
                    {option.label} ({sortOrderSuffix.desc})
                  </option>,
                  <option key={`${option.value}-asc`} value={`${option.value}-asc`}>
                    {option.label} ({sortOrderSuffix.asc})
                  </option>
                ])}
              </select>
              <ArrowUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* View mode toggle (desktop only) */}
            <div className="hidden sm:flex border border-neutral-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' 
                  ? 'bg-brand-100 text-brand-600' 
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
                title={labels.gridViewTitle}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' 
                  ? 'bg-brand-100 text-brand-600' 
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
                title={labels.listViewTitle}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Container */}
      <div className="container mx-auto px-4 py-6">
        {hasError && !isLoading ? (
          /* Error State */
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-4">
              {isOnline ? <AlertCircle className="w-8 h-8" /> : <WifiOff className="w-8 h-8" />}
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {isOnline ? labels.postsErrorTitle : labels.networkErrorTitle}
            </h3>
            <p className="text-neutral-600 mb-4">
              {isOnline ? labels.postsErrorBody : labels.networkErrorBody}
            </p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
              disabled={!isOnline}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {labels.retry}
            </button>
          </div>
        ) : (posts?.length || 0) === 0 && !isLoading ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Grid className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {labels.emptyTitle}
            </h3>
            <p className="text-neutral-600">
              {labels.emptyBody}
            </p>
          </div>
        ) : (
          /* Posts Grid/List */
          <>
            <div className={`
              ${viewMode === 'grid' 
                ? `grid gap-4 ${compactMode 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
                }`
                : 'space-y-4'
              }
            `}>
              {(posts || []).map((post, index) => (
                  <div
                    key={post.id}
                    ref={index === (posts?.length || 0) - 1 ? lastPostRef : undefined}
                    className={viewMode === 'list' ? 'max-w-4xl mx-auto' : ''}
                  >
                    <PostCard
                      post={post}
                      className={`
                        ${compactMode && viewMode === 'grid' ? 'text-xs' : ''}
                        ${viewMode === 'list' ? 'sm:flex sm:flex-row' : ''}
                        hover:shadow-md transition-shadow duration-200
                      `}
                    />
                  </div>
                ))}
            </div>

            {/* Loading indicator for infinite scroll */}
            {isLoadingMore && (
              <div className="flex justify-center items-center py-8">
                <div className="flex items-center text-neutral-600">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {labels.loadingPosts}
                </div>
              </div>
            )}

            {/* End of results indicator */}
            {!pagination?.hasNext && (posts?.length || 0) > 0 && !isLoading && (
              <div className="mt-8">
                <div className="flex justify-center overflow-x-auto pb-6">
                  <AdsterraBanner
                    placementKey={isMobileAd ? '76d0f267be29a5359c9156029262c853' : 'f518bfdff1cb8fbf49eb32474cb013ca'}
                    width={isMobileAd ? 320 : 728}
                    height={isMobileAd ? 50 : 90}
                    className="mx-auto"
                  />
                </div>
                <div className="text-center py-8 border-t border-neutral-200">
                  <p className="text-neutral-500">
                    {labels.endOfResults.replace('{count}', String(posts?.length || 0))}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Loading skeletons for initial load */}
        {isLoading && (posts?.length || 0) === 0 && (
          <div className={`
            ${viewMode === 'grid' 
              ? `grid gap-4 ${compactMode 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
              }`
              : 'space-y-4'
            }
          `}>
            {Array.from({ length: 8 }).map((_, index) => (
              <PostCardSkeleton 
                key={`loading-skeleton-${index}`}
                className={viewMode === 'list' ? 'max-w-4xl mx-auto' : ''}
              />
            ))}
          </div>
        )}

        {/* Load more trigger for infinite scroll (fallback) */}
        {pagination?.hasNext && !isLoadingMore && (posts?.length || 0) > 0 && !isLoading && (
          <div className="text-center mt-8">
            <button
              onClick={loadMorePosts}
              className="inline-flex items-center px-6 py-3 border border-neutral-300 rounded-lg text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
            >
              {labels.loadMore}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
