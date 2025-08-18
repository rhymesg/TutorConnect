'use client';

import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'blue' | 'gray' | 'white';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6', 
  lg: 'h-8 w-8',
};

const colorClasses = {
  blue: 'text-blue-600',
  gray: 'text-gray-600',
  white: 'text-white',
};

export function LoadingSpinner({ size = 'md', className = '', color = 'blue' }: Props) {
  return (
    <ArrowPathIcon 
      className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin ${className}`}
      aria-label="Laster..."
    />
  );
}