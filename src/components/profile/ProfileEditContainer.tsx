'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileEdit19 } from './ProfileEdit19';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { User } from '@prisma/client';
import { useLanguageText } from '@/contexts/LanguageContext';

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
}

export function ProfileEditContainer() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useLanguageText();

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/profile');
        const data = await response.json();
        
        if (data.success) {
          setProfileData(data.data);
        } else {
          setError(data.error || 'Profile fetch failed');
        }
      } catch (err) {
        setError('Network error');
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = (updatedProfile: any) => {
    // Update local state with new profile data
    setProfileData(updatedProfile);
    // Navigate back to profile view after successful save
    router.push('/profile');
  };

  const handleCancel = () => {
    router.push('/profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
         <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
          <div>{t('Laster profil...', 'Loading profile...')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-600 mb-4">{t('Feil', 'Error')}: {error}</div>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            {t('Tilbake til profil', 'Back to profile')}
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>{t('Profil data ikke funnet', 'Profile data not found')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileEdit19 
          profile={profileData}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
