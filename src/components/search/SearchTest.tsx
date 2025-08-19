'use client';

import { useState } from 'react';
import { SearchBar, FilterPanel } from './index';
import { PostFilters } from '@/types/database';
import { generateSearchSuggestions } from '@/lib/search-utils';

/**
 * Test component for search functionality
 * Used for testing and demo purposes
 */
export default function SearchTest() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<PostFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const suggestions = generateSearchSuggestions(query);
  const recentSearches = []; // Empty for test

  const handleSuggestionSelect = (suggestion: any) => {
    setQuery(suggestion.text);
    if (suggestion.filters) {
      setFilters(prev => ({ ...prev, ...suggestion.filters }));
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Search Component Test</h1>
      
      {/* Search Bar Test */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">SearchBar Component</h2>
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          suggestions={suggestions}
          recentSearches={recentSearches}
          onSuggestionSelect={handleSuggestionSelect}
          onRecentSearchSelect={() => {}}
          onFilterToggle={() => setShowFilters(!showFilters)}
          activeFilterCount={Object.keys(filters).length}
          placeholder="Test søk..."
        />
      </div>

      {/* Filter Panel Test */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">FilterPanel Component</h2>
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
          resultCount={42}
        />
      </div>

      {/* Current State Display */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Current State:</h3>
        <pre className="text-sm">
          {JSON.stringify({ query, filters, showFilters }, null, 2)}
        </pre>
      </div>
    </div>
  );
}