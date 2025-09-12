'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useApiCall } from '@/hooks/useApiCall';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import { InlineProfileView } from './InlineProfileView';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import AuthError from '@/components/auth/AuthError';
import { User } from '@prisma/client';

interface ProfileData extends User {
  privacyGender: string;
  privacyAge: string;
  privacyDocuments: string;
  privacyContact: string;
  privacyEducation: string;
  privacyCertifications: string;
  privacyLocation: string;
  privacyPostalCode: string;
  privacyMemberSince: string;
  privacyLastActive: string;
  privacyActivity: string;
  privacyStats: string;
  completeness: {
    percentage: number;
    missingFields: string[];
  };
  documents: Array<{
    id: string;
    documentType: string;
    fileName: string;
    verificationStatus: string;
    uploadedAt: string;
  }>;
  posts: Array<{
    id: string;
    type: string;
    subject: string;
    title: string;
    createdAt: string;
  }>;
}

export function ProfileContainer() {
  // Track user activity on profile page
  useActivityTracking();
  
  const router = useRouter();
  const { authError, clearAuthError, refreshAuth } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data with proper auth handling
  const { execute, data, error: apiError, isLoading: apiLoading } = useApiCall<ProfileData>();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const result = await execute('/api/profile', {
          method: 'GET',
          requireAuth: true,
        });
        
        if (result) {
          // Ensure all privacy fields have default values
          const profileWithDefaults = {
            ...result,
            privacyGender: result.privacyGender || 'PUBLIC',
            privacyAge: result.privacyAge || 'PUBLIC',
            privacyDocuments: result.privacyDocuments || 'PUBLIC',
            privacyContact: result.privacyContact || 'PUBLIC',
            privacyEducation: result.privacyEducation || 'PUBLIC',
            privacyCertifications: result.privacyCertifications || 'PUBLIC',
            privacyLocation: result.privacyLocation || 'PUBLIC',
            privacyPostalCode: result.privacyPostalCode || 'PUBLIC',
            privacyMemberSince: result.privacyMemberSince || 'PUBLIC',
            privacyLastActive: result.privacyLastActive || 'PUBLIC',
            privacyActivity: result.privacyActivity || 'PUBLIC',
            privacyStats: result.privacyStats || 'PUBLIC'
          };
          setProfileData(profileWithDefaults);
          setError(null);
        } else if (apiError) {
          setError(apiError);
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        // Error handling is done by useApiCall and AuthContext
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [execute, apiError]);

  // Handle retry after authentication error
  const handleRetry = async () => {
    clearAuthError();
    const refreshed = await refreshAuth();
    if (refreshed) {
      // Refetch profile data
      setLoading(true);
      setError(null);
      window.location.reload(); // Simple reload to refetch everything
    }
  };

  // Show auth error if present
  if (authError) {
    return (
      <AuthError
        type={authError}
        onRetry={handleRetry}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div>에러: {error}</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <InlineProfileView 
            profile={profileData} 
            onProfileUpdate={setProfileData}
            isPublicView={false}
          />
        </div>
      </div>
    </div>
  );
}