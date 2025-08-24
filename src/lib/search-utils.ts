/**
 * Search utilities for TutorConnect Norwegian tutoring platform
 * Provides Norwegian-specific search functionality and data processing
 */

import { PostFilters, Subject, AgeGroup, NorwegianRegion, PostType } from '@/types/database';

// Norwegian search constants
export const NORWEGIAN_SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 300,
  MIN_SEARCH_LENGTH: 2,
  MAX_SUGGESTIONS: 8,
  MAX_RECENT_SEARCHES: 10,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  LOCAL_STORAGE_KEY: 'tutorconnect_search_history',
} as const;

// Norwegian subjects with search keywords
export const NORWEGIAN_SUBJECTS = {
  MATHEMATICS: {
    no: 'Matematikk',
    keywords: ['matte', 'regning', 'algebra', 'geometri', 'statistikk', 'kalkulus']
  },
  NORWEGIAN: {
    no: 'Norsk',
    keywords: ['språk', 'grammatikk', 'skriving', 'lesing', 'litteratur', 'bokmål', 'nynorsk']
  },
  ENGLISH: {
    no: 'Engelsk',
    keywords: ['language', 'grammar', 'speaking', 'writing', 'pronunciation']
  },
  SCIENCE: {
    no: 'Naturfag',
    keywords: ['fysikk', 'kjemi', 'biologi', 'naturvitenskap']
  },
  HISTORY: {
    no: 'Historie',
    keywords: ['samfunnsfag', 'verdenshistorie', 'norgeshistorie']
  },
  MUSIC: {
    no: 'Musikk',
    keywords: ['piano', 'gitar', 'sang', 'instrument', 'teori']
  },
  ART: {
    no: 'Kunst',
    keywords: ['tegning', 'maling', 'kreativitet', 'design']
  },
  PROGRAMMING: {
    no: 'Programmering',
    keywords: ['koding', 'javascript', 'python', 'web', 'app', 'utvikling']
  },
  PHYSICS: {
    no: 'Fysikk',
    keywords: ['mekanikk', 'elektromagnetisme', 'termodynamikk']
  },
  CHEMISTRY: {
    no: 'Kjemi',
    keywords: ['organisk', 'uorganisk', 'lab', 'reaksjoner']
  },
  BIOLOGY: {
    no: 'Biologi',
    keywords: ['anatomi', 'genetikk', 'evolusjon', 'økologi']
  },
  GEOGRAPHY: {
    no: 'Geografi',
    keywords: ['kart', 'klima', 'miljø', 'samfunnsgeografi']
  },
  ECONOMICS: {
    no: 'Økonomi',
    keywords: ['finans', 'regnskap', 'bedriftsøkonomi', 'makroøkonomi']
  },
  PSYCHOLOGY: {
    no: 'Psykologi',
    keywords: ['mental', 'atferd', 'kognitiv', 'sosial']
  },
  LANGUAGES: {
    no: 'Språk',
    keywords: ['fremmedspråk', 'spansk', 'fransk', 'tysk', 'italiensk']
  }
} as const;

// Age group labels and search terms
export const AGE_GROUP_CONFIG = {
  PRESCHOOL: {
    no: '0-5 år',
    keywords: ['barnehage', 'førskole', 'småbarn'],
    ageRange: '0-5'
  },
  PRIMARY_LOWER: {
    no: '6-9 år',
    keywords: ['1.-4. klasse', 'småskole', 'barneskole lavere'],
    ageRange: '6-9'
  },
  PRIMARY_UPPER: {
    no: '10-12 år',
    keywords: ['5.-7. klasse', 'barneskole øvre', 'mellomtrinn'],
    ageRange: '10-12'
  },
  MIDDLE: {
    no: '13-15 år',
    keywords: ['8.-10. klasse', 'ungdomsskole'],
    ageRange: '13-15'
  },
  SECONDARY: {
    no: '16-18 år',
    keywords: ['vgs', 'videregående', '1vg', '2vg', '3vg'],
    ageRange: '16-18'
  },
  ADULTS: {
    no: '19+ år',
    keywords: ['voksen', 'høyskole', 'universitet', 'etterutdanning'],
    ageRange: '19+'
  }
} as const;

