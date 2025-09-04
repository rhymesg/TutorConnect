'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PostForm19 from '@/components/posts/PostForm19';
import { PostWithDetails } from '@/types/database';
import { LoadingSpinner, ErrorMessage } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

interface EditPostClientProps {
  postId: string;
}

export default function EditPostClient({ postId }: EditPostClientProps) {
  const router = useRouter();
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [post, setPost] = useState<PostWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch post data
  useEffect(() => {
    // Don't fetch if auth is still loading or user is not authenticated
    if (authLoading || !isAuthenticated) {
      return;
    }

    const fetchPost = async () => {
      try {
        console.log(`Fetching post from /api/posts/${postId}...`);
        
        // Prepare headers with Authorization token
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
          console.log('Using Authorization header with token');
        }
        
        const response = await fetch(`/api/posts/${postId}`, {
          credentials: 'include', // Include cookies as fallback
          headers,
        });
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API response not ok:', response.status, errorText);
          
          if (response.status === 404) {
            setError('Annonsen ble ikke funnet');
          } else if (response.status === 403) {
            setError('Du har ikke tilgang til å redigere denne annonsen');
          } else {
            setError(`HTTP ${response.status}: ${errorText}`);
          }
          return;
        }
        const data = await response.json();
        console.log('Post data received:', data);
        setPost(data);
      } catch (error) {
        console.error('Failed to fetch post:', error);
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        setError('Noe gikk galt. Vennligst prøv igjen senere.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId, authLoading, isAuthenticated]);

  const handleSuccess = (updatedPost: PostWithDetails) => {
    // Redirect to the updated post
    router.push(`/posts/${updatedPost.id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <ErrorMessage 
          title="Feil ved lasting av annonse" 
          message={error} 
        />
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Gå tilbake
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <ErrorMessage 
          title="Annonse ikke funnet" 
          message="Kunne ikke finne annonsen du prøver å redigere." 
        />
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Gå tilbake
        </button>
      </div>
    );
  }

  return (
    <PostForm19
      mode="edit"
      post={post}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}