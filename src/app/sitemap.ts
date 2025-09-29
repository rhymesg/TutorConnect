import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://tutorconnect.no';
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/posts/teachers`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/posts/students`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/chat`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/settings`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/om-oss`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }
  ];

  // Subject-based landing pages (based on SEO strategy)
  const subjects = [
    'matematikk', 'engelsk', 'norsk', 'naturfag', 'programmering', 
    'tennis', 'ski', 'musik', 'kunst'
  ];
  
  const subjectPages = subjects.map(subject => ({
    url: `${baseUrl}/posts?subject=${subject}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Location-based landing pages (based on SEO strategy)
  const locations = [
    'Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Kristiansand', 
    'Drammen', 'Fredrikstad', 'Sandnes', 'Tromsø'
  ];
  
  const locationPages = locations.map(location => ({
    url: `${baseUrl}/posts?location=${location}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Target group landing pages (based on SEO strategy)
  const targetPages = [
    {
      url: `${baseUrl}/posts?target=asian_families`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/posts?target=adult_learning`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/posts?target=part_time`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }
  ];

  // Popular subject+location combinations (based on SEO strategy examples)
  const popularCombinations = [
    'matematikk-Oslo', 'engelsk-Bergen', 'norsk-Trondheim', 'programmering-Oslo',
    'tennis-Oslo', 'ski-Trondheim', 'engelsk-konversasjon-Stavanger'
  ].map(combo => {
    const [subject, location] = combo.split('-');
    return {
      url: `${baseUrl}/posts?subject=${subject}&location=${location}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    };
  });

  // Blog pages (Norwegian and English versions)
  const blogPages = [
    // Norwegian blog posts
    {
      url: `${baseUrl}/blog/hvordan-finne-riktig-tutor-i-norge`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/tips-for-effektiv-undervisning`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/online-vs-fysisk-undervisning-fordeler-ulemper`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/sikkerhet-ved-privat-undervisning`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/priser-privat-undervisning-norge-2024`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    // English blog posts
    {
      url: `${baseUrl}/blog/en/how-to-find-right-tutor-norway`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog/en/effective-tutoring-tips`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog/en/online-vs-physical-tutoring-pros-cons`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog/en/private-tutoring-safety-tips`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog/en/tutoring-prices-norway-2024`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }
  ];

  // Return comprehensive sitemap including all sections
  return [
    ...staticPages,
    ...subjectPages,
    ...locationPages,
    ...targetPages,
    ...popularCombinations,
    ...blogPages,
  ];
}