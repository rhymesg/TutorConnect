// Search components for TutorConnect
export { default as SearchBar } from './SearchBar';
export { default as SearchSuggestions } from './SearchSuggestions';
export { default as FilterPanel } from './FilterPanel';

// Re-export types from search utilities
export type {
  SearchSuggestion,
  SearchHistoryItem,
} from '@/lib/search-utils';