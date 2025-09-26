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
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import { getSubjectOptions, getSubjectLabelByLanguage } from '@/constants/subjects';
import { getAgeGroupOptions, getAgeGroupLabelByLanguage } from '@/constants/ageGroups';
import { getRegionOptions } from '@/constants/regions';

interface SearchAndFiltersEnhancedProps {
  filters: PostFilters;
  onFiltersChange: (filters: PostFilters) => void;
  className?: string;
  showRecentSearches?: boolean;
  searchHistory?: string[];
  onSearchHistoryAdd?: (search: string) => void;
  onSearchHistoryRemove?: (search: string) => void;
  showDesktopFilters?: boolean;
  setShowDesktopFilters?: (show: boolean) => void;
  showMobileFilters?: boolean;
  setShowMobileFilters?: (show: boolean) => void;
}

interface PriceRange {
  min: number;
  max: number;
  label: string;
}

const PRICE_RANGE_VALUES: Array<Omit<PriceRange, 'label'>> = [
  { min: 0, max: 300 },
  { min: 300, max: 500 },
  { min: 500, max: 800 },
  { min: 800, max: 1200 },
  { min: 1200, max: 999999 },
];

export default function SearchAndFiltersEnhanced({
  filters,
  onFiltersChange,
  className = '',
  showRecentSearches = true,
  searchHistory = [],
  onSearchHistoryAdd,
  onSearchHistoryRemove,
  showDesktopFilters = false,
  setShowDesktopFilters,
  showMobileFilters = false,
  setShowMobileFilters,
}: SearchAndFiltersEnhancedProps) {
  const { language } = useLanguage();
  const t = useLanguageText();
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [customPriceMode, setCustomPriceMode] = useState(false);

  const buildCurrencyFormatter = () => new Intl.NumberFormat(language === 'no' ? 'nb-NO' : 'en-GB', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const priceFormatter = buildCurrencyFormatter();

  const buildPriceRangeLabel = (range: Omit<PriceRange, 'label'>) => {
    if (range.max === 999999) {
      return t('Over {amount} per time', 'Over {amount} per hour').replace('{amount}', priceFormatter.format(range.min));
    }
    if (range.min === 0) {
      return t('Under {amount} per time', 'Under {amount} per hour').replace('{amount}', priceFormatter.format(range.max));
    }
    return `${priceFormatter.format(range.min)} - ${priceFormatter.format(range.max)} ${t('per time', 'per hour')}`;
  };

  const commonPriceRanges: PriceRange[] = PRICE_RANGE_VALUES.map((range) => ({
    ...range,
    label: buildPriceRangeLabel(range),
  }));

  const subjectOptions = getSubjectOptions().map((option) => ({
    value: option.value,
    label: getSubjectLabelByLanguage(language, option.value),
  }));

  const ageGroupOptions = getAgeGroupOptions().map((option) => ({
    value: option.value,
    label: getAgeGroupLabelByLanguage(language, option.value),
  }));

  const regionOptions = getRegionOptions();

  const copy = {
    recentSearches: t('Tidligere søk', 'Recent searches'),
    subjectHeading: t('Fag', 'Subjects'),
    subjectLabel: t('Fag', 'Subject'),
    subjectPlaceholder: t('Velg fag', 'Select subject'),
    locationLabel: t('Sted', 'Location'),
    locationPlaceholder: t('Velg sted', 'Select location'),
    ageGroupsLabel: t('Aldersgrupper', 'Age groups'),
    statusLabel: t('Status', 'Status'),
    includePaused: t('Inkluder pauserte annonser', 'Include paused posts'),
    desktopFiltersTitle: t('Filtrer resultater', 'Filter results'),
    mobileResetAll: t('Nullstill alle', 'Reset all'),
    mobileShowResults: t('Vis resultater', 'Show results'),
    backToPresets: t('← Tilbake til forhåndsdefinerte områder', '← Back to preset ranges'),
    searchPlaceholder: t('Søk etter fag eller område...', 'Search subjects or locations...'),
  };

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
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      includePaused: false,
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
      filters.search ||
      filters.includePaused
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
    if (filters.includePaused) count++;
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

  // Subject options from centralized constants
  // Age group and region options already derived above

  // Search suggestions component
  const SearchSuggestions = () => (
    <div className="absolute top-full left-0 right-0 bg-white border border-neutral-200 rounded-b-lg shadow-lg z-50 max-h-64 overflow-y-auto">
      {showRecentSearches && searchHistory.length > 0 && (
        <div className="p-3 border-b border-neutral-100">
          <div className="text-xs font-medium text-neutral-500 mb-2 flex items-center">
            <History className="w-3 h-3 mr-1" />
            {copy.recentSearches}
          </div>
          <div className="space-y-1">
            {searchHistory.slice(0, 5).map((search, index) => (
              <div
                key={index}
                className="w-full flex items-center justify-between px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-50 rounded group"
              >
                <button
                  onClick={() => {
                    setLocalSearch(search);
                    setShowSearchSuggestions(false);
                  }}
                  className="flex-1 text-left truncate"
                >
                  {search}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSearchHistoryRemove?.(search);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-neutral-600 ml-1 flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Subject suggestions */}
      {localSearch && (
        <div className="p-3">
          <div className="text-xs font-medium text-neutral-500 mb-2">{copy.subjectHeading}</div>
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
      {/* Post Type Filter - Hidden since route determines the type
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Type annonse
        </label>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => updateFilter('type', filters.type === 'TEACHER' ? undefined : 'TEACHER')}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors text-left ${
              filters.type === 'TEACHER'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Tilbyr undervisning</span>
              {filters.type === 'TEACHER' && <Check className="w-4 h-4" />}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Lærere som tilbyr sine tjenester</div>
          </button>
          <button
            onClick={() => updateFilter('type', filters.type === 'STUDENT' ? undefined : 'STUDENT')}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors text-left ${
              filters.type === 'STUDENT'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Søker lærer</span>
              {filters.type === 'STUDENT' && <Check className="w-4 h-4" />}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Studenter som trenger hjelp</div>
          </button>
        </div>
      </div>
      */}

      {/* Subject Filter */}
      <div>
      <label className="block text-sm font-medium text-neutral-700 mb-3">
          <BookOpen className="w-4 h-4 inline mr-1" />
          {copy.subjectLabel}
        </label>
        <div className="relative">
          <select
            value={filters.subject || ''}
            onChange={(e) => updateFilter('subject', e.target.value || undefined)}
            className="w-full p-3 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 appearance-none"
          >
            <option value="">{copy.subjectPlaceholder}</option>
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
          {copy.ageGroupsLabel}
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
          {copy.locationLabel}
        </label>
        <div className="relative">
          <select
            value={filters.location || ''}
            onChange={(e) => updateFilter('location', e.target.value || undefined)}
            className="w-full p-3 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 appearance-none"
          >
            <option value="">{copy.locationPlaceholder}</option>
            {regionOptions.map((region) => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* Price Range Filter - Hidden for now
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
      */}

      {/* Status Filter */}
      <div>
      <label className="block text-sm font-medium text-neutral-700 mb-3">
          {copy.statusLabel}
        </label>
        <div className="flex items-center">
          <input
            id="include-paused"
            type="checkbox"
            checked={filters.includePaused || false}
            onChange={(e) => updateFilter('includePaused', e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500 focus:ring-offset-0"
          />
          <label htmlFor="include-paused" className="ml-3 text-sm text-neutral-700">
            {copy.includePaused}
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white border-b border-neutral-200 ${className}`}>
      {/* Search Bar - Hidden for now
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder={copy.searchPlaceholder}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setShowSearchSuggestions(false);
                // Trigger immediate search instead of waiting for debounce
                onFiltersChange({ ...filters, search: localSearch || undefined, page: 1 });
                if (localSearch && localSearch.length >= 3 && onSearchHistoryAdd) {
                  onSearchHistoryAdd(localSearch);
                }
              }
            }}
            onFocus={() => setShowSearchSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
            className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-neutral-900 placeholder-neutral-500"
          />
          
          <div>
            {showSearchSuggestions && (localSearch || searchHistory.length > 0) && (
              <SearchSuggestions />
            )}
          </div>
        </div>
      </div>
      */}


      {/* Desktop Filter Panel */}
      {showDesktopFilters && (
        <div className="hidden sm:block border-t border-neutral-200 bg-neutral-50">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white">
            <h3 className="text-lg font-medium text-neutral-900 flex items-center">
              <Sliders className="w-5 h-5 mr-2" />
              {copy.desktopFiltersTitle}
            </h3>
            <button
              onClick={() => setShowDesktopFilters && setShowDesktopFilters(false)}
              className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
                          {copy.desktopFiltersTitle}
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
                            {copy.mobileResetAll}
                          </button>
                          <button
                            onClick={() => setShowMobileFilters(false)}
                            className="px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
                          >
                            {copy.mobileShowResults}
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
