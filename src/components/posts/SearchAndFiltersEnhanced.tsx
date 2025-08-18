'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  MapPin, 
  BookOpen, 
  Users, 
  Banknote,
  Sliders,
  RotateCcw,
  Check,
  History
} from 'lucide-react';

import { PostFilters, PostType, Subject, AgeGroup, NorwegianRegion } from '@/types/database';
import { education, regions, forms, actions } from '@/lib/translations';

interface SearchAndFiltersEnhancedProps {
  filters: PostFilters;
  onFiltersChange: (filters: PostFilters) => void;
  className?: string;
  showRecentSearches?: boolean;
  searchHistory?: string[];
  onSearchHistoryAdd?: (search: string) => void;
  onSearchHistoryRemove?: (search: string) => void;
}

interface PriceRange {
  min: number;
  max: number;
  label: string;
}

const COMMON_PRICE_RANGES: PriceRange[] = [
  { min: 0, max: 300, label: 'Under 300 kr/time' },
  { min: 300, max: 500, label: '300 - 500 kr/time' },
  { min: 500, max: 800, label: '500 - 800 kr/time' },
  { min: 800, max: 1200, label: '800 - 1200 kr/time' },
  { min: 1200, max: 999999, label: 'Over 1200 kr/time' },
];

export default function SearchAndFiltersEnhanced({
  filters,
  onFiltersChange,
  className = '',
  showRecentSearches = true,
  searchHistory = [],
  onSearchHistoryAdd,
  onSearchHistoryRemove,
}: SearchAndFiltersEnhancedProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showDesktopFilters, setShowDesktopFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [customPriceMode, setCustomPriceMode] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== (filters.search || '')) {
        onFiltersChange({ ...filters, search: localSearch || undefined, page: 1 });
        if (localSearch && localSearch.length >= 3 && onSearchHistoryAdd) {
          onSearchHistoryAdd(localSearch);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, filters, onFiltersChange, onSearchHistoryAdd]);

  const updateFilter = (key: keyof PostFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const clearFilters = () => {
    setLocalSearch('');
    setCustomPriceMode(false);
    onFiltersChange({
      page: 1,
      limit: filters.limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
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

  const handlePriceRangeSelect = (range: PriceRange) => {
    onFiltersChange({
      ...filters,
      minRate: range.max === 999999 ? range.min : range.min,
      maxRate: range.max === 999999 ? undefined : range.max,
      page: 1,
    });
    setCustomPriceMode(false);
  };

  const handleCustomPrice = () => {
    setCustomPriceMode(true);
  };

  // Subject options with search
  const subjectOptions = Object.entries(education.no.subjects).map(([key, name]) => ({
    value: key.toUpperCase(),
    label: name,
  }));

  const ageGroupOptions = [
    { value: 'ELEMENTARY', label: education.no.levels.elementary },
    { value: 'MIDDLE_SCHOOL', label: education.no.levels.middleSchool },
    { value: 'HIGH_SCHOOL', label: education.no.levels.highSchool },
    { value: 'UNIVERSITY', label: education.no.levels.university },
    { value: 'ADULT', label: education.no.levels.adult },
  ];

  // Search suggestions component
  const SearchSuggestions = () => (
    <div className="absolute top-full left-0 right-0 bg-white border border-neutral-200 rounded-b-lg shadow-lg z-50 max-h-64 overflow-y-auto">
      {showRecentSearches && searchHistory.length > 0 && (
        <div className="p-3 border-b border-neutral-100">
          <div className="text-xs font-medium text-neutral-500 mb-2 flex items-center">
            <History className="w-3 h-3 mr-1" />
            Tidligere søk
          </div>
          <div className="space-y-1">
            {searchHistory.slice(0, 5).map((search, index) => (
              <button
                key={index}
                onClick={() => {
                  setLocalSearch(search);
                  setShowSearchSuggestions(false);
                }}
                className="w-full text-left px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-50 rounded flex items-center justify-between group"
              >
                <span>{search}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSearchHistoryRemove?.(search);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Subject suggestions */}
      {localSearch && (
        <div className="p-3">
          <div className="text-xs font-medium text-neutral-500 mb-2">Fag</div>
          <div className="space-y-1">
            {subjectOptions
              .filter(option => 
                option.label.toLowerCase().includes(localSearch.toLowerCase()) ||
                option.value.toLowerCase().includes(localSearch.toLowerCase())
              )
              .slice(0, 3)
              .map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setLocalSearch(option.label);
                    updateFilter('subject', option.value);
                    setShowSearchSuggestions(false);
                  }}
                  className="w-full text-left px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-50 rounded"
                >
                  {option.label}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  // Filter content component
  const FilterContent = ({ isMobile }: { isMobile: boolean }) => (
    <div className="space-y-6">
      {/* Post Type Filter */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Type annonse
        </label>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => updateFilter('type', filters.type === 'TUTOR_OFFERING' ? undefined : 'TUTOR_OFFERING')}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors text-left ${
              filters.type === 'TUTOR_OFFERING'
                ? 'bg-brand-50 border-brand-200 text-brand-700'
                : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Tilbyr undervisning</span>
              {filters.type === 'TUTOR_OFFERING' && <Check className="w-4 h-4" />}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Lærere som tilbyr sine tjenester</div>
          </button>
          <button
            onClick={() => updateFilter('type', filters.type === 'STUDENT_SEEKING' ? undefined : 'STUDENT_SEEKING')}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors text-left ${
              filters.type === 'STUDENT_SEEKING'
                ? 'bg-brand-50 border-brand-200 text-brand-700'
                : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Søker lærer</span>
              {filters.type === 'STUDENT_SEEKING' && <Check className="w-4 h-4" />}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Studenter som trenger hjelp</div>
          </button>
        </div>
      </div>

      {/* Subject Filter */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          <BookOpen className="w-4 h-4 inline mr-1" />
          {forms.no.subject}
        </label>
        <div className="relative">
          <select
            value={filters.subject || ''}
            onChange={(e) => updateFilter('subject', e.target.value || undefined)}
            className="w-full p-3 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 appearance-none"
          >
            <option value="">{forms.no.selectSubject}</option>
            {subjectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* Age Groups Filter */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          <Users className="w-4 h-4 inline mr-1" />
          Aldersgrupper
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ageGroupOptions.map((ageGroup) => (
            <button
              key={ageGroup.value}
              onClick={() => {
                const current = filters.ageGroups || [];
                const updated = current.includes(ageGroup.value as AgeGroup)
                  ? current.filter(g => g !== ageGroup.value)
                  : [...current, ageGroup.value as AgeGroup];
                updateFilter('ageGroups', updated.length > 0 ? updated : undefined);
              }}
              className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                filters.ageGroups?.includes(ageGroup.value as AgeGroup)
                  ? 'bg-brand-50 border-brand-200 text-brand-700'
                  : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {ageGroup.label}
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
        <div className="relative">
          <select
            value={filters.location || ''}
            onChange={(e) => updateFilter('location', e.target.value || undefined)}
            className="w-full p-3 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 appearance-none"
          >
            <option value="">{forms.no.selectLocation}</option>
            {regions.counties.map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          <Banknote className="w-4 h-4 inline mr-1" />
          Prisområde (NOK/time)
        </label>
        
        {!customPriceMode ? (
          <div className="space-y-2">
            {COMMON_PRICE_RANGES.map((range, index) => {
              const isSelected = 
                (range.max === 999999 && filters.minRate === range.min && !filters.maxRate) ||
                (filters.minRate === range.min && filters.maxRate === range.max);
              
              return (
                <button
                  key={index}
                  onClick={() => handlePriceRangeSelect(range)}
                  className={`w-full p-3 rounded-lg border text-sm font-medium transition-colors text-left ${
                    isSelected
                      ? 'bg-brand-50 border-brand-200 text-brand-700'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {range.label}
                </button>
              );
            })}
            <button
              onClick={handleCustomPrice}
              className="w-full p-3 rounded-lg border border-dashed border-neutral-300 text-sm text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
            >
              Egendefinert prisområde
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-600 mb-1">Fra (NOK)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minRate || ''}
                  onChange={(e) => updateFilter('minRate', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full p-3 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  min="0"
                  step="50"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-600 mb-1">Til (NOK)</label>
                <input
                  type="number"
                  placeholder="∞"
                  value={filters.maxRate || ''}
                  onChange={(e) => updateFilter('maxRate', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full p-3 border border-neutral-300 rounded-lg text-neutral-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  min="0"
                  step="50"
                />
              </div>
            </div>
            <button
              onClick={() => setCustomPriceMode(false)}
              className="text-sm text-neutral-600 hover:text-neutral-800"
            >
              ← Tilbake til forhåndsdefinerte områder
            </button>
          </div>
        )}
      </div>
    </div>
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
            onFocus={() => setShowSearchSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
            className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-neutral-900 placeholder-neutral-500"
          />
          
          {/* Search suggestions */}
          {showSearchSuggestions && (localSearch || searchHistory.length > 0) && (
            <SearchSuggestions />
          )}
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between">
          {/* Desktop filter toggle */}
          <button
            onClick={() => setShowDesktopFilters(!showDesktopFilters)}
            className="hidden sm:inline-flex items-center px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
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

          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="sm:hidden inline-flex items-center px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtrer
            {getActiveFilterCount() > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-brand-500 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </button>

          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-1 text-sm text-brand-600 hover:text-brand-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Nullstill
            </button>
          )}
        </div>
      </div>

      {/* Desktop Filter Panel */}
      {showDesktopFilters && (
        <div className="hidden sm:block border-t border-neutral-200 bg-neutral-50">
          <div className="p-6">
            <FilterContent isMobile={false} />
          </div>
        </div>
      )}

      {/* Mobile Filter Drawer */}
      <Transition show={showMobileFilters} as={Fragment}>
        <Dialog 
          as="div" 
          className="relative z-50"
          onClose={setShowMobileFilters}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto relative w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-6 border-b border-neutral-200">
                        <Dialog.Title className="text-lg font-medium text-neutral-900 flex items-center">
                          <Filter className="w-5 h-5 mr-2" />
                          Filtrer resultater
                        </Dialog.Title>
                        <button
                          onClick={() => setShowMobileFilters(false)}
                          className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Filter Content */}
                      <div className="flex-1 px-4 py-6">
                        <FilterContent isMobile={true} />
                      </div>

                      {/* Footer */}
                      <div className="border-t border-neutral-200 px-4 py-4 bg-neutral-50">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-sm font-medium text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                            disabled={!hasActiveFilters()}
                          >
                            Nullstill alle
                          </button>
                          <button
                            onClick={() => setShowMobileFilters(false)}
                            className="px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
                          >
                            Vis resultater
                          </button>
                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}