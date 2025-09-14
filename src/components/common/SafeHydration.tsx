'use client';

import { useEffect, useState } from 'react';

interface SafeHydrationProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// This component ensures safe hydration by only rendering children after mount
export default function SafeHydration({ children, fallback }: SafeHydrationProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is fully ready
    const id = requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => {
      cancelAnimationFrame(id);
    };
  }, []);

  if (!mounted) {
    return fallback ? <>{fallback}</> : (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}