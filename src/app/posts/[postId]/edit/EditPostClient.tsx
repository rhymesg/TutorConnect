'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PostForm } from '@/components/posts';
import { LoadingSpinner, ErrorMessage } from '@/components/ui';
import { PostWithDetails } from '@/types/database';
import { useApiCall } from '@/hooks/useApiCall';

interface EditPostClientProps {
  postId: string;
  initialPost: PostWithDetails | null;
}

export default function EditPostClient({ postId, initialPost }: EditPostClientProps) {
  const [post, setPost] = useState<PostWithDetails | null>(initialPost);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { apiCall, isLoading } = useApiCall();

  // Fetch post if not provided
  useEffect(() => {
    if (!post && !isLoading) {
      fetchPost();
    }
  }, [postId, post, isLoading]);

  const fetchPost = async () => {
    try {
      setError(null);
      const response = await apiCall<PostWithDetails>({
        method: 'GET',
        endpoint: `/api/posts/${postId}`,
      });

      if (response.success && response.data) {
        setPost(response.data);
      } else {
        throw new Error(response.error || 'Post not found');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError(error instanceof Error ? error.message : 'Failed to load post');
    }
  };

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
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorMessage 
          title="Feil ved lasting av annonse"
          message={error}
          action={{
            label: 'Prøv igjen',
            onClick: fetchPost
          }}
        />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-neutral-900 mb-4">
          Annonse ikke funnet
        </h1>
        <p className="text-neutral-600 mb-6">
          Annonsen du prøver å redigere eksisterer ikke eller du har ikke tilgang til den.
        </p>
        <button
          onClick={() => router.push('/posts')}
          className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          Gå til annonser
        </button>
      </div>
    );
  }

  return (
    <PostForm
      mode="edit"
      post={post}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}