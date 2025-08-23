'use client';

import { useState } from 'react';
import { X, Search, MapPin, BookOpen, Users, Banknote, Filter, Sliders, ChevronDown, RotateCcw } from 'lucide-react';
import { PostFilters } from '@/types/database';
import { education, formatters } from '@/lib/translations';
import { getSubjectLabel } from '@/constants/subjects';
import { getAgeGroupLabel } from '@/constants/ageGroups';
import { getRegionLabel } from '@/constants/regions';

interface ActiveFiltersEnhancedProps {
  filters: PostFilters;
  onFiltersChange: (filters: PostFilters) => void;
  className?: string;
  showDesktopFilters?: boolean;
  setShowDesktopFilters?: (show: boolean) => void;
  setShowMobileFilters?: (show: boolean) => void;
}

export default function ActiveFiltersEnhanced({ 
  filters, 
  onFiltersChange,
  className = '',
  showDesktopFilters,
  setShowDesktopFilters,
  setShowMobileFilters
}: ActiveFiltersEnhancedProps) {
  const removeFilter = (key: keyof PostFilters) => {
    const updated = { ...filters };
    delete updated[key];
    onFiltersChange({ ...updated, page: 1 });
  };

  const removePriceRange = () => {
    const updated = { ...filters };
    delete updated.minRate;
    delete updated.maxRate;
    onFiltersChange({ ...updated, page: 1 });
  };

  const activeFilters = [];

  // Search filter
  if (filters.search) {
    activeFilters.push({
      key: 'search' as keyof PostFilters,
      label: `"${filters.search}"`,
      icon: Search,
      onRemove: () => removeFilter('search')
    });
  }

  // Post type filter
  if (filters.type) {
    activeFilters.push({
      key: 'type' as keyof PostFilters,
      label: filters.type === 'TEACHER' ? 'Tilbyr undervisning' : 'Søker lærer',
      icon: Filter,
      onRemove: () => removeFilter('type')
    });
  }

  // Subject filter
  if (filters.subject) {
    const subjectLabel = getSubjectLabel(filters.subject);
    activeFilters.push({
      key: 'subject' as keyof PostFilters,
      label: subjectLabel,
      icon: BookOpen,
      onRemove: () => removeFilter('subject')
    });
  }

  // Location filter
  if (filters.location) {
    activeFilters.push({
      key: 'location' as keyof PostFilters,
      label: getRegionLabel(filters.location),
      icon: MapPin,
      onRemove: () => removeFilter('location')
    });
  }

  // Age groups filter
  if (filters.ageGroups?.length) {
    const label = filters.ageGroups.length === 1 
      ? getAgeGroupLabel(filters.ageGroups[0])
      : `${filters.ageGroups.length} aldersgrupper`;

    activeFilters.push({
      key: 'ageGroups' as keyof PostFilters,
      label,
      icon: Users,
      onRemove: () => removeFilter('ageGroups')
    });
  }

  // Price range filter
  if (filters.minRate || filters.maxRate) {
    let label = '';
    if (filters.minRate && filters.maxRate) {
      label = `${formatters.currency(filters.minRate)} - ${formatters.currency(filters.maxRate)}`;
    } else if (filters.minRate) {
      label = `Fra ${formatters.currency(filters.minRate)}`;
    } else if (filters.maxRate) {
      label = `Opptil ${formatters.currency(filters.maxRate)}`;
    }
    
    activeFilters.push({
      key: 'priceRange',
      label,
      icon: Banknote,
      onRemove: removePriceRange
    });
  }

  // Show component even if no active filters to display filter buttons

  const clearFilters = () => {
    onFiltersChange({
      page: 1,
      limit: filters.limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.type) count++;
    if (filters.subject) count++;
    if (filters.ageGroups?.length) count++;
    if (filters.location) count++;
    if (filters.minRate || filters.maxRate) count++;
    if (filters.search) count++;
    return count;
  };

  const hasActiveFilters = () => {
    return !!(
      filters.type || 
      filters.subject || 
      filters.ageGroups?.length || 
      filters.location || 
      filters.minRate || 
      filters.maxRate ||
      filters.search
    );
  };

  return (
    <div className={`px-4 py-3 bg-neutral-50 border-b border-neutral-200 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Left side - Filter buttons and active filters */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Desktop filter toggle */}
          {setShowDesktopFilters && (
            <button
              onClick={() => setShowDesktopFilters(!showDesktopFilters)}
              className="hidden sm:inline-flex items-center px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-all shadow-sm"
            >
              <Sliders className="w-4 h-4 mr-2" />
              Avanserte filtre
              {getActiveFilterCount() > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-brand-500 rounded-full">
                  {getActiveFilterCount()}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showDesktopFilters ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* Mobile filter toggle */}
          {setShowMobileFilters && (
            <button
              onClick={() => setShowMobileFilters(true)}
              className="sm:hidden inline-flex items-center px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-all shadow-sm"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
              {getActiveFilterCount() > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-brand-500 rounded-full">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
          )}

          {/* Active filters chips */}
          {activeFilters.length > 0 && (
            <>
              {activeFilters.map((filter) => {
                const IconComponent = filter.icon;
                return (
                  <button
                    key={typeof filter.key === 'string' ? filter.key : 'custom'}
                    onClick={filter.onRemove}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm hover:bg-brand-200 transition-colors group"
                  >
                    <IconComponent className="w-3 h-3 mr-1.5" />
                    {filter.label}
                    <X className="w-3 h-3 ml-1.5 group-hover:text-brand-800" />
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Right side - Clear filters button */}
        {hasActiveFilters() && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-3 py-2 text-sm text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Nullstill
          </button>
        )}
      </div>
    </div>
  );
}