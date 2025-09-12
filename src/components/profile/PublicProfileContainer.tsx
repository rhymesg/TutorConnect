'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApiCall } from '@/hooks/useApiCall';
import { InlineProfileView } from './InlineProfileView';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { User } from '@prisma/client';

interface PublicProfileData extends User {
  lastActive: Date | null;
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
  teacherSessions: number;
  teacherStudents: number;
  studentSessions: number;
  studentTeachers: number;
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

interface Props {
  userId: string;
}

export function PublicProfileContainer({ userId }: Props) {
  const { user: currentUser } = useAuth();
  const { execute: fetchProfile, data: profileData, isLoading: loading, error } = useApiCall<PublicProfileData>();
  const [initialLoad, setInitialLoad] = useState(true);

  // Check if this is the current user's own profile
  const isOwnProfile = currentUser?.id === userId;

  // Fetch profile data
  useEffect(() => {
    if (userId) {
      // Always use public profile endpoint to show public view
      const endpoint = `/api/profile/${userId}`;
      
      fetchProfile(endpoint, {
        method: 'GET',
      }).finally(() => {
        setInitialLoad(false);
      });
    }
  }, [userId, fetchProfile]);

  console.log('Debug - loading:', loading, 'error:', error, 'profileData:', profileData); // Debug log

  if (loading || initialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    console.log('Error state triggered:', error); // Debug log
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

  if (!profileData && !loading && !initialLoad) {
    console.log('No profile data - this is the current issue'); // Debug log
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage 
          title="Profil ikke funnet"
          message="Brukerprofilen du leter etter eksisterer ikke."
        />
      </div>
    );
  }

  // Allow viewing own profile in public view mode

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header for navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.history.length > 1 ? window.history.back() : window.close()}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tilbake
            </button>
            <span className="text-sm text-gray-500">Offentlig profil</span>
          </div>
          <button
            onClick={() => window.close()}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Lukk
          </button>
        </div>
      </div>
      
      {/* Profile content */}
      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm">
            <InlineProfileView 
              profile={profileData}
              onProfileUpdate={() => {}} // No update functionality for public view
              isPublicView={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}