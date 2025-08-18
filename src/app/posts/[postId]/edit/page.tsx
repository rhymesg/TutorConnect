import { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import EditPostClient from './EditPostClient';
import { LoadingSpinner } from '@/components/ui';

interface EditPostPageProps {
  params: {
    postId: string;
  };
}

export async function generateMetadata({ params }: EditPostPageProps): Promise<Metadata> {
  // In a real app, you would fetch the post data to get the title
  return {
    title: 'Rediger annonse | TutorConnect',
    description: 'Rediger din annonse på TutorConnect.',
    openGraph: {
      title: 'Rediger annonse | TutorConnect',
      description: 'Rediger din annonse på TutorConnect.',
      type: 'website',
      locale: 'nb_NO',
    },
    alternates: {
      canonical: `/posts/${params.postId}/edit`
    }
  };
}

async function fetchPost(postId: string) {
  try {
    // In a real app, this would fetch from your API
    // For now, return null to let the client handle loading
    return null;
  } catch (error) {
    console.error('Error fetching post for edit:', error);
    return null;
  }
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const post = await fetchPost(params.postId);

  // In a real app, you would check if the post exists and if the user owns it
  // For now, we'll let the client handle this

  return (
    <div className="min-h-screen bg-neutral-50">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="large" />
        </div>
      }>
        <div className="container mx-auto px-4 py-8">
          <EditPostClient postId={params.postId} initialPost={post} />
        </div>
      </Suspense>
    </div>
  );
}