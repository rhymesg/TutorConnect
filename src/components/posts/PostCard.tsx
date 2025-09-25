'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, User, MessageCircle, Calendar } from 'lucide-react';
import { PostWithDetails } from '@/types/database';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import { getSubjectLabelByLanguage } from '@/constants/subjects';
import { getAgeGroupLabelsByLanguage } from '@/constants/ageGroups';
import { getRegionLabel } from '@/constants/regions';
import { isUserOnline } from '@/lib/user-utils';
import { getTeacherBadge, getStudentBadge } from '@/lib/badges';
import { getPostStatusLabelByLanguage, getPostStatusColor } from '@/constants/postStatus';

interface PostCardProps {
  post: PostWithDetails;
  className?: string;
  onContactClick?: (postId: string) => void;
}

export default function PostCard({ post, className = '', onContactClick: _onContactClick }: PostCardProps) {
  const { language } = useLanguage();
  const t = useLanguageText();
  const [imageLoaded, setImageLoaded] = useState(false);

  void _onContactClick;

  const isTutorPost = post.type === 'TEACHER';

  const subjectName = getSubjectLabelByLanguage(language, post.subject);
  const ageGroupText = getAgeGroupLabelsByLanguage(language, post.ageGroups);

  const formatDate = (value: string | Date) => {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(language === 'no' ? 'nb-NO' : 'en-GB', {
      timeZone: 'Europe/Oslo',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) {
      return '';
    }

    return new Intl.NumberFormat(language === 'no' ? 'nb-NO' : 'en-GB', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const rateDisplay = () => {
    const placeholder = language === 'no' ? '••• kr' : '••• NOK';

    if (isTutorPost) {
      if (post.hourlyRate !== null && post.hourlyRate !== undefined) {
        return formatCurrency(post.hourlyRate);
      }
    } else {
      if (post.hourlyRateMin !== null && post.hourlyRateMin !== undefined && post.hourlyRateMax !== null && post.hourlyRateMax !== undefined) {
        return `${formatCurrency(post.hourlyRateMin)} - ${formatCurrency(post.hourlyRateMax)}`;
      }
      if (post.hourlyRateMin !== null && post.hourlyRateMin !== undefined) {
        return `${t('Fra', 'From')} ${formatCurrency(post.hourlyRateMin)}`;
      }
      if (post.hourlyRateMax !== null && post.hourlyRateMax !== undefined) {
        return `${t('Opptil', 'Up to')} ${formatCurrency(post.hourlyRateMax)}`;
      }
    }

    return placeholder;
  };

  const formatAvailableDays = (days: string[]) => {
    const dayNames = language === 'no'
      ? {
          MONDAY: 'Man',
          TUESDAY: 'Tir',
          WEDNESDAY: 'Ons',
          THURSDAY: 'Tor',
          FRIDAY: 'Fre',
          SATURDAY: 'Lør',
          SUNDAY: 'Søn',
        }
      : {
          MONDAY: 'Mon',
          TUESDAY: 'Tue',
          WEDNESDAY: 'Wed',
          THURSDAY: 'Thu',
          FRIDAY: 'Fri',
          SATURDAY: 'Sat',
          SUNDAY: 'Sun',
        };

    return days
      .map((day) => {
        const normalized = day.toUpperCase();
        return dayNames[normalized as keyof typeof dayNames] ?? day;
      })
      .join(', ');
  };

  const availableDaysText = post.availableDays?.length
    ? formatAvailableDays(post.availableDays)
    : t('Fleksible dager', 'Flexible days');

  const availableTimesText = post.availableTimes?.length
    ? `${post.availableTimes.slice(0, 2).join(', ')}${post.availableTimes.length > 2 ? '...' : ''}`
    : t('Fleksibel tid', 'Flexible time');

  const postTypeLabel = isTutorPost
    ? t('Tilbyr undervisning', 'Offers tutoring')
    : t('Søker lærer', 'Seeking tutor');

  const pausedLabel = getPostStatusLabelByLanguage(language, 'PAUSET');
  const perHourLabel = t('per time', 'per hour');
  const badgeRoleLabel = isTutorPost ? t('Lærer', 'Teacher') : t('Student', 'Student');
  const badgeInfoLabel = t('Klikk for mer info', 'Click for more info');

  return (
    <div className={`
      group ${isTutorPost 
        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300' 
        : 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200 hover:border-blue-300'
      } 
      rounded-xl shadow-sm hover:shadow-lg transition-all duration-300
      overflow-hidden ${className}
    `}>
      {/* Post Type Badge */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {post.status === 'PAUSET' ? (
              <span className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${getPostStatusColor('PAUSET')}
              `}>
                {pausedLabel}
              </span>
            ) : (
              <span className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${isTutorPost 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
                }
              `}>
                {postTypeLabel}
              </span>
            )}
          </div>
          <span className="text-sm text-neutral-500">
            {formatDate(post.updatedAt ?? post.createdAt)}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <Link href={`/posts/${post.id}`} className="block">
        <div className="px-4 pb-4">
          {/* Title */}
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-brand-600 transition-colors line-clamp-1">
              {post.title}
            </h3>
          </div>

          {/* Subject and Age Groups */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-brand-50 text-brand-700 text-xs font-medium">
              {subjectName}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 text-neutral-700 text-xs">
              {ageGroupText}
            </span>
          </div>

          {/* User Info with Badge */}
          <div className="flex items-center mb-3">
            <div className="relative w-8 h-8 mr-3">
              {post.user.profileImage ? (
                <img
                  src={post.user.profileImage}
                  alt={post.user.name}
                  className={`w-full h-full rounded-full object-cover transition-opacity duration-200 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                />
              ) : (
                <div className="w-full h-full rounded-full bg-brand-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-brand-600" />
                </div>
              )}
              {!imageLoaded && post.user.profileImage && (
                <div className="absolute inset-0 w-full h-full rounded-full bg-neutral-200 animate-pulse" />
              )}
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                isUserOnline(post.user.lastActive) ? 'bg-green-400' : 'bg-gray-400'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-900 truncate">
                  {post.user.name}
                </span>
                {/* User Badges */}
                {(() => {
                  const badge = isTutorPost 
                    ? getTeacherBadge(post.user.teacherSessions || 0, post.user.teacherStudents || 0)
                    : getStudentBadge(post.user.studentSessions || 0, post.user.studentTeachers || 0);
                  
                  if (!badge) return null;
                  
                  const typeIcon = isTutorPost ? '👨‍🏫' : '🎓';
                  const title = `${badgeRoleLabel} ${badge.level} - ${badgeInfoLabel}`;
                  
                  return (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = '/badges';
                      }}
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium hover:scale-105 transition-transform cursor-pointer ${badge.color}`}
                      title={title}
                    >
                      <span className="mr-1">{typeIcon}</span>
                      <span>{badge.icon}</span>
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Availability and Location */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center text-sm text-neutral-600">
              <Calendar className="w-4 h-4 mr-2 text-neutral-400" />
              <span className="truncate">{availableDaysText}</span>
            </div>
            <div className="flex items-center text-sm text-neutral-600">
              <MapPin className="w-4 h-4 mr-2 text-neutral-400" />
              <span className="truncate">
                {post.specificLocation || getRegionLabel(post.location)}
              </span>
            </div>
          </div>

          {/* Rate and Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <div className="flex flex-col">
              <span className="text-sm text-neutral-600 font-medium">
                {rateDisplay()}
              </span>
              <span className="text-xs text-neutral-500">{perHourLabel}</span>
            </div>
            
            <div className="flex items-center text-sm text-neutral-500">
              <MessageCircle className="w-4 h-4 mr-1" />
              <span>{post._count.chats}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

// Skeleton loader for post cards
export function PostCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gradient-to-br from-neutral-50 to-gray-50 rounded-xl shadow-sm border border-neutral-200 overflow-hidden ${className}`}>
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-neutral-200 rounded-full w-32 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-20 animate-pulse" />
        </div>
      </div>
      
      <div className="px-4 pb-4">
        <div className="mb-3">
          <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-full mb-1 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-2/3 animate-pulse" />
        </div>
        
        <div className="flex gap-2 mb-3">
          <div className="h-6 bg-neutral-200 rounded w-20 animate-pulse" />
          <div className="h-6 bg-neutral-200 rounded w-16 animate-pulse" />
        </div>
        
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-neutral-200 rounded-full mr-3 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-neutral-200 rounded w-24 mb-1 animate-pulse" />
            <div className="h-3 bg-neutral-200 rounded w-16 animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-neutral-200 rounded w-40 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-32 animate-pulse" />
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          <div className="h-6 bg-neutral-200 rounded w-24 animate-pulse" />
          <div className="h-8 bg-neutral-200 rounded w-20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
