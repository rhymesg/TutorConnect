'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  MapPin, 
  Users, 
  Banknote, 
  X,
  Trash2,
  Star
} from 'lucide-react';
import { SearchSuggestion, SearchHistoryItem, NORWEGIAN_SUBJECTS, AGE_GROUP_CONFIG } from '@/lib/search-utils';
import { PostType } from '@/types/database';
import { createOsloFormatter } from '@/lib/datetime';

interface SearchSuggestionsProps {
  query: string;
  suggestions: SearchSuggestion[];
  recentSearches: SearchHistoryItem[];
  isVisible: boolean;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  onRecentSearchSelect: (search: SearchHistoryItem) => void;
  onClearHistory?: () => void;
  onClose: () => void;
  className?: string;
}

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ReactNode;
  filters: Record<string, any>;
  color: string;
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'tutor-math',
    label: 'Mattelærere',
    icon: <BookOpen className="w-4 h-4" />,
    filters: { type: 'TEACHER' as PostType, subject: 'MATHEMATICS' },
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    id: 'tutor-norwegian',
    label: 'Norsklærere',
    icon: <BookOpen className="w-4 h-4" />,
    filters: { type: 'TEACHER' as PostType, subject: 'NORWEGIAN' },
    color: 'bg-green-50 text-green-700 border-green-200'
  },
  {
    id: 'tutor-english',
    label: 'Engelsklærere',
    icon: <BookOpen className="w-4 h-4" />,
    filters: { type: 'TEACHER' as PostType, subject: 'ENGLISH' },
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    id: 'university-level',
    label: 'Universitetnivå',
    icon: <Users className="w-4 h-4" />,
    filters: { ageGroups: ['UNIVERSITY'] },
    color: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  {
    id: 'budget-friendly',
    label: 'Under 400 kr/t',
    icon: <Banknote className="w-4 h-4" />,
    filters: { maxRate: 400 },
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    id: 'oslo-area',
    label: 'Oslo-området',
    icon: <MapPin className="w-4 h-4" />,
    filters: { location: 'OSLO' },
    color: 'bg-rose-50 text-rose-700 border-rose-200'
  }
];

export default function SearchSuggestions({
  query,
  suggestions,
  recentSearches,
  isVisible,
  onSuggestionSelect,
  onRecentSearchSelect,
  onClearHistory,
  onClose,
  className = '',
}: SearchSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions, recentSearches]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      const totalItems = recentSearches.length + suggestions.length;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % totalItems);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            if (selectedIndex < recentSearches.length) {
              onRecentSearchSelect(recentSearches[selectedIndex]);
            } else {
              onSuggestionSelect(suggestions[selectedIndex - recentSearches.length]);
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, selectedIndex, recentSearches, suggestions, onRecentSearchSelect, onSuggestionSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && containerRef.current) {
      const selectedElement = containerRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'subject':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'location':
        return <MapPin className="w-4 h-4 text-green-500" />;
      case 'keyword':
        return <TrendingUp className="w-4 h-4 text-purple-500" />;
      case 'recent':
        return <Clock className="w-4 h-4 text-neutral-400" />;
      default:
        return <Search className="w-4 h-4 text-neutral-400" />;
    }
  };

  const recentDateFormatter = useMemo(() => createOsloFormatter('nb-NO'), []);

  const formatRecentSearchTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Nå';
    if (minutes < 60) return `${minutes}m siden`;
    if (hours < 24) return `${hours}t siden`;
    if (days < 7) return `${days}d siden`;
    return recentDateFormatter.format(new Date(timestamp));
  };

  const handleQuickFilterClick = (filter: QuickFilter) => {
    const suggestion: SearchSuggestion = {
      id: filter.id,
      text: filter.label,
      type: 'keyword',
      filters: filter.filters
    };
    onSuggestionSelect(suggestion);
  };

  if (!isVisible) return null;

  return (
    <div className={`absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden ${className}`}>
      <div ref={containerRef} className="max-h-96 overflow-y-auto">
        {/* No query - show quick filters and recent searches */}
        {!query.trim() && (
          <>
            {/* Quick Filters */}
            <div className="p-4 border-b border-neutral-100">
              <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
                Populære søk
              </div>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => handleQuickFilterClick(filter)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors hover:shadow-sm ${filter.color}`}
                  >
                    <div className="flex items-center">
                      {filter.icon}
                      <span className="ml-2 truncate">{filter.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="border-b border-neutral-100">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Nylige søk
                  </div>
                  {onClearHistory && (
                    <button
                      onClick={onClearHistory}
                      className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors flex items-center"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Tøm
                    </button>
                  )}
                </div>
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={search.id}
                    onClick={() => onRecentSearchSelect(search)}
                    className={`w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors flex items-center group ${
                      selectedIndex === index ? 'bg-neutral-50' : ''
                    }`}
                  >
                    <Clock className="w-4 h-4 text-neutral-400 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-neutral-900 truncate">
                        {search.query}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-xs text-neutral-500">
                          {search.resultCount !== undefined && `${search.resultCount} resultater • `}
                          {formatRecentSearchTime(search.timestamp)}
                        </div>
                        {search.resultCount !== undefined && search.resultCount > 0 && (
                          <Star className="w-3 h-3 text-yellow-400" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* With query - show suggestions */}
        {query.trim() && suggestions.length > 0 && (
          <div>
            <div className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Forslag for "{query}"
            </div>
            {suggestions.map((suggestion, index) => {
              const adjustedIndex = recentSearches.length + index;
              return (
                <button
                  key={suggestion.id}
                  onClick={() => onSuggestionSelect(suggestion)}
                  className={`w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors flex items-center group ${
                    selectedIndex === adjustedIndex ? 'bg-neutral-50' : ''
                  }`}
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
              );
            })}
          </div>
        )}

        {/* Empty state when searching */}
        {query.trim() && suggestions.length === 0 && recentSearches.length === 0 && (
          <div className="px-4 py-8 text-center text-neutral-500">
            <Search className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
            <div className="text-sm">Ingen forslag funnet</div>
            <div className="text-xs text-neutral-400 mt-1">
              Prøv et annet søkeord eller bruk filtrene
            </div>
          </div>
        )}

        {/* Keyboard shortcuts footer */}
        <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <kbd className="px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-mono">
                  ↑↓
                </kbd>
                <span className="ml-1">navigér</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-mono">
                  Enter
                </kbd>
                <span className="ml-1">velg</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-mono">
                  Esc
                </kbd>
                <span className="ml-1">lukk</span>
              </div>
            </div>
            <div className="text-neutral-400">
              TutorConnect søk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
