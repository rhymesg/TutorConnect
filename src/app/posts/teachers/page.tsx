import { Metadata } from 'next';
import PostsPageLayout from '@/components/posts/PostsPageLayout';

export const metadata: Metadata = {
  title: 'Finn lærer og læringsstøtte | TutorConnect Norge',
  description: 'Søk blant erfarne lærere for leksehjelp, språktrening og privat undervisning. Oslo, Bergen, Trondheim - alle fag fra matematikk til engelsk konversasjon. Profesjonell støtte som avlaster foreldre.',
  keywords: [
    // Core teacher search terms
    'finn lærer', 'lærer søk', 'privat lærer', 'læringsstøtte', 'profesjonell hjelp',
    'leksehjelp lærer', 'tilleggsundervisning', 'skolehjelp', 'sammen læring',
    
    // Parent relief keywords  
    'avlaste foreldre', 'profesjonell leksehjelp', 'ikke foreldre', 'lærer hjemme',
    'hjemmeundervisning', 'privat støtte', 'skolebarn hjelp',
    
    // Subject areas
    'matematikk lærer', 'norsk lærer', 'engelsk lærer', 'naturfag lærer',
    'programmering lærer', 'fysikk lærer', 'kjemi lærer', 'historie lærer',
    
    // Academic levels
    'barneskole lærer', 'ungdomsskole lærer', 'videregående lærer',
    'universitet lærer', 'voksen lærer', 'høgskole lærer',
    
    // Adult learning teachers
    'engelsk konversasjon lærer', 'norsk språk lærer', 'tennis lærer',
    'ski instruktør', 'private lesson teacher', 'voksen undervisning',
    'hobby lærer', 'adult learning teacher',
    
    // Cultural/multilingual
    'korean teacher norway', 'chinese math teacher', 'multilingual teacher',
    'asian teacher', 'flerspråklig lærer', 'innvandrer lærer',
    'forhåndslæring lærer', 'advanced learning teacher',
    
    // Location-based
    'lærer Oslo', 'lærer Bergen', 'lærer Trondheim', 'lærer Stavanger',
    'teacher Oslo', 'tutor Bergen', 'instructor Trondheim',
    
    // Integration support
    'norskprøve lærer', 'bergenstest lærer', 'språktest lærer',
    'innvandrer støtte', 'integration teacher', 'norwegian language teacher',
    
    // Quality indicators
    'erfaren lærer', 'kvalifisert lærer', 'kompetent lærer', 'dyktig lærer',
    'experienced teacher', 'qualified tutor', 'professional instructor'
  ],
  openGraph: {
    title: 'Finn lærer og læringsstøtte | TutorConnect Norge',
    description: 'Søk blant erfarne lærere for alle fag og aldersgrupper. Fra leksehjelp til engelsk konversasjon - finn profesjonell læringsstøtte i hele Norge.',
    type: 'website',
    locale: 'nb_NO',
    siteName: 'TutorConnect',
    images: [
      {
        url: '/images/og-teachers.jpg',
        width: 1200,
        height: 630,
        alt: 'TutorConnect - Finn kvalifiserte lærere i Norge',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Finn lærer og læringsstøtte | TutorConnect Norge',
    description: 'Søk blant erfarne lærere for alle fag og aldersgrupper i Norge.',
    images: ['/images/twitter-teachers.jpg'],
  },
  alternates: {
    canonical: '/posts/teachers',
    languages: {
      'nb-NO': '/posts/teachers',
      'en': '/en/posts/teachers',
    },
  },
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