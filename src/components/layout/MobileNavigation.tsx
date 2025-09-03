'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  CalendarIcon as CalendarIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconSolid: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: number;
}

interface MobileNavigationProps {
  unreadMessagesCount?: number;
}

export default function MobileNavigation({ unreadMessagesCount = 0 }: MobileNavigationProps) {
  const pathname = usePathname();

  const navigation: NavigationItem[] = [
    {
      name: 'Hjem',
      href: '/posts',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
    },
    {
      name: 'Søk',
      href: '/posts',
      icon: MagnifyingGlassIcon,
      iconSolid: MagnifyingGlassIconSolid,
    },
    {
      name: 'Chat',
      href: '/chat',
      icon: ChatBubbleLeftRightIcon,
      iconSolid: ChatBubbleLeftRightIconSolid,
      badge: unreadMessagesCount,
    },
    {
      name: 'Timer',
      href: '/appointments',
      icon: CalendarIcon,
      iconSolid: CalendarIconSolid,
    },
    {
      name: 'Profil',
      href: '/profile',
      icon: UserIcon,
      iconSolid: UserIconSolid,
    },
  ];

  const isCurrentPage = (href: string) => {
    return pathname.startsWith(href);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 lg:hidden"
      aria-label="Hovednavigasjon for mobil"
    >
      <div className="grid grid-cols-5 h-16">
        {navigation.map((item) => {
          const current = isCurrentPage(item.href);
          const IconComponent = current ? item.iconSolid : item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                relative flex flex-col items-center justify-center px-2 py-1 text-xs font-medium transition-colors
                ${current 
                  ? 'text-brand-600' 
                  : 'text-neutral-500 hover:text-neutral-700'
                }
              `}
              aria-current={current ? 'page' : undefined}
            >
              <div className="relative">
                <IconComponent 
                  className="h-6 w-6 mb-1" 
                  aria-hidden="true" 
                />
                
                {/* Badge for notifications */}
                {item.badge && item.badge > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white"
                    aria-label={`${item.badge} nye varsler`}
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              
              <span className="truncate">
                {item.name}
              </span>
              
              {/* Active indicator */}
              {current && (
                <div 
                  className="absolute bottom-0 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-brand-600"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
      
      {/* Safe area for devices with home indicators */}
      <div className="h-4 bg-white sm:hidden" />
    </nav>
  );
}