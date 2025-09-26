'use client';

import { useState, useEffect, Fragment, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  UserIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useLanguageText } from '@/contexts/LanguageContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  unreadMessagesCount?: number;
  showDesktop?: boolean;
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: number;
}

export default function Sidebar({ isOpen, onClose, unreadMessagesCount = 0, showDesktop = true }: SidebarProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const t = useLanguageText();

  const navigationGroups = useMemo<NavigationGroup[]>(() => ([
    {
      title: t('Søk & Opprett', 'Search & Create'),
      items: [
        { name: t('Opprett annonse', 'Post an ad'), href: '/posts/new', icon: PlusIcon },
        { name: t('Finn en lærer', 'Find a tutor'), href: '/posts/teachers', icon: MagnifyingGlassIcon },
        { name: t('Finn en student', 'Find a student'), href: '/posts/students', icon: MagnifyingGlassIcon },
      ],
    },
    {
      title: t('Mine aktiviteter', 'My activity'),
      items: [
        { name: t('Mine annonser', 'My ads'), href: '/profile/posts', icon: DocumentTextIcon },
        { name: t('Mine samtaler', 'Conversations'), href: '/chat', icon: ChatBubbleLeftRightIcon, badge: unreadMessagesCount },
        { name: t('Mine timer', 'Appointments'), href: '/appointments', icon: CalendarIcon },
      ],
    },
    {
      title: t('Konto', 'Account'),
      items: [
        { name: t('Min profil', 'My profile'), href: '/profile', icon: UserIcon },
        { name: t('Innstillinger', 'Settings'), href: '/settings', icon: Cog6ToothIcon },
      ],
    },
  ]), [t, unreadMessagesCount]);

  const closeSidebarLabel = t('Lukk sidemeny', 'Close sidebar');
  const sidebarNavLabel = t('Sidemeny navigasjon', 'Sidebar navigation');
  const notificationLabel = (count: number) => count > 0
    ? t(`${count} nye varsler`, `${count} new notifications`)
    : '';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isCurrentPage = (href: string) => {
    if (href === '/profile') {
      return pathname === '/profile';
    }

    if (href === '/profile/posts') {
      return pathname === '/profile/posts' || pathname.startsWith('/profile/posts/');
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const SidebarContent = () => {
    if (!isMounted) {
      return (
        <div className="flex h-full flex-col">
          <div className="flex h-12 items-center justify-end border-b border-neutral-200 px-6 lg:hidden">
            <div className="rounded-md p-2">
              <XMarkIcon className="h-6 w-6 text-neutral-500" aria-hidden="true" />
            </div>
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
            <div className="space-y-8">
              {navigationGroups.map((group, index) => (
                <div key={index}>
                  <h3 className="mb-3 px-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {group.title}
                  </h3>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li key={item.name}>
                        <div className="group flex items-center rounded-lg px-4 py-3 text-sm font-medium text-neutral-700">
                          <item.icon className="mr-4 h-6 w-6 flex-shrink-0 text-neutral-400" aria-hidden="true" />
                          <span className="flex-1">{item.name}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col">
        <div className="flex h-12 items-center justify-end border-b border-neutral-200 px-6 lg:hidden">
          <button
            type="button"
            className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
            onClick={onClose}
            aria-label={closeSidebarLabel}
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-6 py-8" aria-label={sidebarNavLabel}>
          <div className="space-y-8">
            {navigationGroups.map((group, index) => (
              <div key={index}>
                <h3 className="mb-3 px-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {group.title}
                </h3>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const current = isCurrentPage(item.href);

                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          aria-current={current ? 'page' : undefined}
                          onClick={onClose}
                          className={`group flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                            current
                              ? 'bg-brand-50 text-brand-700'
                              : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                          }`}
                        >
                          <item.icon
                            className={`mr-4 h-6 w-6 flex-shrink-0 ${
                              current
                                ? 'text-brand-500'
                                : 'text-neutral-400 group-hover:text-neutral-500'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="flex-1">{item.name}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span
                              className="ml-2 inline-flex items-center justify-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800"
                              aria-label={notificationLabel(item.badge)}
                            >
                              {item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </div>
    );
  };

  return (
    <>
      {showDesktop && (
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex h-full flex-col overflow-hidden border-r border-neutral-200 bg-white pt-16">
            <SidebarContent />
          </div>
        </div>
      )}

      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-neutral-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
                <div className="flex h-full flex-col pt-16">
                  <SidebarContent />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
