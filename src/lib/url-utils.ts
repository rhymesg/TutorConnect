/**
 * URL utilities for TutorConnect search functionality
 * Handles URL state synchronization and sharing
 */

import { PostFilters } from '@/types/database';

/**
 * Convert filters to URL search parameters
 */
export function filtersToUrlParams(filters: PostFilters, searchQuery?: string): URLSearchParams {
  const params = new URLSearchParams();

  // Add search query
  if (searchQuery?.trim()) {
    params.set('q', searchQuery.trim());
  }

  // Add filter parameters
  Object.entries(filters).forEach(([key, value]) => {
    if (value != null && value !== '' && value !== undefined) {
      // Skip internal pagination parameters for sharing
      if (key === 'page' || key === 'limit') {
        return;
      }

      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(','));
        }
      } else {
        params.set(key, String(value));
      }
    }
  });

  return params;
}

/**
 * Parse URL search parameters to filters
 */
export function urlParamsToFilters(searchParams: URLSearchParams): { filters: PostFilters; query: string } {
  const filters: PostFilters = {};
  let query = '';

  searchParams.forEach((value, key) => {
    switch (key) {
      case 'q':
        if (value) query = value;
        break;
      case 'type':
        if (value) filters.type = value as any;
        break;
      case 'subject':
        if (value) filters.subject = value as any;
        break;
      case 'location':
        if (value) filters.location = value as any;
        break;
      case 'ageGroups':
        if (value) filters.ageGroups = value.split(',') as any[];
        break;
      case 'minRate':
        if (value && !isNaN(Number(value))) filters.minRate = Number(value);
        break;
      case 'maxRate':
        if (value && !isNaN(Number(value))) filters.maxRate = Number(value);
        break;
      case 'sortBy':
        if (value) filters.sortBy = value as any;
        break;
      case 'sortOrder':
        if (value === 'asc' || value === 'desc') filters.sortOrder = value;
        break;
    }
  });

  return { filters, query };
}

/**
 * Generate a shareable URL for the current search
 */
export function generateShareableUrl(
  filters: PostFilters, 
  searchQuery?: string,
  baseUrl?: string
): string {
  const params = filtersToUrlParams(filters, searchQuery);
  const base = baseUrl || (typeof window !== 'undefined' ? 
    `${window.location.origin}${window.location.pathname}` : 
    'https://tutorconnect.no/posts'
  );
  
  return params.toString() ? `${base}?${params.toString()}` : base;
}

/**
 * Generate sharing metadata for social platforms
 */
export function generateSharingMetadata(
  filters: PostFilters,
  searchQuery?: string,
  resultCount?: number
): {
  title: string;
  description: string;
  url: string;
} {
  let title = 'TutorConnect';
  let description = 'Finn lærere og privatundervisning i Norge';

  // Customize based on search criteria
  if (searchQuery?.trim()) {
    title = `Søk: "${searchQuery}" - TutorConnect`;
    description = `Se søkeresultater for "${searchQuery}" på TutorConnect`;
  } else if (filters.subject || filters.type || filters.location) {
    const parts: string[] = [];
    
    if (filters.type === 'TEACHER') {
      parts.push('Lærere');
    } else if (filters.type === 'STUDENT') {
      parts.push('Studenter');
    }
    
    if (filters.subject) {
      parts.push(`i ${filters.subject.toLowerCase()}`);
    }
    
    if (filters.location) {
      parts.push(`i ${filters.location}`);
    }
    
    if (parts.length > 0) {
      title = `${parts.join(' ')} - TutorConnect`;
      description = `Finn ${parts.join(' ').toLowerCase()} på TutorConnect`;
    }
  }

  if (resultCount !== undefined && resultCount > 0) {
    description += ` (${resultCount} ${resultCount === 1 ? 'resultat' : 'resultater'})`;
  }

  return {
    title,
    description,
    url: generateShareableUrl(filters, searchQuery),
  };
}

/**
 * Copy URL to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Native sharing with fallback to clipboard
 */
export async function shareUrl(
  filters: PostFilters,
  searchQuery?: string,
  resultCount?: number
): Promise<{ success: boolean; method: 'native' | 'clipboard' | 'none' }> {
  const metadata = generateSharingMetadata(filters, searchQuery, resultCount);
  
  // Try native sharing first
  if (navigator.share) {
    try {
      await navigator.share({
        title: metadata.title,
        text: metadata.description,
        url: metadata.url,
      });
      return { success: true, method: 'native' };
    } catch (err) {
      // User cancelled or error occurred, try clipboard
      console.log('Native sharing cancelled or failed:', err);
    }
  }
  
  // Fallback to clipboard
  const success = await copyToClipboard(metadata.url);
  return { 
    success, 
    method: success ? 'clipboard' : 'none'
  };
}

/**
 * Deep link to specific parts of the app with search context
 */
export function createDeepLink(
  path: string,
  filters?: PostFilters,
  searchQuery?: string
): string {
  const baseUrl = typeof window !== 'undefined' ? 
    `${window.location.origin}${path}` : 
    `https://tutorconnect.no${path}`;
    
  if (!filters && !searchQuery) {
    return baseUrl;
  }
  
  const params = filtersToUrlParams(filters || {}, searchQuery);
  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
}

/**
 * Update URL without page reload
 */
export function updateUrlWithoutReload(
  filters: PostFilters,
  searchQuery?: string,
  router?: any
): void {
  if (typeof window === 'undefined') return;
  
  const params = filtersToUrlParams(filters, searchQuery);
  const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
  
  if (router?.replace) {
    // Use Next.js router if available
    router.replace(newUrl, undefined, { shallow: true });
  } else {
    // Fallback to window.history
    window.history.replaceState(
      { ...window.history.state, as: newUrl, url: newUrl },
      '',
      newUrl
    );
  }
}