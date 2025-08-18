'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bars3Icon, 
  UserCircleIcon,
  BellIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import { 
  ChevronDownIcon 
} from '@heroicons/react/24/solid';

interface HeaderProps {
  onMenuClick: () => void;
  showMenuButton?: boolean;
  isAuthenticated?: boolean;
}

interface NavigationItem {
  name: string;
  href: string;
  current: boolean;
}

export default function Header({ 
  onMenuClick, 
  showMenuButton = false, 
  isAuthenticated = false 
}: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const pathname = usePathname();

  // Main navigation items for public pages
  const publicNavigation: NavigationItem[] = [
    { name: 'Finn lærer', href: '/posts?type=teacher', current: pathname.startsWith('/posts') },
    { name: 'Bli lærer', href: '/auth/register?type=teacher', current: false },
    { name: 'Om oss', href: '/om-oss', current: pathname === '/om-oss' },
    { name: 'Kontakt', href: '/kontakt', current: pathname === '/kontakt' },
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

          {/* Center - Public navigation (desktop) */}
          {!isAuthenticated && (
            <nav className="hidden md:flex space-x-8" aria-label="Hovednavigasjon">
              {publicNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${item.current 
                      ? 'text-brand-600 bg-brand-50' 
                      : 'text-neutral-700 hover:text-brand-600 hover:bg-neutral-50'
                    }
                  `}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          )}

          {/* Center - Search (authenticated users) */}
          {isAuthenticated && (
            <div className="flex-1 max-w-lg mx-8 hidden lg:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MagnifyingGlassIcon 
                    className={`h-5 w-5 ${searchFocused ? 'text-brand-500' : 'text-neutral-400'}`} 
                    aria-hidden="true" 
                  />
                </div>
                <input
                  type="search"
                  placeholder="Søk etter lærere eller studenter..."
                  className="block w-full rounded-lg border border-neutral-300 py-2 pl-10 pr-3 text-sm placeholder:text-neutral-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  aria-label="Søk i TutorConnect"
                />
              </div>
            </div>
          )}

          {/* Right side - Authentication/User menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <button
                  type="button"
                  className="relative rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  aria-label="Vis varsler"
                >
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                  {/* Notification badge */}
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                    3
                  </span>
                </button>

                {/* User menu */}
                <div className="relative">
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
                        >
                          Min profil
                        </Link>
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                          role="menuitem"
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                          role="menuitem"
                        >
                          Innstillinger
                        </Link>
                        <hr className="my-1 border-neutral-200" />
                        <button
                          type="button"
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

      {/* Mobile navigation menu (public pages only) */}
      {!isAuthenticated && (
        <div className="md:hidden border-t border-neutral-200 bg-white">
          <nav className="mx-auto max-w-7xl px-4 py-2" aria-label="Mobilnavigasjon">
            <div className="flex space-x-4">
              {publicNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${item.current 
                      ? 'text-brand-600 bg-brand-50' 
                      : 'text-neutral-700 hover:text-brand-600'
                    }
                  `}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}