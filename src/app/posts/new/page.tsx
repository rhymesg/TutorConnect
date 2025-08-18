import { Metadata } from 'next';
import { Suspense } from 'react';
import NewPostClient from './NewPostClient';
import { LoadingSpinner } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Opprett ny annonse | TutorConnect',
  description: 'Lag en annonse for å tilby undervisning eller finne en lærer på TutorConnect.',
  openGraph: {
    title: 'Opprett ny annonse | TutorConnect',
    description: 'Lag en annonse for å tilby undervisning eller finne en lærer.',
    type: 'website',
    locale: 'nb_NO',
  },
  alternates: {
    canonical: '/posts/new'
  }
};

export default function NewPostPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="large" />
        </div>
      }>
        <div className="container mx-auto px-4 py-8">
          <NewPostClient />
        </div>
      </Suspense>
    </div>
  );
}