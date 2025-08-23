'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp, MapPin, BookOpen, Filter, Share } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SearchSuggestion, SearchHistoryItem } from '@/lib/search-utils';
import { forms, actions } from '@/lib/translations';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  suggestions: SearchSuggestion[];
  recentSearches: SearchHistoryItem[];
  isLoading?: boolean;
  hasSuggestions?: boolean;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  onRecentSearchSelect: (search: SearchHistoryItem) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSearch?: () => void;
  onFilterToggle?: () => void;
  onShare?: () => void;
  placeholder?: string;
  showFilters?: boolean;
  activeFilterCount?: number;
  className?: string;
}

export default function SearchBar({
  query,
  onQueryChange,
  suggestions,
  recentSearches,
  isLoading = false,
  hasSuggestions = false,
  onSuggestionSelect,
  onRecentSearchSelect,
  onFocus,
  onBlur,
  onSearch,
  onFilterToggle,
  onShare,
  placeholder = 'Søk etter lærere eller fag...',
  showFilters = true,
  activeFilterCount = 0,
  className = '',
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setIsFocused(false);
        onBlur?.();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onBlur]);

  // Show dropdown when there are suggestions or recent searches
  useEffect(() => {
    setShowDropdown(isFocused && (hasSuggestions || recentSearches.length > 0));
  }, [isFocused, hasSuggestions, recentSearches.length]);

  const handleInputFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch?.();
      setShowDropdown(false);
      searchRef.current?.blur();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      searchRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSuggestionSelect(suggestion);
    setShowDropdown(false);
    searchRef.current?.blur();
  };

  const handleRecentSearchClick = (search: SearchHistoryItem) => {
    onRecentSearchSelect(search);
    setShowDropdown(false);
    searchRef.current?.blur();
  };

  const handleClear = () => {
    onQueryChange('');
    searchRef.current?.focus();
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'subject':
        return <BookOpen className="w-4 h-4 text-neutral-400" />;
      case 'location':
        return <MapPin className="w-4 h-4 text-neutral-400" />;
      case 'keyword':
        return <TrendingUp className="w-4 h-4 text-neutral-400" />;
      case 'recent':
        return <Clock className="w-4 h-4 text-neutral-400" />;
      default:
        return <Search className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <div className={`
          flex items-center bg-white border rounded-xl transition-all duration-200 
          ${isFocused || showDropdown
            ? 'border-brand-500 ring-2 ring-brand-100 shadow-lg' 
            : 'border-neutral-300 hover:border-neutral-400'
          }
        `}>
          {/* Search Icon */}
          <div className="pl-4 pr-2">
            <Search className={`w-5 h-5 transition-colors ${
              isFocused ? 'text-brand-500' : 'text-neutral-400'
            }`} />
          </div>

          {/* Input Field */}
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            className="flex-1 py-3 px-2 text-neutral-900 placeholder-neutral-500 bg-transparent border-none outline-none text-sm sm:text-base"
            autoComplete="off"
            spellCheck="false"
          />

          {/* Loading Spinner */}
          {isLoading && (
            <div className="px-2">
              <LoadingSpinner size="sm" />
            </div>
          )}

          {/* Clear Button */}
          {query && !isLoading && (
            <button
              onClick={handleClear}
              className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
              type="button"
              aria-label="Tøm søk"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Action Buttons */}
          <div className="flex items-center border-l border-neutral-200 ml-2">
            {/* Share Button */}
            {onShare && (
              <button
                onClick={onShare}
                className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                type="button"
                title="Del søk"
              >
                <Share className="w-4 h-4" />
              </button>
            )}

            {/* Filter Toggle */}
            {showFilters && onFilterToggle && (
              <button
                onClick={onFilterToggle}
                className={`p-2 transition-colors relative ${
                  activeFilterCount > 0
                    ? 'text-brand-600 hover:text-brand-700'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
                type="button"
                title="Filtrer"
              >
                <Filter className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {activeFilterCount > 9 ? '9+' : activeFilterCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden"
        >
          <div className="max-h-96 overflow-y-auto">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="border-b border-neutral-100">
                <div className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Nylige søk
                </div>
                {recentSearches.slice(0, 3).map((search) => (
                  <button
                    key={search.id}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors flex items-center group"
                  >
                    <Clock className="w-4 h-4 text-neutral-400 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-neutral-900 truncate">
                        {search.query}
                      </div>
                      {search.resultCount !== undefined && (
                        <div className="text-xs text-neutral-500">
                          {search.resultCount} resultater
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <div className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Forslag
                </div>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors flex items-center group"
                  >
                    {getSuggestionIcon(suggestion.type)}
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="text-sm text-neutral-900 truncate">
                        {suggestion.text}
                      </div>
                      {suggestion.category && (
                        <div className="text-xs text-neutral-500">
                          {suggestion.category}
                        </div>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-xs text-neutral-400 flex items-center">
                        <Search className="w-3 h-3 mr-1" />
                        Søk
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Empty State */}
            {suggestions.length === 0 && recentSearches.length === 0 && (
              <div className="px-4 py-8 text-center text-neutral-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                <div className="text-sm">Begynn å skrive for å se forslag</div>
              </div>
            )}

            {/* Quick Actions Footer */}
            <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-3">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <kbd className="px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-mono">
                      Enter
                    </kbd>
                    <span className="ml-1">for å søke</span>
                  </div>
                  <div className="flex items-center">
                    <kbd className="px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-mono">
                      Esc
                    </kbd>
                    <span className="ml-1">for å lukke</span>
                  </div>
                </div>
                {recentSearches.length > 0 && (
                  <button className="text-neutral-400 hover:text-neutral-600 transition-colors">
                    Tøm historikk
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}