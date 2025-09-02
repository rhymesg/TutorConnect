'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

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
            <Link 
              href="/" 
              className="flex items-center space-x-2"
              aria-label="Gå til forsiden"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white font-bold text-sm">
                TC
              </div>
              <span className="text-xl font-bold text-neutral-900 hidden sm:block">
                TutorConnect
              </span>
            </Link>
          </div>

          {/* Center - Navigation (desktop) */}
          <nav className="hidden md:flex items-center space-x-6" aria-label="Hovednavigasjon">
            {/* Create post button */}
            {isAuthenticated && (
              <Link
                href="/posts/new"
                className="flex items-center px-3 py-2 text-sm font-medium text-neutral-700 hover:text-brand-600 hover:bg-neutral-50 rounded-md transition-colors"
              >
                <PlusCircleIcon className="h-5 w-5 mr-1.5" aria-hidden="true" />
                Opprett annonse
              </Link>
            )}
            
            {publicNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${item.current 
                    ? 'text-brand-600 bg-brand-50' 
                    : 'text-neutral-700 hover:text-brand-600 hover:bg-neutral-50'
                  }
                `}
                aria-current={item.current ? 'page' : undefined}
              >
                {(item.name === 'Finn en lærer' || item.name === 'Finn en student') && (
                  <MagnifyingGlassIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                )}
                {item.name}
              </Link>
            ))}
          </nav>


          {/* Right side - Authentication/User menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link
                  href="/chat"
                  className="relative block rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  aria-label="Vis meldinger"
                >
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                  {/* Notification badge */}
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </Link>

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
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Min side
                        </Link>
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
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-neutral-700 hover:text-brand-600 transition-colors"
                >
                  Logg inn
                </Link>
                <Link
                  href="/auth/register"
                  className="btn-primary text-sm"
                >
                  Registrer deg
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation menu */}
      <div className="md:hidden border-t border-neutral-200 bg-white">
        <nav className="mx-auto max-w-7xl px-4 py-2" aria-label="Mobilnavigasjon">
          <div className="flex flex-wrap items-center gap-2">
            {/* Create post button for mobile */}
            {isAuthenticated && (
              <Link
                href="/posts/new"
                className="flex items-center px-3 py-1.5 text-sm font-medium text-neutral-700 hover:text-brand-600 rounded-md transition-colors"
              >
                <PlusCircleIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                Opprett
              </Link>
            )}
            
            {publicNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${item.current 
                    ? 'text-brand-600 bg-brand-50' 
                    : 'text-neutral-700 hover:text-brand-600'
                  }
                `}
                aria-current={item.current ? 'page' : undefined}
              >
                {(item.name === 'Finn en lærer' || item.name === 'Finn en student') && (
                  <MagnifyingGlassIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                )}
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}