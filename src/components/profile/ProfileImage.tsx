'use client';

import { useState } from 'react';
import { UserIcon } from '@heroicons/react/24/solid';

interface Props {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-20 w-20',
  xl: 'h-32 w-32',
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-16 w-16',
};

export function ProfileImage({ src, name, size = 'md', className = '' }: Props) {
  const [hasError, setHasError] = useState(false);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const baseClasses = `${sizeClasses[size]} rounded-full flex-shrink-0 ${className}`;
  const showFallback = !src || hasError;

  if (!showFallback) {
    return (
      <img
        src={src as string}
        alt={`${name} sitt profilbilde`}
        className={`${baseClasses} object-cover`}
        onError={() => setHasError(true)}
      />
    );
  }

  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' || size === 'xl' ? 'text-lg' : 'text-sm';

  return (
    <div className={`${baseClasses} bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center`}>
      {initials ? (
        <span className={`text-white font-medium ${textSize}`}>
          {initials}
        </span>
      ) : (
        <UserIcon className={`${iconSizes[size]} text-white`} />
      )}
    </div>
  );
}
