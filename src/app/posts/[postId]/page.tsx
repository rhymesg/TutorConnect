import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostDetailClient from './PostDetailClient';
import { getPostById } from '@/lib/actions/posts';

interface PostPageProps {
  params: Promise<{
    postId: string;
  }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPostById(postId);
  
  if (!post) {
    return {
      title: 'Annonse ikke funnet | TutorConnect',
      description: 'Denne annonsen eksisterer ikke eller har blitt fjernet.',
    };
  }

  // Generate SEO-friendly description
  const subjectInfo = post.subject ? ` - ${post.subject}` : '';
  const locationInfo = post.location ? ` i ${post.location}` : ' i Norge';
  const typeInfo = post.type === 'TEACHER' ? 'lærer' : 'student som trenger hjelp';
  
  const seoDescription = `${post.description.substring(0, 100)}... Finn ${typeInfo}${subjectInfo}${locationInfo}. Profesjonell læringsstøtte på TutorConnect.`;
  
  // Generate keywords based on post content
  const keywords = [
    // Basic keywords
    post.subject || 'undervisning',
    post.location || 'Norge',
    post.type === 'TEACHER' ? 'lærer' : 'student',
    
    // Subject-specific
    ...(post.subject ? [
      `${post.subject} lærer`,
      `${post.subject} undervisning`,
      `${post.subject} hjelp`,
      `privat ${post.subject}`
    ] : []),
    
    // Location-specific
    ...(post.location ? [
      `lærer ${post.location}`,
      `undervisning ${post.location}`,
      `${post.location} privattimer`
    ] : []),
    
    // Type-specific keywords
    post.type === 'TEACHER' ? [
      'finn lærer', 'læringsstøtte', 'privat undervisning', 'leksehjelp',
      'profesjonell hjelp', 'avlaste foreldre', 'skolehjelp'
    ] : [
      'undervisning jobb', 'deltidsjobb', 'student jobb', 'fleksibel jobb',
      'bijobb', 'tjene penger', 'part time teaching'
    ],
    
    // Cultural keywords based on content
    'læringsstøtte', 'sammen læring', 'vennlig hjelp', 'profesjonell støtte'
  ].flat().filter(Boolean);

  const title = `${post.title} | TutorConnect Norge`;

  return {
    title,
    description: seoDescription,
    keywords: keywords.join(', '),
    openGraph: {
      title,
      description: seoDescription,
      type: 'article',
      locale: 'nb_NO',
      siteName: 'TutorConnect',
      images: [
        {
          url: '/images/og-post-default.jpg',
          width: 1200,
          height: 630,
          alt: `${post.title} - TutorConnect`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: seoDescription,
      images: ['/images/twitter-post-default.jpg'],
    },
    alternates: {
      canonical: `/posts/${postId}`,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { postId } = await params;
  const post = await getPostById(postId);

  if (!post) {
    notFound();
  }

  return <PostDetailClient post={post} />;
}