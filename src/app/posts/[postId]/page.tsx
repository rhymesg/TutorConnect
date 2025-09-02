import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostDetailClient from './PostDetailClient';
import { getPostById } from '@/lib/actions/posts';

interface PostPageProps {
  params: {
    postId: string;
  };
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPostById(postId);
  
  if (!post) {
    return {
      title: 'Annonse ikke funnet',
    };
  }

  return {
    title: post.title,
    description: post.description.substring(0, 160),
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { postId } = await params;
  const post = await getPostById(postId);

  if (!post) {
    notFound();
  }

  return <PostDetailClient post={post} />;
}