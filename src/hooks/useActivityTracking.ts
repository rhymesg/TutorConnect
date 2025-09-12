import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to track user activity by updating lastActive timestamp
 * Call this in page components to track when users visit pages
 */
export function useActivityTracking() {
  const { user, accessToken } = useAuth();
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    // Only track once per page visit and only for authenticated users
    if (!user || !accessToken || hasTrackedRef.current) {
      return;
    }

    const trackActivity = async () => {
      try {
        await fetch('/api/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        hasTrackedRef.current = true;
      } catch (error) {
        // Silently fail - activity tracking shouldn't break the page
        console.debug('Failed to track activity:', error);
      }
    };

    trackActivity();
  }, [user, accessToken]);
}

/**
 * Hook to track user activity with periodic updates
 * Updates activity every specified interval while user is on the page
 */
export function usePeriodicActivityTracking(intervalMinutes: number = 5) {
  const { user, accessToken } = useAuth();

  useEffect(() => {
    if (!user || !accessToken) {
      return;
    }

    const trackActivity = async () => {
      try {
        await fetch('/api/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      } catch (error) {
        console.debug('Failed to track periodic activity:', error);
      }
    };

    // Track immediately on mount
    trackActivity();

    // Set up periodic tracking
    const interval = setInterval(trackActivity, intervalMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, accessToken, intervalMinutes]);
}