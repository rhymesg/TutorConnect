import { Metadata } from 'next';
import { Suspense } from 'react';
import PostsPageClient from './PostsPageClient';
import { PostListLoading } from '@/components/posts/LoadingStates';

export const metadata: Metadata = {
  title: 'Finn lærer eller student | TutorConnect',
  description: 'Søk blant tusenvis av kvalifiserte lærere og studenter i Norge. Finn den perfekte matchen for dine undervisningsbehov.',
  keywords: 'privatundervisning, lærer, student, Norge, matematikk, norsk, engelsk, naturfag',
  openGraph: {
    title: 'Finn lærer eller student | TutorConnect',
    description: 'Søk blant tusenvis av kvalifiserte lærere og studenter i Norge.',
    type: 'website',
    locale: 'nb_NO',
  },
  alternates: {
    canonical: '/posts'
  }
};

// Server-side data fetching
async function fetchInitialPosts() {
  try {
    // In a real app, this would fetch from your API
    // For now, return empty data to let the client handle loading
    return null;
  } catch (error) {
    console.error('Error fetching initial posts:', error);
    return null;
  }
}

export default async function PostsPage({
  searchParams
}: {
  searchParams: { 
    [key: string]: string | string[] | undefined;
  };
}) {
  const initialPosts = await fetchInitialPosts();

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Page Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Finn din perfekte{' '}
              <span className="text-green-600">
                lærer
              </span>{' '}
              eller{' '}
              <span className="text-blue-600">
                student
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              Fra matematikk til musikk - finn den perfekte matchen for dine behov.
            </p>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <Suspense fallback={<PostListLoading />}>
        <PostsPageClient 
          initialPosts={initialPosts}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
}