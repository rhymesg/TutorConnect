'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PostsSelectionCards() {
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

  // Render static placeholder until mounted
  if (!isMounted) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Find Teachers Card */}
          <div className="group relative bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 3.5C14.5 3.2 14 3 13.5 3H10.5C10 3 9.5 3.2 9 3.5L3 7V9H5V20C5 20.6 5.4 21 6 21H18C18.6 21 19 20.6 19 20V9H21ZM7 9H17V19H16V17C16 16.4 15.6 16 15 16H9C8.4 16 8 16.4 8 17V19H7V9Z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-3">
              Finn en lærer
            </h2>
            <p className="text-neutral-600 mb-4">
              Søk blant erfarne lærere i ditt fagområde
            </p>
            <div className="inline-flex items-center text-green-600 font-medium">
              Se alle lærere
              <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
              </svg>
            </div>
          </div>

          {/* Find Students Card */}
          <div className="group relative bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9L12 15L21 11.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 16L12 13L7 16L12 19L17 16Z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-3">
              Finn en student
            </h2>
            <p className="text-neutral-600 mb-4">
              Hjelp studenter i ditt fagområde
            </p>
            <div className="inline-flex items-center text-blue-600 font-medium">
              Se alle studenter
              <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Find Teachers Card */}
        <button
          type="button"
          onClick={() => handleNavigation('/posts/teachers')}
          disabled={navigating !== null}
          className={`
            group relative bg-white rounded-xl shadow-sm border border-neutral-200 hover:shadow-lg hover:border-green-300 transition-all duration-200 p-8 text-center w-full text-left
            ${navigating === '/posts/teachers' ? 'opacity-50' : ''}
          `}
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 3.5C14.5 3.2 14 3 13.5 3H10.5C10 3 9.5 3.2 9 3.5L3 7V9H5V20C5 20.6 5.4 21 6 21H18C18.6 21 19 20.6 19 20V9H21ZM7 9H17V19H16V17C16 16.4 15.6 16 15 16H9C8.4 16 8 16.4 8 17V19H7V9Z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-3 group-hover:text-green-700">
            Finn en lærer
          </h2>
          <p className="text-neutral-600 mb-4">
            Søk blant erfarne lærere i ditt fagområde
          </p>
          <div className="inline-flex items-center text-green-600 font-medium group-hover:text-green-700">
            Se alle lærere
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </div>
        </button>

        {/* Find Students Card */}
        <button
          type="button"
          onClick={() => handleNavigation('/posts/students')}
          disabled={navigating !== null}
          className={`
            group relative bg-white rounded-xl shadow-sm border border-neutral-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200 p-8 text-center w-full text-left
            ${navigating === '/posts/students' ? 'opacity-50' : ''}
          `}
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9L12 15L21 11.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 16L12 13L7 16L12 19L17 16Z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-3 group-hover:text-blue-700">
            Finn en student
          </h2>
          <p className="text-neutral-600 mb-4">
            Hjelp studenter i ditt fagområde
          </p>
          <div className="inline-flex items-center text-blue-600 font-medium group-hover:text-blue-700">
            Se alle studenter
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}