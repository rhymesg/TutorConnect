'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DocumentTextIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import { useAuth } from '@/contexts/AuthContext';
import { PostWithDetails } from '@/types/database';
import { PostListLoading } from '@/components/posts/LoadingStates';
import { getSubjectLabel } from '@/constants/subjects';
import { getPostStatusLabel, getPostStatusColor } from '@/constants/postStatus';
import { createOsloFormatter } from '@/lib/datetime';
import AdsterraBanner from '@/components/ads/AdsterraBanner';
import { adPlacementIds } from '@/constants/adPlacements';

export default function MyPostsPageClient() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileAd, setIsMobileAd] = useState(false);

  const dateFormatter = useMemo(
    () =>
      createOsloFormatter('nb-NO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    []
  );

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
        setPosts(data.data || []);
      } catch (err) {
        console.error('Error fetching my posts:', err);
        setError('포스트를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyPosts();
  }, [user?.id]);

  useEffect(() => {
    const updateAdBreakpoint = () => {
      if (typeof window === 'undefined') return;
      setIsMobileAd(window.innerWidth < 768);
    };
    updateAdBreakpoint();
    window.addEventListener('resize', updateAdBreakpoint);
    return () => window.removeEventListener('resize', updateAdBreakpoint);
  }, []);

  if (loading) {
    return <PostListLoading />;
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-white px-6 py-10 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="border border-neutral-200 bg-white px-6 py-10 text-center">
        <p className="text-neutral-600">로그인이 필요합니다.</p>
        <Link
          href="/auth/login"
          className="mt-4 inline-flex items-center bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
        >
          로그인
        </Link>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="border border-neutral-200 bg-white px-6 py-12 text-center">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-neutral-400" />
        <h3 className="mt-4 text-lg font-medium text-neutral-900">
          아직 작성한 annonse가 없습니다
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          첫 번째 annonse를 작성해서 시작해보세요.
        </p>
        <div className="mt-6">
          <Link
            href="/posts/new"
            className="inline-flex items-center bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-500"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Ny annonse
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return dateFormatter.format(date);
  };

  const getPostTypeLabel = (type: string) =>
    type === 'TEACHER' ? 'Tilbyr undervisning' : 'Søker lærer';

  const getPostTypeBadgeColor = (type: string) =>
    type === 'TEACHER'
      ? 'bg-green-100 text-green-800'
      : 'bg-blue-100 text-blue-800';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="relative flex flex-col rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <Link href={`/posts/${post.id}`} className="flex flex-col flex-1">
              <div className="flex-1 p-6">
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPostTypeBadgeColor(post.type)}`}
                  >
                    {getPostTypeLabel(post.type)}
                  </span>
                  {post.status === 'PAUSET' && (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPostStatusColor('PAUSET')}`}
                    >
                      {getPostStatusLabel('PAUSET')}
                    </span>
                  )}
                </div>

                <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-neutral-900">
                  {post.title}
                </h3>

                {post.subject && (
                  <p className="mb-2 text-sm font-medium text-brand-600">
                    {getSubjectLabel(post.subject)}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-neutral-500">
                    <MapPinIcon className="mr-1.5 h-4 w-4" />
                    <span>{post.location || post.region}</span>
                  </div>

                  {(post.hourlyRate || post.hourlyRateMin) && (
                    <div className="text-sm font-medium text-neutral-900">
                      {post.type === 'TEACHER'
                        ? post.hourlyRate
                          ? `${Math.round(Number(post.hourlyRate))} kr/time`
                          : 'Pris etter avtale'
                        : post.hourlyRateMin && post.hourlyRateMax
                        ? `${Math.round(Number(post.hourlyRateMin))} - ${Math.round(Number(post.hourlyRateMax))} kr/time`
                        : post.hourlyRateMin
                        ? `Fra ${Math.round(Number(post.hourlyRateMin))} kr/time`
                        : post.hourlyRateMax
                        ? `Opptil ${Math.round(Number(post.hourlyRateMax))} kr/time`
                        : 'Pris etter avtale'}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-neutral-200 px-6 py-4">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <div className="flex items-center">
                    <ClockIcon className="mr-1 h-4 w-4" />
                    <span>{formatDate(post.updatedAt || post.createdAt)}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {post._count?.chats !== undefined && (
                      <div className="flex items-center">
                        <ChatBubbleLeftRightIcon className="mr-1 h-4 w-4" />
                        <span>{post._count.chats}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>

            <div className="absolute top-4 right-4">
              <Link
                href={`/posts/${post.id}/edit`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-900"
                title="Rediger annonse"
              >
                <PencilIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center overflow-x-auto pb-6">
        <AdsterraBanner
          placement={
            isMobileAd
              ? adPlacementIds.horizontalMobile320x50
              : adPlacementIds.horizontal728x90
          }
          className="mx-auto"
        />
      </div>
    </div>
  );
}
