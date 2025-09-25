'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, MapPin, BookOpen, Users, Banknote } from 'lucide-react';
import { PostFilters, PostType, Subject, AgeGroup, NorwegianRegion } from '@/types/database';
import { getAgeGroupOptions } from '@/constants/ageGroups';
import { NORWEGIAN_SUBJECTS, AGE_GROUP_CONFIG, NORWEGIAN_REGIONS_CONFIG } from '@/lib/search-utils';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';

const SUBJECT_LABELS_EN: Record<string, string> = {
  MATHEMATICS: 'Mathematics',
  NORWEGIAN: 'Norwegian',
  ENGLISH: 'English',
  SCIENCE: 'Science',
  HISTORY: 'History',
  MUSIC: 'Music',
  ART: 'Art',
  PROGRAMMING: 'Programming',
  PHYSICS: 'Physics',
  CHEMISTRY: 'Chemistry',
  BIOLOGY: 'Biology',
  GEOGRAPHY: 'Geography',
  ECONOMICS: 'Economics',
  PSYCHOLOGY: 'Psychology',
  LANGUAGES: 'Languages',
};

const AGE_GROUP_LABELS_EN: Record<string, string> = {
  PRESCHOOL: '0-5 yrs',
  PRIMARY_LOWER: '6-9 yrs',
  PRIMARY_UPPER: '10-12 yrs',
  MIDDLE: '13-15 yrs',
  SECONDARY: '16-18 yrs',
  ADULTS: '19+ yrs',
};

const getSubjectLabelByLanguage = (language: string, key: string) => {
  const subject = NORWEGIAN_SUBJECTS[key as keyof typeof NORWEGIAN_SUBJECTS];
  if (!subject) return key;
  return language === 'no' ? subject.no : SUBJECT_LABELS_EN[key] || subject.no;
};

const getAgeGroupLabelByLanguage = (language: string, key: string) => {
  const config = AGE_GROUP_CONFIG[key as keyof typeof AGE_GROUP_CONFIG];
  if (!config) return key;
  return language === 'no' ? config.no : AGE_GROUP_LABELS_EN[key] || config.no;
};

const formatPriceBadgeByLanguage = (language: string, min?: number, max?: number) => {
  if (min && max) {
    return language === 'no' ? `${min}-${max} kr` : `${min}-${max} NOK`;
  }
  if (min) {
    return language === 'no' ? `Fra ${min} kr` : `From ${min} NOK`;
  }
  if (max) {
    return language === 'no' ? `Opptil ${max} kr` : `Up to ${max} NOK`;
  }
  return language === 'no' ? 'Alle priser' : 'Any price';
};

const formatPriceRangeLabelByLanguage = (
  language: string,
  min?: number | null,
  max?: number | null,
  fallback?: string
) => {
  if (language === 'no') {
    if (fallback) return fallback;
    if (min && max) return `${min}-${max} kr`;
    if (min) return `Fra ${min} kr`;
    if (max) return `Opptil ${max} kr`;
    return 'Alle priser';
  }
  if (min && max) return `${min}-${max} NOK`;
  if (min) return `From ${min} NOK`;
  if (max) return `Up to ${max} NOK`;
  return fallback || 'Any price';
};

