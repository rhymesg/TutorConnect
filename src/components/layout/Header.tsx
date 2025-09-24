'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bars3Icon,
  UserCircleIcon,
  BellIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';

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
  notificationCount = 0,
}: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { language, setLanguage } = useLanguage();
  const t = useLanguageText();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const publicNavigation: NavigationItem[] = [
    { name: t('Finn en lærer', 'Find a tutor'), href: '/posts/teachers', current: pathname === '/posts/teachers' },
    { name: t('Finn en student', 'Find a student'), href: '/posts/students', current: pathname === '/posts/students' },
    { name: t('Om oss', 'About'), href: '/om-oss', current: pathname === '/om-oss' },
  ];

  const handleCreateClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isAuthenticated) {
      event.preventDefault();
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('redirectAfterLogin', '/posts/new');
      }
      router.push('/auth/login');
    }
  };

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
                <span className="hidden text-xl font-bold text-neutral-900 sm:block">
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
          <div className="flex items-center">
            {showMenuButton && (
              <button
                type="button"
                className="mr-4 rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-500 lg:hidden"
                onClick={onMenuClick}
                aria-label={t('Åpne hovedmeny', 'Open main menu')}
              >
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
            )}

            <Link
              href="/"
              className="flex items-center space-x-2"
              aria-label={t('Gå til forsiden', 'Go to homepage')}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white font-bold text-sm">
                TC
              </div>
              <span className="hidden text-xl font-bold text-neutral-900 sm:block">
                TutorConnect
              </span>
            </Link>
          </div>

          <nav
            className="hidden items-center space-x-6 md:flex"
            aria-label={t('Hovednavigasjon', 'Primary navigation')}
          >
            <Link
              href="/posts/new"
              onClick={handleCreateClick}
              className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-brand-600"
            >
              <PlusCircleIcon className="mr-1.5 h-5 w-5" aria-hidden="true" />
              {t('Opprett annonse', 'Post an ad')}
            </Link>

            {publicNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.current ? 'page' : undefined}
                className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  item.current
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-brand-600'
                }`}
              >
                {(item.href === '/posts/teachers' || item.href === '/posts/students') && (
                  <MagnifyingGlassIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
                )}
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              href="/posts/new"
              onClick={handleCreateClick}
              className="md:hidden flex h-10 w-10 items-center justify-center text-neutral-600 transition-colors hover:text-neutral-800"
              aria-label={t('Opprett annonse', 'Post an ad')}
            >
              <PlusCircleIcon className="h-6 w-6" aria-hidden="true" />
            </Link>
            <Link
              href="/posts"
              className="md:hidden flex h-10 w-10 items-center justify-center text-neutral-600 transition-colors hover:text-neutral-800"
              aria-label={t('Søk blant annonser', 'Browse listings')}
            >
              <MagnifyingGlassIcon className="h-6 w-6" aria-hidden="true" />
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/chat"
                  className="relative rounded-md p-2 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  aria-label={t('Vis meldinger', 'View notifications')}
                >
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </Link>

                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    className="flex items-center rounded-md p-2 text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    aria-label={t('Brukermeny', 'User menu')}
                  >
                    <UserCircleIcon className="h-8 w-8" aria-hidden="true" />
                    <ChevronDownIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-medium ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1" role="menu">
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                          role="menuitem"
                        >
                          {t('Min side', 'My profile')}
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
                          aria-label={t('Logg ut', 'Log out')}
                        >
                          {t('Logg ut', 'Log out')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-neutral-700 transition-colors hover:text-brand-600"
                >
                  {t('Logg inn', 'Log in')}
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-md border border-brand-100 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-600 shadow-sm transition hover:border-brand-200 hover:bg-brand-100 hover:text-brand-700"
                >
                  {t('Registrer deg', 'Sign up')}
                </Link>
              </>
            )}

            <div className="hidden rounded-lg bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium md:flex md:flex-col md:items-center md:space-y-1">
              <button
                type="button"
                onClick={() => setLanguage('no')}
                className={`w-full rounded-md px-2 py-0.5 text-center transition-colors ${
                  language === 'no'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
                aria-pressed={language === 'no'}
                aria-label="Set language to Norwegian"
              >
                NO
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`w-full rounded-md px-2 py-0.5 text-center transition-colors ${
                  language === 'en'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
                aria-pressed={language === 'en'}
                aria-label="Set language to English"
              >
                EN
              </button>
            </div>

            <div className="flex flex-col items-center rounded-lg bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium md:hidden md:space-y-1">
              <button
                type="button"
                onClick={() => setLanguage('no')}
                className={`w-full rounded-md px-1.5 py-0.5 text-center transition-colors ${
                  language === 'no'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
                aria-pressed={language === 'no'}
                aria-label="Set language to Norwegian"
              >
                NO
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`w-full rounded-md px-1.5 py-0.5 text-center transition-colors ${
                  language === 'en'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
                aria-pressed={language === 'en'}
                aria-label="Set language to English"
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
