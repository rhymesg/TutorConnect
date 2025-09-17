'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bars3Icon, 
  UserCircleIcon,
  BellIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { 
  ChevronDownIcon 
} from '@heroicons/react/24/solid';

interface HeaderProps {
  onMenuClick: () => void;
  showMenuButton?: boolean;
  notificationCount?: number;
}

interface NavigationItem {
  name: string;
  href: string;
  current: boolean;
}

export default function Header({ 
  onMenuClick, 
  showMenuButton = false,
  notificationCount = 0
}: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [navigating, setNavigating] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Mount stabilization pattern
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Safe navigation that preserves auth state
  const handleNavigation = (href: string) => {
    if (!isMounted || navigating) return;
    
    // If already on the same page, don't navigate
    if (pathname === href) return;
    
    // Prevent double clicks
    setNavigating(href);
    
    // Use Next.js router for client-side navigation to preserve state
    setTimeout(() => {
      router.push(href);
    }, 50); // Small delay to ensure state update
    
    // Reset navigating state
    setTimeout(() => setNavigating(null), 300);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen]);

  // Main navigation items for public pages
  const publicNavigation: NavigationItem[] = [
    { name: 'Finn en lærer', href: '/posts/teachers', current: pathname === '/posts/teachers' },
    { name: 'Finn en student', href: '/posts/students', current: pathname === '/posts/students' },
    { name: 'Om oss', href: '/om-oss', current: pathname === '/om-oss' },
  ];

  // Prevent hydration issues by rendering static placeholder until mounted
  if (!isMounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white font-bold text-sm">
                  TC
                </div>
                <span className="text-xl font-bold text-neutral-900 hidden sm:block">
                  TutorConnect
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Menu button (mobile) + Logo */}
          <div className="flex items-center">
            {showMenuButton && (
              <button
                type="button"
                className="mr-4 rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-500 lg:hidden"
                onClick={onMenuClick}
                aria-label="Åpne hovedmeny"
              >
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
            )}
            
            {/* Logo */}
            <button
              type="button"
              className="flex items-center space-x-2"
              aria-label="Gå til forsiden"
              onClick={() => handleNavigation('/')}
              disabled={navigating !== null}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white font-bold text-sm">
                TC
              </div>
              <span className="text-xl font-bold text-neutral-900 hidden sm:block">
                TutorConnect
              </span>
            </button>
          </div>

          {/* Center - Navigation (desktop) */}
          <nav className="hidden md:flex items-center space-x-6" aria-label="Hovednavigasjon">
            {/* Create post button */}
            {isAuthenticated && (
              <button
                type="button"
                className="flex items-center px-3 py-2 text-sm font-medium text-neutral-700 hover:text-brand-600 hover:bg-neutral-50 rounded-md transition-colors disabled:opacity-50"
                onClick={() => handleNavigation('/posts/new')}
                disabled={navigating !== null}
              >
                <PlusCircleIcon className="h-5 w-5 mr-1.5" aria-hidden="true" />
                Opprett annonse
              </button>
            )}
            
            {publicNavigation.map((item) => (
              <button
                key={item.name}
                type="button"
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${item.current 
                    ? 'text-brand-600 bg-brand-50' 
                    : 'text-neutral-700 hover:text-brand-600 hover:bg-neutral-50'
                  }
                  ${navigating === item.href ? 'opacity-50' : ''}
                `}
                aria-current={item.current ? 'page' : undefined}
                onClick={() => handleNavigation(item.href)}
                disabled={navigating !== null}
              >
                {(item.name === 'Finn en lærer' || item.name === 'Finn en student') && (
                  <MagnifyingGlassIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                )}
                {item.name}
              </button>
            ))}
          </nav>


          {/* Right side - Authentication/User menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <button
                  type="button"
                  className="relative rounded-md p-2 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                  aria-label="Vis meldinger"
                  onClick={() => handleNavigation('/chat')}
                  disabled={navigating !== null}
                >
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                  {/* Notification badge */}
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </button>

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    className="flex items-center rounded-md p-2 text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    aria-label="Brukermeny"
                  >
                    <UserCircleIcon className="h-8 w-8" aria-hidden="true" />
                    <ChevronDownIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                  </button>

                  {/* User dropdown menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-medium ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1" role="menu">
                        <button
                          type="button"
                          className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                          role="menuitem"
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleNavigation('/profile');
                          }}
                          disabled={navigating !== null}
                        >
                          Min side
                        </button>
                        <hr className="my-1 border-neutral-200" />
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                          role="menuitem"
                        >
                          Logg ut
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Login/Register buttons for non-authenticated users */}
                <button
                  type="button"
                  className="text-sm font-medium text-neutral-700 hover:text-brand-600 transition-colors disabled:opacity-50"
                  onClick={() => handleNavigation('/auth/login')}
                  disabled={navigating !== null}
                >
                  Logg inn
                </button>
                <button
                  type="button"
                  className="btn-primary text-sm disabled:opacity-50"
                  onClick={() => handleNavigation('/auth/register')}
                  disabled={navigating !== null}
                >
                  Registrer deg
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation menu */}
      <div className="md:hidden border-t border-neutral-200 bg-white">
        <nav className="mx-auto max-w-7xl px-4 py-2" aria-label="Mobilnavigasjon">
          <div className="flex flex-wrap items-center gap-2">
            {/* Create post button for mobile - REMOVED to make header single line */}
            
            {publicNavigation.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleNavigation(item.href)}
                className={`
                  flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${item.current 
                    ? 'text-brand-600 bg-brand-50' 
                    : 'text-neutral-700 hover:text-brand-600'
                  }
                  ${navigating === item.href ? 'opacity-50' : ''}
                `}
                aria-current={item.current ? 'page' : undefined}
                disabled={navigating !== null}
              >
                {(item.name === 'Finn en lærer' || item.name === 'Finn en student') && (
                  <MagnifyingGlassIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                )}
                {item.name}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}