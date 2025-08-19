'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PostFilters, PostWithDetails, PaginatedPosts } from '@/types/database';
import { useApiCall } from './useApiCall';
import { 
  generateSearchSuggestions,
  normalizeNorwegianQuery,
  saveSearchToHistory,
  getSearchHistory,
  buildFiltersFromQuery,
  formatFilterText,
  NORWEGIAN_SEARCH_CONFIG,
  SearchSuggestion,
  SearchHistoryItem
} from '@/lib/search-utils';
import {
  filtersToUrlParams,
  urlParamsToFilters,
  generateShareableUrl,
  shareUrl,
  updateUrlWithoutReload
} from '@/lib/url-utils';

export interface UseSearchOptions {
  enableUrlSync?: boolean;
  enableHistory?: boolean;
  enableSuggestions?: boolean;
  autoSearch?: boolean;
  debounceDelay?: number;
  initialFilters?: PostFilters;
}

export interface UseSearchReturn {
  // Search state
  query: string;
  filters: PostFilters;
  suggestions: SearchSuggestion[];
  recentSearches: SearchHistoryItem[];
  
  // Results
  results: PostWithDetails[];
  pagination: PaginatedPosts['pagination'];
  
  // Loading states
  isLoading: boolean;
  isSearching: boolean;
  hasSuggestions: boolean;
  
  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: PostFilters) => void;
  updateFilter: (key: keyof PostFilters, value: any) => void;
  removeFilter: (key: keyof PostFilters) => void;
  clearFilters: () => void;
  search: (customQuery?: string, customFilters?: PostFilters) => Promise<void>;
  applyQuickFilter: (filter: Partial<PostFilters>) => void;
  
  // Suggestions
  showSuggestions: () => void;
  hideSuggestions: () => void;
  selectSuggestion: (suggestion: SearchSuggestion) => void;
  
  // History
  selectRecentSearch: (search: SearchHistoryItem) => void;
  clearSearchHistory: () => void;
  
  // URL management
  updateUrl: () => void;
  shareSearchUrl: () => string;
  shareSearch: () => Promise<{ success: boolean; method: 'native' | 'clipboard' | 'none' }>;
  
  // Utilities
  getActiveFilterCount: () => number;
  getFilterDisplayText: () => string[];
  hasActiveSearch: () => boolean;
}

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    enableUrlSync = true,
    enableHistory = true,
    enableSuggestions = true,
    autoSearch = true,
    debounceDelay = NORWEGIAN_SEARCH_CONFIG.DEBOUNCE_DELAY,
    initialFilters = {},
  } = options;

  const router = useRouter();
  const searchParams = useSearchParams();
  const { apiCall } = useApiCall();

  // State
  const [query, setQueryState] = useState('');
  const [filters, setFiltersState] = useState<PostFilters>(initialFilters);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [results, setResults] = useState<PostWithDetails[]>([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestionsState, setShowSuggestionsState] = useState(false);

  // Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const suggestionsTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSearchRef = useRef<string>('');

  // Initialize from URL on mount
  useEffect(() => {
    if (enableUrlSync && searchParams) {
      const { filters: urlFilters, query: urlQuery } = urlParamsToFilters(searchParams);
      
      setQueryState(urlQuery);
      setFiltersState(prev => ({ ...prev, ...urlFilters }));
      
      if (autoSearch && (urlQuery || Object.keys(urlFilters).length > 0)) {
        search(urlQuery, urlFilters);
      }
    }
  }, []);

  // Load search history
  useEffect(() => {
    if (enableHistory) {
      setRecentSearches(getSearchHistory());
    }
  }, [enableHistory]);

  // Generate suggestions when query changes
  useEffect(() => {
    if (!enableSuggestions) return;

    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    suggestionsTimeoutRef.current = setTimeout(() => {
      if (query.length >= NORWEGIAN_SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
        const newSuggestions = generateSearchSuggestions(query);
        setSuggestions(newSuggestions);
      } else {
        setSuggestions([]);
      }
    }, 150); // Faster for suggestions

    return () => {
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
    };
  }, [query, enableSuggestions]);

  // Auto-search with debouncing
  useEffect(() => {
    if (!autoSearch) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const searchKey = `${query}-${JSON.stringify(filters)}`;
      if (searchKey !== lastSearchRef.current) {
        search();
      }
    }, debounceDelay);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, filters, autoSearch, debounceDelay]);

  // Search function
  const search = useCallback(async (customQuery?: string, customFilters?: PostFilters) => {
    const searchQuery = customQuery !== undefined ? customQuery : query;
    const searchFilters = customFilters || filters;
    const searchKey = `${searchQuery}-${JSON.stringify(searchFilters)}`;

    // Avoid duplicate searches
    if (searchKey === lastSearchRef.current && results.length > 0) {
      return;
    }

    setIsSearching(true);
    setIsLoading(true);
    
    try {
      // Build complete filters including query-based filters
      const enhancedFilters: PostFilters = {
        ...searchFilters,
        search: searchQuery || undefined,
        page: 1, // Reset to first page for new searches
      };

      // Add intelligent filters from query
      if (searchQuery && searchQuery.trim()) {
        const queryFilters = buildFiltersFromQuery(searchQuery);
        Object.assign(enhancedFilters, queryFilters);
      }

      const response = await apiCall<PaginatedPosts>({
        method: 'GET',
        endpoint: '/api/posts',
        params: enhancedFilters,
      });

      if (response.success && response.data) {
        setResults(response.data.data);
        setPagination(response.data.pagination);
        lastSearchRef.current = searchKey;

        // Save to history
        if (enableHistory && searchQuery?.trim()) {
          saveSearchToHistory(
            searchQuery.trim(), 
            enhancedFilters, 
            response.data.pagination.total
          );
          setRecentSearches(getSearchHistory());
        }

        // Update URL
        if (enableUrlSync) {
          updateUrl();
        }
      } else {
        throw new Error(response.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setPagination(DEFAULT_PAGINATION);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [query, filters, results.length, apiCall, enableHistory, enableUrlSync]);

  // Update query
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    if (newQuery.length >= NORWEGIAN_SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
      setShowSuggestionsState(true);
    }
  }, []);

  // Update filters
  const setFilters = useCallback((newFilters: PostFilters) => {
    setFiltersState(newFilters);
    setShowSuggestionsState(false);
  }, []);

  // Update single filter
  const updateFilter = useCallback((key: keyof PostFilters, value: any) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
    setShowSuggestionsState(false);
  }, []);

  // Remove filter
  const removeFilter = useCallback((key: keyof PostFilters) => {
    setFiltersState(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setQueryState('');
    setFiltersState({
      page: 1,
      limit: filters.limit || 12,
    });
    setResults([]);
    setPagination(DEFAULT_PAGINATION);
    setSuggestions([]);
    setShowSuggestionsState(false);
    lastSearchRef.current = '';
  }, [filters.limit]);

  // Apply quick filter
  const applyQuickFilter = useCallback((filter: Partial<PostFilters>) => {
    setFiltersState(prev => ({ ...prev, ...filter, page: 1 }));
    setShowSuggestionsState(false);
  }, []);

  // Suggestion management
  const showSuggestions = useCallback(() => {
    setShowSuggestionsState(true);
  }, []);

  const hideSuggestions = useCallback(() => {
    setShowSuggestionsState(false);
  }, []);

  const selectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    if (suggestion.type === 'recent') {
      setQueryState(suggestion.text);
    } else {
      setQueryState(suggestion.text);
      if (suggestion.filters) {
        setFiltersState(prev => ({ ...prev, ...suggestion.filters, page: 1 }));
      }
    }
    setShowSuggestionsState(false);
  }, []);

  // History management
  const selectRecentSearch = useCallback((searchItem: SearchHistoryItem) => {
    setQueryState(searchItem.query);
    if (searchItem.filters) {
      setFiltersState(prev => ({ ...prev, ...searchItem.filters, page: 1 }));
    }
    setShowSuggestionsState(false);
  }, []);

  const clearSearchHistoryFn = useCallback(() => {
    import('@/lib/search-utils').then(({ clearSearchHistory }) => {
      clearSearchHistory();
      setRecentSearches([]);
    });
  }, []);

  // URL management
  const updateUrl = useCallback(() => {
    if (!enableUrlSync) return;
    updateUrlWithoutReload(filters, query, router);
  }, [enableUrlSync, filters, query, router]);

  const shareSearchUrl = useCallback(() => {
    return generateShareableUrl(filters, query);
  }, [filters, query]);

  // Enhanced sharing function
  const shareSearch = useCallback(async () => {
    return shareUrl(filters, query, pagination.total);
  }, [filters, query, pagination.total]);

  // Utility functions
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (query.trim()) count++;
    if (filters.type) count++;
    if (filters.subject) count++;
    if (filters.location) count++;
    if (filters.ageGroups?.length) count++;
    if (filters.minRate || filters.maxRate) count++;
    return count;
  }, [query, filters]);

  const getFilterDisplayText = useCallback(() => {
    const parts = formatFilterText(filters);
    if (query.trim()) {
      parts.unshift(`"${query.trim()}"`);
    }
    return parts;
  }, [query, filters]);

  const hasActiveSearch = useCallback(() => {
    return !!(query.trim() || filters.type || filters.subject || filters.location || 
             filters.ageGroups?.length || filters.minRate || filters.maxRate);
  }, [query, filters]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Search state
    query,
    filters,
    suggestions,
    recentSearches,
    
    // Results
    results,
    pagination,
    
    // Loading states
    isLoading,
    isSearching,
    hasSuggestions: showSuggestionsState && (suggestions.length > 0 || recentSearches.length > 0),
    
    // Actions
    setQuery,
    setFilters,
    updateFilter,
    removeFilter,
    clearFilters,
    search,
    applyQuickFilter,
    
    // Suggestions
    showSuggestions,
    hideSuggestions,
    selectSuggestion,
    
    // History
    selectRecentSearch,
    clearSearchHistory: clearSearchHistoryFn,
    
    // URL management
    updateUrl,
    shareSearchUrl,
    shareSearch,
    
    // Utilities
    getActiveFilterCount,
    getFilterDisplayText,
    hasActiveSearch,
  };
}