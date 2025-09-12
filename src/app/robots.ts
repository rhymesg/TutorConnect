import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://tutorconnect.no';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/posts/',
          '/posts/teachers',
          '/posts/students',
          '/auth/login',
          '/auth/register',
          '/public/',
          '/images/',
          '/icons/',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/profile/',
          '/chat/',
          '/dashboard/',
          '/settings/',
          '/_next/',
          '/private/',
          '/*.json',
          '/*.xml$',
          '/search?*',
          '/temp/',
          '/test/',
        ],
        crawlDelay: 1, // Be respectful to the server
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/posts/',
          '/posts/teachers',
          '/posts/students',
          '/auth/login',
          '/auth/register',
          '/public/',
          '/images/',
          '/icons/',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/profile/',
          '/chat/',
          '/dashboard/',
          '/settings/',
          '/_next/',
          '/private/',
        ],
        crawlDelay: 0.5, // Faster crawl for Google
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/posts/',
          '/posts/teachers', 
          '/posts/students',
          '/auth/login',
          '/auth/register',
          '/public/',
          '/images/',
          '/icons/',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/profile/',
          '/chat/',
          '/dashboard/',
          '/settings/',
          '/_next/',
          '/private/',
        ],
        crawlDelay: 1,
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}