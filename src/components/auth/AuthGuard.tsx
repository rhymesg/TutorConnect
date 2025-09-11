'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, ReactNode, Suspense } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  showMessage?: boolean;
}

function AuthGuardContent({ 
  children, 
  fallback,
  redirectTo = '/auth/login',
  showMessage = true 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the current URL for redirect after login
      const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      sessionStorage.setItem('redirectAfterLogin', currentUrl);
      
      // Navigate to login page
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo, pathname, searchParams]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  // Show message while redirecting or if authentication failed
  if (!isAuthenticated || !user) {
    return fallback || (showMessage ? (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m11-7a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Du må logge inn for å fortsette
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            You need to log in to access this page
          </p>
          <button
            onClick={() => router.push(redirectTo)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Logg inn / Log in
          </button>
        </div>
      </div>
    ) : null);
  }

  return <>{children}</>;
}

export default function AuthGuard(props: AuthGuardProps) {
  return (
    <Suspense fallback={props.fallback || (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    )}>
      <AuthGuardContent {...props} />
    </Suspense>
  );
}