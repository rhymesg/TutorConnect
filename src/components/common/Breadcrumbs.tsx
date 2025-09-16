'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

import { BreadcrumbItem } from '@/lib/breadcrumbs';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [navigating, setNavigating] = useState<string | null>(null);
  const router = useRouter();

  // Mount stabilization pattern
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Safe navigation that preserves auth state
  const handleNavigation = (href: string) => {
    if (!isMounted || navigating) return;
    
    // Prevent double clicks
    setNavigating(href);
    
    // Use Next.js router for client-side navigation to preserve state
    setTimeout(() => {
      router.push(href);
    }, 50); // Small delay to ensure state update
    
    // Reset navigating state
    setTimeout(() => setNavigating(null), 300);
  };

  // Add safety check for items
  if (!items || items.length === 0) {
    return null;
  }

  // Prevent hydration issues by rendering static placeholder until mounted
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
              <ChevronRightIcon className="h-4 w-4 text-neutral-300 mx-2" aria-hidden="true" />
              <span className="text-neutral-500">{item.label}</span>
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex ${className}`}
    >
      <ol className="flex items-center space-x-2 text-sm text-neutral-500">
        {/* Home link */}
        <li>
          <button
            type="button"
            className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200 disabled:opacity-50"
            onClick={() => handleNavigation('/')}
            disabled={navigating !== null}
          >
            <HomeIcon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">홈</span>
          </button>
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
                <button
                  type="button"
                  className="text-neutral-500 hover:text-neutral-700 transition-colors duration-200 disabled:opacity-50"
                  onClick={() => handleNavigation(item.href)}
                  disabled={navigating !== null}
                >
                  {item.label}
                </button>
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

