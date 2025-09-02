'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import Header from './Header';
import MobileNavigation from './MobileNavigation';
import Sidebar from './Sidebar';
import Footer from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  
  // Get total unread count for notifications
  // Only load if authenticated and not on auth pages
  const shouldLoadUnreadCount = isAuthenticated && !pathname.startsWith('/auth');
  const { totalUnreadCount } = useChat({
    autoLoad: shouldLoadUnreadCount,
    enablePolling: shouldLoadUnreadCount,
  });

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Determine if current page should show navigation
  const isPublicPage = pathname === '/' || 
                      pathname.startsWith('/auth') || 
                      pathname === '/om-oss';
  
  // Hide navigation for public profile pages (viewing other users' profiles)
  const isPublicProfilePage = pathname.startsWith('/profile/') && pathname !== '/profile';

  // Determine layout structure based on authentication and page type
  const showSidebar = isAuthenticated && !isPublicPage && !isPublicProfilePage;
  const showMobileNav = isAuthenticated && !isPublicPage && !isPublicProfilePage;
  const showHeader = !isPublicProfilePage;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 z-50 rounded-lg bg-brand-500 px-4 py-2 text-white focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
      >
        Hopp til hovedinnhold
      </a>

      {/* Header */}
      {showHeader && (
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          showMenuButton={showSidebar}
          notificationCount={totalUnreadCount}
        />
      )}

      <div className={`flex ${showHeader ? 'h-[calc(100vh-4rem)]' : 'h-screen'}`}>
        {/* Desktop Sidebar */}
        {showSidebar && (
          <Sidebar 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            unreadMessagesCount={totalUnreadCount}
          />
        )}

        {/* Main Content Area */}
        <main 
          id="main-content"
          className={`
            flex-1 overflow-y-auto
            ${showSidebar ? 'lg:ml-64' : ''}
            ${showMobileNav ? 'pb-16' : ''}
          `}
          role="main"
          aria-label="Hovedinnhold"
        >
          <div className="min-h-full">
            {children}
          </div>
          
          {/* Footer - show on all public pages */}
          {isPublicPage && <Footer />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {showMobileNav && <MobileNavigation />}

      {/* Mobile sidebar overlay */}
      {showSidebar && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 bg-neutral-600 opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Accessibility announcer for screen readers */}
      <div
        id="aria-live-region"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
    </div>
  );
}