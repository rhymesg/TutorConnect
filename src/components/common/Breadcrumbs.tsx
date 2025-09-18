'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

import { BreadcrumbItem } from '@/lib/breadcrumbs';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!items || items.length === 0) {
    return null;
  }

  if (!isMounted) {
    return (
      <nav aria-label="Breadcrumb" className={`flex ${className}`}>
        <ol className="flex items-center space-x-2 text-sm text-neutral-500">
          <li>
            <div className="text-neutral-400">
              <HomeIcon className="h-4 w-4" aria-hidden="true" />
            </div>
          </li>
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              <ChevronRightIcon className="mx-2 h-4 w-4 text-neutral-300" aria-hidden="true" />
              <span className="text-neutral-500">{item.label}</span>
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className={`flex ${className}`}>
      <ol className="flex items-center space-x-2 text-sm text-neutral-500">
        <li>
          <Link href="/" className="text-neutral-400 transition-colors duration-200 hover:text-neutral-600">
            <HomeIcon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Hjem</span>
          </Link>
        </li>

        {items.map((item, index) => {
          if (!item || !item.label) {
            return null;
          }

          const isLink = Boolean(item.href && !item.current);

          return (
            <li key={index} className="flex items-center">
              <ChevronRightIcon className="mx-2 h-4 w-4 text-neutral-300" aria-hidden="true" />
              {isLink ? (
                <Link
                  href={item.href!}
                  className="text-neutral-500 transition-colors duration-200 hover:text-neutral-700"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={item.current ? 'font-medium text-neutral-900' : 'text-neutral-500'}
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
