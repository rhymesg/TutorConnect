import { Metadata } from 'next';
import { Suspense } from 'react';
import PostsPageClient from './PostsPageClient';
import { PostListLoading } from '@/components/posts/LoadingStates';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { generateBreadcrumbs } from '@/lib/breadcrumbs';
import PostsSelectionCards from '@/components/posts/PostsSelectionCards';

interface PostsPageProps {
  searchParams: Promise<{
    subject?: string;
    location?: string;
    target?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PostsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const subject = params.subject;
  const location = params.location;
  const target = params.target;

  // Generate dynamic title based on parameters
  let title = 'Læringsstøtte og undervisning | TutorConnect Norge';
  let description = 'Finn kvalifiserte lærere og studenter for leksehjelp, språktrening og privat undervisning i Norge. Oslo, Bergen, Trondheim, Stavanger - alle fag og aldersgrupper.';
  
  if (subject && location) {
    title = `${subject} lærer ${location} - Profesjonell undervisning | TutorConnect Norge`;
    description = `Finn kvalifiserte ${subject} lærere i ${location}. Profesjonell læringsstøtte og privat undervisning. Kontakt lokale eksperter i ${subject} på TutorConnect.`;
  } else if (subject) {
    title = `${subject} lærer og undervisning - Finn eksperter | TutorConnect Norge`;
    description = `Søk blant erfarne ${subject} lærere i hele Norge. Kvalifisert læringsstøtte og privat undervisning i ${subject} for alle nivåer.`;
  } else if (location) {
    title = `Læringsstøtte ${location} - Finn lokale lærere | TutorConnect Norge`;
    description = `Finn kvalifiserte lærere og læringsstøtte i ${location}. Lokale eksperter innen alle fag og aldersgrupper. Profesjonell undervisning i ${location}.`;
  }

  // Add target-specific adjustments
  if (target === 'asian_families') {
    description += ' Flerspråklig støtte og kulturelt tilpasset læringshjelp.';
  } else if (target === 'adult_learning') {
    description += ' Spesialisert på voksenopplæring og hobbyundervisning.';
  } else if (target === 'part_time') {
    description += ' Fleksible deltidsjobber for studenter og fageksperter.';
  }

  return {
    title,
    description,
    keywords: [
      // Keep existing keywords
      'læringsstøtte', 'privatundervisning', 'leksehjelp', 'tilleggsundervisning',
      'skolehjelp', 'sammen læring', 'vennlig hjelp', 'profesjonell støtte',
      'matematikk', 'norsk', 'engelsk', 'naturfag', 'samfunnsfag', 'fysikk', 'kjemi', 
      'historie', 'geografi', 'programmering', 'IT', 'økonomi',
      'engelsk konversasjon', 'norsk språktrening', 'tennis privattimer', 'ski instruksjon',
      'private lesson', 'voksen opplæring', 'adult learning', 'hobby undervisning',
      'avlaste foreldre', 'ikke foreldre', 'forhåndslæring', 'advanced learning',
      'korean tutor', 'chinese math', 'asian families', 'flerspråklig støtte',
      'deltidsjobb', 'student jobb', 'fleksibel jobb', 'bijobb', 'undervisning jobb',
      'tjene penger student', 'part time teaching',
      'barneskole', 'ungdomsskole', 'videregående', 'universitet', 'høgskole',
      'skolebarn', 'elementary', 'middle school', 'high school', 'university',
      'Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Kristiansand', 'Norge', 'Norway',
      'innvandrere', 'integrering', 'språktest', 'norskprøve', 'bergenstest',
      'gig economy', 'studiestøtte', 'ekstrajobb', 'education', 'utdanning',
      // Add parameter-specific keywords
      ...(subject ? [`${subject} lærer`, `${subject} undervisning`, `${subject} hjelp`] : []),
      ...(location ? [`lærer ${location}`, `undervisning ${location}`, `${location} privattimer`] : [])
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'nb_NO',
      siteName: 'TutorConnect',
      images: [
        {
          url: '/images/og-posts.jpg',
          width: 1200,
          height: 630,
          alt: 'TutorConnect - Læringsstøtte for alle i Norge',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/twitter-posts.jpg'],
    },
    alternates: {
      canonical: `/posts${subject || location ? `?${subject ? `subject=${subject}` : ''}${subject && location ? '&' : ''}${location ? `location=${location}` : ''}` : ''}`,
      languages: {
        'nb-NO': `/posts${subject || location ? `?${subject ? `subject=${subject}` : ''}${subject && location ? '&' : ''}${location ? `location=${location}` : ''}` : ''}`,
        'en': `/en/posts${subject || location ? `?${subject ? `subject=${subject}` : ''}${subject && location ? '&' : ''}${location ? `location=${location}` : ''}` : ''}`,
      },
    },
  };
}


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

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const subject = params.subject;
  const location = params.location;
  const target = params.target;

  // Generate breadcrumbs
  const breadcrumbItems = generateBreadcrumbs('/posts', params);

  // Generate dynamic JSON-LD structured data based on URL parameters  
  let jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'TutorConnect Norge',
    url: 'https://tutorconnect.no',
    logo: 'https://tutorconnect.no/images/logo.png',
    description: subject && location 
      ? `${subject} læringsstøtte i ${location}. Kvalifiserte lærere og profesjonell undervisning.`
      : subject
        ? `Profesjonell ${subject} læringsstøtte og undervisning i hele Norge.`
        : location
          ? `Læringsstøtte og privat undervisning i ${location} for alle fag og aldersgrupper.`
          : 'Norges ledende plattform for læringsstøtte og privat undervisning. Kobler lærere og studenter for alle fag og aldersgrupper.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'NO',
      addressRegion: location || 'Norge'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'contact@tutorconnect.no',
      availableLanguage: ['Norwegian', 'English', 'Korean', 'Chinese']
    },
    areaServed: location 
      ? [{ '@type': 'Place', name: location }]
      : [
          { '@type': 'Place', name: 'Oslo' },
          { '@type': 'Place', name: 'Bergen' },
          { '@type': 'Place', name: 'Trondheim' },
          { '@type': 'Place', name: 'Stavanger' },
          { '@type': 'Place', name: 'Kristiansand' },
          { '@type': 'Place', name: 'Norge' }
        ],
    serviceType: [
      'Læringsstøtte',
      'Privat undervisning', 
      'Leksehjelp',
      'Språktrening',
      'Voksen opplæring',
      'Hobbyundervisning',
      ...(subject ? [`${subject} undervisning`] : [])
    ],
    knowsAbout: [
      ...(subject ? [subject] : [
        'Matematikk',
        'Norsk språk',
        'Engelsk',
        'Naturfag', 
        'Programmering'
      ]),
      'Tennisundervisning',
      'Skiinstruksjon',
      'Korean språk' // Adding Korean support in structured data
    ],
    audience: target === 'asian_families' 
      ? [
          { '@type': 'Audience', audienceType: 'Asiatiske familier' },
          { '@type': 'Audience', audienceType: 'Flerspråklige studenter' },
          { '@type': 'Audience', audienceType: 'Innvandrerfamilier' }
        ]
      : target === 'adult_learning'
        ? [
            { '@type': 'Audience', audienceType: 'Voksne lærende' },
            { '@type': 'Audience', audienceType: 'Hobbyentusiaster' },
            { '@type': 'Audience', audienceType: 'Profesjonell utvikling' }
          ]
        : target === 'part_time'
          ? [
              { '@type': 'Audience', audienceType: 'Universitets studenter' },
              { '@type': 'Audience', audienceType: 'Deltidsarbeidere' },
              { '@type': 'Audience', audienceType: 'Fageksperter' }
            ]
          : [
              { '@type': 'Audience', audienceType: 'Studenter' },
              { '@type': 'Audience', audienceType: 'Foreldre' },
              { '@type': 'Audience', audienceType: 'Voksne lærende' },
              { '@type': 'Audience', audienceType: 'Innvandrere' },
              { '@type': 'Audience', audienceType: 'Universitets studenter' }
            ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-neutral-50">
        {/* Breadcrumbs */}
        {breadcrumbItems.length > 0 && (
          <div className="bg-white border-b border-neutral-100">
            <div className="container mx-auto px-4 py-3">
              <Breadcrumbs items={breadcrumbItems} />
            </div>
          </div>
        )}
        
        {/* Page Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              {subject && location 
                ? `${subject} lærer i ${location}`
                : subject 
                  ? `${subject} læringsstøtte og undervisning`
                  : location
                    ? `Læringsstøtte i ${location}`
                    : 'Velg hva du leter etter'
              }
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              {subject && location
                ? `Finn kvalifiserte ${subject} lærere i ${location} området. Profesjonell læringsstøtte og privat undervisning.`
                : subject
                  ? `Søk blant erfarne ${subject} lærere i hele Norge. Kvalifisert undervisning for alle nivåer.`
                  : location
                    ? `Finn lokale lærere og studenter i ${location}. Alle fag og aldersgrupper representert.`
                    : 'Finn lærere eller studenter innenfor ditt fagområde.'
              }
            </p>
            {target === 'asian_families' && (
              <p className="mx-auto mt-2 max-w-2xl text-sm text-green-700 bg-green-50 rounded-lg p-3">
                🌏 Flerspråklig støtte tilgjengelig | Kulturelt tilpasset læringshjelp
              </p>
            )}
            {target === 'adult_learning' && (
              <p className="mx-auto mt-2 max-w-2xl text-sm text-blue-700 bg-blue-50 rounded-lg p-3">
                👩‍🎓 Spesialisert på voksenopplæring | Hobbyundervisning og profesjonell utvikling
              </p>
            )}
            {target === 'part_time' && (
              <p className="mx-auto mt-2 max-w-2xl text-sm text-purple-700 bg-purple-50 rounded-lg p-3">
                💼 Fleksible deltidsjobber | Perfekt for studenter og fageksperter
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Selection Cards */}
      <PostsSelectionCards />
    </div>
    </>
  );
}