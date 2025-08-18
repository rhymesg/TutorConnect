'use client';

import { ArrowUpDown, Grid, List, SlidersHorizontal } from 'lucide-react';
import { PostFilters } from '@/types/database';

interface SortAndViewProps {
  filters: PostFilters;
  onFiltersChange: (filters: PostFilters) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalResults: number;
  className?: string;
}

type SortOption = 'createdAt' | 'hourlyRate' | 'rating';
type SortOrder = 'asc' | 'desc';

export default function SortAndView({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  totalResults,
  className = ''
}: SortAndViewProps) {
  
  const handleSortChange = (sortBy: SortOption, sortOrder?: SortOrder) => {
    const newOrder = sortOrder || (filters.sortOrder === 'asc' ? 'desc' : 'asc');
    onFiltersChange({
      ...filters,
      sortBy,
      sortOrder: newOrder,
      page: 1, // Reset to first page when sorting changes
    });
  };

  const sortOptions = [
    { 
      value: 'createdAt', 
      label: 'Dato',
      ascLabel: 'Eldste først',
      descLabel: 'Nyeste først'
    },
    { 
      value: 'hourlyRate', 
      label: 'Pris',
      ascLabel: 'Laveste pris',
      descLabel: 'Høyeste pris'
    },
    { 
      value: 'rating', 
      label: 'Vurdering',
      ascLabel: 'Laveste vurdering',
      descLabel: 'Høyeste vurdering'
    },
  ];

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === filters.sortBy);
    if (!option) return 'Sorter';
    
    return filters.sortOrder === 'desc' ? option.descLabel : option.ascLabel;
  };

  return (
    <div className={`bg-white border-b border-neutral-200 px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Results count */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-neutral-600">
            {totalResults > 0 
              ? `${totalResults.toLocaleString('nb-NO')} ${totalResults === 1 ? 'resultat' : 'resultater'}`
              : 'Ingen resultater'
            }
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [SortOption, SortOrder];
                handleSortChange(sortBy, sortOrder);
              }}
              className="appearance-none bg-white border border-neutral-300 rounded-lg px-3 py-2 pr-10 text-sm text-neutral-700 hover:bg-neutral-50 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            >
              <optgroup label="Dato">
                <option value="createdAt-desc">Nyeste først</option>
                <option value="createdAt-asc">Eldste først</option>
              </optgroup>
              <optgroup label="Pris">
                <option value="hourlyRate-asc">Laveste pris</option>
                <option value="hourlyRate-desc">Høyeste pris</option>
              </optgroup>
              <optgroup label="Vurdering">
                <option value="rating-desc">Høyeste vurdering</option>
                <option value="rating-asc">Laveste vurdering</option>
              </optgroup>
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-neutral-300 rounded-lg overflow-hidden">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-brand-100 text-brand-700 border-brand-200'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
              title="Rutenettvisning"
              aria-label="Rutenettvisning"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 text-sm font-medium transition-colors border-l ${
                viewMode === 'list'
                  ? 'bg-brand-100 text-brand-700 border-brand-200'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50 border-neutral-300'
              }`}
              title="Listevisning"
              aria-label="Listevisning"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick sort buttons component for mobile
export function QuickSortButtons({
  filters,
  onFiltersChange,
  className = ''
}: {
  filters: PostFilters;
  onFiltersChange: (filters: PostFilters) => void;
  className?: string;
}) {
  const quickSortOptions = [
    { 
      label: 'Nyeste', 
      sortBy: 'createdAt' as const, 
      sortOrder: 'desc' as const,
      active: filters.sortBy === 'createdAt' && filters.sortOrder === 'desc'
    },
    { 
      label: 'Laveste pris', 
      sortBy: 'hourlyRate' as const, 
      sortOrder: 'asc' as const,
      active: filters.sortBy === 'hourlyRate' && filters.sortOrder === 'asc'
    },
    { 
      label: 'Høyeste vurdering', 
      sortBy: 'rating' as const, 
      sortOrder: 'desc' as const,
      active: filters.sortBy === 'rating' && filters.sortOrder === 'desc'
    },
  ];

  const handleQuickSort = (sortBy: SortOption, sortOrder: SortOrder) => {
    onFiltersChange({
      ...filters,
      sortBy,
      sortOrder,
      page: 1,
    });
  };

  return (
    <div className={`flex gap-2 overflow-x-auto ${className}`}>
      {quickSortOptions.map((option) => (
        <button
          key={`${option.sortBy}-${option.sortOrder}`}
          onClick={() => handleQuickSort(option.sortBy, option.sortOrder)}
          className={`flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
            option.active
              ? 'bg-brand-100 text-brand-700 border border-brand-200'
              : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Results per page selector
export function ResultsPerPage({
  currentLimit,
  onLimitChange,
  className = ''
}: {
  currentLimit: number;
  onLimitChange: (limit: number) => void;
  className?: string;
}) {
  const limitOptions = [12, 24, 48, 96];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-neutral-600">Vis:</span>
      <select
        value={currentLimit}
        onChange={(e) => onLimitChange(parseInt(e.target.value))}
        className="bg-white border border-neutral-300 rounded-lg px-2 py-1 text-sm text-neutral-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
      >
        {limitOptions.map(limit => (
          <option key={limit} value={limit}>
            {limit}
          </option>
        ))}
      </select>
      <span className="text-sm text-neutral-600">per side</span>
    </div>
  );
}