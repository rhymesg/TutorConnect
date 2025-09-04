'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PostForm19 from '@/components/posts/PostForm19';
import { PostWithDetails } from '@/types/database';
import { LoadingSpinner, ErrorMessage } from '@/components/ui';

interface EditPostClientProps {
  postId: string;
}

export default function EditPostClient({ postId }: EditPostClientProps) {
  const router = useRouter();
  const [post, setPost] = useState<PostWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Annonsen ble ikke funnet');
          } else if (response.status === 403) {
            setError('Du har ikke tilgang til å redigere denne annonsen');
          } else {
            throw new Error('Kunne ikke hente annonsen');
          }
          return;
        }
        const data = await response.json();
        setPost(data);
      } catch (error) {
        console.error('Failed to fetch post:', error);
        setError('Noe gikk galt. Vennligst prøv igjen senere.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

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