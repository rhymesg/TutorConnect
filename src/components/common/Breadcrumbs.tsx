'use client';

import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

import { BreadcrumbItem } from '@/lib/breadcrumbs';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  // Add safety check for items
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex ${className}`}
    >
      <ol className="flex items-center space-x-2 text-sm text-neutral-500">
        {/* Home link */}
        <li>
          <Link
            href="/"
            className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
          >
            <HomeIcon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">홈</span>
          </Link>
        </li>
        
        {items.map((item, index) => {
          // Safety check for item data
          if (!item || !item.label) {
            return null;
          }
          
          return (
            <li key={index} className="flex items-center">
              <ChevronRightIcon className="h-4 w-4 text-neutral-300 mx-2" aria-hidden="true" />
              {item.href && !item.current ? (
                <Link
                  href={item.href}
                  className="text-neutral-500 hover:text-neutral-700 transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`${
                    item.current
                      ? 'text-neutral-900 font-medium'
                      : 'text-neutral-500'
                  }`}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

