import { Metadata } from 'next';
import PostsPageLayout from '@/components/posts/PostsPageLayout';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { generateBreadcrumbs } from '@/lib/breadcrumbs';

interface StudentsPageProps {
  searchParams: Promise<{
    subject?: string;
    location?: string;
    target?: string;
  }>;
}

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

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams;
  const breadcrumbItems = generateBreadcrumbs('/posts/students', params);
  // JSON-LD structured data for students/job opportunities
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Undervisningsjobb og deltidsarbeid | TutorConnect Norge',
    description: 'Finn studenter som trenger læringsstøtte. Fleksible undervisningsjobber for studenter, lærere og fageksperter.',
    url: 'https://tutorconnect.no/posts/students',
    mainEntity: {
      '@type': 'ItemList',
      name: 'Teaching Job Opportunities for Students',
      description: 'Part-time teaching and tutoring job opportunities for university students and qualified individuals',
      itemListElement: [
        {
          '@type': 'JobPosting',
          title: 'Fleksible undervisningsjobber',
          description: 'Deltidsjobber innen undervisning og læringsstøtte for studenter',
          employmentType: 'PART_TIME',
          industry: 'Education',
          jobBenefits: [
            'Fleksible timer',
            'Godt betalt',
            'Meningsfullt arbeid',
            'Egne timer'
          ],
          workHours: 'Flexible schedule',
          skills: 'Teaching, Communication, Subject expertise',
          hiringOrganization: {
            '@type': 'Organization',
            name: 'TutorConnect Norge'
          }
        },
        {
          '@type': 'JobPosting',
          title: 'Universitets student undervisning',
          description: 'Undervisningsjobber spesielt tilpasset universitetsstudenter',
          employmentType: 'PART_TIME',
          industry: 'Education',
          audience: {
            '@type': 'EducationalAudience',
            educationalRole: 'university student'
          },
          workHours: 'Efter skole, kveld, helg',
          hiringOrganization: {
            '@type': 'Organization', 
            name: 'TutorConnect Norge'
          }
        }
      ]
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'TutorConnect',
          item: 'https://tutorconnect.no'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Posts',
          item: 'https://tutorconnect.no/posts'
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Students',
          item: 'https://tutorconnect.no/posts/students'
        }
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostsPageLayout
        type="STUDENT"
        title={
          <>
            Finn din{' '}
            <span className="text-blue-600">student</span>
          </>
        }
        subtitle="Fra matematikk til musikk, barn til voksne - finn den perfekte matchen for dine behov."
        breadcrumbs={breadcrumbItems}
      />
    </>
  );
}