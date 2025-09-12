import { getSubjectLabelEN } from '@/constants/subjects';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

/**
 * Server-side utility function to generate breadcrumbs based on pathname and search params
 * NOTE: Breadcrumbs are kept in English for international user accessibility and familiarity
 */
export function generateBreadcrumbs(
  pathname: string,
  searchParams?: { [key: string]: string | string[] | undefined }
): BreadcrumbItem[] {
  try {
    const items: BreadcrumbItem[] = [];
    
    // Safety check for pathname
    if (!pathname || typeof pathname !== 'string') {
      return [];
    }
    
    // Split pathname into segments
    const segments = pathname.split('/').filter(Boolean);
  
  // Handle different page types
  if (segments.length === 0) {
    // Home page - no breadcrumbs needed
    return [];
  }
  
  if (segments[0] === 'posts') {
    items.push({ label: 'Posts', href: '/posts' });
    
    if (segments.length === 1) {
      // /posts page
      items[0].current = true;
    } else if (segments[1] === 'teachers') {
      items.push({ label: 'Find Teachers', href: '/posts/teachers' });
      
      // Add subject/location breadcrumbs if present in searchParams
      if (searchParams?.subject) {
        const subject = Array.isArray(searchParams.subject) 
          ? searchParams.subject[0] 
          : searchParams.subject;
        
        const subjectLabel = getSubjectLabelEN(subject);
        if (subjectLabel) {
          items.push({ 
            label: subjectLabel, 
            href: `/posts/teachers?subject=${subject}` 
          });
        }
      }
      
      if (searchParams?.location) {
        const location = Array.isArray(searchParams.location) 
          ? searchParams.location[0] 
          : searchParams.location;
        
        if (location && typeof location === 'string') {
          items.push({ 
            label: location, 
            href: searchParams?.subject 
              ? `/posts/teachers?subject=${searchParams.subject}&location=${location}`
              : `/posts/teachers?location=${location}`
          });
        }
      }
      
      // Mark last item as current if no individual post
      if (segments.length === 2) {
        items[items.length - 1].current = true;
      }
    } else if (segments[1] === 'students') {
      items.push({ label: 'Find Students', href: '/posts/students' });
      
      // Add subject/location breadcrumbs if present
      if (searchParams?.subject) {
        const subject = Array.isArray(searchParams.subject) 
          ? searchParams.subject[0] 
          : searchParams.subject;
        
        const subjectLabel = getSubjectLabelEN(subject);
        if (subjectLabel) {
          items.push({ 
            label: subjectLabel, 
            href: `/posts/students?subject=${subject}` 
          });
        }
      }
      
      if (searchParams?.location) {
        const location = Array.isArray(searchParams.location) 
          ? searchParams.location[0] 
          : searchParams.location;
        
        if (location && typeof location === 'string') {
          items.push({ 
            label: location, 
            href: searchParams?.subject 
              ? `/posts/students?subject=${searchParams.subject}&location=${location}`
              : `/posts/students?location=${location}`
          });
        }
      }
      
      if (segments.length === 2) {
        items[items.length - 1].current = true;
      }
    } else if (segments.length === 3) {
      // Individual post page: /posts/[postId]
      const postId = segments[1];
      items.push({ label: 'Post Details', current: true });
    }
  } else if (segments[0] === 'profile') {
    items.push({ label: 'Profile', href: '/profile' });
    
    if (segments.length > 1) {
      if (segments[1] === 'edit') {
        items.push({ label: 'Edit Profile', current: true });
      } else if (segments[1] === 'posts') {
        items.push({ label: 'My Posts', current: true });
      }
    } else {
      items[0].current = true;
    }
  } else if (segments[0] === 'chat') {
    items.push({ label: 'Chat', href: '/chat' });
    
    if (segments.length > 1) {
      items.push({ label: 'Conversation', current: true });
    } else {
      items[0].current = true;
    }
  } else if (segments[0] === 'auth') {
    if (segments[1] === 'login') {
      items.push({ label: 'Login', current: true });
    } else if (segments[1] === 'register') {
      items.push({ label: 'Register', current: true });
    }
  }
  
  // Filter out any invalid items before returning
  return items.filter(item => item && item.label && typeof item.label === 'string');
  } catch (error) {
    console.warn('Error generating breadcrumbs:', error);
    return [];
  }
}


export type { BreadcrumbItem };