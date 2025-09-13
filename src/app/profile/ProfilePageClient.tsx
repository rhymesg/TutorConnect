'use client';

import { ProfileContainer } from '@/components/profile/ProfileContainer';
import AuthGuard from '@/components/auth/AuthGuard';

/**
 * Client-side profile page component
 */
export default function ProfilePageClient() {
  return (
    <AuthGuard>
      <ProfileContainer />
    </AuthGuard>
  );
}