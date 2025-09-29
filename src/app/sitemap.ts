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

  // Blog pages (Norwegian and English versions)
  const blogPages = [
    // Norwegian blog post
    {
      url: `${baseUrl}/blog/de-beste-nettstedene-for-privatundervisning-i-norge-2025`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    // English blog post
    {
      url: `${baseUrl}/blog/en/best-private-tutoring-websites-norway-2025`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }
  ];

  // Return comprehensive sitemap including all sections
  return [
    ...staticPages,
    ...blogPages,
  ];
}