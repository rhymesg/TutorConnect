'use client';

import { useRouter } from 'next/navigation';
import PostForm19 from '@/components/posts/PostForm19';
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
    <PostForm19
      mode="create"
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}