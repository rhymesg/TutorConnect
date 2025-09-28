import { Metadata } from 'next';
import { Suspense } from 'react';
import MyPostsPageClient from './MyPostsPageClient';
import { PostListLoading } from '@/components/posts/LoadingStates';
import AuthGuard from '@/components/auth/AuthGuard';
import AdsterraBanner from '@/components/ads/AdsterraBanner';

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
    <AuthGuard>
      <div className="bg-neutral-50">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col xl:flex-row gap-8 xl:items-start">
            <div className="flex-1 min-w-0 space-y-8">
              <div className="bg-white border-b border-neutral-200 px-4 py-12 sm:py-16 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                  Mine annonser
                </h1>
                <p className="mx-auto mt-4 max-w-3xl text-lg text-neutral-600">
                  Administrer og rediger dine aktive annonser. Klikk på en annonse for å se detaljer eller redigere.
                </p>
              </div>

              <Suspense fallback={<PostListLoading />}>
                <MyPostsPageClient />
              </Suspense>
            </div>

            <div className="w-full xl:w-auto flex justify-center xl:justify-start">
              <AdsterraBanner
                placementKey="a5659616e7810115e1f11798ce145254"
                width={160}
                height={600}
                className="w-full max-w-[160px] xl:w-[160px]"
              />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
