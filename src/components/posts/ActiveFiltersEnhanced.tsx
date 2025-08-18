'use client';

import { X, Search, MapPin, BookOpen, Users, Banknote, Filter } from 'lucide-react';
import { PostFilters } from '@/types/database';
import { education, formatters } from '@/lib/translations';

interface ActiveFiltersEnhancedProps {
  filters: PostFilters;
  onFiltersChange: (filters: PostFilters) => void;
  className?: string;
}

export default function ActiveFiltersEnhanced({ 
  filters, 
  onFiltersChange,
  className = ''
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
      label: filters.type === 'TUTOR_OFFERING' ? 'Tilbyr undervisning' : 'Søker lærer',
      icon: Filter,
      onRemove: () => removeFilter('type')
    });
  }

  // Subject filter
  if (filters.subject) {
    const subjectName = education.no.subjects[filters.subject.toLowerCase() as keyof typeof education.no.subjects];
    activeFilters.push({
      key: 'subject' as keyof PostFilters,
      label: subjectName || filters.subject,
      icon: BookOpen,
      onRemove: () => removeFilter('subject')
    });
  }

  // Location filter
  if (filters.location) {
    activeFilters.push({
      key: 'location' as keyof PostFilters,
      label: filters.location,
      icon: MapPin,
      onRemove: () => removeFilter('location')
    });
  }

  // Age groups filter
  if (filters.ageGroups?.length) {
    const ageGroupLabels = {
      ELEMENTARY: 'Barneskole',
      MIDDLE_SCHOOL: 'Ungdomsskole',
      HIGH_SCHOOL: 'Videregående',
      UNIVERSITY: 'Høyskole/Universitet',
      ADULT: 'Voksenopplæring',
    };

    const label = filters.ageGroups.length === 1 
      ? ageGroupLabels[filters.ageGroups[0] as keyof typeof ageGroupLabels]
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

  if (activeFilters.length === 0) return null;

  return (
    <div className={`px-4 py-3 bg-neutral-50 border-b border-neutral-200 ${className}`}>
      <div className="flex items-center flex-wrap gap-2">
        <span className="text-sm text-neutral-600 mr-2 flex items-center">
          <Filter className="w-4 h-4 mr-1" />
          Aktive filtre:
        </span>
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
      </div>
    </div>
  );
}