// Norwegian regions with major cities
export const NORWEGIAN_REGIONS_CONFIG = {
  OSLO: {
    name: 'Oslo',
    cities: ['Oslo', 'Bærum', 'Asker', 'Lørenskog', 'Ski'],
    region: 'Østlandet'
  },
  AKERSHUS: {
    name: 'Akershus',
    cities: ['Sandvika', 'Lillestrøm', 'Drøbak', 'Jessheim'],
    region: 'Østlandet'
  },
  BERGEN: {
    name: 'Bergen',
    cities: ['Bergen', 'Åsane', 'Fyllingsdalen'],
    region: 'Vestlandet'
  },
  TRONDHEIM: {
    name: 'Trondheim',
    cities: ['Trondheim', 'Malvik', 'Klæbu'],
    region: 'Trøndelag'
  },
  STAVANGER: {
    name: 'Stavanger',
    cities: ['Stavanger', 'Sandnes', 'Sola', 'Randaberg'],
    region: 'Vestlandet'
  },
  KRISTIANSAND: {
    name: 'Kristiansand',
    cities: ['Kristiansand', 'Grimstad', 'Arendal'],
    region: 'Sørlandet'
  },
  TROMSØ: {
    name: 'Tromsø',
    cities: ['Tromsø', 'Lyngen', 'Balsfjord'],
    region: 'Nord-Norge'
  },
  BODØ: {
    name: 'Bodø',
    cities: ['Bodø', 'Fauske', 'Saltdal'],
    region: 'Nord-Norge'
  }
} as const;

// Price ranges commonly used in Norwegian tutoring market
export const PRICE_RANGES = [
  { min: 0, max: 200, label: 'Under 200 kr' },
  { min: 200, max: 400, label: '200-400 kr' },
  { min: 400, max: 600, label: '400-600 kr' },
  { min: 600, max: 800, label: '600-800 kr' },
  { min: 800, max: 1000, label: '800-1000 kr' },
  { min: 1000, max: null, label: 'Over 1000 kr' },
] as const;

// Search history interface
export interface SearchHistoryItem {
  id: string;
  query: string;
  filters?: Partial<PostFilters>;
  timestamp: number;
  resultCount?: number;
}

// Search suggestion interface
export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'subject' | 'location' | 'keyword' | 'recent';
  category?: string;
  filters?: Partial<PostFilters>;
}

/**
 * Generate search suggestions based on query
 */
export function generateSearchSuggestions(query: string): SearchSuggestion[] {
  if (!query || query.length < NORWEGIAN_SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
    return [];
  }

  const suggestions: SearchSuggestion[] = [];
  const normalizedQuery = query.toLowerCase().trim();

  // Search in subjects
  Object.entries(NORWEGIAN_SUBJECTS).forEach(([key, config]) => {
    const matchesName = config.no.toLowerCase().includes(normalizedQuery);
    const matchesKeywords = config.keywords.some(keyword => 
      keyword.toLowerCase().includes(normalizedQuery)
    );

    if (matchesName || matchesKeywords) {
      suggestions.push({
        id: `subject-${key}`,
        text: config.no,
        type: 'subject',
        category: 'Fag',
        filters: { subject: key as Subject }
      });
    }
  });

  // Search in locations
  Object.values(NORWEGIAN_REGIONS_CONFIG).forEach(region => {
    const matchesRegion = region.name.toLowerCase().includes(normalizedQuery);
    const matchesCity = region.cities.some(city => 
      city.toLowerCase().includes(normalizedQuery)
    );

    if (matchesRegion || matchesCity) {
      suggestions.push({
        id: `location-${region.name}`,
        text: region.name,
        type: 'location',
        category: 'Sted',
        filters: { location: region.name as NorwegianRegion }
      });
    }
  });

  // Search in age groups
  Object.entries(AGE_GROUP_CONFIG).forEach(([key, config]) => {
    const matchesName = config.no.toLowerCase().includes(normalizedQuery);
    const matchesKeywords = config.keywords.some(keyword => 
      keyword.toLowerCase().includes(normalizedQuery)
    );

    if (matchesName || matchesKeywords) {
      suggestions.push({
        id: `age-${key}`,
        text: config.no,
        type: 'keyword',
        category: 'Aldersgruppe',
        filters: { ageGroups: [key as AgeGroup] }
      });
    }
  });

  return suggestions.slice(0, NORWEGIAN_SEARCH_CONFIG.MAX_SUGGESTIONS);
}

/**
 * Normalize search query for Norwegian language
 */
export function normalizeNorwegianQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    // Norwegian character replacements for better search
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    // Remove extra spaces
    .replace(/\s+/g, ' ');
}

/**
 * Get search history from localStorage
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(NORWEGIAN_SEARCH_CONFIG.LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading search history:', error);
    return [];
  }
}

/**
 * Save search to history
 */
