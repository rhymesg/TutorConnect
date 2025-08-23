'use client';

import { useState, useEffect } from 'react';
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  MapPin, 
  BookOpen, 
  Users, 
  Banknote, 
  Clock,
  Star,
  Zap,
  Check,
  RotateCcw
} from 'lucide-react';
import { PostFilters, PostType, Subject, AgeGroup, NorwegianRegion } from '@/types/database';
import { 
  NORWEGIAN_SUBJECTS, 
  AGE_GROUP_CONFIG, 
  NORWEGIAN_REGIONS_CONFIG, 
  PRICE_RANGES 
} from '@/lib/search-utils';
import { education, regions, forms, actions } from '@/lib/translations';

interface FilterPanelProps {
  filters: PostFilters;
  onFiltersChange: (filters: PostFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
  resultCount?: number;
  className?: string;
}

interface FilterSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
}

export default function FilterPanel({
  filters,
  onFiltersChange,
  isOpen,
  onToggle,
  resultCount,
  className = '',
}: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    type: true,
    subject: true,
    ageGroups: false,
    location: false,
    price: false,
    availability: false,
  });

  // Track active filter count
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

  const updateFilter = (key: keyof PostFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const removeFilter = (key: keyof PostFilters) => {
    const updated = { ...filters };
    delete updated[key];
    onFiltersChange(updated);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      page: 1,
      limit: filters.limit || 12,
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const hasActiveFilters = getActiveFilterCount() > 0;

  const filterSections: FilterSection[] = [
    {
      id: 'type',
      title: 'Type annonse',
      icon: <Zap className="w-4 h-4" />,
      isExpanded: expandedSections.type
    },
    {
      id: 'subject',
      title: 'Fag',
      icon: <BookOpen className="w-4 h-4" />,
      isExpanded: expandedSections.subject
    },
    {
      id: 'ageGroups',
      title: 'Aldersgrupper',
      icon: <Users className="w-4 h-4" />,
      isExpanded: expandedSections.ageGroups
    },
    {
      id: 'location',
      title: 'Område',
      icon: <MapPin className="w-4 h-4" />,
      isExpanded: expandedSections.location
    },
    {
      id: 'price',
      title: 'Prisområde',
      icon: <Banknote className="w-4 h-4" />,
      isExpanded: expandedSections.price
    },
  ];

  return (
    <>
      {/* Filter Toggle Button */}
      <button
        onClick={onToggle}
        className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-all duration-200 ${
          isOpen || hasActiveFilters
            ? 'bg-brand-50 border-brand-200 text-brand-700'
            : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
        }`}
      >
        <Filter className="w-4 h-4 mr-2" />
        Filtrer
        {hasActiveFilters && (
          <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-brand-500 rounded-full">
            {getActiveFilterCount()}
          </span>
        )}
        {isOpen ? (
          <ChevronUp className="w-4 h-4 ml-2" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-2" />
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className={`mt-4 bg-white border border-neutral-200 rounded-xl shadow-lg ${className}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <div className="flex items-center">
              <Filter className="w-5 h-5 text-neutral-600 mr-2" />
              <h3 className="text-lg font-semibold text-neutral-900">Filtrer søket</h3>
              {resultCount !== undefined && (
                <span className="ml-3 text-sm text-neutral-500">
                  {resultCount} resultater
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center px-3 py-1 text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Nullstill
                </button>
              )}
              <button
                onClick={onToggle}
                className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Content */}
          <div className="p-4 space-y-6 max-h-96 overflow-y-auto">
            {/* Post Type Filter */}
            <div>
              <button
                onClick={() => toggleSection('type')}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center">
                  <Zap className="w-4 h-4 text-neutral-500 mr-2" />
                  <span className="font-medium text-neutral-900">Type annonse</span>
                  {filters.type && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
                      Valgt
                    </span>
                  )}
                </div>
                {expandedSections.type ? (
                  <ChevronUp className="w-4 h-4 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                )}
              </button>
              
              {expandedSections.type && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => updateFilter('type', filters.type === 'TEACHER' ? undefined : 'TEACHER')}
                    className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                      filters.type === 'TEACHER'
                        ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Tilbyr undervisning</div>
                        <div className="text-sm text-neutral-500 mt-1">Lærere som tilbyr timer</div>
                      </div>
                      {filters.type === 'TEACHER' && (
                        <Check className="w-5 h-5 text-brand-600" />
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => updateFilter('type', filters.type === 'STUDENT' ? undefined : 'STUDENT')}
                    className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                      filters.type === 'STUDENT'
                        ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Søker lærer</div>
                        <div className="text-sm text-neutral-500 mt-1">Studenter som søker hjelp</div>
                      </div>
                      {filters.type === 'STUDENT' && (
                        <Check className="w-5 h-5 text-brand-600" />
                      )}
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Subject Filter */}
            <div>
              <button
                onClick={() => toggleSection('subject')}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 text-neutral-500 mr-2" />
                  <span className="font-medium text-neutral-900">Fag</span>
                  {filters.subject && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
                      {NORWEGIAN_SUBJECTS[filters.subject as keyof typeof NORWEGIAN_SUBJECTS]?.no || filters.subject}
                    </span>
                  )}
                </div>
                {expandedSections.subject ? (
                  <ChevronUp className="w-4 h-4 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                )}
              </button>
              
              {expandedSections.subject && (
                <div className="mt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {Object.entries(NORWEGIAN_SUBJECTS).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => updateFilter('subject', filters.subject === key ? undefined : key)}
                        className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                          filters.subject === key
                            ? 'bg-brand-50 border-brand-200 text-brand-700'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{config.no}</span>
                          {filters.subject === key && (
                            <Check className="w-4 h-4 text-brand-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Age Groups Filter */}
            <div>
              <button
                onClick={() => toggleSection('ageGroups')}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-neutral-500 mr-2" />
                  <span className="font-medium text-neutral-900">Aldersgrupper</span>
                  {filters.ageGroups?.length && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
                      {filters.ageGroups.length} valgt
                    </span>
                  )}
                </div>
                {expandedSections.ageGroups ? (
                  <ChevronUp className="w-4 h-4 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                )}
              </button>
              
              {expandedSections.ageGroups && (
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {Object.entries(AGE_GROUP_CONFIG).map(([key, config]) => {
                    const isSelected = filters.ageGroups?.includes(key as AgeGroup);
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          const current = filters.ageGroups || [];
                          const updated = isSelected
                            ? current.filter(g => g !== key)
                            : [...current, key as AgeGroup];
                          updateFilter('ageGroups', updated.length > 0 ? updated : undefined);
                        }}
                        className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                          isSelected
                            ? 'bg-brand-50 border-brand-200 text-brand-700'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{config.no}</div>
                            <div className="text-sm text-neutral-500">{config.ageRange} år</div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-brand-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Location Filter */}
            <div>
              <button
                onClick={() => toggleSection('location')}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-neutral-500 mr-2" />
                  <span className="font-medium text-neutral-900">Område</span>
                  {filters.location && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
                      {filters.location}
                    </span>
                  )}
                </div>
                {expandedSections.location ? (
                  <ChevronUp className="w-4 h-4 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                )}
              </button>
              
              {expandedSections.location && (
                <div className="mt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {Object.values(NORWEGIAN_REGIONS_CONFIG).map((region) => (
                      <button
                        key={region.name}
                        onClick={() => updateFilter('location', filters.location === region.name ? undefined : region.name)}
                        className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                          filters.location === region.name
                            ? 'bg-brand-50 border-brand-200 text-brand-700'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{region.name}</div>
                            <div className="text-sm text-neutral-500">{region.region}</div>
                          </div>
                          {filters.location === region.name && (
                            <Check className="w-4 h-4 text-brand-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price Range Filter */}
            <div>
              <button
                onClick={() => toggleSection('price')}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center">
                  <Banknote className="w-4 h-4 text-neutral-500 mr-2" />
                  <span className="font-medium text-neutral-900">Prisområde</span>
                  {(filters.minRate || filters.maxRate) && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
                      {filters.minRate && filters.maxRate 
                        ? `${filters.minRate}-${filters.maxRate} kr`
                        : filters.minRate 
                          ? `Fra ${filters.minRate} kr`
                          : `Opptil ${filters.maxRate} kr`
                      }
                    </span>
                  )}
                </div>
                {expandedSections.price ? (
                  <ChevronUp className="w-4 h-4 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                )}
              </button>
              
              {expandedSections.price && (
                <div className="mt-3 space-y-4">
                  {/* Quick price ranges */}
                  <div className="grid grid-cols-1 gap-2">
                    {PRICE_RANGES.map((range, index) => {
                      const isSelected = filters.minRate === range.min && 
                        (range.max === null ? !filters.maxRate : filters.maxRate === range.max);
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            if (isSelected) {
                              updateFilter('minRate', undefined);
                              updateFilter('maxRate', undefined);
                            } else {
                              updateFilter('minRate', range.min || undefined);
                              updateFilter('maxRate', range.max || undefined);
                            }
                          }}
                          className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                            isSelected
                              ? 'bg-brand-50 border-brand-200 text-brand-700'
                              : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{range.label}</span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-brand-600" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom price range inputs */}
                  <div className="border-t border-neutral-200 pt-4">
                    <div className="text-sm font-medium text-neutral-700 mb-3">Egendefinert område</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Fra (kr/time)</label>
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
                        <label className="block text-xs text-neutral-500 mb-1">Til (kr/time)</label>
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
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-200 p-4 bg-neutral-50 rounded-b-xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-600">
                {resultCount !== undefined && (
                  <span>
                    {resultCount === 0 
                      ? 'Ingen resultater funnet'
                      : `${resultCount} ${resultCount === 1 ? 'resultat' : 'resultater'} funnet`
                    }
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
                  >
                    Nullstill alle
                  </button>
                )}
                <button
                  onClick={onToggle}
                  className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
                >
                  Lukk filtere
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}