'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApiCall } from '@/hooks/useApiCall';
import { PublicProfileView } from './PublicProfileView';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { User } from '@prisma/client';

interface PublicProfileData extends User {
  documents?: Array<{
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

interface Props {
  userId: string;
}

export function PublicProfileContainer({ userId }: Props) {
  const { user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);
  const [isRequestingInfo, setIsRequestingInfo] = useState(false);
  
  const { execute: fetchProfile, loading, error } = useApiCall<PublicProfileData>();
  const { execute: requestInfo } = useApiCall();

  // Check if this is the current user's own profile
  const isOwnProfile = currentUser?.id === userId;

  // Fetch profile data
  useEffect(() => {
    if (userId) {
      const endpoint = isOwnProfile ? '/api/profile' : `/api/profile/${userId}`;
      
      fetchProfile(endpoint, {
        method: 'GET',
      }).then((data) => {
        if (data?.success) {
          setProfileData(data.data);
        }
      });
    }
  }, [userId, isOwnProfile, fetchProfile]);

  // Handle info request for private fields
  const handleInfoRequest = async (fields: string[]) => {
    if (!currentUser) return;

    setIsRequestingInfo(true);
    try {
      const response = await requestInfo('/api/profile/info-request', {
        method: 'POST',
        data: {
          targetUserId: userId,
          requestedFields: fields,
        },
      });

      if (response?.success) {
        // Show success message - could be implemented with a toast system
        console.log('Info request sent successfully');
      }
    } catch (error) {
      console.error('Info request error:', error);
    } finally {
      setIsRequestingInfo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <ErrorMessage 
          title="Kunne ikke laste profil"
          message="Profilen ble ikke funnet eller du har ikke tilgang til den."
          action={{
            text: "Tilbake til søk",
            onClick: () => window.history.back()
          }}
        />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage 
          title="Profil ikke funnet"
          message="Brukerprofilen du leter etter eksisterer ikke."
        />
      </div>
    );
  }

  // Redirect to own profile if viewing self
  if (isOwnProfile) {
    window.location.href = '/profile';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <PublicProfileView 
            profile={profileData}
            currentUser={currentUser}
            onInfoRequest={handleInfoRequest}
            isRequestingInfo={isRequestingInfo}
          />
        </div>
      </div>
    </div>
  );
}