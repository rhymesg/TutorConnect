'use client';

import { Loader2, AlertCircle, Search, Grid, RefreshCw } from 'lucide-react';
import { actions, messages } from '@/lib/translations';

// Loading spinner component
export function LoadingSpinner({ 
  size = 'md', 
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-brand-600`} />
    </div>
  );
}

// Full page loading state
export function PostListLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-neutral-50 min-h-screen ${className}`}>
      {/* Search bar skeleton */}
      <div className="bg-white border-b border-neutral-200 p-4">
        <div className="h-12 bg-neutral-200 rounded-xl animate-pulse" />
      </div>
      
      {/* Filter bar skeleton */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-neutral-200 rounded w-32 animate-pulse" />
          <div className="flex space-x-3">
            <div className="h-8 bg-neutral-200 rounded w-24 animate-pulse" />
            <div className="h-8 bg-neutral-200 rounded w-16 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <PostCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Post card skeleton
export function PostCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden ${className}`}>
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-neutral-200 rounded-full w-32 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-20 animate-pulse" />
        </div>
      </div>
      
      <div className="px-4 pb-4">
        <div className="mb-3">
          <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-full mb-1 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-2/3 animate-pulse" />
        </div>
        
        <div className="flex gap-2 mb-3">
          <div className="h-6 bg-neutral-200 rounded w-20 animate-pulse" />
          <div className="h-6 bg-neutral-200 rounded w-16 animate-pulse" />
        </div>
        
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-neutral-200 rounded-full mr-3 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-neutral-200 rounded w-24 mb-1 animate-pulse" />
            <div className="h-3 bg-neutral-200 rounded w-16 animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-neutral-200 rounded w-40 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-32 animate-pulse" />
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          <div className="h-6 bg-neutral-200 rounded w-24 animate-pulse" />
          <div className="h-8 bg-neutral-200 rounded w-20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// Inline loading for infinite scroll
export function InfiniteScrollLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="flex items-center space-x-2 text-brand-600">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">{messages.no.loading}</span>
      </div>
    </div>
  );
}

// Error states
export function PostListError({
  onRetry,
  className = ''
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-neutral-900 mb-2">
        {messages.no.error}
      </h3>
      <p className="text-neutral-600 mb-6 max-w-md mx-auto">
        Kunne ikke laste inn annonser. Sjekk internettforbindelsen din og prøv igjen.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {actions.no.retry}
        </button>
      )}
    </div>
  );
}

// Network error specific
export function NetworkError({
  onRetry,
  className = ''
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-orange-600" />
      </div>
      <h3 className="text-lg font-medium text-neutral-900 mb-2">
        {messages.no.networkError}
      </h3>
      <p className="text-neutral-600 mb-6 max-w-md mx-auto">
        Kunne ikke koble til serveren. Sjekk internettforbindelsen din.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {actions.no.retry}
        </button>
      )}
    </div>
  );
}

// Empty state
export function EmptyState({
  title = messages.no.noResults,
  description = 'Prøv å justere søkekriteriene eller fjerne noen filtre.',
  actionLabel,
  onAction,
  icon: Icon = Search,
  className = ''
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-medium text-neutral-900 mb-2">
        {title}
      </h3>
      <p className="text-neutral-600 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// No posts for specific search
export function NoSearchResults({
  searchQuery,
  onClearFilters,
  className = ''
}: {
  searchQuery?: string;
  onClearFilters?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      title={searchQuery ? `Ingen resultater for "${searchQuery}"` : messages.no.noResults}
      description="Prøv å søke med andre ord, eller juster filtrene dine."
      actionLabel={onClearFilters ? 'Fjern alle filtre' : undefined}
      onAction={onClearFilters}
      icon={Search}
      className={className}
    />
  );
}

// Offline state
export function OfflineState({
  onRetry,
  className = ''
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Grid className="w-8 h-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-medium text-neutral-900 mb-2">
        {messages.no.offline}
      </h3>
      <p className="text-neutral-600 mb-6 max-w-md mx-auto">
        Du er ikke tilkoblet internett. Sjekk tilkoblingen din og prøv igjen.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {actions.no.retry}
        </button>
      )}
    </div>
  );
}