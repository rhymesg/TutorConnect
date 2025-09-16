'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Fragment } from 'react';
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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  unreadMessagesCount?: number;
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

export default function Sidebar({ isOpen, onClose, unreadMessagesCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [navigating, setNavigating] = useState<string | null>(null);

  // Mount stabilization pattern
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Safe navigation that preserves auth state
  const handleNavigation = (href: string) => {
    if (!isMounted || navigating) return;
    
    // If already on the same page, don't navigate
    if (pathname === href) {
      onClose();
      return;
    }
    
    // Prevent double clicks
    setNavigating(href);
    
    // Close sidebar and wait for animation
    onClose();
    
    // Use window.location for mobile sidebar to avoid hydration issues
    setTimeout(() => {
      window.location.href = href;
    }, 300); // Wait for sidebar close animation
  };

  const navigationGroups: NavigationGroup[] = [
    {
      title: 'Søk & Opprett',
      items: [
        {
          name: 'Opprett annonse',
          href: '/posts/new',
          icon: PlusIcon,
        },
        {
          name: 'Finn en lærer',
          href: '/posts/teachers',
          icon: MagnifyingGlassIcon,
        },
        {
          name: 'Finn en student',
          href: '/posts/students', 
          icon: MagnifyingGlassIcon,
        },
      ],
    },
    {
      title: 'Mine Aktiviteter',
      items: [
        {
          name: 'Mine annonser',
          href: '/profile/posts',
          icon: DocumentTextIcon,
        },
        {
          name: 'Mine samtaler',
          href: '/chat',
          icon: ChatBubbleLeftRightIcon,
          badge: unreadMessagesCount,
        },
        {
          name: 'Mine timer',
          href: '/appointments',
          icon: CalendarIcon,
        },
      ],
    },
    {
      title: 'Konto',
      items: [
        {
          name: 'Min profil',
          href: '/profile',
          icon: UserIcon,
        },
        {
          name: 'Innstillinger',
          href: '/settings',
          icon: Cog6ToothIcon,
        },
      ],
    },
  ];

  const isCurrentPage = (href: string) => {
    return pathname.startsWith(href);
  };

  const SidebarContent = () => {
    // Render static content until mounted
    if (!isMounted) {
      return (
        <div className="flex h-full flex-col">
          <div className="lg:hidden flex h-12 items-center justify-end px-6 border-b border-neutral-200">
            <div className="rounded-md p-2">
              <XMarkIcon className="h-6 w-6 text-neutral-500" aria-hidden="true" />
            </div>
          </div>
          <nav className="flex-1 px-6 py-8 overflow-y-auto min-h-0">
            <div className="space-y-8">
              {navigationGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 px-4">
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

        {/* Navigation */}
        <nav className="flex-1 px-6 py-8 overflow-y-auto min-h-0" aria-label="Sidemeny navigasjon">
          <div className="space-y-8">
            {navigationGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 px-4">
                  {group.title}
                </h3>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const current = isCurrentPage(item.href);
                    
                    return (
                      <li key={item.name}>
                        <button
                          type="button"
                          className={`
                            group flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors w-full text-left
                            ${current 
                              ? 'bg-brand-50 text-brand-700' 
                              : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                            }
                            ${navigating === item.href ? 'opacity-50' : ''}
                          `}
                          onClick={() => handleNavigation(item.href)}
                          aria-current={current ? 'page' : undefined}
                          disabled={navigating !== null}
                        >
                        <item.icon
                          className={`
                            mr-4 h-6 w-6 flex-shrink-0
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
                      </button>
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