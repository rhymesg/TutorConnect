import { Metadata } from 'next';
import PostsPageLayout from '@/components/posts/PostsPageLayout';

export const metadata: Metadata = {
  title: 'Finn student | TutorConnect',
  description: 'Finn studenter. Tilby dine undervisningstjenester til dem som trenger det.',
  keywords: 'privatundervisning, student, undervisning, Norge, lærer, hjelp',
  openGraph: {
    title: 'Finn student | TutorConnect',
    description: 'Finn studenter med undervisning.',
    type: 'website',
    locale: 'nb_NO',
  },
  alternates: {
    canonical: '/posts/students'
  }
};

export default async function StudentsPage() {
  return (
    <PostsPageLayout
      type="STUDENT"
      title={
        <>
          Finn din{' '}
          <span className="text-blue-600">student</span>
        </>
      }
      subtitle="Fra matematikk til musikk, barn til voksne - finn den perfekte matchen for dine behov."
    />
  );
}