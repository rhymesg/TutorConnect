import { MetadataRoute } from 'next';
import { getPosts } from '@/lib/actions/posts';

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

  // Dynamic post pages
  try {
    const postsResult = await getPosts({
      page: 1,
      limit: 1000, // Get a large number of posts for sitemap
      sortBy: 'createdAt',
      sortOrder: 'desc',
      includePaused: false
    });

    const postPages = postsResult.data.map(post => ({
      url: `${baseUrl}/posts/${post.id}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [
      ...staticPages,
      ...subjectPages,
      ...locationPages,
      ...targetPages,
      ...popularCombinations,
      ...postPages,
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return static pages if dynamic content fails
    return [
      ...staticPages,
      ...subjectPages,
      ...locationPages,
      ...targetPages,
      ...popularCombinations,
    ];
  }
}