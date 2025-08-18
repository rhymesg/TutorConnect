'use client';

import { useRouter } from 'next/navigation';
import { PostForm } from '@/components/posts';
import { PostWithDetails } from '@/types/database';

export default function NewPostClient() {
  const router = useRouter();

  const handleSuccess = (post: PostWithDetails) => {
    // Redirect to the new post or posts list
    router.push(`/posts/${post.id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <PostForm
      mode="create"
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}