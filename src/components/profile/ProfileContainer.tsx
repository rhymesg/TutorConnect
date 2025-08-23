'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useApiCall } from '@/hooks/useApiCall';
import { InlineProfileView } from './InlineProfileView';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
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
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data directly
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/profile');
        const data = await response.json();
        
        if (data.success) {
          // Ensure all privacy fields have default values
          const profileWithDefaults = {
            ...data.data,
            privacyGender: data.data.privacyGender || 'PUBLIC',
            privacyAge: data.data.privacyAge || 'PUBLIC',
            privacyDocuments: data.data.privacyDocuments || 'PUBLIC',
            privacyContact: data.data.privacyContact || 'PUBLIC',
            privacyEducation: data.data.privacyEducation || 'PUBLIC',
            privacyCertifications: data.data.privacyCertifications || 'PUBLIC',
            privacyLocation: data.data.privacyLocation || 'PUBLIC',
            privacyPostalCode: data.data.privacyPostalCode || 'PUBLIC',
            privacyMemberSince: data.data.privacyMemberSince || 'PUBLIC',
            privacyLastActive: data.data.privacyLastActive || 'PUBLIC',
            privacyActivity: data.data.privacyActivity || 'PUBLIC',
            privacyStats: data.data.privacyStats || 'PUBLIC'
          };
          setProfileData(profileWithDefaults);
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