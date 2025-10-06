import { Metadata } from 'next';
import { NorwegianRegion, PostType, Subject } from '@prisma/client';
import PostsPageLayout from '@/components/posts/PostsPageLayout';
import { generateBreadcrumbs } from '@/lib/breadcrumbs';
import { fetchPostsForFilters } from '@/lib/actions/posts';

interface TeachersPageProps {
  searchParams: Promise<{
    subject?: string;
    location?: string;
    target?: string;
  }>;
}

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

export default async function TeachersPage({ searchParams }: TeachersPageProps) {
  const params = await searchParams;
  const subjectFilter = resolveEnumValue(params.subject, Subject);
  const locationFilter = resolveEnumValue(params.location, NorwegianRegion);
  const initialPosts = await fetchPostsForFilters({
    type: PostType.TEACHER,
    subject: subjectFilter,
    location: locationFilter,
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    includePaused: false,
  });
  const breadcrumbItems = generateBreadcrumbs('/posts/teachers', params);
  // JSON-LD structured data for teachers directory
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Finn lærer og læringsstøtte | TutorConnect Norge',
    description: 'Søk blant erfarne lærere for leksehjelp, språktrening og privat undervisning i hele Norge.',
    url: 'https://tutorconnect.no/posts/teachers',
    mainEntity: {
      '@type': 'ItemList',
      name: 'Qualified Teachers and Tutors in Norway',
      description: 'Directory of professional teachers offering private tutoring and educational support services',
      itemListElement: [
        {
          '@type': 'Service',
          name: 'Leksehjelp og læringsstøtte',
          serviceType: 'Educational Support',
          description: 'Profesjonell leksehjelp som avlaster foreldre og gir barn kvalifisert støtte',
          audience: {
            '@type': 'EducationalAudience',
            educationalRole: 'student'
          }
        },
        {
          '@type': 'Service',
          name: 'Engelsk konversasjon for voksne',
          serviceType: 'Language Training',
          description: 'Engelsk konversasjonstrening for voksne i alle nivåer',
          audience: {
            '@type': 'EducationalAudience',
            educationalRole: 'adult learner'
          }
        },
        {
          '@type': 'Service',
          name: 'Tennis privattimer',
          serviceType: 'Sports Instruction',
          description: 'Private tennis lessons for all skill levels and ages',
          audience: {
            '@type': 'EducationalAudience',
            educationalRole: 'adult learner'
          }
        },
        {
          '@type': 'Service',
          name: 'Skiinstruksjon',
          serviceType: 'Sports Instruction',
          description: 'Professional ski instruction for beginners and advanced skiers',
          audience: {
            '@type': 'EducationalAudience',
            educationalRole: 'adult learner'
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
          name: 'Teachers',
          item: 'https://tutorconnect.no/posts/teachers'
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
        type="TEACHER"
        title={
          <>
            Finn din{' '}
            <span className="text-green-600">lærer</span>
          </>
        }
        subtitle="Fra matematikk til musikk, barn til voksne - finn den perfekte matchen for dine behov."
        breadcrumbs={breadcrumbItems}
        initialPosts={initialPosts}
        filterOverrides={{
          subject: subjectFilter,
          location: locationFilter,
        }}
      />
    </>
  );
}

function resolveEnumValue<T extends string>(value: string | undefined, enumObject: Record<string, T>): T | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/-/g, '_').replace(/\s+/g, '_').toUpperCase();
  return (Object.values(enumObject) as string[]).find((item) => item.toUpperCase() === normalized) as T | undefined;
}
