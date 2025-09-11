import { Metadata } from 'next';
import { Suspense } from 'react';
import EditPostClient from './EditPostClient';
import { LoadingSpinner } from '@/components/ui';
import AuthGuard from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Rediger annonse | TutorConnect',
  description: 'Rediger din annonse på TutorConnect.',
  openGraph: {
    title: 'Rediger annonse | TutorConnect',
    description: 'Rediger din annonse.',
    type: 'website',
    locale: 'nb_NO',
  },
};

export default async function EditPostPage({
  params
}: {
  params: Promise<{ postId: string }>
}) {
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