'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithDetails } from '@/types/database';
import { PostListLoading } from '@/components/posts/LoadingStates';
import { getSubjectLabel } from '@/constants/subjects';
import { 
  DocumentTextIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  PlusIcon
  // EyeIcon - TODO: Re-add when view count tracking is implemented
} from '@heroicons/react/24/outline';

export default function MyPostsPageClient() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyPosts = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/posts?userId=${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        
        const data = await response.json();
        // API uses paginated response format, so posts are in data.data
        setPosts(data.data || []);
      } catch (error) {
        console.error('Error fetching my posts:', error);
        setError('포스트를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyPosts();
  }, [user?.id]);

  if (loading) {
    return <PostListLoading />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-neutral-600">로그인이 필요합니다.</p>
          <Link 
            href="/auth/login" 
            className="mt-4 inline-block px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            로그인
          </Link>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-neutral-400" />
          <h3 className="mt-2 text-sm font-medium text-neutral-900">
            아직 작성한 annonse가 없습니다
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            첫 번째 annonse를 작성해서 시작해보세요.
          </p>
          <div className="mt-6">
            <Link
              href="/posts/new"
              className="inline-flex items-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Ny annonse
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('no-NO', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getPostTypeLabel = (type: string) => {
    return type === 'TEACHER' ? 'Tilbyr undervisning' : 'Søker lærer';
  };

  const getPostTypeBadgeColor = (type: string) => {
    return type === 'TEACHER' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Action Bar */}
      <div className="mb-8 flex justify-between items-center">
        <p className="text-sm text-neutral-600">
          {posts.length} annonse{posts.length !== 1 ? 'r' : ''} funnet
        </p>
        <Link
          href="/posts/new"
          className="inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
        >
          <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
          Ny annonse
        </Link>
      </div>

      {/* Posts Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="relative flex flex-col rounded-lg border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Post Content */}
            <Link href={`/posts/${post.id}`} className="flex flex-col flex-1">
              <div className="p-6 flex-1">
                {/* Type Badge */}
                <div className="mb-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPostTypeBadgeColor(post.type)}`}>
                    {getPostTypeLabel(post.type)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-neutral-900 mb-2 line-clamp-2">
                  {post.title}
                </h3>

                {/* Subject */}
                {post.subject && (
                  <p className="text-sm text-brand-600 font-medium mb-2">
                    {getSubjectLabel(post.subject)}
                  </p>
                )}

                {/* Location and Price */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-neutral-500">
                    <MapPinIcon className="h-4 w-4 mr-1.5" />
                    <span>{post.location || post.region}</span>
                  </div>
                  
                  {post.price && (
                    <div className="flex items-center text-sm text-neutral-900 font-medium">
                      <span>{Math.round(post.price)} kr/time</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-neutral-200 px-6 py-4">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* TODO: Implement view count tracking
                    {post.viewCount !== undefined && (
                      <div className="flex items-center">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        <span>{post.viewCount}</span>
                      </div>
                    )}
                    */}
                    
                    {post._count?.chats !== undefined && (
                      <div className="flex items-center">
                        <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                        <span>{post._count.chats}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>

            {/* Edit Button */}
            <div className="absolute top-4 right-4">
              <Link
                href={`/posts/${post.id}/edit`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:border-neutral-300 transition-colors"
                title="Rediger annonse"
              >
                <PencilIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}