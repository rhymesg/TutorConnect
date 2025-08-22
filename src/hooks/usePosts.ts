'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PostWithDetails, PostFilters, PaginatedPosts } from '@/types/database';
import { useApiCall } from './useApiCall';

export interface UsePostsOptions {
  initialPosts?: PaginatedPosts;
  enableInfiniteScroll?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  cacheKey?: string;
}

export interface UsePostsReturn {
  // Data
  posts: PostWithDetails[];
  pagination: PaginatedPosts['pagination'];
  
  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  hasError: boolean;
  errorMessage?: string;
  
  // Actions
  fetchPosts: (filters: PostFilters, append?: boolean) => Promise<void>;
  loadMorePosts: () => Promise<void>;
  retry: () => Promise<void>;
  refresh: () => Promise<void>;
  
  // Infinite scroll utilities
  lastPostRef: (node: HTMLDivElement | null) => void;
  
  // Cache utilities
  clearCache: () => void;
}

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

// Simple in-memory cache for posts
const postsCache = new Map<string, { data: PaginatedPosts; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function usePosts(options: UsePostsOptions = {}): UsePostsReturn {
  const {
    initialPosts,
    enableInfiniteScroll = true,
    enableRetry = true,
    maxRetries = 3,
    retryDelay = 1000,
    cacheKey,
  } = options;

  // State
  const [posts, setPosts] = useState<PostWithDetails[]>(initialPosts?.data || []);
  const [pagination, setPagination] = useState(initialPosts?.pagination || DEFAULT_PAGINATION);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [retryCount, setRetryCount] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<PostFilters>({});

  // Refs
  const observer = useRef<IntersectionObserver>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const { execute: apiCall, isLoading } = useApiCall();

  // Cache utilities
  const getCachedPosts = useCallback((key: string): PaginatedPosts | null => {
    if (!cacheKey) return null;
    
    const cached = postsCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, [cacheKey]);

  const setCachedPosts = useCallback((key: string, data: PaginatedPosts) => {
    if (!cacheKey) return;
    
    postsCache.set(key, { data, timestamp: Date.now() });
  }, [cacheKey]);

  const clearCache = useCallback(() => {
    if (cacheKey) {
      postsCache.delete(cacheKey);
    }
  }, [cacheKey]);

  // Fetch posts function
  const fetchPosts = useCallback(async (filters: PostFilters, append: boolean = false) => {
    try {
      setHasError(false);
      setErrorMessage(undefined);
      setCurrentFilters(filters);

      // Check cache first
      const cacheKeyForRequest = cacheKey ? `${cacheKey}_${JSON.stringify(filters)}` : '';
      if (!append && cacheKeyForRequest) {
        const cached = getCachedPosts(cacheKeyForRequest);
        if (cached) {
          setPosts(cached.data);
          setPagination(cached.pagination);
          return;
        }
      }

      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const url = `/api/posts?${queryParams.toString()}`;
      const response = await apiCall(url, { method: 'GET' });

      if (response) {
        const data = response as PaginatedPosts;
        if (append) {
          setPosts(prev => [...prev, ...data.data]);
        } else {
          setPosts(data.data);
          // Smooth scroll to top when filters change
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
        
        setPagination(data.pagination);
        setRetryCount(0);

        // Cache the result
        if (cacheKeyForRequest && !append) {
          setCachedPosts(cacheKeyForRequest, data);
        }
      } else {
        throw new Error('Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setHasError(true);
      setErrorMessage(message);
      
      // Auto-retry with exponential backoff
      if (enableRetry && retryCount < maxRetries) {
        const timeout = retryDelay * Math.pow(2, retryCount);
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchPosts(filters, append);
        }, timeout);
      }
    }
  }, [apiCall, retryCount, maxRetries, retryDelay, enableRetry, cacheKey, getCachedPosts, setCachedPosts]);

  // Load more posts for infinite scroll
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !pagination.hasNext || isLoading || hasError) {
      return;
    }
    
    setIsLoadingMore(true);
    const nextFilters = { ...currentFilters, page: pagination.page + 1 };
    
    try {
      await fetchPosts(nextFilters, true);
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPosts, currentFilters, pagination, isLoadingMore, isLoading, hasError]);

  // Manual retry
  const retry = useCallback(async () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setRetryCount(0);
    await fetchPosts(currentFilters);
  }, [fetchPosts, currentFilters]);

  // Refresh posts (bypass cache)
  const refresh = useCallback(async () => {
    clearCache();
    await fetchPosts(currentFilters);
  }, [fetchPosts, currentFilters, clearCache]);

  // Intersection observer for infinite scroll
  const lastPostRef = useCallback((node: HTMLDivElement | null) => {
    if (!enableInfiniteScroll || isLoading || isLoadingMore) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && pagination.hasNext && !hasError) {
        loadMorePosts();
      }
    }, { 
      rootMargin: '100px' // Load when 100px away from the element
    });
    
    if (node) observer.current.observe(node);
  }, [enableInfiniteScroll, isLoading, isLoadingMore, pagination.hasNext, hasError, loadMorePosts]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return {
    // Data
    posts,
    pagination,
    
    // Loading states
    isLoading,
    isLoadingMore,
    hasError,
    errorMessage,
    
    // Actions
    fetchPosts,
    loadMorePosts,
    retry,
    refresh,
    
    // Utilities
    lastPostRef,
    clearCache,
  };
}

// Hook for individual post data
export function usePost(postId: string) {
  const [post, setPost] = useState<PostWithDetails | null>(null);
  const { execute: apiCall, isLoading } = useApiCall();

  const fetchPost = useCallback(async () => {
    if (!postId) return;

    try {
      const response = await apiCall(`/api/posts/${postId}`, { method: 'GET' });

      if (response) {
        setPost(response as PostWithDetails);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    }
  }, [postId, apiCall]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return {
    post,
    isLoading,
    refetch: fetchPost,
  };
}