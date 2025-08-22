'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PostForm19 from '@/components/posts/PostForm19';
import { PostWithDetails } from '@/types/database';
import { LoadingSpinner } from '@/components/ui';

interface UserProfile {
  region?: string;
  postnummer?: string;
}

export default function NewPostClient() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const profile = await response.json();
          // Profile data loaded successfully
          setUserProfile({
            region: profile.data.region,
            postnummer: profile.data.postalCode
          });
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSuccess = (post: PostWithDetails) => {
    // Redirect to the new post or posts list
    router.push(`/posts/${post.id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  // Prepare default values from user profile
  const defaultValues = {
    location: userProfile?.region,
    postnummer: userProfile?.postnummer
  };

  // Show form immediately while data loads in background

  return (
    <PostForm19
      mode="create"
      defaultValues={defaultValues}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}