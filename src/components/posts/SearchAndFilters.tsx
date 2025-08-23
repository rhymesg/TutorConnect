'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, MapPin, BookOpen, Users, Banknote } from 'lucide-react';
import { PostFilters, PostType, Subject, AgeGroup, NorwegianRegion } from '@/types/database';
import { education, regions, forms, actions } from '@/lib/translations';
import { getAgeGroupOptions } from '@/constants/ageGroups';

interface SearchAndFiltersProps {
  filters: PostFilters;
  onFiltersChange: (filters: PostFilters) => void;
  className?: string;
}

export default function SearchAndFilters({ 
  filters, 
  onFiltersChange, 
  className = '' 
}: SearchAndFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: localSearch || undefined });
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch]);

  const updateFilter = (key: keyof PostFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setLocalSearch('');
    onFiltersChange({
      page: 1,
      limit: filters.limit
    });
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

  const subjects = Object.entries(education.no.subjects);
  const ageGroupOptions = getAgeGroupOptions();
  const ageGroups: AgeGroup[] = ageGroupOptions.map(opt => opt.value as AgeGroup);
  
  const ageGroupLabels = Object.fromEntries(
    ageGroupOptions.map(opt => [opt.value, opt.label])
  );

  return (
    <div className={`bg-white border-b border-neutral-200 ${className}`}>
      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder={forms.no.searchPlaceholder}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-neutral-900 placeholder-neutral-500"
          />
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtrer
            {getActiveFilterCount() > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-brand-500 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-1 text-sm text-brand-600 hover:text-brand-700 transition-colors"
            >
              <X className="w-4 h-4 mr-1" />
              {actions.no.delete} alle filtre
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="border-t border-neutral-200 bg-neutral-50">
          <div className="p-4 space-y-6">
            {/* Post Type Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Type annonse
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateFilter('type', filters.type === 'TEACHER' ? undefined : 'TEACHER')}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    filters.type === 'TEACHER'
                      ? 'bg-brand-50 border-brand-200 text-brand-700'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Tilbyr undervisning
                </button>
                <button
                  onClick={() => updateFilter('type', filters.type === 'STUDENT' ? undefined : 'STUDENT')}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    filters.type === 'STUDENT'
                      ? 'bg-brand-50 border-brand-200 text-brand-700'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Søker lærer
                </button>
              </div>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                <BookOpen className="w-4 h-4 inline mr-1" />
                {forms.no.subject}
              </label>
              <select
                value={filters.subject || ''}
                onChange={(e) => updateFilter('subject', e.target.value || undefined)}
                className="w-full p-3 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">{forms.no.selectSubject}</option>
                {subjects.map(([key, name]) => (
                  <option key={key} value={key.toUpperCase()}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Age Groups Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                <Users className="w-4 h-4 inline mr-1" />
                Aldersgrupper
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ageGroups.map((ageGroup) => (
                  <button
                    key={ageGroup}
                    onClick={() => {
                      const current = filters.ageGroups || [];
                      const updated = current.includes(ageGroup)
                        ? current.filter(g => g !== ageGroup)
                        : [...current, ageGroup];
                      updateFilter('ageGroups', updated.length > 0 ? updated : undefined);
                    }}
                    className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                      filters.ageGroups?.includes(ageGroup)
                        ? 'bg-brand-50 border-brand-200 text-brand-700'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    {ageGroupLabels[ageGroup]}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                <MapPin className="w-4 h-4 inline mr-1" />
                {forms.no.location}
              </label>
              <select
                value={filters.location || ''}
                onChange={(e) => updateFilter('location', e.target.value || undefined)}
                className="w-full p-3 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">{forms.no.selectLocation}</option>
                {regions.counties.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                <Banknote className="w-4 h-4 inline mr-1" />
                Prisområde (NOK/time)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    placeholder="Fra"
                    value={filters.minRate || ''}
                    onChange={(e) => updateFilter('minRate', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full p-3 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    min="0"
                    step="50"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Til"
                    value={filters.maxRate || ''}
                    onChange={(e) => updateFilter('maxRate', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full p-3 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    min="0"
                    step="50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Active filters display component
export function ActiveFilters({ 
  filters, 
  onFiltersChange 
}: { 
  filters: PostFilters; 
  onFiltersChange: (filters: PostFilters) => void;
}) {
  const removeFilter = (key: keyof PostFilters) => {
    const updated = { ...filters };
    delete updated[key];
    onFiltersChange(updated);
  };

  const activeFilters = [];

  if (filters.type) {
    activeFilters.push({
      key: 'type' as keyof PostFilters,
      label: filters.type === 'TEACHER' ? 'Tilbyr undervisning' : 'Søker lærer'
    });
  }

  if (filters.subject) {
    const subjectName = education.no.subjects[filters.subject as keyof typeof education.no.subjects];
    activeFilters.push({
      key: 'subject' as keyof PostFilters,
      label: subjectName || filters.subject
    });
  }

  if (filters.location) {
    activeFilters.push({
      key: 'location' as keyof PostFilters,
      label: filters.location
    });
  }

  if (filters.ageGroups?.length) {
    activeFilters.push({
      key: 'ageGroups' as keyof PostFilters,
      label: `${filters.ageGroups.length} aldersgrupper`
    });
  }

  if (filters.minRate || filters.maxRate) {
    const label = filters.minRate && filters.maxRate 
      ? `${filters.minRate}-${filters.maxRate} NOK`
      : filters.minRate 
        ? `Fra ${filters.minRate} NOK`
        : `Opptil ${filters.maxRate} NOK`;
    
    activeFilters.push({
      key: 'minRate' as keyof PostFilters,
      label,
      onRemove: () => {
        const updated = { ...filters };
        delete updated.minRate;
        delete updated.maxRate;
        onFiltersChange(updated);
      }
    });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
      <div className="flex items-center flex-wrap gap-2">
        <span className="text-sm text-neutral-600 mr-2">Aktive filtre:</span>
        {activeFilters.map((filter) => (
          <button
            key={filter.key}
            onClick={filter.onRemove || (() => removeFilter(filter.key))}
            className="inline-flex items-center px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-sm hover:bg-brand-200 transition-colors"
          >
            {filter.label}
            <X className="w-3 h-3 ml-2" />
          </button>
        ))}
      </div>
    </div>
  );
}