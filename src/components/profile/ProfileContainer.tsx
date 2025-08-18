'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApiCall } from '@/hooks/useApiCall';
import { ProfileView } from './ProfileView';
import { ProfileEdit } from './ProfileEdit';
import { PrivacySettings } from './PrivacySettings';
import { ProfileCompleteness } from './ProfileCompleteness';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { User } from '@prisma/client';

interface ProfileData extends User {
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
  const { user, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'view' | 'edit' | 'privacy'>('view');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  
  const { execute: fetchProfile, loading, error } = useApiCall<ProfileData>();
  const { execute: updateProfile } = useApiCall();

  // Fetch profile data
  useEffect(() => {
    if (user) {
      fetchProfile('/api/profile', {
        method: 'GET',
      }).then((data) => {
        if (data?.success) {
          setProfileData(data.data);
        }
      });
    }
  }, [user, fetchProfile]);

  // Handle profile update
  const handleProfileUpdate = async (updatedData: Partial<User>) => {
    try {
      const response = await updateProfile('/api/profile', {
        method: 'PUT',
        data: updatedData,
      });

      if (response?.success) {
        setProfileData(prev => prev ? { ...prev, ...response.data } : null);
        setCurrentView('view');
        // Show success message
      }
    } catch (error) {
      console.error('Profile update error:', error);
      // Error is handled by useApiCall
    }
  };

  // Handle privacy settings update
  const handlePrivacyUpdate = async (privacyData: any) => {
    try {
      const response = await updateProfile('/api/profile', {
        method: 'PATCH',
        data: privacyData,
      });

      if (response?.success) {
        setProfileData(prev => prev ? { ...prev, ...response.data } : null);
        // Show success message
      }
    } catch (error) {
      console.error('Privacy update error:', error);
    }
  };

  if (authLoading || loading) {
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
          message="Det oppstod en feil ved lasting av profilen. Prøv å laste siden på nytt."
          action={{
            text: "Prøv igjen",
            onClick: () => window.location.reload()
          }}
        />
      </div>
    );
  }

  if (!user || !profileData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile completeness banner */}
        {profileData.completeness.percentage < 100 && (
          <div className="mb-8">
            <ProfileCompleteness 
              completeness={profileData.completeness}
              onEditClick={() => setCurrentView('edit')}
            />
          </div>
        )}

        {/* Navigation tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setCurrentView('view')}
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  currentView === 'view'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                aria-current={currentView === 'view' ? 'page' : undefined}
              >
                Min profil
              </button>
              <button
                onClick={() => setCurrentView('edit')}
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  currentView === 'edit'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                aria-current={currentView === 'edit' ? 'page' : undefined}
              >
                Rediger profil
              </button>
              <button
                onClick={() => setCurrentView('privacy')}
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  currentView === 'privacy'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                aria-current={currentView === 'privacy' ? 'page' : undefined}
              >
                Personvern
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {currentView === 'view' && (
            <ProfileView 
              profile={profileData} 
              onEditClick={() => setCurrentView('edit')}
            />
          )}
          
          {currentView === 'edit' && (
            <ProfileEdit
              profile={profileData}
              onSave={handleProfileUpdate}
              onCancel={() => setCurrentView('view')}
            />
          )}
          
          {currentView === 'privacy' && (
            <PrivacySettings
              profile={profileData}
              onSave={handlePrivacyUpdate}
              onCancel={() => setCurrentView('view')}
            />
          )}
        </div>
      </div>
    </div>
  );
}