export function saveSearchToHistory(query: string, filters?: Partial<PostFilters>, resultCount?: number): void {
  if (typeof window === 'undefined' || !query.trim()) return;

  try {
    const history = getSearchHistory();
    const newItem: SearchHistoryItem = {
      id: `search-${Date.now()}`,
      query: query.trim(),
      filters,
      timestamp: Date.now(),
      resultCount
    };

    // Remove duplicates and add new item
    const filteredHistory = history.filter(item => 
      item.query.toLowerCase() !== query.toLowerCase()
    );
    
    const updatedHistory = [newItem, ...filteredHistory]
      .slice(0, NORWEGIAN_SEARCH_CONFIG.MAX_RECENT_SEARCHES);

    localStorage.setItem(
      NORWEGIAN_SEARCH_CONFIG.LOCAL_STORAGE_KEY, 
      JSON.stringify(updatedHistory)
    );
  } catch (error) {
    console.error('Error saving search history:', error);
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(NORWEGIAN_SEARCH_CONFIG.LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
}

/**
 * Build filters from search query using Norwegian keywords
 */
export function buildFiltersFromQuery(query: string): Partial<PostFilters> {
  const normalizedQuery = normalizeNorwegianQuery(query);
  const filters: Partial<PostFilters> = {};

  // Check for post type keywords
  if (normalizedQuery.includes('lærer') || normalizedQuery.includes('underviser')) {
    filters.type = 'TEACHER';
  } else if (normalizedQuery.includes('student') || normalizedQuery.includes('elev')) {
    filters.type = 'STUDENT';
  }

  // Check for subject matches
  Object.entries(NORWEGIAN_SUBJECTS).forEach(([key, config]) => {
    const matchesName = config.no.toLowerCase().includes(normalizedQuery);
    const matchesKeywords = config.keywords.some(keyword => 
      normalizedQuery.includes(keyword.toLowerCase())
    );

    if (matchesName || matchesKeywords) {
      filters.subject = key as Subject;
    }
  });

  // Check for location matches
  Object.values(NORWEGIAN_REGIONS_CONFIG).forEach(region => {
    const matchesRegion = normalizedQuery.includes(region.name.toLowerCase());
    const matchesCity = region.cities.some(city => 
      normalizedQuery.includes(city.toLowerCase())
    );

    if (matchesRegion || matchesCity) {
      filters.location = region.name as NorwegianRegion;
    }
  });

  return filters;
}

/**
 * Format filter display text in Norwegian
 */
export function formatFilterText(filters: PostFilters): string[] {
  const parts: string[] = [];

  if (filters.type) {
    parts.push(filters.type === 'TEACHER' ? 'Lærere' : 'Studenter');
  }

  if (filters.subject && NORWEGIAN_SUBJECTS[filters.subject as keyof typeof NORWEGIAN_SUBJECTS]) {
    parts.push(NORWEGIAN_SUBJECTS[filters.subject as keyof typeof NORWEGIAN_SUBJECTS].no);
  }

  if (filters.location) {
    parts.push(`i ${filters.location}`);
  }

  if (filters.ageGroups?.length) {
    const ageGroupNames = filters.ageGroups.map(ag => 
      AGE_GROUP_CONFIG[ag as keyof typeof AGE_GROUP_CONFIG]?.no
    ).filter(Boolean);
    if (ageGroupNames.length > 0) {
      parts.push(ageGroupNames.join(', '));
    }
  }

  if (filters.minRate || filters.maxRate) {
    if (filters.minRate && filters.maxRate) {
      parts.push(`${filters.minRate}-${filters.maxRate} kr/time`);
    } else if (filters.minRate) {
      parts.push(`fra ${filters.minRate} kr/time`);
    } else if (filters.maxRate) {
      parts.push(`opptil ${filters.maxRate} kr/time`);
    }
  }

  return parts;
}

/**
 * Generate URL search params from filters (deprecated - use url-utils instead)
 * @deprecated Use filtersToUrlParams from url-utils.ts instead
 */
export function filtersToSearchParams(filters: PostFilters): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value != null && value !== '' && value !== undefined) {
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
 * Parse URL search params to filters (deprecated - use url-utils instead)
 * @deprecated Use urlParamsToFilters from url-utils.ts instead
 */
export function searchParamsToFilters(searchParams: URLSearchParams): PostFilters {
  const filters: PostFilters = {};

  searchParams.forEach((value, key) => {
    switch (key) {
      case 'search':
        if (value) filters.search = value;
        break;
      case 'type':
        if (value) filters.type = value as PostType;
        break;
      case 'subject':
        if (value) filters.subject = value as Subject;
        break;
      case 'location':
        if (value) filters.location = value as NorwegianRegion;
        break;
      case 'ageGroups':
        if (value) filters.ageGroups = value.split(',') as AgeGroup[];
        break;
      case 'minRate':
        if (value && !isNaN(Number(value))) filters.minRate = Number(value);
        break;
      case 'maxRate':
        if (value && !isNaN(Number(value))) filters.maxRate = Number(value);
        break;
      case 'page':
        if (value && !isNaN(Number(value))) filters.page = Number(value);
        break;
      case 'limit':
        if (value && !isNaN(Number(value))) filters.limit = Number(value);
        break;
      case 'sortBy':
        if (value) filters.sortBy = value as any;
        break;
      case 'sortOrder':
        if (value === 'asc' || value === 'desc') filters.sortOrder = value;
        break;
    }
  });

  return filters;
}