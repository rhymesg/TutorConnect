import { Metadata } from 'next';
import { Suspense } from 'react';
import MyPostsPageClient from './MyPostsPageClient';
import { PostListLoading } from '@/components/posts/LoadingStates';

export const metadata: Metadata = {
  title: 'Mine annonser | TutorConnect',
  description: 'Administrer og rediger dine aktive annonser på TutorConnect.',
  keywords: 'mine annonser, administrer annonser, rediger annonser, TutorConnect',
  openGraph: {
    title: 'Mine annonser | TutorConnect',
    description: 'Administrer og rediger dine aktive annonser.',
    type: 'website',
    locale: 'nb_NO',
  },
  alternates: {
    canonical: '/profile/posts'
  }
};

export default async function MyPostsPage() {
  return (
    <div className="bg-neutral-50">
      {/* Page Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Mine annonser
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-neutral-600">
              Administrer og rediger dine aktive annonser. Klikk på en annonse for å se detaljer eller redigere.
            </p>
          </div>
        </div>
      </div>

      {/* Posts Content */}
      <Suspense fallback={<PostListLoading />}>
        <MyPostsPageClient />
      </Suspense>
    </div>
  );
}