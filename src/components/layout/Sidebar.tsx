'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  UserIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  unreadMessagesCount?: number;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: number;
  description?: string;
}

export default function Sidebar({ isOpen, onClose, unreadMessagesCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  const navigationSections: NavigationSection[] = [
    {
      title: 'Hovedmeny',
      items: [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: HomeIcon,
          description: 'Oversikt over din aktivitet',
        },
        {
          name: 'Finn en lærer',
          href: '/posts/teachers',
          icon: MagnifyingGlassIcon,
          description: 'Se lærerannonser',
        },
        {
          name: 'Finn en student',
          href: '/posts/students', 
          icon: MagnifyingGlassIcon,
          description: 'Se studentannonser',
        },
        {
          name: 'Mine samtaler',
          href: '/chat',
          icon: ChatBubbleLeftRightIcon,
          badge: unreadMessagesCount,
          description: 'Aktive samtaler og meldinger',
        },
        {
          name: 'Mine timer',
          href: '/appointments',
          icon: CalendarIcon,
          description: 'Kommende og tidligere timer',
        },
      ],
    },
    {
      title: 'Profil',
      items: [
        {
          name: 'Min profil',
          href: '/profile',
          icon: UserIcon,
          description: 'Rediger profil og kvalifikasjoner',
        },
        {
          name: 'Mine annonser',
          href: '/profile/posts',
          icon: DocumentTextIcon,
          description: 'Administrer dine annonser',
        },
      ],
    },
    {
      title: 'Innstillinger',
      items: [
        {
          name: 'Innstillinger',
          href: '/settings',
          icon: Cog6ToothIcon,
          description: 'Kontoinnstillinger og preferanser',
        },
        {
          name: 'Hjelp',
          href: '/help',
          icon: QuestionMarkCircleIcon,
          description: 'Få hjelp og støtte',
        },
      ],
    },
  ];

  const isCurrentPage = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Mobile close button - only show on mobile */}
      <div className="lg:hidden flex h-12 items-center justify-end px-6 border-b border-neutral-200">
        <button
          type="button"
          className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
          onClick={onClose}
          aria-label="Lukk sidemeny"
        >
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Quick action button */}
      <div className="px-6 py-4 border-b border-neutral-200">
        <Link
          href="/posts/new"
          className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors"
          onClick={onClose}
        >
          <PlusIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          Opprett annonse
        </Link>
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 space-y-6 px-6 py-6 overflow-y-auto min-h-0" aria-label="Sidemeny navigasjon">
        {navigationSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const current = isCurrentPage(item.href);
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`
                        group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors
                        ${current 
                          ? 'bg-brand-50 text-brand-700' 
                          : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                        }
                      `}
                      onClick={onClose}
                      aria-current={current ? 'page' : undefined}
                    >
                      <item.icon
                        className={`
                          mr-3 h-5 w-5 flex-shrink-0
                          ${current 
                            ? 'text-brand-500' 
                            : 'text-neutral-400 group-hover:text-neutral-500'
                          }
                        `}
                        aria-hidden="true"
                      />
                      
                      <span className="flex-1">
                        {item.name}
                      </span>
                      
                      {item.badge !== undefined && item.badge > 0 && (
                        <span 
                          className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800"
                          aria-label={`${item.badge} nye varsler`}
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </Link>
                    
                    {/* Description tooltip on hover (hidden on mobile) */}
                    {item.description && (
                      <div className="hidden lg:block ml-8 mt-1">
                        <p className="text-xs text-neutral-500">
                          {item.description}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col h-full border-r border-neutral-200 bg-white pt-16 overflow-hidden">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile sidebar */}
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