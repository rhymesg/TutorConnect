'use client';

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
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const baseClasses = `${sizeClasses[size]} rounded-full flex-shrink-0 ${className}`;

  if (src) {
    return (
      <img
        src={src}
        alt={`${name} sitt profilbilde`}
        className={`${baseClasses} object-cover`}
        onError={(e) => {
          // Fallback to initials if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `
              <div class="${baseClasses} bg-blue-600 flex items-center justify-center">
                <span class="text-white font-medium text-${size === 'sm' ? 'xs' : size === 'lg' || size === 'xl' ? 'lg' : 'sm'}">
                  ${initials || <UserIcon className="${iconSizes[size]}" />}
                </span>
              </div>
            `;
          }
        }}
      />
    );
  }

  return (
    <div className={`${baseClasses} bg-blue-600 flex items-center justify-center`}>
      {initials ? (
        <span className={`text-white font-medium ${size === 'sm' ? 'text-xs' : size === 'lg' || size === 'xl' ? 'text-lg' : 'text-sm'}`}>
          {initials}
        </span>
      ) : (
        <UserIcon className={`${iconSizes[size]} text-white`} />
      )}
    </div>
  );
}