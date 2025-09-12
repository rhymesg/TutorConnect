import { Metadata } from 'next';
import { Suspense } from 'react';
import EditPostClient from './EditPostClient';
import { LoadingSpinner } from '@/components/ui';
import AuthGuard from '@/components/auth/AuthGuard';
import { getPostById } from '@/lib/actions/posts';

interface EditPostPageProps {
  params: Promise<{
    postId: string;
  }>;
}

export async function generateMetadata({ params }: EditPostPageProps): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPostById(postId);
  
  if (!post) {
    return {
      title: 'Annonse ikke funnet | TutorConnect',
      description: 'Denne annonsen eksisterer ikke eller har blitt fjernet.',
    };
  }

  const title = `Rediger: ${post.title} | TutorConnect`;
  const description = `Rediger din ${post.type === 'TEACHER' ? 'lærer' : 'student'} annonse for ${post.subject || 'undervisning'}${post.location ? ` i ${post.location}` : ''}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'nb_NO',
      siteName: 'TutorConnect',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    robots: {
      index: false, // Don't index edit pages
      follow: false,
    },
  };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { postId } = await params;
  return (
    <AuthGuard>
      <div className="min-h-screen bg-neutral-50">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <div className="container mx-auto px-4 py-8">
            <EditPostClient postId={postId} />
          </div>
        </Suspense>
      </div>
    </AuthGuard>
  );
}