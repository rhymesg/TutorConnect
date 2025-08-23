import { Metadata } from 'next';
import PostsPageLayout from '@/components/posts/PostsPageLayout';

export const metadata: Metadata = {
  title: 'Finn lærer | TutorConnect',
  description: 'Søk blant tusenvis av lærere i Norge. Finn den perfekte matchen for dine undervisningsbehov.',
  keywords: 'privatundervisning, lærer, Norge, matematikk, norsk, engelsk, naturfag',
  openGraph: {
    title: 'Finn lærer | TutorConnect',
    description: 'Søk blant tusenvis av lærere i Norge.',
    type: 'website',
    locale: 'nb_NO',
  },
  alternates: {
    canonical: '/posts/teachers'
  }
};

export default async function TeachersPage() {
  return (
    <PostsPageLayout
      type="TEACHER"
      title={
        <>
          Finn din{' '}
          <span className="text-green-600">lærer</span>
        </>
      }
      subtitle="Fra matematikk til musikk, barn til voksne - finn den perfekte matchen for dine behov."
    />
  );
}