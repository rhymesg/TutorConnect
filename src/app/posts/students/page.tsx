import { Metadata } from 'next';
import PostsPageLayout from '@/components/posts/PostsPageLayout';

export const metadata: Metadata = {
  title: 'Undervisningsjobb og deltidsarbeid | TutorConnect Norge',
  description: 'Finn studenter som trenger læringsstøtte. Fleksible undervisningsjobber for studenter, lærere og fageksperter. Oslo, Bergen, Trondheim - tjene penger med å hjelpe andre.',
  keywords: [
    // Student job search terms
    'undervisning jobb', 'deltidsjobb student', 'student jobb', 'fleksibel jobb',
    'bijobb undervisning', 'ekstrajobb', 'tjene penger student', 'part time teaching',
    
    // Flexible work terms
    'fleksible timer', 'hjemmejobb undervisning', 'online undervisning jobb',
    'egne timer', 'etter skole jobb', 'kveldsjobb', 'helgjobb',
    
    // Teaching opportunities
    'lære bort', 'hjelpe studenter', 'læringsstøtte jobb', 'privat undervisning',
    'leksehjelp jobb', 'tutoringjobb', 'teaching job', 'tutoring work',
    
    // Subject teaching jobs
    'matematikk undervisning', 'engelsk undervisning', 'norsk undervisning',
    'programmering undervisning', 'naturfag undervisning', 'fysikk undervisning',
    
    // Adult teaching opportunities  
    'engelsk konversasjon jobb', 'norsk språk undervisning', 'tennis instruksjon',
    'ski undervisning', 'hobby undervisning jobb', 'private lesson instructor',
    
    // Academic level jobs
    'barneskole undervisning', 'ungdomsskole undervisning', 'videregående undervisning',
    'universitet undervisning', 'voksen undervisning', 'adult teaching',
    
    // Location-based jobs
    'undervisning jobb Oslo', 'deltidsjobb Bergen', 'student jobb Trondheim',
    'teaching job Stavanger', 'tutoring Bergen', 'instructor Oslo',
    
    // University students
    'universitets student jobb', 'høgskole student', 'college student job',
    'student deltid', 'studere og jobbe', 'flexible student work',
    
    // Skills monetization
    'bruke kunnskapen', 'tjene på kunnskap', 'monetize skills',
    'share knowledge', 'teach what you know', 'expertise sharing',
    
    // Experience building
    'undervisning erfaring', 'teaching experience', 'mentoring experience',
    'pedagogisk erfaring', 'communication skills', 'leadership skills',
    
    // Economic terms
    'god betaling', 'konkurransedyktig lønn', 'fair betaling', 'well paid',
    'gig economy', 'freelance teaching', 'independent contractor'
  ],
  openGraph: {
    title: 'Undervisningsjobb og deltidsarbeid | TutorConnect Norge',
    description: 'Finn studenter som trenger læringsstøtte. Fleksible undervisningsjobber med god betaling for studenter, lærere og fageksperter i hele Norge.',
    type: 'website',
    locale: 'nb_NO',
    siteName: 'TutorConnect',
    images: [
      {
        url: '/images/og-students.jpg',
        width: 1200,
        height: 630,
        alt: 'TutorConnect - Undervisningsjobber for studenter i Norge',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Undervisningsjobb og deltidsarbeid | TutorConnect Norge',
    description: 'Finn studenter som trenger læringsstøtte. Fleksible undervisningsjobber i hele Norge.',
    images: ['/images/twitter-students.jpg'],
  },
  alternates: {
    canonical: '/posts/students',
    languages: {
      'nb-NO': '/posts/students',
      'en': '/en/posts/students',
    },
  },
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