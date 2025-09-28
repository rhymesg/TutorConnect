'use client';

import { useEffect, useState } from 'react';

import AuthGuard from '@/components/auth/AuthGuard';
import { ProfileContainer } from '@/components/profile/ProfileContainer';
import AdsterraBanner from '@/components/ads/AdsterraBanner';
import { adPlacementIds } from '@/constants/adPlacements';

/**
 * User profile page - displays current user's profile
 * Shows comprehensive profile information with editing capabilities
 */
export default function ProfilePage() {
  const [isMobileAd, setIsMobileAd] = useState(false);

  useEffect(() => {
    const updateAdBreakpoint = () => {
      if (typeof window === 'undefined') {
        return;
      }
      setIsMobileAd(window.innerWidth < 768);
    };

    updateAdBreakpoint();
    window.addEventListener('resize', updateAdBreakpoint);
    return () => window.removeEventListener('resize', updateAdBreakpoint);
  }, []);

  return (
    <AuthGuard>
      <div className="bg-neutral-50">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <ProfileContainer />

            <div className="flex justify-center overflow-x-auto pb-6">
              <AdsterraBanner
                placement={
                  isMobileAd
                    ? adPlacementIds.horizontalMobile320x50
                    : adPlacementIds.horizontal728x90
                }
                className="mx-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