const formatAgeGroupCountLabel = (language: string, count: number) => {
  if (language === 'no') {
    return `${count} ${count === 1 ? 'aldersgruppe' : 'aldersgrupper'}`;
  }
  return `${count} age group${count === 1 ? '' : 's'}`;
};

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
  const { language } = useLanguage();
  const t = useLanguageText();

  const regionOptions = Array.from(new Set(Object.values(NORWEGIAN_REGIONS_CONFIG).map(region => region.name)));
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

  const subjectKeys = Object.keys(NORWEGIAN_SUBJECTS);
  const ageGroupOptions = getAgeGroupOptions();
  const ageGroups: AgeGroup[] = ageGroupOptions.map(opt => opt.value as AgeGroup);

  const getSubjectLabel = (key: string) => getSubjectLabelByLanguage(language, key);
  const getAgeGroupLabel = (key: string) => getAgeGroupLabelByLanguage(language, key);
  const formatPriceBadge = (min?: number, max?: number) => formatPriceBadgeByLanguage(language, min, max);
  const formatPriceRangeLabel = (min?: number | null, max?: number | null, fallbackLabel?: string) =>
    formatPriceRangeLabelByLanguage(language, min, max, fallbackLabel);
  const formatAgeGroupCount = (count: number) => formatAgeGroupCountLabel(language, count);

  const labels = {
    searchPlaceholder: t('Søk etter lærere eller fag...', 'Search tutors or subjects...'),
    toggleFilter: t('Filtrer', 'Filter'),
    clearAllFilters: t('Fjern alle filtre', 'Clear filters'),
    typeTitle: t('Type annonse', 'Listing type'),
    teacherTitle: t('Tilbyr undervisning', 'Offers tutoring'),
    studentTitle: t('Søker lærer', 'Seeking tutor'),
    subjectsTitle: t('Fag', 'Subjects'),
    selectSubject: t('Velg fag', 'Select subject'),
    ageGroupsTitle: t('Aldersgrupper', 'Age groups'),
    locationTitle: t('Område', 'Location'),
    selectLocation: t('Velg område', 'Select location'),
    priceTitle: t('Prisområde (NOK/time)', 'Price range (NOK/hour)'),
    priceFromPlaceholder: t('Fra', 'From'),
    priceToPlaceholder: t('Til', 'To'),
    activeFiltersHeading: t('Aktive filtre:', 'Active filters:'),
  };

  return (
    <div className={`bg-white border-b border-neutral-200 ${className}`}>
      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder={labels.searchPlaceholder}
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
            {labels.toggleFilter}
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
              {labels.clearAllFilters}
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
                  {labels.teacherTitle}
                </button>
                <button
                  onClick={() => updateFilter('type', filters.type === 'STUDENT' ? undefined : 'STUDENT')}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    filters.type === 'STUDENT'
                      ? 'bg-brand-50 border-brand-200 text-brand-700'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {labels.studentTitle}
                </button>
              </div>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                <BookOpen className="w-4 h-4 inline mr-1" />
                {labels.subjectsTitle}
              </label>
              <select
                value={filters.subject || ''}
                onChange={(e) => updateFilter('subject', e.target.value || undefined)}
                className="w-full p-3 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">{labels.selectSubject}</option>
                {subjectKeys.map((key) => (
                  <option key={key} value={key}>
                    {getSubjectLabel(key)}
                  </option>
                ))}
              </select>
            </div>

            {/* Age Groups Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                <Users className="w-4 h-4 inline mr-1" />
                {labels.ageGroupsTitle}
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
                    {getAgeGroupLabel(ageGroup)}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                <MapPin className="w-4 h-4 inline mr-1" />
                {labels.locationTitle}
              </label>
              <select
                value={filters.location || ''}
                onChange={(e) => updateFilter('location', e.target.value || undefined)}
                className="w-full p-3 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">{labels.selectLocation}</option>
                {regionOptions.map((county) => (
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
                {labels.priceTitle}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    placeholder={labels.priceFromPlaceholder}
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
                    placeholder={labels.priceToPlaceholder}
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
  const { language } = useLanguage();
  const t = useLanguageText();

  const removeFilter = (key: keyof PostFilters) => {
    const updated = { ...filters };
    delete updated[key];
    onFiltersChange(updated);
  };

  const activeFilters = [];

  if (filters.type) {
    activeFilters.push({
      key: 'type' as keyof PostFilters,
      label: filters.type === 'TEACHER'
        ? t('Tilbyr undervisning', 'Offers tutoring')
        : t('Søker lærer', 'Seeking tutor')
    });
  }

  if (filters.subject) {
    activeFilters.push({
      key: 'subject' as keyof PostFilters,
      label: getSubjectLabelByLanguage(language, filters.subject)
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
      label: formatAgeGroupCountLabel(language, filters.ageGroups.length)
    });
  }

  if (filters.minRate || filters.maxRate) {
    const label = formatPriceRangeLabelByLanguage(language, filters.minRate ?? null, filters.maxRate ?? null);
    
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
        <span className="text-sm text-neutral-600 mr-2">{t('Aktive filtre:', 'Active filters:')}</span>
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
