'use client';

import { ProfileContainer } from '@/components/profile/ProfileContainer';
import AuthGuard from '@/components/auth/AuthGuard';

/**
 * User profile page - displays current user's profile
 * Shows comprehensive profile information with editing capabilities
 */
export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContainer />
    </AuthGuard>
  );
}